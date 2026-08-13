import {
  cardOrderCallbackUrl,
  cardOrderReturnUrl,
  getCardGatewayConfig,
} from '@/lib/card-gateway/config';
import {
  escapeXml,
  formatGatewayDate,
  formatPaymentAmount,
  splitPersonName,
  xmlLeaf,
  xmlTag,
} from '@/lib/card-gateway/xml';

export type CardCreateTokenInput = {
  amount: number;
  companyRef: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCity?: string;
  customerAddress?: string;
};

export type CardCreateTokenResult = {
  transToken: string;
  transRef: string;
};

export type CardVerifyResult = {
  result: string;
  resultExplanation: string;
  companyRef: string;
  transToken: string;
  transRef: string;
  transactionAmount: string;
  transactionCurrency: string;
  transactionApproval: string;
};

const CREATE_RETRY_CODES = new Set(['804', '902', '950']);
const VERIFY_RETRY_CODES = new Set(['950', '804', '803']);

let cachedServiceType: string | null = null;

async function postGatewayXml(xml: string): Promise<string> {
  const { apiUrl } = getCardGatewayConfig();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Accept: 'application/xml',
    },
    body: xml,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(xmlTag(text, 'ResultExplanation') || 'Card payment request failed.');
  }
  return text;
}

function customerXml(input: CardCreateTokenInput, indent: string): string {
  const { firstName, lastName } = splitPersonName(input.customerName);
  return [
    xmlLeaf('customerFirstName', firstName, indent),
    xmlLeaf('customerLastName', lastName, indent),
    xmlLeaf('customerEmail', input.customerEmail, indent),
    xmlLeaf('customerPhone', input.customerPhone, indent),
    xmlLeaf('customerCity', input.customerCity, indent),
    xmlLeaf('customerAddress', input.customerAddress, indent),
    xmlLeaf('customerCountry', 'UG', indent),
  ].join('');
}

function nestedCreateTokenXml(input: CardCreateTokenInput, serviceType: string): string {
  const config = getCardGatewayConfig();
  const description = (input.description || 'ShiQueen order').slice(0, 120);
  const redirectUrl = cardOrderReturnUrl(input.companyRef);
  const callbackUrl = cardOrderCallbackUrl(input.companyRef);

  return `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(config.companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${formatPaymentAmount(input.amount)}</PaymentAmount>
    <PaymentCurrency>${escapeXml(config.currency)}</PaymentCurrency>
    <CompanyRef>${escapeXml(input.companyRef)}</CompanyRef>
    <RedirectURL>${escapeXml(redirectUrl)}</RedirectURL>
    <BackURL>${escapeXml(callbackUrl)}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>${config.ptlHours}</PTL>
    <PTLtype>hours</PTLtype>${customerXml(input, '    ')}
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${escapeXml(serviceType)}</ServiceType>
      <ServiceDescription>${escapeXml(description)}</ServiceDescription>
      <ServiceDate>${formatGatewayDate()}</ServiceDate>
    </Service>
  </Services>
</API3G>`;
}

function flatCreateTokenXml(input: CardCreateTokenInput, serviceType: string): string {
  const config = getCardGatewayConfig();
  const description = (input.description || 'ShiQueen order').slice(0, 120);
  const redirectUrl = cardOrderReturnUrl(input.companyRef);
  const callbackUrl = cardOrderCallbackUrl(input.companyRef);

  return `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(config.companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <PaymentAmount>${formatPaymentAmount(input.amount)}</PaymentAmount>
  <PaymentCurrency>${escapeXml(config.currency)}</PaymentCurrency>
  <CompanyRef>${escapeXml(input.companyRef)}</CompanyRef>
  <RedirectURL>${escapeXml(redirectUrl)}</RedirectURL>
  <BackURL>${escapeXml(callbackUrl)}</BackURL>
  <PTL>${config.ptlHours}</PTL>
  <ServiceType>${escapeXml(serviceType)}</ServiceType>
  <Description>${escapeXml(description)}</Description>${customerXml(input, '  ')}
</API3G>`;
}

function parseCreateTokenResponse(responseXml: string): CardCreateTokenResult | { error: string; result: string } {
  const result = xmlTag(responseXml, 'Result');
  if (result !== '000') {
    return {
      result,
      error: xmlTag(responseXml, 'ResultExplanation') || 'Could not start card payment. Please try again.',
    };
  }

  const transToken = xmlTag(responseXml, 'TransToken') || xmlTag(responseXml, 'TransactionToken');
  if (!transToken) {
    return { result, error: 'Card payment started but no checkout session was returned.' };
  }

  return {
    transToken,
    transRef: xmlTag(responseXml, 'TransRef'),
  };
}

async function resolveServiceType(): Promise<string> {
  const configured = getCardGatewayConfig().serviceType;
  if (configured) return configured;
  if (cachedServiceType) return cachedServiceType;

  const config = getCardGatewayConfig();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(config.companyToken)}</CompanyToken>
  <Request>getServices</Request>
</API3G>`;

  const responseXml = await postGatewayXml(xml);
  const serviceId = xmlTag(responseXml, 'ServiceID');
  if (!serviceId) {
    throw new Error(
      'Card payments are not available right now. Please use mobile money or cash on delivery.'
    );
  }

  cachedServiceType = serviceId;
  return serviceId;
}

export async function createCardPaymentToken(
  input: CardCreateTokenInput
): Promise<CardCreateTokenResult> {
  const serviceType = await resolveServiceType();
  const nested = parseCreateTokenResponse(await postGatewayXml(nestedCreateTokenXml(input, serviceType)));
  if ('transToken' in nested) return nested;

  if (CREATE_RETRY_CODES.has(nested.result)) {
    const flat = parseCreateTokenResponse(await postGatewayXml(flatCreateTokenXml(input, serviceType)));
    if ('transToken' in flat) return flat;
    throw new Error(flat.error);
  }

  throw new Error(nested.error);
}

export async function verifyCardPaymentToken(transToken: string): Promise<CardVerifyResult> {
  const config = getCardGatewayConfig();

  const requestXml = (tokenTag: 'TransactionToken' | 'TransToken') => `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(config.companyToken)}</CompanyToken>
  <Request>verifyToken</Request>
  <${tokenTag}>${escapeXml(transToken)}</${tokenTag}>
</API3G>`;

  let responseXml = await postGatewayXml(requestXml('TransactionToken'));
  let result = xmlTag(responseXml, 'Result');
  if (VERIFY_RETRY_CODES.has(result)) {
    responseXml = await postGatewayXml(requestXml('TransToken'));
    result = xmlTag(responseXml, 'Result');
  }

  return {
    result,
    resultExplanation: xmlTag(responseXml, 'ResultExplanation'),
    companyRef: xmlTag(responseXml, 'CompanyRef'),
    transToken: xmlTag(responseXml, 'TransToken') || xmlTag(responseXml, 'TransactionToken') || transToken,
    transRef: xmlTag(responseXml, 'TransRef'),
    transactionAmount: xmlTag(responseXml, 'TransactionAmount'),
    transactionCurrency: xmlTag(responseXml, 'TransactionCurrency'),
    transactionApproval: xmlTag(responseXml, 'TransactionApproval'),
  };
}

export function mapCardVerifyToPayment(result: string): {
  paymentStatus: 'paid' | 'failed' | 'cancelled' | 'awaiting_payment';
  orderStatus?: 'processing' | 'cancelled' | 'pending';
} {
  switch (result) {
    case '000':
    case '001':
    case '002':
      return { paymentStatus: 'paid', orderStatus: 'processing' };
    case '900':
    case '003':
    case '005':
    case '007':
      return { paymentStatus: 'awaiting_payment' };
    case '904':
    case '903':
      return { paymentStatus: 'cancelled', orderStatus: 'cancelled' };
    case '901':
    default:
      return { paymentStatus: 'failed', orderStatus: 'pending' };
  }
}

export function amountsMatch(expected: number, charged: string): boolean {
  if (!charged.trim()) return true;
  const paid = Number(charged.replace(/,/g, ''));
  if (!Number.isFinite(paid)) return true;
  return Math.abs(paid - expected) <= 1;
}
