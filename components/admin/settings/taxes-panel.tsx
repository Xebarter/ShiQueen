'use client';

import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ActiveBadge,
  OffBadge,
  SettingsSwitch,
} from '@/components/admin/settings/settings-switch';
import { useCommerceSettings } from '@/lib/commerce-settings-context';
import { newCommerceId, type TaxRegion } from '@/lib/commerce-settings';
import { saveCommerceSettings } from '@/lib/supabase/commerce-settings';

function percentLabel(rate: number): string {
  const percent = rate * 100;
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? Math.round(percent) : rounded}%`;
}

function regionDraft(region: TaxRegion) {
  return {
    region: region.region,
    country: region.country,
    type: region.type,
    ratePercent: String(Math.round(region.rate * 10000) / 100),
  };
}

const emptyRegion = (): TaxRegion => ({
  id: newCommerceId('tax'),
  region: '',
  country: 'Uganda',
  type: 'VAT',
  rate: 0.18,
  enabled: false,
});

export function TaxesPanel() {
  const { settings, loading } = useCommerceSettings();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState(regionDraft(emptyRegion()));

  const persist = async (regions: TaxRegion[], message: string) => {
    setSaving(true);
    try {
      await saveCommerceSettings({ taxes: { regions } });
      toast.success(message);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleRegion = async (id: string, enabled: boolean) => {
    await persist(
      settings.taxes.regions.map((region) => (region.id === id ? { ...region, enabled } : region)),
      enabled ? 'Tax enabled for checkout in this region' : 'Tax turned off for this region'
    );
  };

  const startEdit = (region: TaxRegion) => {
    setEditingId(region.id);
    setDraft(regionDraft(region));
  };

  const saveEditor = async () => {
    const percent = Math.max(0, Number(draft.ratePercent) || 0);
    const next: TaxRegion = {
      id: editingId === 'new' ? newCommerceId('tax') : (editingId as string),
      region: draft.region.trim() || 'Uganda',
      country: draft.country.trim() || draft.region.trim() || 'Uganda',
      type: draft.type.trim() || 'VAT',
      rate: Math.min(1, percent / 100),
      enabled: settings.taxes.regions.find((region) => region.id === editingId)?.enabled ?? false,
    };
    const regions =
      editingId === 'new'
        ? [...settings.taxes.regions, next]
        : settings.taxes.regions.map((region) => (region.id === next.id ? next : region));
    await persist(regions, editingId === 'new' ? 'Tax region added' : 'Tax region updated');
  };

  const removeRegion = async (id: string) => {
    if (settings.taxes.regions.length <= 1) {
      toast.error('Keep at least one tax region');
      return;
    }
    await persist(
      settings.taxes.regions.filter((region) => region.id !== id),
      'Tax region removed'
    );
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">Tax rates by region</CardTitle>
            <CardDescription>
              Checkout is Uganda-only, so only the Uganda row is charged when it is on.
            </CardDescription>
          </div>
          <Button
            className="gap-2 shrink-0 self-start sm:self-auto"
            onClick={() => {
              setEditingId('new');
              setDraft(regionDraft(emptyRegion()));
            }}
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            Add tax rate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {settings.taxes.regions.map((region) => (
          <div key={region.id} className="border-b border-border/60 last:border-0">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{region.region}</p>
                  {region.enabled ? <ActiveBadge /> : <OffBadge />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {region.type} ·{' '}
                  <span className="font-semibold text-foreground">{percentLabel(region.rate)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <SettingsSwitch
                  checked={region.enabled}
                  disabled={loading || saving}
                  label={`${region.enabled ? 'Disable' : 'Enable'} ${region.region} tax`}
                  onCheckedChange={(next) => void toggleRegion(region.id, next)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label={`Edit ${region.region}`}
                  onClick={() => startEdit(region)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  aria-label={`Delete ${region.region}`}
                  onClick={() => void removeRegion(region.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editingId === region.id ? (
              <TaxEditor
                draft={draft}
                saving={saving}
                onChange={setDraft}
                onSave={() => void saveEditor()}
                onCancel={() => setEditingId(null)}
              />
            ) : null}
          </div>
        ))}
        {editingId === 'new' ? (
          <TaxEditor
            draft={draft}
            saving={saving}
            onChange={setDraft}
            onSave={() => void saveEditor()}
            onCancel={() => setEditingId(null)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaxEditor({
  draft,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  draft: ReturnType<typeof regionDraft>;
  saving: boolean;
  onChange: (next: ReturnType<typeof regionDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-t border-border/60 bg-muted/10 px-4 py-4 sm:px-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tax-region">Region</Label>
          <Input
            id="tax-region"
            value={draft.region}
            onChange={(e) => onChange({ ...draft, region: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax-country">Country</Label>
          <Input
            id="tax-country"
            value={draft.country}
            onChange={(e) => onChange({ ...draft, country: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax-type">Type</Label>
          <Input
            id="tax-type"
            value={draft.type}
            onChange={(e) => onChange({ ...draft, type: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tax-rate">Rate (%)</Label>
          <Input
            id="tax-rate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={draft.ratePercent}
            onChange={(e) => onChange({ ...draft, ratePercent: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
