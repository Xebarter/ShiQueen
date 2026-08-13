'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Check,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Scissors,
  Star,
  Trash2,
  UserRound,
  X,
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
import { isRemoteProductImage } from '@/components/product-image';
import { useServices } from '@/lib/services-context';
import {
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  type ProviderCatalogCounts,
} from '@/lib/firebase/service-providers';
import { upsertProviderAvailability } from '@/lib/firebase/provider-availability';
import { uploadProviderImage, uploadProviderImages } from '@/lib/firebase/storage';
import { getDefaultWeeklySlots } from '@/lib/services-utils';
import { formatUGX } from '@/lib/wholesale-data';
import type { ServiceProvider } from '@/lib/types/services';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PROVIDERS_LIST_HREF = '/admin/services?tab=providers';

const AREA_PRESETS = [
  'Kampala',
  'Kololo',
  'Nakasero',
  'Ntinda',
  'Bugolobi',
  'Naguru',
  'Wandegeya',
  'Bukoto',
];

type ServiceProviderFormProps = {
  mode: 'create' | 'edit';
  providerId: string;
  initialProvider?: ServiceProvider;
  catalogCounts?: ProviderCatalogCounts;
  onSaved?: () => void;
};

type FormState = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  bio: string;
  experienceYears: string;
  categoryIds: string[];
  profileImage: string;
  portfolioImages: string[];
  isVerified: boolean;
  isActive: boolean;
  mobileServiceEnabled: boolean;
  serviceRadiusKm: string;
  serviceAreas: string[];
  travelFee: string;
};

function emptyForm(): FormState {
  return {
    name: '',
    businessName: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Kampala',
    bio: '',
    experienceYears: '1',
    categoryIds: [],
    profileImage: '',
    portfolioImages: [],
    isVerified: false,
    isActive: true,
    mobileServiceEnabled: false,
    serviceRadiusKm: '0',
    serviceAreas: ['Kampala'],
    travelFee: '0',
  };
}

function toFormState(provider: ServiceProvider): FormState {
  return {
    name: provider.name,
    businessName: provider.businessName,
    email: provider.email,
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    address: provider.address,
    city: provider.city,
    bio: provider.bio,
    experienceYears: String(provider.experienceYears ?? 0),
    categoryIds: [...provider.categoryIds],
    profileImage: provider.profileImage,
    portfolioImages: [...provider.portfolioImages],
    isVerified: provider.isVerified,
    isActive: provider.isActive,
    mobileServiceEnabled: provider.mobileServiceEnabled,
    serviceRadiusKm: String(provider.serviceRadiusKm ?? 0),
    serviceAreas: provider.serviceAreas.length ? [...provider.serviceAreas] : ['Kampala'],
    travelFee: String(provider.travelFee ?? 0),
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

export function ServiceProviderForm({
  mode,
  providerId,
  initialProvider,
  catalogCounts,
  onSaved,
}: ServiceProviderFormProps) {
  const router = useRouter();
  const { categories } = useServices();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [areaDraft, setAreaDraft] = useState('');
  const [form, setForm] = useState<FormState>(() =>
    initialProvider ? toFormState(initialProvider) : emptyForm()
  );

  const countsLabel = useMemo(() => {
    if (!catalogCounts) return null;
    return `${catalogCounts.activeListings} active of ${catalogCounts.listings} listings`;
  }, [catalogCounts]);

  const completion = useMemo(
    () => ({
      identity: Boolean(form.name.trim() && form.businessName.trim()),
      contact: Boolean(form.phone.trim() || form.email.trim()),
      location: Boolean(form.city.trim()),
      categories: form.categoryIds.length > 0,
    }),
    [form]
  );

  const completionCount = Object.values(completion).filter(Boolean).length;
  const previewInitial = (form.businessName.trim() || form.name.trim() || 'P')
    .slice(0, 1)
    .toUpperCase();
  const previewName = form.businessName.trim() || 'Business name';
  const previewPerson = form.name.trim() || 'Provider name';
  const previewContact =
    [form.phone.trim() || form.email.trim()].filter(Boolean).join(' · ') ||
    'Add contact details';

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const addArea = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setForm((prev) =>
      prev.serviceAreas.some((a) => a.toLowerCase() === value.toLowerCase())
        ? prev
        : { ...prev, serviceAreas: [...prev.serviceAreas, value] }
    );
    setAreaDraft('');
  };

  const removeArea = (area: string) => {
    setForm((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((a) => a !== area),
    }));
  };

  const handleProfileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProviderImage(`${providerId}-profile`, file);
      setField('profileImage', url);
      toast.success('Profile photo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await uploadProviderImages(
        `${providerId}-portfolio`,
        Array.from(files)
      );
      setForm((prev) => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...urls],
      }));
      toast.success(urls.length === 1 ? 'Photo added' : `${urls.length} photos added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Provider name is required.');
      return;
    }
    if (!form.businessName.trim()) {
      toast.error('Business name is required.');
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast.error('Add a phone number or email.');
      return;
    }
    if (form.categoryIds.length === 0) {
      toast.error('Select at least one service category.');
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<ServiceProvider, 'createdAt' | 'updatedAt'> = {
        id: providerId,
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim() || 'Kampala',
        profileImage: form.profileImage,
        bio: form.bio.trim(),
        experienceYears: Number(form.experienceYears) || 0,
        categoryIds: form.categoryIds,
        portfolioImages: form.portfolioImages,
        isVerified: form.isVerified,
        isActive: form.isActive,
        ownerUid: initialProvider?.ownerUid ?? null,
        approvalStatus: initialProvider?.approvalStatus ?? (form.isActive ? 'approved' : 'pending'),
        approvedAt: initialProvider?.approvedAt,
        rejectedAt: initialProvider?.rejectedAt,
        rejectionReason: initialProvider?.rejectionReason,
        mobileServiceEnabled: form.mobileServiceEnabled,
        serviceRadiusKm: form.mobileServiceEnabled
          ? Number(form.serviceRadiusKm) || 0
          : 0,
        serviceAreas: form.serviceAreas.length ? form.serviceAreas : [form.city.trim() || 'Kampala'],
        travelFee: form.mobileServiceEnabled ? Number(form.travelFee) || 0 : 0,
        rating: initialProvider?.rating ?? 0,
        reviewCount: initialProvider?.reviewCount ?? 0,
        completedJobs: initialProvider?.completedJobs ?? 0,
      };

      if (mode === 'create') {
        await createServiceProvider(payload);
        await upsertProviderAvailability({
          id: providerId,
          providerId,
          weeklySlots: getDefaultWeeklySlots(),
          blackoutDates: [],
          slotDurationMinutes: 60,
        });
        toast.success('Provider created');
      } else {
        const { id: _id, ...data } = payload;
        await updateServiceProvider(providerId, data);
        toast.success('Provider saved');
      }
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !initialProvider) return;
    const listingNote = catalogCounts?.listings
      ? ` ${catalogCounts.listings} linked listing(s) will be archived.`
      : '';
    if (
      !confirm(
        `Delete "${initialProvider.businessName}"?${listingNote} Bookings are kept for history.`
      )
    ) {
      return;
    }

    try {
      await deleteServiceProvider(providerId);
      toast.success('Provider deleted');
      router.push(PROVIDERS_LIST_HREF);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete provider');
    }
  };

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href={
            mode === 'edit'
              ? `/admin/services/providers/${providerId}`
              : PROVIDERS_LIST_HREF
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'edit' ? 'Back to provider' : 'Back to providers'}
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Scissors className="h-3.5 w-3.5" />
              {mode === 'create' ? 'New provider' : 'Editing provider'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === 'create' ? 'Add a service provider' : 'Edit provider'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {mode === 'create'
                ? 'Create a stylist or studio profile so bookings and listings can be assigned on the storefront.'
                : 'Update the profile customers see when browsing and booking services.'}
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button
              variant="outline"
              onClick={() => router.push(PROVIDERS_LIST_HREF)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="min-w-[9.5rem]">
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
              icon={UserRound}
              title="Identity"
              description="How this provider appears on listings and the public services page."
            />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Amina Nakato"
                  className="h-11"
                  autoFocus={mode === 'create'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business / studio name *</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => setField('businessName', e.target.value)}
                  placeholder="e.g. Glow Studio Kampala"
                  className="h-11"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Experience, specialties, and what clients can expect…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Years of experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min={0}
                  value={form.experienceYears}
                  onChange={(e) => setField('experienceYears', e.target.value)}
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={ImagePlus}
              title="Photos"
              description="Profile portrait and portfolio work shown on the public listing."
            />
            <CardContent className="space-y-6 pt-6">
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  void handleProfileUpload(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handlePortfolioUpload(e.target.files);
                  e.target.value = '';
                }}
              />

              <div className="space-y-2">
                <Label>Profile photo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border bg-muted">
                    {isRemoteProductImage(form.profileImage) ? (
                      <Image
                        src={form.profileImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
                        {previewInitial}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => profileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading…' : 'Upload photo'}
                    </Button>
                    {form.profileImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setField('profileImage', '')}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Portfolio</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => portfolioInputRef.current?.click()}
                  >
                    Add photos
                  </Button>
                </div>
                {form.portfolioImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No portfolio photos yet. These appear on the provider’s public profile.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {form.portfolioImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        {isRemoteProductImage(url) ? (
                          <Image src={url} alt="" fill className="object-cover" sizes="160px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Image
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
                            }))
                          }
                          className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-rose-600 hover:bg-background"
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={Phone}
              title="Contact"
              description="How customers and admin reach this provider."
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
                    placeholder="hello@studio.ug"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="07XXXXXXXX"
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
              title="Location & coverage"
              description="Studio address and areas served for mobile bookings."
            />
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Studio / business address</Label>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Service areas</Label>
                <div className="flex flex-wrap gap-1.5">
                  {form.serviceAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => removeArea(area)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {area}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={areaDraft}
                    onChange={(e) => setAreaDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArea(areaDraft);
                      }
                    }}
                    placeholder="Add an area, then press Enter"
                    className="h-11"
                  />
                  <Button type="button" variant="outline" onClick={() => addArea(areaDraft)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AREA_PRESETS.filter((a) => !form.serviceAreas.includes(a)).map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => addArea(area)}
                      className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50"
                    >
                      + {area}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <SectionHeader
              icon={Briefcase}
              title="Categories & mobile service"
              description="Which catalog categories this provider can be assigned to."
            />
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const active = form.categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
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
                      <p className="pr-6 text-sm font-semibold">{category.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {category.serviceTypes.slice(0, 3).join(', ') || category.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setField('mobileServiceEnabled', !form.mobileServiceEnabled)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                  form.mobileServiceEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                    form.mobileServiceEnabled
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-border bg-background'
                  )}
                >
                  {form.mobileServiceEnabled && <Check className="h-3 w-3" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">Offers mobile / home service</span>
                  <span className="text-xs text-muted-foreground">
                    Customers can book this provider at their address.
                  </span>
                </span>
              </button>

              {form.mobileServiceEnabled && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="serviceRadiusKm">Travel radius (km)</Label>
                    <Input
                      id="serviceRadiusKm"
                      type="number"
                      min={0}
                      value={form.serviceRadiusKm}
                      onChange={(e) => setField('serviceRadiusKm', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travelFee">Travel fee (UGX)</Label>
                    <Input
                      id="travelFee"
                      type="number"
                      min={0}
                      value={form.travelFee}
                      onChange={(e) => setField('travelFee', e.target.value)}
                      className="h-11"
                    />
                    <FieldHint>
                      {Number(form.travelFee) > 0
                        ? `Shown as ${formatUGX(Number(form.travelFee) || 0)} on mobile bookings.`
                        : 'Leave 0 for complimentary travel.'}
                    </FieldHint>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <CardTitle>Directory preview</CardTitle>
              <CardDescription>How this provider will appear in admin and on listings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="rounded-xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm shadow-primary/25">
                    {isRemoteProductImage(form.profileImage) ? (
                      <Image
                        src={form.profileImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      previewInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">{previewName}</p>
                      {form.isVerified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
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
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{previewPerson}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{previewContact}</span>
                    </p>
                    {form.city.trim() && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {form.city.trim()}
                        {form.mobileServiceEnabled ? ' · Mobile' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Storefront visibility and verification.</CardDescription>
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
                  <span className="block text-sm font-medium">Active on storefront</span>
                  <span className="text-xs text-muted-foreground">
                    Listings for this provider can appear in public search.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setField('isVerified', !form.isVerified)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                  form.isVerified
                    ? 'border-sky-500/30 bg-sky-500/5'
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition',
                    form.isVerified
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-border bg-background'
                  )}
                >
                  {form.isVerified && <Star className="h-3 w-3" />}
                </span>
                <span>
                  <span className="block text-sm font-medium">Verified provider</span>
                  <span className="text-xs text-muted-foreground">
                    Shows a verified badge on public listings.
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
                <ChecklistItem done={completion.identity} label="Name and business" />
                <ChecklistItem done={completion.contact} label="Phone or email" />
                <ChecklistItem done={completion.location} label="City" />
                <ChecklistItem done={completion.categories} label="At least one category" />
              </CardContent>
            </Card>
          )}

          {mode === 'edit' && (
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Linked listings</CardTitle>
                <CardDescription>{countsLabel ?? 'Loading linked services…'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <Link
                  href={`/admin/services/providers/${providerId}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-muted/50"
                >
                  View provider details
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create provider' : 'Save changes'}
                </>
              )}
            </Button>
            {mode === 'edit' && (
              <Button type="button" variant="destructive" className="w-full" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete provider
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
