'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { updateSupplier } from '@/lib/firebase/suppliers';
import {
  SUPPLIER_CATEGORY_OPTIONS,
  type SupplierCategory,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';

const LISTING_CATEGORIES = SUPPLIER_CATEGORY_OPTIONS.filter(
  (c) => c.id === 'products' || c.id === 'packages'
);

export default function SupplierProfilePage() {
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    city: '',
    address: '',
    categories: [] as SupplierCategory[],
  });

  useEffect(() => {
    if (!supplier) return;
    setForm({
      companyName: supplier.companyName,
      contactName: supplier.contactName,
      phone: supplier.phone,
      city: supplier.city,
      address: supplier.address,
      categories: supplier.categories.filter((c) => c === 'products' || c === 'packages'),
    });
  }, [supplier]);

  if (!supplierId || !supplier) {
    return (
      <SupplierShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </SupplierShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSupplier(supplierId, {
        companyName: form.companyName.trim(),
        name: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        categories: form.categories,
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Business profile"
          description="How your company appears on the storefront."
        />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-[#E8E2D9] bg-card p-5 shadow-sm shadow-primary/5">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact name</Label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="flex gap-2">
            {LISTING_CATEGORIES.map((cat) => {
              const active = form.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      categories: active
                        ? f.categories.filter((c) => c !== cat.id)
                        : [...f.categories, cat.id],
                    }))
                  }
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-medium',
                    active ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save profile
        </Button>
      </form>
      </PartnerPage>
    </SupplierShell>
  );
}
