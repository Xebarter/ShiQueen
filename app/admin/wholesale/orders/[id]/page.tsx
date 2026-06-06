'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX, getProductNameMap } from '@/lib/wholesale-data';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWholesaleOrderDetailPage() {
  const { bulkOrders, updateBulkOrder } = useWholesale();
  const params = useParams();
  const id = params.id as string;
  const productNames = getProductNameMap();

  const order = bulkOrders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Link href="/admin/wholesale/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <Link
        href="/admin/wholesale/orders"
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{order.id}</h1>
          <p className="text-muted-foreground capitalize">
            {order.orderType} · {order.status}
          </p>
        </div>
        <p className="text-2xl font-bold">{formatUGX(order.totalAmount)}</p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-4">Order Items</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm border-b border-border pb-3 last:border-0">
              <div>
                <p className="font-medium">{productNames[item.productId] || item.productId}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × {formatUGX(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold">{formatUGX(item.totalPrice)}</p>
            </li>
          ))}
        </ul>
      </Card>

      {order.notes && (
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'approved', 'shipped', 'delivered', 'cancelled'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={order.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={async () => {
                  try {
                    await updateBulkOrder(order.id, { status });
                    toast.success('Order updated');
                  } catch {
                    toast.error('Failed to update order');
                  }
                }}
                className="capitalize"
              >
                {status}
              </Button>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
