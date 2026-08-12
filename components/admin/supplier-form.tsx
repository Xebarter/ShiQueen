'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuppliers } from '@/lib/suppliers-context';
import {
  DEFAULT_SUPPLIER_ID,
  SUPPLIER_CATEGORY_OPTIONS,
  type Supplier,
  type SupplierCategory,
} from '@/lib/types/suppliers';
import type { SupplierCatalogCounts } from '@/lib/firebase/suppliers';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type SupplierFormProps = {
  mode: 'create' | 'edit';
  supplierId: string;
  initialSupplier?: Supplier;
  catalogCounts?: SupplierCatalogCounts;
  onSaved?: () => void;
};

type FormState = {
  name: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  notes: string;
  categories: SupplierCategory[];
  isDefault: boolean;
  isActive: boolean;
};

const CATEGORY_META: Record<
  SupplierCategory,
  { label: string; hint: string }
> = {
  products: { label: 'Products', hint: 'Retail inventory' },
  packages: { label: 'Packages', hint: 'Curated bundles' },
  services: { label: 'Services', hint: 'Bookable listings' },
};

function emptyForm(): FormState {
  return {
    name: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Kampala',
    notes: '',
    categories: ['products', 'packages', 'services'],
    isDefault: false,
    isActive: true,
  };
}

function toFormState(supplier: Supplier): FormState {
  return {
    name: supplier.name,
    companyName: supplier.companyName,
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    whatsapp: supplier.whatsapp,
    address: supplier.address,
    city: supplier.city,
    notes: supplier.notes,
    categories: supplier.categories.length
      ? supplier.categories
      : ['products', 'packages', 'services'],
    isDefault: supplier.isDefault,
    isActive: supplier.isActive,
  };
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-border/60 bg-muted/20">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
          done
            ? 'border-emerald-500/40 bg-emerald-500 text-white'
            : 'border-border bg-background text-transparent'
        )}
      >
        <Check className="h-3 w-3" />
      </span>
      <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}

export function SupplierForm({
  mode,
  supplierId,
  initialSupplier,
  catalogCounts,
  onSaved,
}: SupplierFormProps) {
  const router = useRouter();
  const { create, update, remove } = useSuppliers();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    initialSupplier ? toFormState(initialSupplier) : emptyForm()
  );

  const isProtectedDefault = supplierId === DEFAULT_SUPPLIER_ID;

  const countsLabel = useMemo(() => {
    if (!catalogCounts) return null;
    return `${catalogCounts.products} products · ${catalogCounts.packages} packages · ${catalogCounts.services} services`;
  }, [catalogCounts]);

  const completion = useMemo(
    () => ({
      identity: Boolean(form.name.trim()),
      contact: Boolean(form.email.trim() || form.phone.trim()),
      location: Boolean(form.city.trim()),
      categories: form.categories.length > 0,
    }),
    [form]
  );

  const completionCount = Object.values(completion).filter(Boolean).length;

  const previewInitial = (form.name.trim() || 'S').slice(0, 1).toUpperCase();
  const previewName = form.name.trim() || 'Supplier name';
  const previewCompany =
    form.companyName.trim() || form.name.trim() || 'Company name';
  const previewContact =
    [form.contactName.trim(), form.phone.trim() || form.email.trim()]
      .filter(Boolean)
      .join(' · ') || 'Add contact details';

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: SupplierCategory) => {
    setForm((prev) => {
      const has = prev.categories.includes(category);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required.');
      return;
    }
    if (form.categories.length === 0) {
      toast.error('Select at least one catalog category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim() || form.name.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        notes: form.notes.trim(),
        categories: form.categories,
        isDefault: form.isDefault || isProtectedDefault,
        isActive: form.isActive,
        approvalStatus: initialSupplier?.approvalStatus ?? 'approved',
        ownerUid: initialSupplier?.ownerUid ?? null,
        approvedAt: initialSupplier?.approvedAt,
        rejectedAt: initialSupplier?.rejectedAt,
        rejectionReason: initialSupplier?.rejectionReason,
      };

      if (mode === 'create') {
        await create({
          ...payload,
          id: supplierId,
          approvalStatus: 'approved',
          ownerUid: null,
          approvedAt: new Date(),
        });
        toast.success('Supplier created');
      } else {
        await update(supplierId, payload);
        toast.success('Supplier saved');
      }
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !initialSupplier) return;
    if (isProtectedDefault) {
      toast.error('The default SheQueen supplier cannot be deleted.');
      return;
    }
    if (
      !confirm(
        `Delete "${initialSupplier.name}"? Linked catalog items will move to the default supplier.`
      )
    ) {
      return;
    }

    try {
      await remove(supplierId);
      toast.success('Supplier deleted');
      router.push('/admin/suppliers');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete supplier');
    }
  };

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin/suppliers"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to suppliers
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Truck className="h-3.5 w-3.5" />
              {mode === 'create' ? 'New supplier' : 'Editing supplier'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === 'create' ? 'Add a catalog supplier' : 'Edit supplier'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {mode === 'create'
                ? 'Create a vendor profile so products, packages, and services can be assigned quickly when listing.'
                : 'Update vendor details used across your catalog listings.'}
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/suppliers')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[9.5rem]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={Building2}
              title="Identity"
              description="How this supplier appears in the admin picker and directory."
            />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Display name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Nile Beauty Distributors"
                  className="h-11"
                  autoFocus={mode === 'create'}
                />
                <FieldHint>Shown in supplier selectors when listing catalog items.</FieldHint>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company / trading name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setField('companyName', e.target.value)}
                  placeholder="Legal or trading name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact person</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setField('contactName', e.target.value)}
                  placeholder="Primary contact"
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={Phone}
              title="Contact"
              description="Reach details for ordering and follow-up."
            />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="orders@supplier.com"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="+256 7…"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setField('whatsapp', e.target.value)}
                  placeholder="Defaults to phone if left empty"
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={MapPin}
              title="Location"
              description="Where this supplier operates from."
            />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Street, area, landmark"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Kampala"
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={Truck}
              title="What they supply"
              description="Choose which catalog areas this vendor can be assigned to."
            />
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {SUPPLIER_CATEGORY_OPTIONS.map((option) => {
                  const active = form.categories.includes(option.id);
                  const meta = CATEGORY_META[option.id];
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleCategory(option.id)}
                      className={cn(
                        'relative rounded-xl border p-4 text-left transition',
                        active
                          ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : 'border-border bg-background hover:bg-muted/40'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card'
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                      <p className="pr-6 text-sm font-semibold">{meta.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta.hint}</p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal notes</Label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Lead times, payment terms, preferred contacts…"
                />
                <FieldHint>Only visible to admins — not shown on the storefront.</FieldHint>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Directory preview</CardTitle>
              <CardDescription>How this supplier will appear in the list.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm shadow-primary/25">
                    {previewInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">{previewName}</p>
                      {(form.isDefault || isProtectedDefault) && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Default
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          form.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {previewCompany}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{previewContact}</span>
                    </p>
                    {form.city.trim() && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {form.city.trim()}
                        {form.address.trim() ? ` · ${form.address.trim()}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                {form.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                    {form.categories.map((id) => (
                      <span
                        key={id}
                        className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {CATEGORY_META[id].label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Visibility and default selection.</CardDescription>
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {completionCount}/4 ready
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <button
                type="button"
                onClick={() => setField('isActive', !form.isActive)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                  form.isActive
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                    form.isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-border bg-background'
                  )}
                >
                  {form.isActive && <Check className="h-3 w-3" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">Active supplier</span>
                  <span className="text-xs text-muted-foreground">
                    Available when creating products, packages, and services.
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={isProtectedDefault}
                onClick={() => setField('isDefault', !form.isDefault)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                  form.isDefault || isProtectedDefault
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border hover:bg-muted/40',
                  isProtectedDefault && 'cursor-not-allowed opacity-80'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                    form.isDefault || isProtectedDefault
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background'
                  )}
                >
                  {(form.isDefault || isProtectedDefault) && <Check className="h-3 w-3" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">Default supplier</span>
                  <span className="text-xs text-muted-foreground">
                    Pre-selected on new catalog listings to save clicks.
                  </span>
                </span>
              </button>
            </CardContent>
          </Card>

          {mode === 'create' && (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Before you save</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <ChecklistItem done={completion.identity} label="Display name" />
                <ChecklistItem done={completion.contact} label="Email or phone" />
                <ChecklistItem done={completion.location} label="City" />
                <ChecklistItem done={completion.categories} label="At least one category" />
              </CardContent>
            </Card>
          )}

          {mode === 'edit' && (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Catalog links</CardTitle>
                <CardDescription>
                  {countsLabel ?? 'Loading linked items…'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-5">
                <Link
                  href="/admin/products"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted/50"
                >
                  Products
                </Link>
                <Link
                  href="/admin/packages"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted/50"
                >
                  Packages
                </Link>
                <Link
                  href="/admin/services"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted/50"
                >
                  Services
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create supplier' : 'Save changes'}
                </>
              )}
            </Button>
            {mode === 'edit' && !isProtectedDefault && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete supplier
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
