'use client';

import { useState } from 'react';
import { Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
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
import { newCommerceId, type ShippingZone } from '@/lib/commerce-settings';
import { saveCommerceSettings } from '@/lib/supabase/commerce-settings';
import { formatUGX } from '@/lib/wholesale-data';

const emptyZone = (): ShippingZone => ({
  id: newCommerceId('zone'),
  name: '',
  countries: ['Uganda'],
  baseCost: 0,
  freeThreshold: 0,
  estimatedDays: '2–3 days',
  enabled: true,
});

function zoneDraft(zone: ShippingZone) {
  return {
    name: zone.name,
    countries: zone.countries.join(', '),
    baseCost: String(zone.baseCost),
    freeThreshold: String(zone.freeThreshold),
    estimatedDays: zone.estimatedDays,
  };
}

export function ShippingPanel() {
  const { settings, loading } = useCommerceSettings();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState(zoneDraft(emptyZone()));

  const persist = async (zones: ShippingZone[], message: string) => {
    setSaving(true);
    try {
      await saveCommerceSettings({ shipping: { zones } });
      toast.success(message);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save shipping');
    } finally {
      setSaving(false);
    }
  };

  const toggleZone = async (id: string, enabled: boolean) => {
    await persist(
      settings.shipping.zones.map((zone) => (zone.id === id ? { ...zone, enabled } : zone)),
      enabled ? 'Zone enabled' : 'Zone hidden'
    );
  };

  const startEdit = (zone: ShippingZone) => {
    setEditingId(zone.id);
    setDraft(zoneDraft(zone));
  };

  const startAdd = () => {
    setEditingId('new');
    setDraft(zoneDraft(emptyZone()));
  };

  const saveEditor = async () => {
    const countries = draft.countries
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const next: ShippingZone = {
      id: editingId === 'new' ? newCommerceId('zone') : (editingId as string),
      name: draft.name.trim() || 'Untitled zone',
      countries: countries.length ? countries : ['Uganda'],
      baseCost: Math.max(0, Math.round(Number(draft.baseCost) || 0)),
      freeThreshold: Math.max(0, Math.round(Number(draft.freeThreshold) || 0)),
      estimatedDays: draft.estimatedDays.trim() || '2–3 days',
      enabled:
        settings.shipping.zones.find((zone) => zone.id === editingId)?.enabled ?? true,
    };

    const zones =
      editingId === 'new'
        ? [...settings.shipping.zones, next]
        : settings.shipping.zones.map((zone) => (zone.id === next.id ? next : zone));

    await persist(zones, editingId === 'new' ? 'Zone added' : 'Zone updated');
  };

  const removeZone = async (id: string) => {
    if (settings.shipping.zones.length <= 1) {
      toast.error('Keep at least one shipping zone');
      return;
    }
    await persist(
      settings.shipping.zones.filter((zone) => zone.id !== id),
      'Zone removed'
    );
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">Shipping zones</CardTitle>
            <CardDescription>
              Checkout currently ships to Uganda, so the Uganda-matching zone is used. A base cost of
              0 keeps delivery free.
            </CardDescription>
          </div>
          <Button className="gap-2 shrink-0 self-start sm:self-auto" onClick={startAdd} disabled={saving}>
            <Plus className="h-4 w-4" />
            Add zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {settings.shipping.zones.map((zone) => (
          <div key={zone.id} className="border-b border-border/60 last:border-0">
            <div className="flex items-start gap-3 px-4 py-4 sm:items-center sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="font-medium">{zone.name}</p>
                  {zone.enabled ? <ActiveBadge /> : <OffBadge />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{zone.countries.join(', ')}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Base</p>
                    <p className="font-semibold tabular-nums">{formatUGX(zone.baseCost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Free over</p>
                    <p className="font-semibold tabular-nums">
                      {zone.freeThreshold > 0 ? formatUGX(zone.freeThreshold) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivery</p>
                    <p className="font-semibold">{zone.estimatedDays}</p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <SettingsSwitch
                  checked={zone.enabled}
                  disabled={loading || saving}
                  label={`${zone.enabled ? 'Disable' : 'Enable'} ${zone.name}`}
                  onCheckedChange={(next) => void toggleZone(zone.id, next)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label={`Edit ${zone.name}`}
                  onClick={() => startEdit(zone)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  aria-label={`Delete ${zone.name}`}
                  onClick={() => void removeZone(zone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editingId === zone.id ? (
              <ZoneEditor
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
          <ZoneEditor
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

function ZoneEditor({
  draft,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  draft: ReturnType<typeof zoneDraft>;
  saving: boolean;
  onChange: (next: ReturnType<typeof zoneDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-t border-border/60 bg-muted/10 px-4 py-4 sm:px-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="zone-name">Name</Label>
          <Input
            id="zone-name"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-eta">Estimated days</Label>
          <Input
            id="zone-eta"
            value={draft.estimatedDays}
            onChange={(e) => onChange({ ...draft, estimatedDays: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="zone-countries">Countries (comma-separated)</Label>
          <Input
            id="zone-countries"
            value={draft.countries}
            onChange={(e) => onChange({ ...draft, countries: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-base">Base cost (UGX)</Label>
          <Input
            id="zone-base"
            type="number"
            min={0}
            value={draft.baseCost}
            onChange={(e) => onChange({ ...draft, baseCost: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zone-free">Free over (UGX)</Label>
          <Input
            id="zone-free"
            type="number"
            min={0}
            value={draft.freeThreshold}
            onChange={(e) => onChange({ ...draft, freeThreshold: e.target.value })}
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
