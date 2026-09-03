'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { isRemoteProductImage } from '@/components/product-image';
import { updateOrderStatus } from '@/lib/firebase/orders';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { buildTelLink, buildWhatsAppLink } from '@/lib/phone-utils';
import type { Order, OrderItem, Product } from '@/lib/types/database';
import type { Package as WholesalePackage } from '@/lib/types/wholesale';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/labels';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import { getOrderPayState } from '@/lib/payments/order-payment';
import {
  FULFILL_STEPS,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  canAdvanceFulfillStep,
  formatOrderRef,
  isFulfillLocked,
  itemsTotal,
  lineTotal,
  nextFulfillLabel,
  nextFulfillStatus,
  resolveOrderItemImage,
  supplierOrderItems,
} from '@/components/supplier/supplier-order-utils';

function ItemThumb({ src, size = 56 }: { src?: string; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/60"
      style={{ width: size, height: size }}
    >
      {isRemoteProductImage(src) ? (
        <Image src={src!} alt="" fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Package className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

export function SupplierOrderFulfillDialog({
  order,
  supplierId,
  productsById,
  packages,
  onClose,
}: {
  order: Order | null;
  supplierId: string;
  productsById: Map<string, Product>;
  packages: WholesalePackage[];
  onClose: () => void;
}) {
  useHistoryOverlay(Boolean(order), onClose);
  const [confirmingDone, setConfirmingDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [order]);

  useEffect(() => {
    setConfirmingDone(false);
    setSaving(false);
  }, [order?.id]);

  const items = order
    ? supplierOrderItems(order, supplierId, productsById, packages)
    : [];
  const mineTotal = itemsTotal(items);
  const address = order?.shippingAddress;
  const phone = address?.phone || '';
  const currentStep = order ? FULFILL_STEPS.indexOf(order.status) : -1;
  const nextStatus = order ? nextFulfillStatus(order.status) : null;
  const nextLabel = order ? nextFulfillLabel(order.status) : null;
  const pay = order ? getOrderPayState(order) : null;
  const canFulfill = Boolean(pay?.canFulfill);
  const locked = Boolean(order && isFulfillLocked(order.status));

  const applyStatus = async (status: Order['status']) => {
    if (!order || status === order.status || saving) return;
    if (!getOrderPayState(order).canFulfill) {
      toast.error('Payment first.');
      return;
    }
    if (!canAdvanceFulfillStep(order.status, status)) {
      if (locked) toast.error('Locked.');
      else toast.error(`Next: ${nextFulfillLabel(order.status) ?? '—'}`);
      return;
    }
    setSaving(true);
    try {
      await updateOrderStatus(order.id, status);
      setConfirmingDone(false);
      toast.success(ORDER_STATUS_LABEL[status]);
    } catch {
      toast.error('Could not update.');
    } finally {
      setSaving(false);
    }
  };

  const requestStatus = (status: Order['status']) => {
    if (!order) return;
    if (status === 'delivered') {
      if (!canAdvanceFulfillStep(order.status, 'delivered')) {
        toast.error(`Next: ${nextFulfillLabel(order.status) ?? '—'}`);
        return;
      }
      setConfirmingDone(true);
      return;
    }
    void applyStatus(status);
  };

  return (
    <AnimatePresence>
      {order ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm"
            onClick={() => {
              if (confirmingDone) {
                setConfirmingDone(false);
                return;
              }
              onClose();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-fulfill-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '40%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'fixed z-[80] flex w-full flex-col overflow-hidden border border-border/80 bg-background shadow-2xl',
              'inset-0 h-[100dvh] max-h-[100dvh] rounded-none',
              'sm:inset-x-4 sm:top-[6%] sm:bottom-auto sm:mx-auto sm:h-auto sm:max-h-[88dvh] sm:max-w-lg sm:rounded-2xl',
              'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]'
            )}
          >
            <div className="relative shrink-0 border-b border-border/70">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-accent/10" />
              <div className="relative flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                        ORDER_STATUS_TONE[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                        pay?.kind === 'paid' && 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
                        pay?.kind === 'cod' && 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
                        pay?.kind === 'waiting' && 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
                        pay?.kind === 'failed' && 'bg-rose-500/15 text-rose-800 ring-rose-500/25'
                      )}
                    >
                      {pay?.label ?? 'Unpaid'}
                    </span>
                    {locked && order.status === 'delivered' ? (
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-border">
                        Locked
                      </span>
                    ) : null}
                    {order.giftPayment ? (
                      <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground ring-1 ring-inset ring-accent/30">
                        Gift
                      </span>
                    ) : null}
                  </div>
                  <h2
                    id="supplier-fulfill-title"
                    className="font-mono text-lg font-bold tracking-tight"
                  >
                    {formatOrderRef(order.id)}
                  </h2>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-primary">
                    {formatUGX(mineTotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmingDone) {
                      setConfirmingDone(false);
                      return;
                    }
                    onClose();
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <div className="space-y-4">
                {!canFulfill ? (
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-center',
                      pay?.kind === 'failed'
                        ? 'bg-rose-500/12 ring-1 ring-rose-500/20'
                        : 'bg-amber-500/12 ring-1 ring-amber-500/20'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        pay?.kind === 'failed' ? 'text-rose-800' : 'text-amber-900'
                      )}
                    >
                      {pay?.kind === 'failed' ? 'Failed' : 'Not paid'}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        pay?.kind === 'failed' ? 'text-rose-800/80' : 'text-amber-900/80'
                      )}
                    >
                      Cannot pack yet.
                    </p>
                  </div>
                ) : order.status !== 'cancelled' ? (
                  <ol className="grid grid-cols-4 gap-1.5">
                    {FULFILL_STEPS.map((step, index) => {
                      const done = currentStep >= index;
                      const current = currentStep === index;
                      const isNext = nextStatus === step;
                      const clickable = canFulfill && !locked && isNext && !saving;
                      return (
                        <li key={step}>
                          <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => requestStatus(step)}
                            className={cn(
                              'flex w-full flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center',
                              done
                                ? 'border-primary/30 bg-primary/8'
                                : isNext && !locked
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-border/70 bg-muted/30',
                              locked && 'cursor-default opacity-90',
                              !clickable && !locked && 'cursor-default'
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                                done
                                  ? 'bg-primary text-primary-foreground'
                                  : isNext && !locked
                                    ? 'bg-primary/80 text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {done ? <Check className="h-3 w-3" /> : index + 1}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wide',
                                current || isNext
                                  ? 'text-primary'
                                  : done
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {ORDER_STATUS_LABEL[step]}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-center text-sm font-medium text-rose-800">
                    Cancelled
                  </p>
                )}

                <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                  <ul className="divide-y divide-border/60">
                    {items.map((item, index) => (
                      <FulfillLine
                        key={`${item.productId}-${index}`}
                        item={item}
                        src={resolveOrderItemImage(item, productsById, packages)}
                      />
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-border/70 bg-card p-4">
                  <p className="text-sm font-semibold">{order.customerName || 'Customer'}</p>
                  {phone ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={buildTelLink(phone)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={buildWhatsAppLink(
                          phone,
                          `ShiQueen ${formatOrderRef(order.id)}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat
                      </a>
                    </div>
                  ) : null}
                  {address ? (
                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {address.address}
                        {address.city ? `, ${address.city}` : ''}
                      </span>
                    </p>
                  ) : null}
                </section>

                <section className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    {order.paymentMethod
                      ? PAYMENT_METHOD_LABELS[order.paymentMethod]
                      : 'Pay'}
                  </span>
                  <span className="font-semibold tabular-nums">{formatUGX(mineTotal)}</span>
                </section>
              </div>
            </div>

            <div className="shrink-0 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={onClose}>
                  Close
                </Button>
                {canFulfill && !locked && nextStatus && nextLabel ? (
                  <Button
                    className="h-11 flex-1 rounded-xl"
                    disabled={saving}
                    onClick={() => requestStatus(nextStatus)}
                  >
                    {nextLabel}
                  </Button>
                ) : null}
              </div>
            </div>

            {confirmingDone ? (
              <div className="absolute inset-0 z-20 flex items-end bg-black/45 sm:items-center sm:justify-center">
                <div className="w-full rounded-t-2xl border border-border/70 bg-background p-5 shadow-2xl sm:mx-5 sm:max-w-sm sm:rounded-2xl">
                  <p className="text-lg font-semibold tracking-tight">Mark Done?</p>
                  <p className="mt-1 text-sm text-muted-foreground">Cannot undo.</p>
                  <ul className="mt-4 flex gap-2">
                    {items.slice(0, 4).map((item, index) => (
                      <li key={`${item.productId}-warn-${index}`}>
                        <ItemThumb
                          src={resolveOrderItemImage(item, productsById, packages)}
                          size={48}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-medium">
                    {items.length} item{items.length === 1 ? '' : 's'} · {formatUGX(mineTotal)}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <Button
                      variant="outline"
                      className="h-11 flex-1 rounded-xl"
                      disabled={saving}
                      onClick={() => setConfirmingDone(false)}
                    >
                      Back
                    </Button>
                    <Button
                      className="h-11 flex-1 rounded-xl"
                      disabled={saving}
                      onClick={() => void applyStatus('delivered')}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function FulfillLine({ item, src }: { item: OrderItem; src?: string }) {
  const meta = [item.size, item.color].filter(Boolean).join(' · ');
  return (
    <li className="flex gap-3 px-3 py-3">
      <ItemThumb src={src} size={64} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          × {item.quantity}
          {meta ? ` · ${meta}` : ''}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatUGX(lineTotal(item))}</p>
    </li>
  );
}
