import { getSiteUrl } from '@/lib/site-url';

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export function getCardGatewayPublicBaseUrl(): string {
  const override = firstEnv(
    'CARD_GATEWAY_PUBLIC_BASE_URL',
    'SITE_URL',
    'NEXT_PUBLIC_APP_URL'
  );
  if (override) return trimTrailingSlash(override);
  return getSiteUrl();
}

export function isCardGatewayConfigured(): boolean {
  return Boolean(
    firstEnv(
      'DPO_COMPANY_TOKEN',
      'HOSTED_CHECKOUT_COMPANY_TOKEN',
      'CARD_GATEWAY_COMPANY_TOKEN'
    )
  );
}

export function getCardGatewayConfig() {
  const companyToken = firstEnv(
    'DPO_COMPANY_TOKEN',
    'HOSTED_CHECKOUT_COMPANY_TOKEN',
    'CARD_GATEWAY_COMPANY_TOKEN'
  );
  const serviceType = firstEnv(
    'DPO_SERVICE_TYPE',
    'HOSTED_CHECKOUT_SERVICE_TYPE',
    'CARD_GATEWAY_SERVICE_TYPE'
  );

  if (!companyToken) {
    throw new Error(
      'Card payments are not available right now. Please use mobile money or cash on delivery.'
    );
  }

  const publicBase = getCardGatewayPublicBaseUrl();
  const callbackOverride = firstEnv('DPO_BACK_URL', 'CARD_GATEWAY_CALLBACK_URL');

  return {
    companyToken,
    serviceType,
    currency: (firstEnv('CARD_GATEWAY_CURRENCY', 'DPO_CURRENCY') || 'UGX').toUpperCase(),
    apiUrl:
      firstEnv('DPO_API_URL', 'CARD_GATEWAY_API_URL') ||
      'https://secure.3gdirectpay.com/API/v6/',
    checkoutUrl:
      firstEnv('DPO_PAYMENT_URL', 'CARD_GATEWAY_CHECKOUT_URL') ||
      'https://secure.3gdirectpay.com/payv3.php',
    ptlHours: Number(firstEnv('CARD_GATEWAY_PTL_HOURS', 'DPO_PTL_HOURS') || '5') || 5,
    returnUrl: `${publicBase}/api/payments/card/return`,
    callbackUrl: callbackOverride
      ? trimTrailingSlash(callbackOverride.split('?')[0]!)
      : `${publicBase}/api/payments/card/callback`,
  };
}

function checkoutBaseUrl(checkoutUrl: string): string {
  return checkoutUrl
    .trim()
    .replace(/[?&]ID=$/i, '')
    .replace(/\/+$/, '');
}

export function cardCheckoutRedirectUrl(transToken: string): string {
  const base = checkoutBaseUrl(getCardGatewayConfig().checkoutUrl);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}ID=${encodeURIComponent(transToken)}`;
}

function withOrderId(url: string, orderId: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}orderId=${encodeURIComponent(orderId)}`;
}

export function cardOrderReturnUrl(orderId: string): string {
  return withOrderId(getCardGatewayConfig().returnUrl, orderId);
}

export function cardOrderCallbackUrl(orderId: string): string {
  return withOrderId(getCardGatewayConfig().callbackUrl, orderId);
}
