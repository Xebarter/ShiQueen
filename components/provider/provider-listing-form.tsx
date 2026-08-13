'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServices } from '@/lib/services-context';
import {
  createServiceListing,
  updateServiceListing,
  generateServiceListingId,
} from '@/lib/firebase/service-listings';
import { slugifyServiceName } from '@/lib/services-utils';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';
import type { ServiceListing } from '@/lib/types/services';

type ProviderListingFormProps = {
  mode: 'create' | 'edit';
  providerId: string;
  initial?: ServiceListing;
};

export function ProviderListingForm({ mode, providerId, initial }: ProviderListingFormProps) {
  const router = useRouter();
  const { categories, listings } = useServices();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.categoryId ?? categories[0]?.id ?? '',
    durationMinutes: String(initial?.durationMinutes ?? 60),
    basePrice: String(initial?.basePrice ?? 100000),
    location: initial?.location ?? 'Kampala',
    supportsMobile: initial?.supportsMobile ?? true,
    supportsInStudio: initial?.supportsInStudio ?? true,
    isActive: initial?.isActive ?? true,
  });

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) {
      toast.error('Name and category are required');
      return;
    }
    setSaving(true);
    try {
      const category = categories.find((c) => c.id === form.categoryId);
      if (mode === 'create') {
        const slugBase = slugifyServiceName(form.name);
        const id = (() => {
          try {
            return generateServiceListingId();
          } catch {
            return `svc-${Date.now()}`;
          }
        })();
        await createServiceListing({
          id,
          slug: `${slugBase}-${id.slice(-4)}`,
          name: form.name.trim(),
          description: form.description.trim(),
          benefits: [],
          categoryId: form.categoryId,
          serviceType: category?.serviceTypes[0] || form.name.trim(),
          providerId,
          supplierId: DEFAULT_SUPPLIER_ID,
          durationMinutes: Number(form.durationMinutes) || 60,
          basePrice: Number(form.basePrice) || 0,
          galleryImages: [],
          isFeatured: false,
          isPopular: false,
          isActive: form.isActive,
          isArchived: false,
          supportsMobile: form.supportsMobile,
          supportsInStudio: form.supportsInStudio,
          location: form.location.trim() || 'Kampala',
          bookingCount: 0,
          viewCount: 0,
          rating: 0,
          reviewCount: 0,
          sortOrder: listings.length + 1,
        });
        toast.success('Listing created');
      } else if (initial) {
        await updateServiceListing(initial.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          durationMinutes: Number(form.durationMinutes) || 60,
          basePrice: Number(form.basePrice) || 0,
          location: form.location.trim(),
          supportsMobile: form.supportsMobile,
          supportsInStudio: form.supportsInStudio,
          isActive: form.isActive,
        });
        toast.success('Listing saved');
      }
      router.push('/services/dashboard/listings');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="partner-surface max-w-xl space-y-4 rounded-[1.4rem] p-5 sm:p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Service name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          value={form.categoryId}
          onChange={(e) => setField('categoryId', e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {categories.filter((c) => c.isActive).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input
            id="durationMinutes"
            type="number"
            min={15}
            value={form.durationMinutes}
            onChange={(e) => setField('durationMinutes', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Price (UGX)</Label>
          <Input
            id="basePrice"
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => setField('basePrice', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.supportsInStudio}
          onChange={(e) => setField('supportsInStudio', e.target.checked)}
        />
        In-studio
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.supportsMobile}
          onChange={(e) => setField('supportsMobile', e.target.checked)}
        />
        Mobile / home visit
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setField('isActive', e.target.checked)}
        />
        Active (visible when account is approved)
      </label>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {mode === 'create' ? 'Create listing' : 'Save listing'}
      </Button>
    </form>
  );
}
