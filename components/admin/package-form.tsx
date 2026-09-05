'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  getPackageComposition,
} from '@/lib/types/wholesale';
import { useProducts } from '@/lib/products-context';
import { useServices } from '@/lib/services-context';
import { isRetailCatalogProduct } from '@/lib/product-channels';
import { productsToCatalog, formatUGX } from '@/lib/wholesale-data';
import { uploadPackageImage, uploadPackageItemImage } from '@/lib/firebase/storage';
import { resolveListingImage } from '@/lib/services-utils';
import {
  buildPackageCatalogMaps,
  computePackageItemTotal,
  computePackageRetailTotal,
  createCustomPackageItemId,
  getPackageCoverImages,
  getPackageItemImage,
  getPackageItemKind,
  getPackageItemRefId,
  getPackageItemRetailUnit,
  getPackageTypeLabel,
  getUniquePackageProductIds,
  isCustomPackageItem,
  isServicePackageItem,
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
import { SupplierSelect } from '@/components/admin/supplier-select';
import { useSuppliers } from '@/lib/suppliers-context';
import {
  ArrowLeft,
  Boxes,
  Check,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ServiceListing } from '@/lib/types/services';

function getDefaultPackageItems(
  catalog: { id: string }[],
  services: ServiceListing[]
): PackageItem[] {
  if (catalog[0]) {
    return [{ productId: catalog[0].id, quantity: 1, itemType: 'product' }];
  }
  if (services[0]) {
    return [
      {
        productId: services[0].id,
        serviceId: services[0].id,
        quantity: 1,
        itemType: 'service',
      },
    ];
  }
  return [
    {
      productId: createCustomPackageItemId(),
      quantity: 1,
      itemType: 'custom',
      isCustom: true,
      customName: '',
      customRetailPrice: 0,
    },
  ];
}

interface PackageFormProps {
  mode: 'create' | 'edit';
  packageId: string;
  initialData?: Package;
  onSubmit: (data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
  portal?: 'admin' | 'supplier';
  forcedSupplierId?: string;
  backHref?: string;
}

const BUNDLE_TYPES: {
  value: PackageRule['type'];
  label: string;
  description: string;
}[] = [
  { value: 'fixed', label: 'Fixed', description: 'Set items & price' },
  { value: 'customizable', label: 'Customizable', description: 'Base + options' },
  { value: 'mix-and-match', label: 'Mix & Match', description: 'Pick up to a limit' },
];

export function PackageForm({
  mode,
  packageId,
  initialData,
  onSubmit,
  portal = 'admin',
  forcedSupplierId,
  backHref,
}: PackageFormProps) {
  const { products: allProducts } = useProducts();
  const { activeListings } = useServices();
  const { defaultSupplierId } = useSuppliers();
  const isSupplierPortal = portal === 'supplier';
  const products = useMemo(() => {
    const scoped =
      !isSupplierPortal || !forcedSupplierId
        ? allProducts
        : allProducts.filter((p) => p.supplierId === forcedSupplierId);
    return scoped.filter(isRetailCatalogProduct);
  }, [allProducts, forcedSupplierId, isSupplierPortal]);
  const serviceOptions = useMemo(() => {
    const active = activeListings.filter((s) => !s.isArchived);
    if (!isSupplierPortal || !forcedSupplierId) return active;
    return active.filter((s) => s.supplierId === forcedSupplierId);
  }, [activeListings, forcedSupplierId, isSupplierPortal]);
  const listHref = backHref ?? (isSupplierPortal ? '/suppliers/packages' : '/admin/packages');
  const catalog = productsToCatalog(products);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const itemImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null);

  const [category, setCategory] = useState<PackageCategoryId | ''>(
    initialData?.category ?? ''
  );
  const [supplierId, setSupplierId] = useState(
    initialData?.supplierId ?? forcedSupplierId ?? defaultSupplierId
  );
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
    const seedItems = initialData?.items ?? getDefaultPackageItems(catalog, serviceOptions);
    return getUniquePackageProductIds(seedItems).slice(0, 4);
  });
  const [items, setItems] = useState<PackageItem[]>(
    initialData?.items ?? getDefaultPackageItems(catalog, serviceOptions)
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
  const [catalogQuery, setCatalogQuery] = useState('');

  useEffect(() => {
    if (forcedSupplierId) {
      setSupplierId(forcedSupplierId);
      return;
    }
    if (mode === 'create' && !supplierId && defaultSupplierId) {
      setSupplierId(defaultSupplierId);
    }
  }, [mode, supplierId, defaultSupplierId, forcedSupplierId]);

  const { productNames: itemNames, retailPrices: itemRetailPrices } = useMemo(
    () =>
      buildPackageCatalogMaps(products, serviceOptions, [
        { items } as Package,
      ]),
    [items, products, serviceOptions]
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
      const item = items.find((i) => getPackageItemRefId(i) === id);
      if (item && isCustomPackageItem(item)) {
        return {
          id,
          name: item.customName?.trim() || 'Custom item',
          image: item.customImage,
        };
      }
      if (item && isServicePackageItem(item)) {
        const service = serviceOptions.find((s) => s.id === id);
        return {
          id,
          name: service?.name ?? 'Service',
          image: service ? resolveListingImage(service) ?? undefined : undefined,
        };
      }
      const product = products.find((p) => p.id === id);
      return {
        id,
        name: product?.name ?? 'Product',
        image: product?.image,
      };
    });
  }, [items, products, serviceOptions]);

  const previewCoverImages = useMemo(
    () =>
      getPackageCoverImages(
        {
          id: packageId,
          name,
          description,
          supplierId: forcedSupplierId || supplierId,
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
        products,
        serviceOptions
      ),
    [
      packageId,
      name,
      description,
      supplierId,
      forcedSupplierId,
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
      serviceOptions,
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
    if (item.quantity <= 0) return false;
    const kind = getPackageItemKind(item);
    if (kind === 'custom') {
      return Boolean(item.customName?.trim()) && (item.customRetailPrice ?? 0) > 0;
    }
    if (kind === 'service') {
      const id = getPackageItemRefId(item);
      return Boolean(id) && serviceOptions.some((s) => s.id === id);
    }
    return Boolean(item.productId) && catalog.some((p) => p.id === item.productId);
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
    const hasPositioning = Boolean(category) && name.trim().length > 0;
    const hasDetails = description.trim().length > 0 || tagline.trim().length > 0;
    const hasItems = items.length > 0 && items.every(isValidPackageItem);
    const hasCover =
      coverMode === 'upload'
        ? isRemoteProductImage(uploadedImage)
        : coverProductIds.length > 0 || previewCoverImages.length > 0;
    const hasPricing = effectivePrice > 0;
    return { hasPositioning, hasDetails, hasItems, hasCover, hasPricing };
  }, [
    category,
    name,
    tagline,
    description,
    items,
    effectivePrice,
    coverMode,
    uploadedImage,
    coverProductIds,
    previewCoverImages,
  ]);

  const completionCount = Object.values(completionSteps).filter(Boolean).length;
  const completionTotal = Object.keys(completionSteps).length;

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, catalogQuery]);

  const filteredServices = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return serviceOptions;
    return serviceOptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [serviceOptions, catalogQuery]);

  const composition = useMemo(() => getPackageComposition(items), [items]);
  const compositionLabel =
    composition === 'mixed'
      ? 'Mixed'
      : composition === 'services'
        ? 'Services'
        : composition === 'products'
          ? 'Products'
          : 'Empty';

  const selectClass =
    'h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40';
  const fieldClass =
    'h-11 rounded-lg border-border/80 bg-background shadow-sm transition focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20';
  const textareaClass =
    'min-h-[110px] w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm leading-relaxed shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40';

  const applyNameTemplate = (template: string) => {
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
    const first = catalog[0];
    if (!first) {
      toast.error('No products to add');
      return;
    }
    setItems([
      ...items,
      { productId: first.id, quantity: 1, itemType: 'product' },
    ]);
  };

  const addServiceItem = () => {
    const first = serviceOptions[0];
    if (!first) {
      toast.error('No services to add');
      return;
    }
    setItems([
      ...items,
      {
        productId: first.id,
        serviceId: first.id,
        quantity: 1,
        itemType: 'service',
      },
    ]);
  };

  const addCustomItem = () => {
    setItems([
      ...items,
      {
        productId: createCustomPackageItemId(),
        quantity: 1,
        itemType: 'custom',
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
        if (field === 'serviceId') {
          const serviceId = String(value);
          return { ...item, productId: serviceId, serviceId, itemType: 'service' };
        }
        if (field === 'productId' && isServicePackageItem(item)) {
          const serviceId = String(value);
          return { ...item, productId: serviceId, serviceId, itemType: 'service' };
        }
        if (field === 'productId' && getPackageItemKind(item) === 'product') {
          return { ...item, productId: String(value), itemType: 'product' };
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
        toast.error('Max 4 cover images');
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

    if (!(forcedSupplierId || supplierId)) {
      toast.error('Select a supplier');
      return;
    }

    if (!tagline.trim() && !description.trim()) {
      toast.error('Add a tagline or description');
      return;
    }

    if (!items.every(isValidPackageItem)) {
      toast.error('Finish all items (custom needs name & price)');
      return;
    }

    if (coverMode === 'upload' && !uploadedImage) {
      toast.error('Upload a cover or use collage');
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
      toast.error('Add items with images for the collage');
      return;
    }

    const rule: PackageRule =
      ruleType === 'mix-and-match' ? { type: ruleType, itemLimit } : { type: ruleType };

    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        supplierId: forcedSupplierId || supplierId,
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

  const canSave =
    Boolean(category) &&
    name.trim().length > 0 &&
    (tagline.trim().length > 0 || description.trim().length > 0) &&
    items.length > 0 &&
    items.every(isValidPackageItem) &&
    completionSteps.hasCover &&
    effectivePrice > 0 &&
    Boolean(forcedSupplierId || supplierId);

  const progressPct = Math.round((completionCount / completionTotal) * 100);

  const SaveButton = ({
    className,
    fullWidth,
  }: {
    className?: string;
    fullWidth?: boolean;
  }) => (
    <Button
      type="submit"
      form="package-form"
      disabled={saving || !canSave}
      className={cn(fullWidth && 'w-full', className)}
    >
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
  );

  return (
    <AdminPage className={cn('pb-28 sm:pb-8', isSupplierPortal && 'pb-40 sm:pb-8')}>
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-0 md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={listHref}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/80 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Back to packages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {mode === 'create' ? 'New package' : name || initialData?.name || 'Edit package'}
              </h1>
              <PackageActiveBadge isActive={isActive} />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                {completionCount}/{completionTotal}
              </span>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Link href={listHref} className={cn(saving && 'pointer-events-none opacity-50')}>
              <Button type="button" variant="outline" size="sm" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <SaveButton />
          </div>
        </div>
      </div>

      <form id="package-form" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            {/* Basics */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Basics</h2>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium transition hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={isSignature}
                    onChange={(e) => setIsSignature(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  Signature
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PACKAGE_CATEGORIES.map((cat) => {
                      const selected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                          }}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition',
                            selected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-secondary text-foreground hover:bg-secondary/80'
                          )}
                        >
                          {cat.discoveryLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!isSupplierPortal && (
                  <SupplierSelect value={supplierId} onChange={setSupplierId} />
                )}

                {category === 'luxury' && (
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <select
                      id="tier"
                      value={tier}
                      onChange={(e) => setTier(e.target.value as PackageTierId | '')}
                      className={selectClass}
                    >
                      <option value="">None</option>
                      {PACKAGE_TIERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {nameTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Quick name</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {nameTemplates.slice(0, 6).map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => applyNameTemplate(template)}
                          className={cn(
                            'max-w-full truncate rounded-lg border px-2.5 py-1.5 text-left text-xs transition',
                            name === template
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          )}
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Package name"
                      className={fieldClass}
                      required
                      autoFocus={mode === 'create'}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {tagline.length}/120
                      </span>
                    </div>
                    <Input
                      id="tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Short pitch"
                      className={fieldClass}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What’s included and who it’s for"
                      className={cn(textareaClass, 'min-h-[88px]')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Highlights</Label>
                    <div className="flex gap-1.5">
                      {category ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={addSuggestedHighlights}
                        >
                          Suggest
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={addHighlight}
                        disabled={highlights.length >= 5}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                  {highlights.length === 0 ? (
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-4 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Add highlight
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                            placeholder={`Highlight ${index + 1}`}
                            className={fieldClass}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 shrink-0 text-muted-foreground"
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
              </div>
            </section>

            {/* Items */}
            <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold">Items</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {items.length} · {compositionLabel} · {formatUGX(basePrice)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={addItem}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={addServiceItem}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Service
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={addCustomItem}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Custom
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {(catalog.length > 6 || serviceOptions.length > 6) && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={catalogQuery}
                      onChange={(e) => setCatalogQuery(e.target.value)}
                      placeholder="Search catalog…"
                      className={cn(fieldClass, 'pl-9')}
                    />
                  </div>
                )}

                <div className="space-y-2.5">
                  {items.map((item, index) => {
                    const kind = getPackageItemKind(item);
                    const isCustom = kind === 'custom';
                    const isService = kind === 'service';
                    const itemImage = getPackageItemImage(item, products, serviceOptions);
                    const unitRetail = getPackageItemRetailUnit(item, itemRetailPrices);
                    const lineRetail = unitRetail * item.quantity;
                    const valid = isValidPackageItem(item);
                    const productSelectOptions = (() => {
                      if (isCustom || isService) return [];
                      const selected = catalog.find((p) => p.id === item.productId);
                      const list = filteredCatalog;
                      if (selected && !list.some((p) => p.id === selected.id)) {
                        return [selected, ...list];
                      }
                      return list;
                    })();
                    const serviceSelectOptions = (() => {
                      if (!isService) return [];
                      const refId = getPackageItemRefId(item);
                      const selected = serviceOptions.find((s) => s.id === refId);
                      const list = filteredServices;
                      if (selected && !list.some((s) => s.id === selected.id)) {
                        return [selected, ...list];
                      }
                      return list;
                    })();

                    return (
                      <div
                        key={`${getPackageItemRefId(item)}-${index}`}
                        className={cn(
                          'rounded-xl border bg-background p-3 transition sm:p-3.5',
                          valid ? 'border-border/70' : 'border-amber-400/50 bg-amber-50/30'
                        )}
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                              {index + 1}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                isCustom
                                  ? 'bg-violet-500/10 text-violet-700'
                                  : isService
                                    ? 'bg-sky-500/10 text-sky-700'
                                    : 'bg-emerald-500/10 text-emerald-700'
                              )}
                            >
                              {isCustom ? 'Custom' : isService ? 'Service' : 'Product'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatUGX(lineRetail)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-14 sm:w-14">
                            {itemImage && isRemoteProductImage(itemImage) ? (
                              <Image
                                src={itemImage}
                                alt=""
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Boxes className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-12 sm:gap-2.5">
                            {isCustom ? (
                              <>
                                <div className="sm:col-span-5">
                                  <Input
                                    value={item.customName ?? ''}
                                    onChange={(e) =>
                                      updateItem(index, 'customName', e.target.value)
                                    }
                                    placeholder="Name"
                                    className="h-10 rounded-lg border-border/80"
                                  />
                                </div>
                                <div className="sm:col-span-3">
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
                                    placeholder="Retail"
                                    className="h-10 rounded-lg border-border/80 tabular-nums"
                                  />
                                </div>
                                <div className="sm:col-span-2">
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
                                    className="h-10 w-full"
                                    disabled={uploadingItemIndex === index}
                                    onClick={() => itemImageRefs.current[index]?.click()}
                                  >
                                    {uploadingItemIndex === index ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Upload className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </>
                            ) : isService ? (
                              <div className="sm:col-span-7">
                                <select
                                  value={getPackageItemRefId(item)}
                                  onChange={(e) =>
                                    updateItem(index, 'serviceId', e.target.value)
                                  }
                                  className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
                                >
                                  {serviceSelectOptions.length === 0 ? (
                                    <option value={getPackageItemRefId(item)}>No matches</option>
                                  ) : (
                                    serviceSelectOptions.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({formatUGX(s.basePrice)})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                            ) : (
                              <div className="sm:col-span-7">
                                <select
                                  value={item.productId}
                                  onChange={(e) =>
                                    updateItem(index, 'productId', e.target.value)
                                  }
                                  className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
                                >
                                  {productSelectOptions.length === 0 ? (
                                    <option value={item.productId}>No matches</option>
                                  ) : (
                                    productSelectOptions.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({formatUGX(p.basePrice)})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                            )}

                            <div className="sm:col-span-2">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                                }
                                className="h-10 rounded-lg border-border/80 tabular-nums"
                                aria-label="Quantity"
                              />
                            </div>
                            <div className={cn(isCustom ? 'sm:col-span-2' : 'sm:col-span-3')}>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Override"
                                value={item.price ?? ''}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'price',
                                    e.target.value ? parseInt(e.target.value) : undefined
                                  )
                                }
                                className="h-10 rounded-lg border-border/80 tabular-nums"
                                aria-label="Price override"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Cover + Pricing */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 text-sm font-semibold">Cover & price</h2>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Cover</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'upload' as const, label: 'Upload', hint: 'One photo' },
                        { id: 'products' as const, label: 'Collage', hint: 'Up to 4' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCoverMode(opt.id)}
                        className={cn(
                          'rounded-xl border px-3 py-3 text-left transition',
                          coverMode === opt.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : 'border-border/70 hover:border-primary/40'
                        )}
                      >
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {coverMode === 'upload' ? (
                  <div className="space-y-3">
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
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/80 bg-muted">
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
                            aria-label="Remove cover"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => coverFileRef.current?.click()}
                          disabled={uploadingCover}
                          className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:bg-muted/80"
                        >
                          {uploadingCover ? (
                            <Loader2 className="h-7 w-7 animate-spin opacity-60" />
                          ) : (
                            <Upload className="h-7 w-7 opacity-50" />
                          )}
                          <p className="text-sm font-medium">Upload cover</p>
                        </button>
                      )}
                    </div>
                    {isRemoteProductImage(uploadedImage) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={uploadingCover}
                        onClick={() => coverFileRef.current?.click()}
                      >
                        {uploadingCover ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Replace
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/80 bg-muted">
                      <PackageCoverDisplay
                        images={previewCoverImages}
                        alt="Cover preview"
                        sizes="(max-width:768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {coverProductIds.length}/{Math.min(4, coverOptions.length || 4)} selected
                      </span>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() =>
                          setCoverProductIds(getUniquePackageProductIds(items).slice(0, 4))
                        }
                      >
                        First 4
                      </button>
                    </div>
                    {coverOptions.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/80 px-4 py-5 text-center text-sm text-muted-foreground">
                        Add items with images first
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
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
                                'relative aspect-square overflow-hidden rounded-lg border transition',
                                !hasImage && 'cursor-not-allowed opacity-40',
                                selected
                                  ? 'border-primary ring-2 ring-primary/20'
                                  : 'border-border/70 hover:border-primary/40'
                              )}
                              title={option.name}
                            >
                              {hasImage ? (
                                <Image
                                  src={option.image!}
                                  alt={option.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                                  <Boxes className="h-4 w-4" />
                                </div>
                              )}
                              {selected && (
                                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUNDLE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRuleType(type.value)}
                        className={cn(
                          'rounded-xl border px-2.5 py-2.5 text-left transition',
                          ruleType === type.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : 'border-border/70 hover:border-primary/40'
                        )}
                      >
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {ruleType === 'mix-and-match' && (
                  <div className="max-w-[10rem] space-y-2">
                    <Label htmlFor="itemLimit">Limit</Label>
                    <Input
                      id="itemLimit"
                      type="number"
                      min={1}
                      value={itemLimit}
                      onChange={(e) => setItemLimit(parseInt(e.target.value) || 1)}
                      className={fieldClass}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Price mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'auto' as const, label: 'Auto', hint: 'Sum of items' },
                        { id: 'custom' as const, label: 'Custom', hint: 'Set price' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPricingMode(opt.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left transition',
                          pricingMode === opt.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : 'border-border/70 hover:border-primary/40'
                        )}
                      >
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Retail</Label>
                    <div className="flex h-11 items-center rounded-lg border border-border/80 bg-muted/40 px-3 text-sm font-medium tabular-nums">
                      {formatUGX(basePrice)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountedPrice">Price (UGX) *</Label>
                    {pricingMode === 'auto' ? (
                      <Input
                        id="discountedPrice"
                        type="number"
                        value={calculatedPrice}
                        readOnly
                        className={cn(fieldClass, 'bg-muted font-semibold tabular-nums')}
                      />
                    ) : (
                      <Input
                        id="discountedPrice"
                        type="number"
                        min={0}
                        value={discountedPrice}
                        onChange={(e) => setDiscountedPrice(e.target.value)}
                        placeholder="0"
                        className={cn(fieldClass, 'font-semibold tabular-nums')}
                        required
                      />
                    )}
                  </div>
                </div>

                {effectivePrice > 0 && savingsAmount > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-accent/10 px-4 py-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-accent">
                      Savings
                    </span>
                    <span className="text-sm font-bold tabular-nums text-accent">
                      {savingsPercentage.toFixed(0)}% · {formatUGX(savingsAmount)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-[4.75rem] lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="relative aspect-[4/3] bg-muted">
                <PackageCoverDisplay
                  images={previewCoverImages}
                  alt={name || 'Preview'}
                  sizes="352px"
                />
                {savingsAmount > 0 && (
                  <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-sm">
                    −{savingsPercentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                {category ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {PACKAGE_CATEGORIES.find((c) => c.id === category)?.discoveryLabel}
                  </p>
                ) : null}
                <div>
                  <p className="font-semibold leading-snug">{name || 'Package name'}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {tagline.trim() || description || 'Add details to preview'}
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-border/60 pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{getPackageTypeLabel(draftRule.type)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium tabular-nums">{items.length}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Retail</span>
                    <span className="font-medium tabular-nums">{formatUGX(basePrice)}</span>
                  </div>
                  <div className="flex justify-between gap-3 pt-1">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {effectivePrice > 0 ? formatUGX(effectivePrice) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ready</h3>
                <span className="text-xs tabular-nums text-muted-foreground">{progressPct}%</span>
              </div>
              <div className="space-y-2">
                <ChecklistItem done={completionSteps.hasPositioning} label="Category & name" />
                <ChecklistItem done={completionSteps.hasDetails} label="Details" />
                <ChecklistItem done={completionSteps.hasItems} label="Items" />
                <ChecklistItem done={completionSteps.hasCover} label="Cover" />
                <ChecklistItem done={completionSteps.hasPricing} label="Price" />
              </div>
              <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition hover:bg-muted/30">
                <span className="text-sm font-medium">Active</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </label>
              <div className="mt-3 hidden sm:block">
                <SaveButton fullWidth />
              </div>
            </div>
          </aside>
        </div>
      </form>

      {/* Mobile sticky save */}
      <div
        className={cn(
          'fixed inset-x-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur-md sm:hidden',
          isSupplierPortal
            ? 'bottom-[calc(3.75rem+env(safe-area-inset-bottom))]'
            : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
        )}
      >
        <div className="flex gap-2">
          <Link href={listHref} className="flex-1">
            <Button type="button" variant="outline" className="w-full" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <div className="flex-[1.4]">
            <SaveButton fullWidth />
          </div>
        </div>
      </div>
    </AdminPage>
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
      <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
  );
}
