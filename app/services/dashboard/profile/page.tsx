'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  Building2,
  Car,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
} from 'lucide-react';
import { ProviderShell, PROVIDER_STATUS_META } from '@/components/provider/provider-shell';
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
import { useServices } from '@/lib/services-context';
import { updateServiceProvider } from '@/lib/firebase/service-providers';
import { uploadProviderLogo } from '@/lib/firebase/storage';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
import { cn } from '@/lib/utils';

type ProfileForm = {
  name: string;
  businessName: string;
  phone: string;
  city: string;
  address: string;
  bio: string;
  categoryIds: string[];
  mobileServiceEnabled: boolean;
  serviceAreas: string;
  profileImage: string;
};

function completenessItems(form: ProfileForm) {
  return [
    { id: 'logo', label: 'Logo', done: Boolean(form.profileImage.trim()) },
    { id: 'business', label: 'Business', done: Boolean(form.businessName.trim()) },
    { id: 'name', label: 'Name', done: Boolean(form.name.trim()) },
    { id: 'phone', label: 'Phone', done: Boolean(form.phone.trim()) },
    { id: 'city', label: 'City', done: Boolean(form.city.trim()) },
    { id: 'address', label: 'Address', done: Boolean(form.address.trim()) },
    { id: 'categories', label: 'Categories', done: form.categoryIds.length > 0 },
    { id: 'bio', label: 'Bio', done: Boolean(form.bio.trim()) },
  ];
}

export default function ProviderProfilePage() {
  const { providerId, profile } = useAuth();
  const { providers } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    businessName: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
    categoryIds: [],
    mobileServiceEnabled: false,
    serviceAreas: '',
    profileImage: '',
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
      profileImage: provider.profileImage,
    });
  }, [provider]);

  const checklist = useMemo(() => completenessItems(form), [form]);
  const completeCount = checklist.filter((item) => item.done).length;
  const completePct = Math.round((completeCount / checklist.length) * 100);
  const previewInitial =
    form.businessName.trim().charAt(0).toUpperCase() ||
    form.name.trim().charAt(0).toUpperCase() ||
    'S';
  const statusMeta = provider ? PROVIDER_STATUS_META[provider.approvalStatus] : null;
  const joinedLabel = provider
    ? new Intl.DateTimeFormat('en-UG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(provider.createdAt)
    : '';
  const selectedCategories = SERVICE_CATALOG.filter((cat) =>
    form.categoryIds.includes(cat.id)
  );

  if (!providerId || !provider || !statusMeta) {
    return (
      <ProviderShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </ProviderShell>
    );
  }

  const persistLogo = async (profileImage: string) => {
    await updateServiceProvider(providerId, { profileImage });
    setForm((f) => ({ ...f, profileImage }));
  };

  const handleLogoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadProviderLogo(providerId, file);
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
        profileImage: form.profileImage,
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
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
      {isRemoteProductImage(form.profileImage) ? (
        <Image
          src={form.profileImage}
          alt={`${form.businessName || 'Business'} logo`}
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
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Profile"
          action={
            <Button
              type="submit"
              form="provider-profile-form"
              disabled={saving || uploadingLogo}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        />

        <div className="mb-6 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.10] p-5 shadow-sm sm:p-6">
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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="shrink-0">
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={form.profileImage ? 'Change logo' : 'Upload logo'}
                >
                  <LogoMark className="h-20 w-20 sm:h-24 sm:w-24" sizes="96px" />
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {uploadingLogo ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-white" />
                    )}
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingLogo ? '…' : form.profileImage ? 'Change' : 'Upload'}
                  </Button>
                  {form.profileImage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={uploadingLogo}
                      onClick={() => void handleLogoRemove()}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold tracking-tight">
                  {form.businessName || 'Your studio'}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {[form.name, form.city || provider.city].filter(Boolean).join(' · ') ||
                    'Add name & city'}
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
                      provider.isActive
                        ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
                        : 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
                    )}
                  >
                    {provider.isActive ? 'Active' : 'Paused'}
                  </span>
                  {provider.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-inset ring-primary/20">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : null}
                  {form.mobileServiceEnabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 ring-1 ring-inset ring-sky-500/20">
                      <Car className="h-3 w-3" />
                      Mobile
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Complete
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{completePct}%</p>
              <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completePct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {completeCount}/{checklist.length}
              </p>
            </div>
          </div>
        </div>

        <form
          id="provider-profile-form"
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="space-y-6">
            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Business</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="businessName">Business</Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    className="h-11"
                    placeholder="Studio name"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-11"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Contact</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || provider.email}
                      readOnly
                      className="h-11 bg-muted/40 pl-9 text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="h-11"
                    placeholder="+256…"
                  />
                </div>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Location</h3>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="h-11"
                    placeholder="Studio / street"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="serviceAreas">Service areas</Label>
                  <Input
                    id="serviceAreas"
                    value={form.serviceAreas}
                    onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))}
                    className="h-11"
                    placeholder="Comma-separated"
                  />
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.mobileServiceEnabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, mobileServiceEnabled: e.target.checked }))
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="flex items-center gap-2 font-medium">
                    <Car className="h-4 w-4 text-primary" />
                    Mobile visits
                  </span>
                </label>
              </div>
            </PartnerCard>

            <PartnerCard className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Categories</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        'rounded-xl border px-3 py-3 text-left text-sm font-medium transition',
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </PartnerCard>

            <div className="flex justify-end lg:hidden">
              <Button type="submit" disabled={saving || uploadingLogo} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <PartnerCard className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <div className="mt-3 rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.05] via-background to-accent/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <LogoMark className="h-12 w-12 !rounded-xl" sizes="48px" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">
                      {form.businessName || 'Your studio'}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {form.name || 'Name'}
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
                {selectedCategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                    {selectedCategories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {cat.name}
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
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="font-medium">{joinedLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Visible</dt>
                  <dd className="font-medium">{provider.isActive ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
              {provider.rejectionReason ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {provider.rejectionReason}
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
    </ProviderShell>
  );
}
