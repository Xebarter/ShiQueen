'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX, getProductNameMap } from '@/lib/wholesale-data';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminWholesaleOrdersPage() {
  const { bulkOrders, updateBulkOrder } = useWholesale();
  const productNames = getProductNameMap();

  const handleStatusChange = async (id: string, status: typeof bulkOrders[0]['status']) => {
    try {
      await updateBulkOrder(id, { status });
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/wholesale"
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wholesale Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Bulk Orders</h1>
      <p className="text-muted-foreground mb-8">
        Review and manage wholesale bulk orders
      </p>

      {bulkOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No bulk orders have been placed yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Orders appear here when customers checkout from the bulk order builder.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bulkOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{order.id}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded capitalize ${STATUS_COLORS[order.status]}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                      {order.orderType}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.requestedAt instanceof Date
                      ? order.requestedAt.toLocaleString()
                      : new Date(order.requestedAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-xl font-bold">{formatUGX(order.totalAmount)}</p>
              </div>

              <div className="border-t border-border pt-4 mb-4">
                <p className="text-sm font-semibold mb-2">Items</p>
                <ul className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.productId} className="flex justify-between">
                      <span>
                        {productNames[item.productId] || item.productId} × {item.quantity}
                      </span>
                      <span>{formatUGX(item.totalPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['pending', 'approved', 'shipped', 'delivered', 'cancelled'] as const).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={order.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(order.id, status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
