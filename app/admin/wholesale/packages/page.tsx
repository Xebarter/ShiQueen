'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX } from '@/lib/wholesale-data';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPackagesPage() {
  const { packages, deletePackage } = useWholesale();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        toast.success('Package deleted');
      } catch {
        toast.error('Failed to delete package');
      }
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Packages</h1>
          <p className="text-muted-foreground">Create and manage wholesale packages and bundles</p>
        </div>
        <Link href="/admin/wholesale/packages/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Package
          </Button>
        </Link>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-6 flex flex-col">
            <div className="flex-1 mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{pkg.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{pkg.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retail:</span>
                  <span className="line-through">{formatUGX(pkg.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wholesale:</span>
                  <span className="font-semibold">{formatUGX(pkg.discountedPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings:</span>
                  <span className="text-accent font-semibold">{pkg.savingsPercentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                {pkg.rule.type === 'fixed' && 'Fixed Bundle'}
                {pkg.rule.type === 'customizable' && 'Customizable'}
                {pkg.rule.type === 'mix-and-match' && 'Mix & Match'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Link href={`/admin/wholesale/packages/${pkg.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(pkg.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No packages created yet</p>
          <Link href="/admin/wholesale/packages/new">
            <Button>Create Your First Package</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
