'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ActiveBadge,
  OffBadge,
  SettingsSwitch,
} from '@/components/admin/settings/settings-switch';
import { useCommerceSettings } from '@/lib/commerce-settings-context';
import {
  enabledPaymentMethods,
  type CommercePayments,
  type PaymentMethodKey,
} from '@/lib/commerce-settings';
import { saveCommerceSettings } from '@/lib/supabase/commerce-settings';

const METHODS: Array<{
  key: PaymentMethodKey;
  label: string;
  description: string;
  icon: typeof Smartphone;
}> = [
  {
    key: 'mobile_money',
    label: 'Paytota (Mobile Money)',
    description: 'MTN and Airtel via Paytota. Requires PAYTOTA_* env vars to complete charges.',
    icon: Smartphone,
  },
  {
    key: 'card',
    label: 'Card (Visa / Mastercard)',
    description: 'DPO PayGate. Requires NEXT_PUBLIC_DPO_COMPANY_TOKEN to complete charges.',
    icon: CreditCard,
  },
  {
    key: 'cash_on_delivery',
    label: 'Cash on Delivery',
    description: 'Pay when the order arrives. No gateway credentials required.',
    icon: Truck,
  },
];

export function PaymentsPanel() {
  const { settings, loading } = useCommerceSettings();
  const [saving, setSaving] = useState(false);

  const toggle = async (key: PaymentMethodKey, enabled: boolean) => {
    const next: CommercePayments = {
      ...settings.payments,
      [key]: { enabled },
    };
    if (!enabled && enabledPaymentMethods({ ...settings, payments: next }).length === 0) {
      toast.error('Keep at least one payment method on');
      return;
    }
    setSaving(true);
    try {
      await saveCommerceSettings({ payments: next });
      toast.success(enabled ? `${labelFor(key)} enabled` : `${labelFor(key)} turned off`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <CardTitle className="text-lg font-light tracking-tight">Payment methods</CardTitle>
        <CardDescription>
          Methods that are off are hidden at checkout. At least one must stay on.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 p-0">
        {METHODS.map((method) => {
          const on = settings.payments[method.key].enabled;
          const Icon = method.icon;
          return (
            <div
              key={method.key}
              className="flex items-start gap-3 px-4 py-4 sm:items-center sm:px-5"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{method.label}</p>
                  {on ? <ActiveBadge /> : <OffBadge />}
                </div>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
              <SettingsSwitch
                checked={on}
                disabled={loading || saving}
                label={`${on ? 'Disable' : 'Enable'} ${method.label}`}
                onCheckedChange={(next) => void toggle(method.key, next)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function labelFor(key: PaymentMethodKey): string {
  return METHODS.find((method) => method.key === key)?.label ?? key;
}
