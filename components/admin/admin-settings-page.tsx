'use client';

import { useMemo, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Edit2,
  Globe,
  MapPin,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { cn } from '@/lib/utils';

type SettingsTab = 'currencies' | 'shipping' | 'taxes' | 'payments';

const TABS: { id: SettingsTab; label: string; icon: typeof DollarSign }[] = [
  { id: 'currencies', label: 'Currencies', icon: DollarSign },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'taxes', label: 'Taxes', icon: Globe },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const CURRENCIES = [
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 1.0, enabled: true },
];

const SHIPPING_ZONES = [
  {
    id: 1,
    name: 'Uganda',
    countries: ['Uganda'],
    baseCost: 'USh 50,000',
    freeThreshold: 'USh 500,000',
    estimatedDays: '2–3 days',
  },
  {
    id: 2,
    name: 'East Africa',
    countries: ['Kenya', 'Tanzania', 'Rwanda', 'Burundi'],
    baseCost: 'USh 75,000',
    freeThreshold: 'USh 750,000',
    estimatedDays: '4–6 days',
  },
  {
    id: 3,
    name: 'Africa',
    countries: ['South Africa', 'Nigeria', 'Ghana', 'Ethiopia', 'Others'],
    baseCost: 'USh 100,000',
    freeThreshold: 'USh 1,000,000',
    estimatedDays: '7–10 days',
  },
  {
    id: 4,
    name: 'International',
    countries: ['All other countries'],
    baseCost: 'USh 150,000',
    freeThreshold: 'USh 1,500,000',
    estimatedDays: '10–15 days',
  },
];

const TAXES = [
  { id: 1, region: 'Uganda', rate: '18%', type: 'VAT', status: 'Active' as const },
  { id: 2, region: 'Kenya', rate: '16%', type: 'VAT', status: 'Active' as const },
  { id: 3, region: 'Tanzania', rate: '18%', type: 'VAT', status: 'Active' as const },
  { id: 4, region: 'Rwanda', rate: '18%', type: 'VAT', status: 'Active' as const },
  { id: 5, region: 'South Africa', rate: '15%', type: 'VAT', status: 'Active' as const },
];

const PAYMENT_METHODS = [
  {
    id: 1,
    name: 'Paytota',
    status: 'Connected' as const,
    supportedCurrencies: 'UGX · MTN & Airtel mobile money',
  },
  {
    id: 2,
    name: 'Cash on Delivery',
    status: 'Connected' as const,
    supportedCurrencies: 'Kampala deliveries',
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof DollarSign;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
        </div>
        <span className={cn('shrink-0 rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function ActiveBadge({ label = 'Active' }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
      {label}
    </span>
  );
}

function ConnectedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-inset ring-sky-500/20">
      Connected
    </span>
  );
}

function RowActions({ editLabel, deleteLabel }: { editLabel: string; deleteLabel: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={editLabel}>
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        aria-label={deleteLabel}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CurrenciesPanel() {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">Supported currencies</CardTitle>
            <CardDescription>Manage currencies for your store</CardDescription>
          </div>
          <Button className="gap-2 shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add currency
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="md:hidden">
          {CURRENCIES.map((currency) => (
            <div
              key={currency.code}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-semibold">
                    {currency.symbol} {currency.code}
                  </p>
                  <ActiveBadge />
                </div>
                <p className="text-sm text-muted-foreground">{currency.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Base rate: {currency.rate}
                </p>
              </div>
              <RowActions editLabel={`Edit ${currency.code}`} deleteLabel={`Delete ${currency.code}`} />
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Code
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Exchange rate
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.map((currency) => (
                <tr
                  key={currency.code}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 font-mono font-semibold">
                    {currency.symbol} {currency.code}
                  </td>
                  <td className="px-5 py-3.5">{currency.name}</td>
                  <td className="px-5 py-3.5 tabular-nums">{currency.rate}</td>
                  <td className="px-5 py-3.5">
                    <ActiveBadge />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <RowActions
                        editLabel={`Edit ${currency.code}`}
                        deleteLabel={`Delete ${currency.code}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ShippingPanel() {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">Shipping zones</CardTitle>
            <CardDescription>Configure rates and delivery times by region</CardDescription>
          </div>
          <Button className="gap-2 shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="md:hidden">
          {SHIPPING_ZONES.map((zone) => (
            <div
              key={zone.id}
              className="border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="font-medium">{zone.name}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {zone.countries.join(', ')}
                  </p>
                </div>
                <RowActions editLabel={`Edit ${zone.name}`} deleteLabel={`Delete ${zone.name}`} />
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Base</p>
                  <p className="font-semibold tabular-nums">{zone.baseCost}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Free over</p>
                  <p className="font-semibold tabular-nums">{zone.freeThreshold}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery</p>
                  <p className="font-semibold">{zone.estimatedDays}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Zone
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Countries
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Base cost
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Free over
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Delivery
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {SHIPPING_ZONES.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 font-medium">{zone.name}</td>
                  <td className="max-w-[200px] px-5 py-3.5 text-muted-foreground">
                    <p className="line-clamp-2">{zone.countries.join(', ')}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums">{zone.baseCost}</td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {zone.freeThreshold}
                  </td>
                  <td className="px-5 py-3.5">{zone.estimatedDays}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <RowActions
                        editLabel={`Edit ${zone.name}`}
                        deleteLabel={`Delete ${zone.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TaxesPanel() {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">Tax rates by region</CardTitle>
            <CardDescription>Manage VAT and tax compliance for your markets</CardDescription>
          </div>
          <Button className="gap-2 shrink-0 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Add tax rate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="md:hidden">
          {TAXES.map((tax) => (
            <div
              key={tax.id}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{tax.region}</p>
                  <ActiveBadge />
                </div>
                <p className="text-sm text-muted-foreground">
                  {tax.type} · <span className="font-semibold text-foreground">{tax.rate}</span>
                </p>
              </div>
              <RowActions editLabel={`Edit ${tax.region}`} deleteLabel={`Delete ${tax.region}`} />
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Region
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rate
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {TAXES.map((tax) => (
                <tr
                  key={tax.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 font-medium">{tax.region}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{tax.type}</td>
                  <td className="px-5 py-3.5 font-semibold">{tax.rate}</td>
                  <td className="px-5 py-3.5">
                    <ActiveBadge />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <RowActions
                        editLabel={`Edit ${tax.region}`}
                        deleteLabel={`Delete ${tax.region}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentsPanel() {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <CardTitle className="text-lg font-light tracking-tight">Payment methods</CardTitle>
        <CardDescription>Connected payment processors and gateways</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="md:hidden">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{method.name}</p>
                  <ConnectedBadge />
                </div>
                <p className="text-xs text-muted-foreground">{method.supportedCurrencies}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                Settings
              </Button>
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4 transition-colors last:border-0 hover:bg-muted/30"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{method.name}</p>
                    <ConnectedBadge />
                  </div>
                  <p className="text-sm text-muted-foreground">{method.supportedCurrencies}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('currencies');

  const stats = useMemo(
    () => ({
      currencies: CURRENCIES.length,
      zones: SHIPPING_ZONES.length,
      taxes: TAXES.length,
      payments: PAYMENT_METHODS.length,
    }),
    []
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="Store configuration for currencies, shipping, taxes, and payments"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Currencies" value={stats.currencies} icon={DollarSign} accent="text-foreground" />
        <StatCard label="Shipping zones" value={stats.zones} icon={Truck} accent="text-violet-600" />
        <StatCard label="Tax regions" value={stats.taxes} icon={Globe} accent="text-amber-600" />
        <StatCard label="Gateways" value={stats.payments} icon={CreditCard} accent="text-emerald-600" />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="shrink-0 gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === 'currencies' && <CurrenciesPanel />}
      {activeTab === 'shipping' && <ShippingPanel />}
      {activeTab === 'taxes' && <TaxesPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
    </AdminPage>
  );
}
