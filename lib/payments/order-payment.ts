import type { Order, PaymentMethod, PaymentStatus } from '@/lib/types/database';

export type OrderPayKind = 'paid' | 'cod' | 'waiting' | 'failed';

export type OrderPayState = {
  kind: OrderPayKind;
  label: string;
  canFulfill: boolean;
  canRetry: boolean;
};

function canRetryMethod(method?: PaymentMethod): boolean {
  return method === 'mobile_money' || method === 'card';
}

export function getOrderPayState(
  order: Pick<Order, 'paymentStatus' | 'paymentMethod' | 'status'>
): OrderPayState {
  const status = order.paymentStatus as PaymentStatus | undefined;
  const method = order.paymentMethod;
  const cancelled = order.status === 'cancelled';

  if (status === 'paid') {
    return { kind: 'paid', label: 'Paid', canFulfill: true, canRetry: false };
  }

  if (status === 'cod_pending' || method === 'cash_on_delivery') {
    return { kind: 'cod', label: 'COD', canFulfill: !cancelled, canRetry: false };
  }

  if (status === 'failed' || status === 'cancelled') {
    return {
      kind: 'failed',
      label: 'Failed',
      canFulfill: false,
      canRetry: !cancelled && canRetryMethod(method),
    };
  }

  if (status === 'awaiting_payment') {
    return {
      kind: 'waiting',
      label: 'Waiting',
      canFulfill: false,
      canRetry: !cancelled && canRetryMethod(method),
    };
  }

  if (
    order.status === 'processing' ||
    order.status === 'shipped' ||
    order.status === 'delivered'
  ) {
    return { kind: 'paid', label: 'Paid', canFulfill: true, canRetry: false };
  }

  return {
    kind: 'waiting',
    label: 'Unpaid',
    canFulfill: false,
    canRetry: !cancelled && canRetryMethod(method),
  };
}
