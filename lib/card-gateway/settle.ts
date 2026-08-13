import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import {
  amountsMatch,
  mapCardVerifyToPayment,
  verifyCardPaymentToken,
} from '@/lib/card-gateway/client';

export type CardSettlementOutcome = 'paid' | 'failed' | 'cancelled' | 'pending';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function outcomeFromMapped(
  paymentStatus: 'paid' | 'failed' | 'cancelled' | 'awaiting_payment'
): CardSettlementOutcome {
  if (paymentStatus === 'paid') return 'paid';
  if (paymentStatus === 'cancelled') return 'cancelled';
  if (paymentStatus === 'failed') return 'failed';
  return 'pending';
}

async function verifyWithRetries(token: string, retries: number) {
  let verified = await verifyCardPaymentToken(token);
  let mapped = mapCardVerifyToPayment(verified.result);
  const extra = Math.max(0, retries);

  for (let attempt = 0; attempt < extra && mapped.paymentStatus === 'awaiting_payment'; attempt += 1) {
    await delay(1500);
    verified = await verifyCardPaymentToken(token);
    mapped = mapCardVerifyToPayment(verified.result);
  }

  return { verified, mapped };
}

function firstString(
  searchParams: URLSearchParams,
  body: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const fromQuery = searchParams.get(key);
    if (fromQuery?.trim()) return fromQuery.trim();
    const value = body[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export async function settleCardPayment(params: {
  transToken?: string | null;
  companyRef?: string | null;
  retries?: number;
}): Promise<{ outcome: CardSettlementOutcome; orderId?: string }> {
  const transToken = params.transToken?.trim();
  const companyRef = params.companyRef?.trim();

  if (!transToken && !companyRef) {
    return { outcome: 'pending' };
  }

  if (!isFirebaseAdminConfigured()) {
    if (!transToken) {
      return { outcome: 'pending', orderId: companyRef || undefined };
    }
    const { mapped } = await verifyWithRetries(transToken, params.retries ?? 0);
    return {
      outcome: outcomeFromMapped(mapped.paymentStatus),
      orderId: companyRef || undefined,
    };
  }

  const {
    getOrderByCardTransRef,
    getOrderByCardTransToken,
    getOrderServer,
    updateOrderPaymentServer,
  } = await import('@/lib/firebase/orders-server');

  let order = transToken ? await getOrderByCardTransToken(transToken) : null;
  if (!order && transToken) {
    order = await getOrderByCardTransRef(transToken);
  }
  if (!order && companyRef) {
    order = await getOrderServer(companyRef);
  }
  if (!order) {
    console.warn('[ShiQueen] card payment: order not found', { transToken, companyRef });
    return { outcome: 'pending', orderId: companyRef || undefined };
  }

  const token = order.cardTransToken || transToken;
  if (!token) {
    return { outcome: 'pending', orderId: order.id };
  }

  const { verified, mapped } = await verifyWithRetries(token, params.retries ?? 0);

  if (mapped.paymentStatus === 'paid' && !amountsMatch(order.total, verified.transactionAmount)) {
    console.warn('[ShiQueen] card payment: amount mismatch', {
      orderId: order.id,
      expected: order.total,
      charged: verified.transactionAmount,
    });
    await updateOrderPaymentServer(order.id, {
      paymentStatus: 'failed',
      cardTransToken: token,
      cardTransRef: verified.transRef || order.cardTransRef,
    });
    return { outcome: 'failed', orderId: order.id };
  }

  if (order.paymentStatus === 'paid' && mapped.paymentStatus === 'paid') {
    return { outcome: 'paid', orderId: order.id };
  }

  await updateOrderPaymentServer(order.id, {
    paymentStatus: mapped.paymentStatus,
    paymentMethod: 'card',
    cardTransToken: token,
    cardTransRef: verified.transRef || order.cardTransRef,
    ...(mapped.orderStatus ? { status: mapped.orderStatus } : {}),
  });

  if (mapped.paymentStatus === 'paid') {
    const { markSharedCheckoutPaidByOrderId } = await import(
      '@/lib/firebase/shared-checkouts-server'
    );
    await markSharedCheckoutPaidByOrderId(order.id);
  }

  return { outcome: outcomeFromMapped(mapped.paymentStatus), orderId: order.id };
}

export function collectCardCallbackFields(
  searchParams: URLSearchParams,
  body: Record<string, unknown>
): { transToken?: string; companyRef?: string } {
  const transToken = firstString(searchParams, body, [
    'TransactionToken',
    'TransToken',
    'transactionToken',
    'transToken',
    'transactionId',
    'TransactionID',
    'ID',
    'Id',
  ]);

  const companyRef = firstString(searchParams, body, [
    'CompanyRef',
    'companyRef',
    'merchantOrderId',
    'orderId',
    'OrderId',
  ]);

  return { transToken, companyRef };
}
