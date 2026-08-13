'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { updateServiceProvider } from '@/lib/firebase/service-providers';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
import { cn } from '@/lib/utils';

export default function ProviderProfilePage() {
  const { providerId } = useAuth();
  const { providers } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
    categoryIds: [] as string[],
    mobileServiceEnabled: false,
    serviceAreas: '',
  });

  useEffect(() => {
    if (!provider) return;
    setForm({
      name: provider.name,
      businessName: provider.businessName,
      phone: provider.phone,
      city: provider.city,
      address: provider.address,
      bio: provider.bio,
      categoryIds: provider.categoryIds,
      mobileServiceEnabled: provider.mobileServiceEnabled,
      serviceAreas: provider.serviceAreas.join(', '),
    });
  }, [provider]);

  if (!providerId || !provider) {
    return (
      <ProviderShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </ProviderShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateServiceProvider(providerId, {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        categoryIds: form.categoryIds,
        mobileServiceEnabled: form.mobileServiceEnabled,
        serviceAreas: form.serviceAreas
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Account"
          title="Business profile"
          description="How you appear on the services marketplace."
        />
      <form onSubmit={handleSubmit} className="partner-surface max-w-xl space-y-4 rounded-[1.4rem] p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Studio address</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_CATALOG.map((cat) => {
              const active = form.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      categoryIds: active
                        ? f.categoryIds.filter((id) => id !== cat.id)
                        : [...f.categoryIds, cat.id],
                    }))
                  }
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left text-xs font-medium',
                    active ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border'
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.mobileServiceEnabled}
            onChange={(e) => setForm((f) => ({ ...f, mobileServiceEnabled: e.target.checked }))}
          />
          Mobile / home visits
        </label>
        <div className="space-y-2">
          <Label htmlFor="serviceAreas">Service areas (comma separated)</Label>
          <Input
            id="serviceAreas"
            value={form.serviceAreas}
            onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save profile
        </Button>
      </form>
      </PartnerPage>
    </ProviderShell>
  );
}
