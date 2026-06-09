'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPage } from '@/components/admin/admin-page';
import { PackageActiveBadge } from '@/components/admin/admin-wholesale-shared';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { isRemoteProductImage } from '@/components/product-image';
import {
  Package,
  PackageItem,
  PackageRule,
  PackagePricingMode,
  PackageCoverMode,
} from '@/lib/types/wholesale';
import { useProducts } from '@/lib/products-context';
import { productsToCatalog, getRetailPricesMap, formatUGX } from '@/lib/wholesale-data';
import { uploadPackageImage, uploadPackageItemImage } from '@/lib/firebase/storage';
import {
  computePackageItemTotal,
  computePackageRetailTotal,
  createCustomPackageItemId,
  getPackageCoverImages,
  getPackageItemImage,
  getPackageItemName,
  getPackageItemRetailUnit,
  getPackageTypeLabel,
  getUniquePackageProductIds,
  isCustomPackageItem,
  mergePackageItemMaps,
  resolveCoverProductIds,
} from '@/lib/package-utils';
import {
  PACKAGE_CATEGORIES,
  PACKAGE_TIERS,
  getDefaultHighlights,
  getPackageNameTemplates,
  type PackageCategoryId,
  type PackageTierId,
} from '@/lib/package-catalog';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Boxes,
  Check,
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface PackageFormProps {
  mode: 'create' | 'edit';
  packageId: string;
  initialData?: Package;
  onSubmit: (data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
}

const BUNDLE_TYPES: {
  value: PackageRule['type'];
  label: string;
  description: string;
}[] = [
  {
    value: 'fixed',
    label: 'Fixed',
    description: 'Pre-selected products with a set price',
  },
  {
    value: 'customizable',
    label: 'Customizable',
    description: 'Curated base the customer can tailor',
  },
  {
    value: 'mix-and-match',
    label: 'Mix & Match',
    description: 'Flexible picks up to an item limit',
  },
];

export function PackageForm({ mode, packageId, initialData, onSubmit }: PackageFormProps) {
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const retailPrices = getRetailPricesMap(catalog);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const itemImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);

  const [category, setCategory] = useState<PackageCategoryId | ''>(
    initialData?.category ?? ''
  );
  const [nameTemplate, setNameTemplate] = useState('');
  const [name, setName] = useState(initialData?.name ?? '');
  const [tagline, setTagline] = useState(initialData?.tagline ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [highlights, setHighlights] = useState<string[]>(initialData?.highlights ?? []);
  const [tier, setTier] = useState<PackageTierId | ''>(initialData?.tier ?? '');
  const [isSignature, setIsSignature] = useState(initialData?.isSignature ?? false);
  const [coverMode, setCoverMode] = useState<PackageCoverMode>(() => {
    if (initialData?.coverMode) return initialData.coverMode;
    if (initialData?.image) return 'upload';
    return 'products';
  });
  const [uploadedImage, setUploadedImage] = useState(initialData?.image ?? '');
  const [coverProductIds, setCoverProductIds] = useState<string[]>(() => {
    if (initialData?.coverProductIds?.length) {
      return initialData.coverProductIds.slice(0, 4);
    }
    const seedItems = initialData?.items ?? [{ productId: catalog[0]?.id ?? '1', quantity: 1 }];
    return getUniquePackageProductIds(seedItems).slice(0, 4);
  });
  const [items, setItems] = useState<PackageItem[]>(
    initialData?.items ?? [{ productId: catalog[0]?.id ?? '1', quantity: 1 }]
  );
  const [ruleType, setRuleType] = useState<PackageRule['type']>(
    initialData?.rule.type ?? 'fixed'
  );
  const [itemLimit, setItemLimit] = useState(initialData?.rule.itemLimit ?? 2);
  const [pricingMode, setPricingMode] = useState<PackagePricingMode>(
    initialData?.pricingMode ?? 'custom'
  );
  const [discountedPrice, setDiscountedPrice] = useState(
    initialData?.discountedPrice?.toString() ?? ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const { productNames: itemNames, retailPrices: itemRetailPrices } = useMemo(
    () =>
      mergePackageItemMaps(
        [{ items } as Package],
        Object.fromEntries(catalog.map((p) => [p.id, p.name])),
        retailPrices
      ),
    [items, catalog, retailPrices]
  );

  const basePrice = useMemo(
    () => computePackageRetailTotal(items, itemRetailPrices),
    [items, itemRetailPrices]
  );

  const calculatedPrice = useMemo(
    () => computePackageItemTotal(items, itemRetailPrices),
    [items, itemRetailPrices]
  );

  const effectivePrice =
    pricingMode === 'auto' ? calculatedPrice : parseInt(discountedPrice) || 0;

  const savingsAmount = Math.max(0, basePrice - effectivePrice);
  const savingsPercentage =
    basePrice > 0 && effectivePrice > 0 ? (savingsAmount / basePrice) * 100 : 0;

  const coverOptions = useMemo(() => {
    const ids = getUniquePackageProductIds(items);
    return ids.map((id) => {
      const item = items.find((i) => i.productId === id);
      if (item && isCustomPackageItem(item)) {
        return {
          id,
          name: item.customName?.trim() || 'Custom item',
          image: item.customImage,
        };
      }
      const product = products.find((p) => p.id === id);
      return {
        id,
        name: product?.name ?? 'Product',
        image: product?.image,
      };
    });
  }, [items, products]);

  const previewCoverImages = useMemo(
    () =>
      getPackageCoverImages(
        {
          id: packageId,
          name,
          description,
          items,
          rule: { type: ruleType },
          pricingMode,
          basePrice,
          discountedPrice: effectivePrice,
          savingsPercentage,
          coverMode,
          image: coverMode === 'upload' ? uploadedImage : undefined,
          coverProductIds: coverMode === 'products' ? coverProductIds : undefined,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        products
      ),
    [
      packageId,
      name,
      description,
      items,
      ruleType,
      pricingMode,
      basePrice,
      effectivePrice,
      savingsPercentage,
      coverMode,
      uploadedImage,
      coverProductIds,
      isActive,
      products,
    ]
  );

  useEffect(() => {
    if (coverMode !== 'products') return;
    const uniqueIds = getUniquePackageProductIds(items);
    setCoverProductIds((prev) => {
      const pruned = prev.filter((id) => uniqueIds.includes(id));
      const merged = [...pruned];
      for (const id of uniqueIds) {
        if (merged.length >= 4) break;
        if (!merged.includes(id)) merged.push(id);
      }
      return merged.slice(0, 4);
    });
  }, [items, coverMode]);

  const isValidPackageItem = (item: PackageItem) => {
    if (!item.productId || item.quantity <= 0) return false;
    if (isCustomPackageItem(item)) {
      return Boolean(item.customName?.trim()) && (item.customRetailPrice ?? 0) > 0;
    }
    return Boolean(catalog.some((p) => p.id === item.productId));
  };

  const nameTemplates = useMemo(
    () => (category ? getPackageNameTemplates(category) : []),
    [category]
  );

  useEffect(() => {
    if (category === 'shequeen-signature') {
      setIsSignature(true);
    }
  }, [category]);

  const completionSteps = useMemo(() => {
    const hasPositioning =
      Boolean(category) &&
      name.trim().length > 0 &&
      (tagline.trim().length > 0 || description.trim().length > 0);
    const hasDetails = description.trim().length > 0;
    const hasItems = items.length > 0 && items.every(isValidPackageItem);
    const hasPricing = effectivePrice > 0;
    return { hasPositioning, hasDetails, hasItems, hasPricing };
  }, [category, name, tagline, description, items, effectivePrice, catalog]);

  const applyNameTemplate = (template: string) => {
    setNameTemplate(template);
    setName(template);
    if (!tagline.trim() && category) {
      const cat = PACKAGE_CATEGORIES.find((c) => c.id === category);
      if (cat) {
        setTagline(`Complete solution for ${cat.shortDescription.toLowerCase()}`);
      }
    }
    if (highlights.length === 0 && category) {
      setHighlights(getDefaultHighlights(category).slice(0, 3));
    }
  };

  const addHighlight = () => {
    if (highlights.length >= 5) return;
    setHighlights([...highlights, '']);
  };

  const updateHighlight = (index: number, value: string) => {
    setHighlights(highlights.map((h, i) => (i === index ? value : h)));
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const addSuggestedHighlights = () => {
    if (!category) return;
    const suggested = getDefaultHighlights(category);
    setHighlights(suggested.slice(0, 5));
  };

  const addItem = () => {
    setItems([...items, { productId: catalog[0]?.id ?? '1', quantity: 1 }]);
  };

  const addCustomItem = () => {
    setItems([
      ...items,
      {
        productId: createCustomPackageItemId(),
        quantity: 1,
        isCustom: true,
        customName: '',
        customRetailPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof PackageItem,
    value: string | number | undefined
  ) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        if (field === 'price' && (value === '' || value === undefined)) {
          const { price: _removed, ...rest } = item;
          return rest;
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleItemImageUpload = async (index: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const item = items[index];
    if (!item) return;

    setUploadingItemIndex(index);
    try {
      const url = await uploadPackageItemImage(packageId, item.productId, file);
      setItems(
        items.map((row, i) => (i === index ? { ...row, customImage: url } : row))
      );
      toast.success('Item image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload item image');
    } finally {
      setUploadingItemIndex(null);
    }
  };

  const handleCoverUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadPackageImage(packageId, file);
      setUploadedImage(url);
      setCoverMode('upload');
      toast.success('Cover image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleCoverProduct = (productId: string) => {
    setCoverProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        toast.error('You can select at most 4 product images for the cover');
        return prev;
      }
      return [...prev, productId];
    });
    setCoverMode('products');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = pricingMode === 'auto' ? calculatedPrice : parseInt(discountedPrice);
    if (!category || !name || !finalPrice || items.length === 0) return;

    if (!tagline.trim() && !description.trim()) {
      toast.error('Add a tagline or description explaining what need this bundle solves');
      return;
    }

    if (!items.every(isValidPackageItem)) {
      toast.error('Complete all package items — custom items need a name and retail price');
      return;
    }

    if (coverMode === 'upload' && !uploadedImage) {
      toast.error('Upload a cover image or switch to product collage');
      return;
    }

    const resolvedCoverIds =
      coverMode === 'products'
        ? resolveCoverProductIds({
            items,
            coverMode,
            coverProductIds,
          })
        : [];

    if (coverMode === 'products' && resolvedCoverIds.length === 0) {
      toast.error('Add package items with product images for the cover collage');
      return;
    }

    const rule: PackageRule =
      ruleType === 'mix-and-match' ? { type: ruleType, itemLimit } : { type: ruleType };

    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        category,
        tagline: tagline.trim() || undefined,
        highlights: highlights.filter((h) => h.trim()).length
          ? highlights.filter((h) => h.trim())
          : undefined,
        tier: tier || undefined,
        isSignature: isSignature || undefined,
        items,
        rule,
        pricingMode,
        basePrice,
        discountedPrice: finalPrice,
        savingsPercentage,
        coverMode,
        image: coverMode === 'upload' ? uploadedImage : undefined,
        coverProductIds: coverMode === 'products' ? resolvedCoverIds : undefined,
        isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  const draftRule: PackageRule =
    ruleType === 'mix-and-match' ? { type: ruleType, itemLimit } : { type: ruleType };

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin/packages"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packages
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Boxes className="h-3.5 w-3.5" />
              {mode === 'create' ? 'New package' : 'Editing package'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {mode === 'create' ? 'Create curated bundle' : 'Edit curated bundle'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {mode === 'create'
                ? 'Position a complete solution for a need, occasion, or lifestyle — then add products and pricing.'
                : `Update "${initialData?.name}" — customers shop bundles by purpose on /packages.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StepPill done={completionSteps.hasPositioning} label="Positioning" />
            <StepPill done={completionSteps.hasItems} label="Items" />
            <StepPill done={completionSteps.hasPricing} label="Pricing" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Bundle positioning</CardTitle>
                    <CardDescription>
                      Define the need, occasion, or lifestyle this bundle solves for customers.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as PackageCategoryId);
                      setNameTemplate('');
                    }}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a category…</option>
                    {PACKAGE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {category && (
                    <p className="text-xs text-muted-foreground">
                      {PACKAGE_CATEGORIES.find((c) => c.id === category)?.shortDescription}
                    </p>
                  )}
                </div>

                {nameTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="nameTemplate">Suggested names</Label>
                    <select
                      id="nameTemplate"
                      value={nameTemplate}
                      onChange={(e) => {
                        if (e.target.value) applyNameTemplate(e.target.value);
                      }}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Pick a suggested name (optional)…</option>
                      {nameTemplates.map((template) => (
                        <option key={template} value={template}>
                          {template}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Bundle name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bridal Beauty Package"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Complete solution for her wedding day glow"
                    className="h-11"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">
                    One-line pitch shown on package cards (max 120 characters).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the need, occasion, or lifestyle goal this bundle addresses…"
                    className="min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Why this bundle</Label>
                    <div className="flex gap-2">
                      {category && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addSuggestedHighlights}
                        >
                          Add suggested
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHighlight}
                        disabled={highlights.length >= 5}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                  {highlights.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                      Add highlights explaining why customers should buy this complete solution.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                            placeholder="Everything she needs in one order"
                            className="h-10"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={() => removeHighlight(index)}
                            aria-label="Remove highlight"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {category === 'luxury' && (
                  <div className="space-y-2">
                    <Label htmlFor="tier">Queen tier</Label>
                    <select
                      id="tier"
                      value={tier}
                      onChange={(e) => setTier(e.target.value as PackageTierId | '')}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">No tier</option>
                      {PACKAGE_TIERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 p-4">
                  <input
                    type="checkbox"
                    checked={isSignature}
                    onChange={(e) => setIsSignature(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <div>
                    <p className="text-sm font-medium">SheQueen Signature bundle</p>
                    <p className="text-xs text-muted-foreground">
                      Feature as a flagship bundle on the storefront
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Package cover</CardTitle>
                    <CardDescription>
                      Upload a photo or combine up to 4 product images from this package.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CoverModeCard
                    selected={coverMode === 'upload'}
                    title="Upload photo"
                    description="Use a single custom cover image"
                    onSelect={() => setCoverMode('upload')}
                  />
                  <CoverModeCard
                    selected={coverMode === 'products'}
                    title="Product collage"
                    description="Combine up to 4 included product photos"
                    onSelect={() => setCoverMode('products')}
                  />
                </div>

                {coverMode === 'upload' ? (
                  <div className="space-y-4">
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        void handleCoverUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                      {isRemoteProductImage(uploadedImage) ? (
                        <>
                          <Image
                            src={uploadedImage}
                            alt="Package cover"
                            fill
                            className="object-cover"
                            sizes="(max-width:768px) 100vw, 50vw"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedImage('')}
                            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-red-600 shadow-sm hover:bg-background"
                            aria-label="Remove cover image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Upload className="h-8 w-8 opacity-50" />
                          <p className="text-sm">No cover uploaded yet</p>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={uploadingCover}
                      onClick={() => coverFileRef.current?.click()}
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadedImage ? 'Replace cover' : 'Upload cover'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP, or GIF · up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                      <PackageCoverDisplay
                        images={previewCoverImages}
                        alt="Package cover preview"
                        sizes="(max-width:768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">
                        {coverProductIds.length} of {Math.min(4, coverOptions.length)}{' '}
                        images selected (max 4)
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCoverProductIds(
                            getUniquePackageProductIds(items).slice(0, 4)
                          )
                        }
                      >
                        Select first 4
                      </Button>
                    </div>
                    {coverOptions.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                        Add package items with images below to pick images for the collage.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {coverOptions.map((option) => {
                          const selected = coverProductIds.includes(option.id);
                          const hasImage = isRemoteProductImage(option.image);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={!hasImage}
                              onClick={() => toggleCoverProduct(option.id)}
                              className={cn(
                                'relative overflow-hidden rounded-xl border text-left transition-all',
                                !hasImage && 'cursor-not-allowed opacity-60',
                                selected
                                  ? 'border-primary ring-2 ring-primary/25'
                                  : 'border-border hover:border-primary/40'
                              )}
                            >
                              <div className="relative aspect-square bg-muted">
                                {hasImage ? (
                                  <Image
                                    src={option.image!}
                                    alt={option.name}
                                    fill
                                    sizes="120px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-muted-foreground">
                                    <Boxes className="h-6 w-6" />
                                  </div>
                                )}
                                {selected && (
                                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </div>
                              <p className="truncate px-2 py-2 text-xs font-medium">
                                {option.name}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle>Package items</CardTitle>
                      <CardDescription>
                        {items.length} product{items.length === 1 ? '' : 's'} · retail{' '}
                        {formatUGX(basePrice)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add catalog item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomItem}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Add custom item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {items.map((item, index) => {
                  const isCustom = isCustomPackageItem(item);
                  const itemImage = getPackageItemImage(item, products);
                  const unitRetail = getPackageItemRetailUnit(item, itemRetailPrices);
                  const lineRetail = unitRetail * item.quantity;

                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isCustom ? 'Custom item' : 'Catalog item'} {index + 1}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-foreground">
                          {formatUGX(lineRetail)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                          {isRemoteProductImage(itemImage) ? (
                            <Image
                              src={itemImage}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Boxes className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        {isCustom ? (
                          <>
                            <div className="min-w-[160px] flex-1 space-y-2">
                              <Label className="text-xs">Name</Label>
                              <Input
                                value={item.customName ?? ''}
                                onChange={(e) =>
                                  updateItem(index, 'customName', e.target.value)
                                }
                                placeholder="Product name"
                                className="h-10"
                              />
                            </div>
                            <div className="w-32 space-y-2">
                              <Label className="text-xs">Retail price</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item.customRetailPrice || ''}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'customRetailPrice',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="UGX"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Image</Label>
                              <input
                                ref={(el) => {
                                  itemImageRefs.current[index] = el;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                  void handleItemImageUpload(index, e.target.files);
                                  e.target.value = '';
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 gap-2"
                                disabled={uploadingItemIndex === index}
                                onClick={() => itemImageRefs.current[index]?.click()}
                              >
                                {uploadingItemIndex === index ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {item.customImage ? 'Replace' : 'Upload'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="min-w-[180px] flex-1 space-y-2">
                            <Label className="text-xs">Product</Label>
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {catalog.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatUGX(p.basePrice)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="w-20 space-y-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label className="text-xs">Override</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Retail"
                            value={item.price ?? ''}
                            onChange={(e) =>
                              updateItem(
                                index,
                                'price',
                                e.target.value ? parseInt(e.target.value) : undefined
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Tag className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle>Bundle behaviour & pricing</CardTitle>
                    <CardDescription>How items combine and what customers pay.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label>Bundle type</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BUNDLE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRuleType(type.value)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all',
                          ruleType === type.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40 hover:bg-muted/40'
                        )}
                      >
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {ruleType === 'mix-and-match' && (
                  <div className="max-w-xs space-y-2">
                    <Label htmlFor="itemLimit">Item limit</Label>
                    <Input
                      id="itemLimit"
                      type="number"
                      min={1}
                      value={itemLimit}
                      onChange={(e) => setItemLimit(parseInt(e.target.value) || 1)}
                      className="h-10"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Pricing mode</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PricingModeCard
                      selected={pricingMode === 'auto'}
                      title="Calculated total"
                      description="Sum of item prices, including overrides"
                      onSelect={() => setPricingMode('auto')}
                    />
                    <PricingModeCard
                      selected={pricingMode === 'custom'}
                      title="Custom price"
                      description="Set a package price below or above retail"
                      onSelect={() => setPricingMode('custom')}
                    />
                  </div>
                </div>

                <div className="max-w-sm space-y-2">
                  <Label htmlFor="discountedPrice">Package price (UGX)</Label>
                  {pricingMode === 'auto' ? (
                    <Input
                      id="discountedPrice"
                      type="number"
                      value={calculatedPrice}
                      readOnly
                      className="h-11 bg-muted font-semibold tabular-nums"
                    />
                  ) : (
                    <Input
                      id="discountedPrice"
                      type="number"
                      min={0}
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      placeholder="550000"
                      className="h-11 font-semibold tabular-nums"
                      required
                    />
                  )}
                </div>

                {effectivePrice > 0 && savingsAmount > 0 && (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                    <p className="text-sm font-medium text-accent">Customer savings</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-accent">
                      {savingsPercentage.toFixed(1)}% · {formatUGX(savingsAmount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Button type="submit" className="h-12 w-full text-base" size="lg" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === 'create' ? 'Create package' : 'Save changes'}
            </Button>
            <Link href="/admin/packages" className="block">
              <Button type="button" variant="outline" className="h-11 w-full">
                Cancel
              </Button>
            </Link>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Storefront preview</CardTitle>
                <CardDescription>How this package appears on /packages</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <PackageCoverDisplay
                    images={previewCoverImages}
                    alt={name || 'Package preview'}
                    sizes="320px"
                  />
                  {savingsAmount > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                      −{savingsPercentage.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="font-semibold leading-snug">{name || 'Package name'}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {description || 'Add a description to help customers understand the value.'}
                </p>
                <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{getPackageTypeLabel(draftRule.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium tabular-nums">{items.length}</span>
                  </div>
                  {items.length > 0 && (
                    <ul className="space-y-1 border-t border-border/60 pt-2">
                      {items.slice(0, 4).map((item, index) => (
                        <li
                          key={index}
                          className="flex justify-between gap-2 text-xs text-muted-foreground"
                        >
                          <span className="truncate">
                            {getPackageItemName(item, itemNames)}
                            {isCustomPackageItem(item) && (
                              <span className="ml-1 text-[10px] uppercase">(custom)</span>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums">×{item.quantity}</span>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{items.length - 4} more
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retail value</span>
                    <span className="font-medium tabular-nums">{formatUGX(basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package price</span>
                    <span className="text-base font-bold text-primary tabular-nums">
                      {effectivePrice > 0 ? formatUGX(effectivePrice) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Visibility</CardTitle>
                <CardDescription>Control whether customers can see this package</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/70 p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Active on storefront</p>
                    <p className="text-xs text-muted-foreground">
                      Visible on /packages when enabled
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PackageActiveBadge isActive={isActive} />
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/80 bg-muted/20">
              <CardContent className="py-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Pricing tip</p>
                <p className="mt-1">
                  Use <span className="font-medium">calculated total</span> when the package price
                  should match the sum of items. Use <span className="font-medium">custom price</span>{' '}
                  to offer a discount or premium bundle fee.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminPage>
  );
}

function StepPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1',
        done
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-muted text-muted-foreground ring-border'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          done ? 'bg-emerald-500' : 'bg-muted-foreground/40'
        )}
      />
      {label}
    </span>
  );
}

function PricingModeCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <CoverModeCard selected={selected} title={title} description={description} onSelect={onSelect} />
  );
}

function CoverModeCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
