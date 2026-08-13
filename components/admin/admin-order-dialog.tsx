'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { isRemoteProductImage } from '@/components/product-image';
import { updateOrderStatus } from '@/lib/firebase/orders';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import {
  Order,
  type PaymentStatus,
} from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/labels';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25' },
  processing: { label: 'Processing', className: 'bg-sky-500/15 text-sky-800 ring-sky-500/25' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/15 text-violet-800 ring-violet-500/25' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-800 ring-red-500/25' },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-800 ring-red-500/25',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
  },
  cod_pending: {
    label: 'COD pending',
    className: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  },
};

const PAYMENT_METHOD = PAYMENT_METHOD_LABELS;

const FULFILLMENT_STEPS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
];

function formatOrderReference(orderId: string): string {
  if (orderId.length <= 12) return orderId.toUpperCase();
  return `#${orderId.slice(-8).toUpperCase()}`;
}

function formatOrderDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        className
      )}
    >
      {children}
    </span>
  );
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}

function CopyChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => copyText(label, value)}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Copy className="h-3 w-3" />
      Copy
    </button>
  );
}

type AdminOrderDialogProps = {
  order: Order | null;
  onClose: () => void;
};

export function AdminOrderDialog({ order, onClose }: AdminOrderDialogProps) {
  useHistoryOverlay(Boolean(order), onClose);

  useEffect(() => {
    if (!order) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [order]);

  const handleStatusUpdate = async (status: Order['status']) => {
    if (!order) return;
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const itemCount =
    order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const address = order?.shippingAddress;
  const phone = address?.phone || '';
  const email = order?.email || address?.email || '';
  const currentStep = order ? FULFILLMENT_STEPS.indexOf(order.status) : -1;

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] touch-none bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-dialog-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '40%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'fixed z-[80] flex w-full flex-col overflow-hidden border border-border/80 bg-background shadow-2xl',
              'inset-0 h-[100dvh] max-h-[100dvh] rounded-none',
              'sm:inset-x-4 sm:top-[5%] sm:bottom-auto sm:mx-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl',
              'md:inset-x-6 md:top-[6%] md:max-w-3xl md:max-h-[88dvh]',
              'lg:max-w-4xl',
              'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]'
            )}
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden border-b border-border/70">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/[0.06] to-accent/10" />
              <div className="relative px-3 py-2.5 sm:px-5 sm:py-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <Badge className={ORDER_STATUS[order.status].className}>
                        {ORDER_STATUS[order.status].label}
                      </Badge>
                      <Badge className="bg-muted/80 text-muted-foreground ring-border">
                        {order.orderType}
                      </Badge>
                      {order.paymentStatus && (
                        <span className="hidden sm:contents">
                          <Badge className={PAYMENT_STATUS[order.paymentStatus].className}>
                            {PAYMENT_STATUS[order.paymentStatus].label}
                          </Badge>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <h2
                        id="admin-order-dialog-title"
                        className="break-all font-mono text-base font-bold tracking-tight sm:text-lg"
                      >
                        {formatOrderReference(order.id)}
                      </h2>
                      <p className="text-base font-bold tabular-nums text-primary sm:text-lg">
                        {formatUGX(order.total)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                      <span className="font-medium text-foreground/80">
                        {order.customerName}
                      </span>
                      <span className="mx-1 text-border">·</span>
                      <span className="whitespace-nowrap">
                        {formatOrderDateTime(order.createdAt)}
                      </span>
                      <span className="mx-1 text-border">·</span>
                      <span className="whitespace-nowrap">
                        {itemCount} unit{itemCount === 1 ? '' : 's'}
                        <span className="mx-1">·</span>
                        {order.items.length} line{order.items.length === 1 ? '' : 's'}
                      </span>
                    </p>
                    <div className="mt-1 hidden min-w-0 items-center gap-2 text-[11px] text-muted-foreground sm:flex">
                      <span className="truncate font-mono">{order.id}</span>
                      <CopyChip label="Order ID" value={order.id} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm transition hover:bg-background hover:text-foreground"
                    aria-label="Close order dialog"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-4 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
                {/* Fulfillment + status */}
                <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">Fulfillment</h3>
                      <p className="text-xs text-muted-foreground">
                        Update status as you process this order.
                      </p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusUpdate(e.target.value as Order['status'])
                      }
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary sm:h-10 sm:w-auto sm:min-w-[10rem]"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {order.status === 'cancelled' ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
                      This order was cancelled.
                    </div>
                  ) : (
                    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {FULFILLMENT_STEPS.map((step, index) => {
                        const done = index <= currentStep;
                        const current = index === currentStep;
                        return (
                          <li
                            key={step}
                            className={cn(
                              'rounded-xl border px-3 py-2.5',
                              done
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-border/70 bg-muted/20'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                                  done
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                )}
                              >
                                {done ? <Check className="h-3 w-3" /> : index + 1}
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-semibold capitalize',
                                  current
                                    ? 'text-primary'
                                    : done
                                      ? 'text-foreground'
                                      : 'text-muted-foreground'
                                )}
                              >
                                {step}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>

                {/* What was ordered */}
                <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                  <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-3 py-3 sm:px-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">What was ordered</h3>
                      <p className="text-xs text-muted-foreground">
                        Products and packages in this checkout
                      </p>
                    </div>
                  </div>
                  <ul className="divide-y divide-border/60">
                    {order.items.map((item, index) => {
                      const lineTotal = item.price * item.quantity;
                      return (
                        <li
                          key={`${item.productId}-${item.size ?? ''}-${item.color ?? ''}-${index}`}
                          className="flex gap-3 px-3 py-3.5 sm:px-4"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                            {isRemoteProductImage(item.image) ? (
                              <Image
                                src={item.image!}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium [overflow-wrap:anywhere]">
                                  {item.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {[
                                    item.size ? `Size ${item.size}` : null,
                                    item.color ? `Color ${item.color}` : null,
                                    item.packageId ? 'Package item' : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || 'Standard item'}
                                </p>
                                <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                                  {item.productId}
                                  {item.packageId ? ` · pkg ${item.packageId}` : ''}
                                </p>
                              </div>
                              <div className="shrink-0 sm:text-right">
                                <p className="text-sm font-semibold tabular-nums">
                                  {formatUGX(lineTotal)}
                                </p>
                                <p className="text-[11px] tabular-nums text-muted-foreground">
                                  {formatUGX(item.price)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Customer */}
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Customer</h3>
                    </div>
                    <p className="font-medium [overflow-wrap:anywhere]">
                      {order.customerName || 'Guest'}
                    </p>
                    <p className="mt-0.5 break-all text-xs text-muted-foreground">
                      {order.userId ? `Account ${order.userId}` : 'Guest checkout'}
                    </p>
                    <div className="mt-3 space-y-2">
                      {email && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <Mail className="h-3 w-3" /> Email
                            </p>
                            <p className="truncate text-sm">{email}</p>
                          </div>
                          <CopyChip label="Email" value={email} />
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <Phone className="h-3 w-3" /> Phone
                            </p>
                            <p className="truncate text-sm">{phone}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <CopyChip label="Phone" value={phone} />
                            <a
                              href={`tel:${phone}`}
                              className="text-[11px] font-semibold text-primary hover:underline"
                            >
                              Call
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Delivery */}
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Delivery</h3>
                    </div>
                    {address ? (
                      <div className="space-y-1 text-sm [overflow-wrap:anywhere]">
                        <p className="font-medium">
                          {address.firstName} {address.lastName}
                        </p>
                        <p className="text-muted-foreground">{address.address}</p>
                        <p className="text-muted-foreground">
                          {[address.city, address.state, address.zipCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className="text-muted-foreground">{address.country}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No shipping address.</p>
                    )}
                  </section>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Payment */}
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Payment</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">Method</span>
                        <span className="text-right font-medium">
                          {order.paymentMethod
                            ? PAYMENT_METHOD[order.paymentMethod]
                            : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="shrink-0 text-muted-foreground">Status</span>
                        {order.paymentStatus ? (
                          <Badge className={PAYMENT_STATUS[order.paymentStatus].className}>
                            {PAYMENT_STATUS[order.paymentStatus].label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      {order.paytotaReference && (
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Reference
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="min-w-0 break-all font-mono text-xs">
                              {order.paytotaReference}
                            </p>
                            <CopyChip label="Reference" value={order.paytotaReference} />
                          </div>
                        </div>
                      )}
                      {order.paytotaPurchaseId && (
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Purchase ID
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="min-w-0 break-all font-mono text-xs">
                              {order.paytotaPurchaseId}
                            </p>
                            <CopyChip
                              label="Purchase ID"
                              value={order.paytotaPurchaseId}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Totals */}
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Wallet className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Totals</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">{formatUGX(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="tabular-nums">{formatUGX(order.tax)}</span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-border/60 pt-3 text-base font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums text-primary">
                          {formatUGX(order.total)}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-muted-foreground sm:text-left">
                  Updated {formatOrderDateTime(order.updatedAt)}
                </p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted sm:h-9 sm:w-auto"
                    >
                      Call customer
                    </a>
                  )}
                  <Button className="h-11 w-full sm:h-9 sm:w-auto" onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
