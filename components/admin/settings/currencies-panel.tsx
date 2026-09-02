'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActiveBadge } from '@/components/admin/settings/settings-switch';
import { useCommerceSettings } from '@/lib/commerce-settings-context';
import { STORE_CURRENCY_CODE, type StoreCurrency } from '@/lib/commerce-settings';
import { saveCommerceSettings } from '@/lib/supabase/commerce-settings';

export function CurrenciesPanel() {
  const { settings, loading } = useCommerceSettings();
  const currency =
    settings.currencies.find((item) => item.code === STORE_CURRENCY_CODE) ?? settings.currencies[0];
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ symbol: currency.symbol, name: currency.name });

  const startEdit = () => {
    setForm({ symbol: currency.symbol, name: currency.name });
    setEditing(true);
  };

  const save = async () => {
    const next: StoreCurrency = {
      ...currency,
      code: STORE_CURRENCY_CODE,
      enabled: true,
      symbol: form.symbol.trim() || 'USh',
      name: form.name.trim() || 'Ugandan Shilling',
    };
    setSaving(true);
    try {
      await saveCommerceSettings({
        currencies: [next, ...settings.currencies.filter((item) => item.code !== STORE_CURRENCY_CODE)],
      });
      toast.success('Currency updated');
      setEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save currency');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <CardTitle className="text-lg font-light tracking-tight">Store currency</CardTitle>
        <CardDescription>
          Checkout and payment gateways use UGX. Name and symbol can be edited for display.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold">
                {currency.symbol} {currency.code}
              </p>
              <ActiveBadge label="Store currency" />
            </div>
            <p className="text-sm text-muted-foreground">{currency.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Base rate: 1.0 · cannot be turned off</p>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEdit} disabled={loading}>
              Edit
            </Button>
          ) : null}
        </div>
        {editing ? (
          <div className="border-t border-border/60 bg-muted/10 px-4 py-4 sm:px-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currency-symbol">Symbol</Label>
                <Input
                  id="currency-symbol"
                  value={form.symbol}
                  onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency-name">Name</Label>
                <Input
                  id="currency-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
