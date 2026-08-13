'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  Building2,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
} from 'lucide-react';
import { SupplierShell, SUPPLIER_STATUS_META } from '@/components/supplier/supplier-shell';
import {
  PartnerCard,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { isRemoteProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { updateSupplier } from '@/lib/firebase/suppliers';
import { uploadSupplierLogo } from '@/lib/firebase/storage';
import {
  SUPPLIER_CATEGORY_OPTIONS,
  type SupplierCategory,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';

const LISTING_CATEGORIES = SUPPLIER_CATEGORY_OPTIONS.filter(
  (c) => c.id === 'products' || c.id === 'packages'
);

type ProfileForm = {
  companyName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  notes: string;
  logo: string;
  categories: SupplierCategory[];
};

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function completenessItems(form: ProfileForm) {
  return [
    { id: 'logo', label: 'Business logo', done: Boolean(form.logo.trim()) },
    { id: 'company', label: 'Company name', done: Boolean(form.companyName.trim()) },
    { id: 'contact', label: 'Contact person', done: Boolean(form.contactName.trim()) },
    { id: 'phone', label: 'Phone number', done: Boolean(form.phone.trim()) },
    { id: 'city', label: 'City', done: Boolean(form.city.trim()) },
    { id: 'address', label: 'Street address', done: Boolean(form.address.trim()) },
    { id: 'categories', label: 'Catalog types', done: form.categories.length > 0 },
    { id: 'about', label: 'About your business', done: Boolean(form.notes.trim()) },
  ];
}

export default function SupplierProfilePage() {
  const { supplierId, profile } = useAuth();
  const { getSupplierById } = useSuppliers();
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    companyName: '',
    contactName: '',
    phone: '',
    whatsapp: '',
    city: '',
    address: '',
    notes: '',
    logo: '',
    categories: [],
  });

  useEffect(() => {
    if (!supplier) return;
    setForm({
      companyName: supplier.companyName,
      contactName: supplier.contactName,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp || supplier.phone,
      city: supplier.city,
      address: supplier.address,
      notes: supplier.notes,
      logo: supplier.logo,
      categories: supplier.categories.filter((c) => c === 'products' || c === 'packages'),
    });
  }, [supplier]);

  const checklist = useMemo(() => completenessItems(form), [form]);
  const completeCount = checklist.filter((item) => item.done).length;
  const completePct = Math.round((completeCount / checklist.length) * 100);
  const previewInitial =
    form.companyName.trim().charAt(0).toUpperCase() ||
    form.contactName.trim().charAt(0).toUpperCase() ||
    'S';
  const statusMeta = supplier ? SUPPLIER_STATUS_META[supplier.approvalStatus] : null;
  const joinedLabel = supplier
    ? new Intl.DateTimeFormat('en-UG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(supplier.createdAt)
    : '';

  if (!supplierId || !supplier || !statusMeta) {
    return (
      <SupplierShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </SupplierShell>
    );
  }

  const persistLogo = async (logo: string) => {
    await updateSupplier(supplierId, { logo });
    setForm((f) => ({ ...f, logo }));
  };

  const handleLogoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadSupplierLogo(supplierId, file);
      await persistLogo(url);
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    setUploadingLogo(true);
    try {
      await persistLogo('');
      toast.success('Logo removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const phone = form.phone.trim();
      await updateSupplier(supplierId, {
        companyName: form.companyName.trim(),
        name: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone,
        whatsapp: form.whatsapp.trim() || phone,
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        logo: form.logo,
        categories: form.categories,
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const LogoMark = ({
    className,
    sizes,
  }: {
    className: string;
    sizes: string;
  }) => (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm',
        className
      )}
    >
      {isRemoteProductImage(form.logo) ? (
        <Image
          src={form.logo}
          alt={`${form.companyName || 'Business'} logo`}
          fill
          className="object-cover"
          sizes={sizes}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-primary text-lg font-semibold text-primary-foreground">
          {previewInitial}
        </div>
      )}
    </div>
  );

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Account"
          title="Business profile"
          description="How ShiQueen and your buyers recognize your brand."
          action={
            <Button type="submit" form="supplier-profile-form" disabled={saving || uploadingLogo} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
          }
        />

        <div className="mb-6 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.10] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <LogoMark className="h-20 w-20 sm:h-24 sm:w-24" sizes="96px" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Supplier identity
                </p>
                <h2 className="mt-1 truncate text-2xl font-bold tracking-tight">
                  {form.companyName || 'Your company'}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {[form.contactName, form.city || supplier.city].filter(Boolean).join(' · ') ||
                    'Add your contact and city'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                      statusMeta.className
                    )}
                  >
                    {statusMeta.label}
                  </span>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                      supplier.isActive
                        ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
                        : 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
                    )}
                  >
                    {supplier.isActive ? 'Storefront on' : 'Storefront paused'}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Profile completeness
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{completePct}%</p>
              <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completePct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {completeCount} of {checklist.length} details
              </p>
            </div>
          </div>
        </div>

        <form
          id="supplier-profile-form"
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="space-y-6">
            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Brand mark</h3>
                  <p className="text-xs text-muted-foreground">Used in the supplier portal and admin directory.</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  void handleLogoUpload(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="flex items-center gap-4">
                <LogoMark className="h-24 w-24" sizes="96px" />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {uploadingLogo ? 'Uploading…' : form.logo ? 'Change logo' : 'Upload logo'}
                    </Button>
                    {form.logo ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => void handleLogoRemove()}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <FieldHint>JPEG, PNG, WebP, or GIF · up to 5MB. Square crops look best.</FieldHint>
                </div>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Company</h3>
                  <p className="text-xs text-muted-foreground">Legal and trading name as it should appear.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="h-11"
                    placeholder="e.g. Pearl Beauty Supply"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contactName">Primary contact</Label>
                  <Input
                    id="contactName"
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    className="h-11"
                    placeholder="Who ShiQueen should reach"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">About your business</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={4}
                    placeholder="Lead times, specialties, what you supply…"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <FieldHint>Shared with ShiQueen when reviewing your account and catalog.</FieldHint>
                </div>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Contact</h3>
                  <p className="text-xs text-muted-foreground">How orders and account updates reach you.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Account email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || supplier.email}
                      readOnly
                      className="h-11 bg-muted/40 pl-9 text-muted-foreground"
                    />
                  </div>
                  <FieldHint>Tied to your sign-in. Change it from Settings if needed.</FieldHint>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="h-11"
                    placeholder="+256 7…"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    className="h-11"
                    placeholder="Defaults to phone"
                  />
                </div>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Location & catalog</h3>
                  <p className="text-xs text-muted-foreground">Where you operate and what you list.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="h-11"
                    placeholder="Kampala"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="h-11"
                    placeholder="Shop, warehouse, or office"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>What you supply</Label>
                  <div className="grid grid-cols-2 gap-2">
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
                            'rounded-xl border px-3 py-3 text-left text-sm font-medium transition',
                            active
                              ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          {cat.label}
                          <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                            {cat.id === 'products' ? 'Individual SKUs on the shop' : 'Curated sets and bundles'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PartnerCard>

            <div className="flex justify-end lg:hidden">
              <Button type="submit" disabled={saving || uploadingLogo} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </Button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <PartnerCard className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Directory preview
              </p>
              <div className="mt-3 rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.05] via-background to-accent/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <LogoMark className="h-12 w-12 !rounded-xl" sizes="48px" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">
                      {form.companyName || 'Your company'}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {form.contactName || 'Primary contact'}
                    </p>
                    {(form.city || form.address) && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {[form.city, form.address].filter(Boolean).join(' · ')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                {form.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                    {form.categories.map((id) => (
                      <span
                        key={id}
                        className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {LISTING_CATEGORIES.find((c) => c.id === id)?.label ?? id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </PartnerCard>

            <PartnerCard className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Account
              </p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{statusMeta.label}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd className="font-medium">{joinedLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Storefront</dt>
                  <dd className="font-medium">{supplier.isActive ? 'Visible' : 'Hidden'}</dd>
                </div>
              </dl>
              {supplier.rejectionReason ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {supplier.rejectionReason}
                </p>
              ) : null}
            </PartnerCard>

            <PartnerCard className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Checklist
              </p>
              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <BadgeCheck
                      className={cn(
                        'h-4 w-4 shrink-0',
                        item.done ? 'text-emerald-600' : 'text-muted-foreground/35'
                      )}
                    />
                    <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </PartnerCard>
          </aside>
        </form>
      </PartnerPage>
    </SupplierShell>
  );
}
