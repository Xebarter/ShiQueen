'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWholesale } from '@/lib/wholesale-context';
import {
  VOLUME_TIER_LABELS,
  WHOLESALE_TAX_RATE,
  WHOLESALE_CATALOG,
  formatUGX,
} from '@/lib/wholesale-data';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWholesaleSettingsPage() {
  const { wholesaleAccounts, updateAccountStatus } = useWholesale();

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link
        href="/admin/wholesale"
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wholesale Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Wholesale Settings</h1>
      <p className="text-muted-foreground mb-8">
        Configure pricing tiers, tax rates, and manage account applications
      </p>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Global Pricing Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex justify-between p-3 bg-secondary/50 rounded">
              <span className="text-muted-foreground">VAT Rate</span>
              <span className="font-semibold">{(WHOLESALE_TAX_RATE * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary/50 rounded">
              <span className="text-muted-foreground">Wholesale Products</span>
              <span className="font-semibold">{WHOLESALE_CATALOG.length}</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary/50 rounded">
              <span className="text-muted-foreground">Default MOQ</span>
              <span className="font-semibold">10 units</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary/50 rounded">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-semibold">UGX</span>
            </div>
          </div>
          <h3 className="font-semibold mb-3">Volume Pricing Tiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VOLUME_TIER_LABELS.map((tier) => (
              <div key={tier.label} className="p-4 border border-border rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">{tier.label}</p>
                <p className="text-xl font-bold">{tier.discount}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Wholesale Account Applications ({wholesaleAccounts.length})
          </h2>
          {wholesaleAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {wholesaleAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">{account.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Customer: {account.customerId}
                      {account.taxId && ` · Tax ID: ${account.taxId}`}
                    </p>
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-1 rounded capitalize bg-secondary">
                      {account.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['approved', 'rejected', 'suspended'] as const).map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateAccountStatus(account.id, status);
                            toast.success('Account status updated');
                          } catch {
                            toast.error('Failed to update account');
                          }
                        }}
                        className="capitalize"
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
