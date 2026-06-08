'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product, MarketingAdPlacement } from '@/lib/types/database';
import {
  createMarketingAd,
  updateMarketingAd,
  deleteMarketingAd,
} from '@/lib/firebase/marketing-ads';
import { uploadMarketingBanner } from '@/lib/firebase/storage';
import { isRemoteProductImage } from '@/components/product-image';
import { ArrowLeft, Save, Loader2, Upload, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarketingAd } from '@/lib/types/database';

const PLACEMENTS: { value: MarketingAdPlacement; label: string; description: string }[] = [
  {
    value: 'home-hero',
    label: 'Home Page Hero',
    description: 'Home page hero and shop page (when no shop-specific ad is set).',
  },
  {
    value: 'shop-hero',
    label: 'Shop Page Hero',
    description: 'Marketing card on the shop page hero when browsing the full catalog.',
  },
];

type AdFormProps = {
  mode: 'create' | 'edit';
  adId: string;
  initialAd?: MarketingAd;
  products: Product[];
  onSaved?: () => void;
};

function emptyForm() {
  return {
    placement: 'home-hero' as MarketingAdPlacement,
    productId: '',
    headline: '',
    subheadline: '',
    ctaLabel: 'Shop Now',
    badgeText: 'Featured',
    isActive: true,
    priority: '0',
    startsAt: '',
    endsAt: '',
  };
}

function toDateTimeLocalValue(date: Date | null): string {
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdForm({ mode, adId, initialAd, products, onSaved }: AdFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [bannerUrl, setBannerUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const pendingPreview = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile]
  );

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  useEffect(() => {
    if (!initialAd) return;
    setFormData({
      placement: initialAd.placement,
      productId: initialAd.productId,
      headline: initialAd.headline,
      subheadline: initialAd.subheadline,
      ctaLabel: initialAd.ctaLabel,
      badgeText: initialAd.badgeText,
      isActive: initialAd.isActive,
      priority: String(initialAd.priority),
      startsAt: toDateTimeLocalValue(initialAd.startsAt),
      endsAt: toDateTimeLocalValue(initialAd.endsAt),
    });
    setBannerUrl(initialAd.bannerImage);
  }, [initialAd]);

  const selectedProduct = products.find((product) => product.id === formData.productId);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileSelected = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setPendingFile(file);
  };

  const handleSave = async () => {
    if (!formData.productId) {
      toast.error('Select a product to advertise');
      return;
    }

    if (!bannerUrl && !pendingFile) {
      toast.error('Upload a banner image');
      return;
    }

    setSaving(true);
    try {
      let finalBannerUrl = bannerUrl;
      if (pendingFile) {
        finalBannerUrl = await uploadMarketingBanner(adId, pendingFile);
        setBannerUrl(finalBannerUrl);
        setPendingFile(null);
      }

      const payload = {
        id: adId,
        placement: formData.placement,
        productId: formData.productId,
        bannerImage: finalBannerUrl,
        headline: formData.headline.trim(),
        subheadline: formData.subheadline.trim(),
        ctaLabel: formData.ctaLabel.trim() || 'Shop Now',
        badgeText: formData.badgeText.trim() || 'Featured',
        isActive: formData.isActive,
        priority: Number(formData.priority) || 0,
        startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
      };

      if (mode === 'create') {
        await createMarketingAd(payload);
        toast.success('Ad published');
      } else {
        const { id: _id, ...updatePayload } = payload;
        await updateMarketingAd(adId, updatePayload);
        toast.success('Ad updated');
      }

      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save ad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !initialAd) return;
    if (!confirm(`Delete this ad? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await deleteMarketingAd(adId);
      toast.success('Ad deleted');
      onSaved?.();
    } catch {
      toast.error('Failed to delete ad');
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = pendingPreview || (isRemoteProductImage(bannerUrl) ? bannerUrl : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/ads">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Ads
          </Button>
        </Link>
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button variant="outline" className="text-red-600" onClick={handleDelete} disabled={saving}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {mode === 'create' ? 'Publish Ad' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="placement">Placement</Label>
              <select
                id="placement"
                name="placement"
                value={formData.placement}
                onChange={handleInputChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {PLACEMENTS.map((placement) => (
                  <option key={placement.value} value={placement.value}>
                    {placement.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {PLACEMENTS.find((p) => p.value === formData.placement)?.description}
              </p>
            </div>

            <div>
              <Label htmlFor="productId">Featured Product</Label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="headline">Headline (optional)</Label>
              <Input
                id="headline"
                name="headline"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder={selectedProduct?.name ?? 'Defaults to product name'}
              />
            </div>

            <div>
              <Label htmlFor="subheadline">Subheadline (optional)</Label>
              <textarea
                id="subheadline"
                name="subheadline"
                value={formData.subheadline}
                onChange={handleInputChange}
                rows={3}
                placeholder="Short marketing copy for the card"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ctaLabel">Button Label</Label>
                <Input
                  id="ctaLabel"
                  name="ctaLabel"
                  value={formData.ctaLabel}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="badgeText">Badge Text</Label>
                <Input
                  id="badgeText"
                  name="badgeText"
                  value={formData.badgeText}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  value={formData.priority}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="startsAt">Starts (optional)</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="endsAt">Ends (optional)</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-border"
              />
              Active — show on storefront when scheduled
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banner Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary">
              {previewSrc ? (
                <Image src={previewSrc} alt="Banner preview" fill className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                  <Upload className="h-8 w-8 opacity-50" />
                  <p className="text-sm">Upload a portrait or hero banner (recommended 1200×1500px)</p>
                </div>
              )}
              {previewSrc && (
                <button
                  type="button"
                  onClick={() => {
                    setBannerUrl('');
                    setPendingFile(null);
                  }}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                  aria-label="Remove banner"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files)}
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {previewSrc ? 'Replace Banner' : 'Upload Banner'}
            </Button>

            {selectedProduct && (
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="mt-1 text-muted-foreground">{selectedProduct.category}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  The card links to this product and shows live pricing from your catalog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
