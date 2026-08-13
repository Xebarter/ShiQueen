'use client';

import { useEffect, useState, Suspense } from 'react';
import { ClipboardList } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import type { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { InstallWelcomeCard } from '@/components/pwa/install-welcome-card';

const STATUS: Record<Order['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-800',
  processing: 'bg-sky-500/15 text-sky-800',
  shipped: 'bg-violet-500/15 text-violet-800',
  delivered: 'bg-emerald-500/15 text-emerald-800',
  cancelled: 'bg-rose-500/15 text-rose-800',
};

export default function SupplierOrdersPage() {
  const { supplierId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!supplierId) return;
    return subscribeOrdersForSupplier(supplierId, setOrders);
  }, [supplierId]);

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Orders"
          description="Orders that include your products or packages. Fulfillment is managed by SheQueen."
        />
        <Suspense fallback={null}>
          <InstallWelcomeCard appName="SheQueen Supplier" />
        </Suspense>

        {orders.length === 0 ? (
          <PartnerEmptyState
            icon={ClipboardList}
            title="No orders yet"
            description="When customers buy your listings, they will show up here."
          />
        ) : (
          <PartnerCard className="divide-y divide-[#E8E2D9]">
            {orders.map((order) => (
              <div key={order.id} className="px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.customerName || 'Customer'}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                      {order.createdAt.toLocaleDateString('en-UG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatUGX(order.total)}</p>
                    <span
                      className={cn(
                        'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        STATUS[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <li key={`${order.id}-${idx}`}>
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
