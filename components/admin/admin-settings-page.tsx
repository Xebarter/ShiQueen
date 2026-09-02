'use client';

import { useMemo, useState } from 'react';
import { CreditCard, DollarSign, Globe, Layers, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  ActiveBadge,
  OffBadge,
  SettingsSwitch,
} from '@/components/admin/settings/settings-switch';
import { CurrenciesPanel } from '@/components/admin/settings/currencies-panel';
import { ShippingPanel } from '@/components/admin/settings/shipping-panel';
import { TaxesPanel } from '@/components/admin/settings/taxes-panel';
import { PaymentsPanel } from '@/components/admin/settings/payments-panel';
import { useFeatureFlags } from '@/lib/feature-flags-context';
import { useCommerceSettings } from '@/lib/commerce-settings-context';
import {
  FEATURE_FLAG_KEYS,
  FEATURE_FLAG_META,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@/lib/feature-flags';
import { saveFeatureFlags } from '@/lib/supabase/feature-flags';
import { cn } from '@/lib/utils';

type SettingsTab = 'features' | 'currencies' | 'shipping' | 'taxes' | 'payments';

const TABS: { id: SettingsTab; label: string; icon: typeof DollarSign }[] = [
  { id: 'features', label: 'Features', icon: Layers },
  { id: 'currencies', label: 'Currencies', icon: DollarSign },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'taxes', label: 'Taxes', icon: Globe },
  { id: 'payments', label: 'Payments', icon: CreditCard },
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

function FeaturesPanel() {
  const { flags, loading } = useFeatureFlags();
  const [savingKey, setSavingKey] = useState<FeatureFlagKey | null>(null);

  const toggleFlag = async (key: FeatureFlagKey, next: boolean) => {
    const nextFlags: FeatureFlags = { ...flags, [key]: next };
    setSavingKey(key);
    try {
      await saveFeatureFlags(nextFlags);
      toast.success(
        next
          ? `${FEATURE_FLAG_META[key].title} is now public`
          : `${FEATURE_FLAG_META[key].title} hidden from the storefront`
      );
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update ${FEATURE_FLAG_META[key].title}`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <CardTitle className="text-lg font-light tracking-tight">Public features</CardTitle>
        <CardDescription>
          Turn storefront surfaces on or off. Admin, supplier, and provider dashboards stay available.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {FEATURE_FLAG_KEYS.map((key) => {
          const meta = FEATURE_FLAG_META[key];
          const enabled = flags[key];
          const busy = loading || savingKey === key;
          return (
            <div
              key={key}
              className="flex items-start gap-4 border-b border-border/60 px-4 py-4 last:border-0 sm:items-center sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{meta.title}</p>
                  {enabled ? <ActiveBadge /> : <OffBadge label="Hidden" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{meta.description}</p>
              </div>
              <SettingsSwitch
                checked={enabled}
                disabled={busy}
                label={`${enabled ? 'Hide' : 'Show'} ${meta.title}`}
                onCheckedChange={(next) => void toggleFlag(key, next)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('features');
  const { flags } = useFeatureFlags();
  const { settings } = useCommerceSettings();

  const stats = useMemo(
    () => ({
      features: FEATURE_FLAG_KEYS.filter((key) => flags[key]).length,
      currencies: settings.currencies.length,
      zones: settings.shipping.zones.length,
      taxes: settings.taxes.regions.length,
      payments: Object.values(settings.payments).filter((method) => method.enabled).length,
    }),
    [flags, settings]
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="Store configuration for public features, currencies, shipping, taxes, and payments"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <StatCard
          label="Public features"
          value={`${stats.features}/${FEATURE_FLAG_KEYS.length}`}
          icon={Layers}
          accent="text-primary"
        />
        <StatCard label="Currencies" value={stats.currencies} icon={DollarSign} accent="text-foreground" />
        <StatCard label="Shipping zones" value={stats.zones} icon={Truck} accent="text-violet-600" />
        <StatCard label="Tax regions" value={stats.taxes} icon={Globe} accent="text-amber-600" />
        <StatCard
          label="Methods on"
          value={`${stats.payments}/3`}
          icon={CreditCard}
          accent="text-emerald-600"
        />
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

      {activeTab === 'features' && <FeaturesPanel />}
      {activeTab === 'currencies' && <CurrenciesPanel />}
      {activeTab === 'shipping' && <ShippingPanel />}
      {activeTab === 'taxes' && <TaxesPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
    </AdminPage>
  );
}
