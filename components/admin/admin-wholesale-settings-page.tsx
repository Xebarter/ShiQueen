'use client';

import { Loader2, Percent, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  AccountStatusBadge,
  AdminWholesaleBackLink,
  StatCard,
} from '@/components/admin/admin-wholesale-shared';
import { useWholesale } from '@/lib/wholesale-context';
import {
  VOLUME_TIER_LABELS,
  WHOLESALE_TAX_RATE,
  WHOLESALE_CATALOG,
} from '@/lib/wholesale-data';
import { WholesaleAccount } from '@/lib/types/wholesale';
import { cn } from '@/lib/utils';

function AccountStatusSelect({
  account,
  onUpdate,
}: {
  account: WholesaleAccount;
  onUpdate: (id: string, status: WholesaleAccount['status']) => void;
}) {
  return (
    <select
      value={account.status}
      onChange={(e) => onUpdate(account.id, e.target.value as WholesaleAccount['status'])}
      aria-label={`Update status for ${account.companyName}`}
      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {(['pending', 'approved', 'rejected', 'suspended'] as const).map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function AdminWholesaleSettingsPage() {
  const { wholesaleAccounts, updateAccountStatus, loading } = useWholesale();

  const pendingCount = wholesaleAccounts.filter((a) => a.status === 'pending').length;
  const approvedCount = wholesaleAccounts.filter((a) => a.status === 'approved').length;

  const handleStatusUpdate = async (id: string, status: WholesaleAccount['status']) => {
    try {
      await updateAccountStatus(id, status);
      toast.success('Account status updated');
    } catch {
      toast.error('Failed to update account');
    }
  };

  return (
    <AdminPage className="max-w-5xl">
      <AdminWholesaleBackLink href="/admin/wholesale" label="Back to wholesale" />

      <AdminPageHeader
        title="Wholesale settings"
        description="Pricing configuration and B2B account applications"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="VAT rate"
              value={`${(WHOLESALE_TAX_RATE * 100).toFixed(0)}%`}
              icon={Percent}
              accent="text-foreground"
            />
            <StatCard
              label="Catalog products"
              value={WHOLESALE_CATALOG.length}
              icon={Percent}
              accent="text-violet-600"
            />
            <StatCard
              label="Pending apps"
              value={pendingCount}
              icon={Users}
              accent="text-amber-600"
            />
            <StatCard
              label="Approved accounts"
              value={approvedCount}
              icon={Users}
              accent="text-emerald-600"
            />
          </div>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg font-light tracking-tight">
                Volume pricing tiers
              </CardTitle>
              <CardDescription>Default discount levels by order quantity</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {VOLUME_TIER_LABELS.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl border border-border/70 bg-muted/20 p-4 text-center"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {tier.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-primary">{tier.discount}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-lg border border-border/60 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Default MOQ</p>
                  <p className="mt-0.5 font-semibold">10 units</p>
                </div>
                <div className="rounded-lg border border-border/60 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="mt-0.5 font-semibold">UGX</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg font-light tracking-tight">
                Account applications
              </CardTitle>
              <CardDescription>
                {wholesaleAccounts.length === 0
                  ? 'No applications submitted yet'
                  : `${wholesaleAccounts.length} wholesale account${wholesaleAccounts.length === 1 ? '' : 's'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {wholesaleAccounts.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Applications will appear here when customers apply for wholesale access.
                </p>
              ) : (
                <>
                  <div className="md:hidden">
                    {wholesaleAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="border-b border-border/60 px-4 py-3 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{account.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.customerId}
                              {account.taxId ? ` · Tax ID: ${account.taxId}` : ''}
                            </p>
                            <div className="mt-1.5">
                              <AccountStatusBadge status={account.status} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Update status
                          </span>
                          <AccountStatusSelect account={account} onUpdate={handleStatusUpdate} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30">
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Company
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Customer
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Update
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {wholesaleAccounts.map((account) => (
                          <tr
                            key={account.id}
                            className={cn(
                              'border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30',
                              account.status === 'pending' && 'bg-amber-500/[0.03]'
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium">{account.companyName}</p>
                              {account.taxId && (
                                <p className="text-xs text-muted-foreground">Tax ID: {account.taxId}</p>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">{account.customerId}</td>
                            <td className="px-5 py-3.5">
                              <AccountStatusBadge status={account.status} />
                            </td>
                            <td className="px-5 py-3.5">
                              <AccountStatusSelect account={account} onUpdate={handleStatusUpdate} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPage>
  );
}
