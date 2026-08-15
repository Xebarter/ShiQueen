'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2 } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
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

export default function ProviderProfilePage() {
  const { providerId } = useAuth();
  const { providers } = useServices();
  const provider = providers.find((p) => p.id === providerId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  if (!providerId || !provider) {
    return (
      <ProviderShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </ProviderShell>
    );
  }

  const previewInitial =
    form.businessName.trim().charAt(0).toUpperCase() ||
    form.name.trim().charAt(0).toUpperCase() ||
    'S';

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

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader title="Profile" />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <Label>Logo</Label>
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
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border bg-muted">
              {isRemoteProductImage(form.profileImage) ? (
                <Image
                  src={form.profileImage}
                  alt={`${form.businessName || 'Business'} logo`}
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
                  {uploadingLogo ? 'Uploading…' : form.profileImage ? 'Change' : 'Upload'}
                </Button>
                {form.profileImage ? (
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
              <p className="mt-1.5 text-xs text-muted-foreground">JPEG, PNG, WebP, GIF</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business</Label>
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
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
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
          Mobile visits
        </label>
        <div className="space-y-2">
          <Label htmlFor="serviceAreas">Service areas</Label>
          <Input
            id="serviceAreas"
            value={form.serviceAreas}
            onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))}
            placeholder="Comma-separated"
          />
        </div>
        <Button type="submit" disabled={saving || uploadingLogo}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </form>
      </PartnerPage>
    </ProviderShell>
  );
}
