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
  getPackageComposition,
} from '@/lib/types/wholesale';
import { useProducts } from '@/lib/products-context';
import { useServices } from '@/lib/services-context';
import { productsToCatalog, getRetailPricesMap, formatUGX } from '@/lib/wholesale-data';
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
  getPackageItemName,
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
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Target,
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
  const resolvedSupplierId = forcedSupplierId || defaultSupplierId;
  const products = useMemo(() => {
    if (!isSupplierPortal || !forcedSupplierId) return allProducts;
    return allProducts.filter((p) => p.supplierId === forcedSupplierId);
  }, [allProducts, forcedSupplierId, isSupplierPortal]);
  const serviceOptions = useMemo(() => {
    const active = activeListings.filter((s) => !s.isArchived);
    if (!isSupplierPortal || !forcedSupplierId) return active;
    return active.filter((s) => s.supplierId === forcedSupplierId);
  }, [activeListings, forcedSupplierId, isSupplierPortal]);
  const listHref = backHref ?? (isSupplierPortal ? '/suppliers/packages' : '/admin/packages');
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
  const [supplierId, setSupplierId] = useState(
    initialData?.supplierId ?? forcedSupplierId ?? defaultSupplierId
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
      ? 'Products & services'
      : composition === 'services'
        ? 'Services only'
        : composition === 'products'
          ? 'Products only'
          : 'No catalog items';

  const selectClass =
    'h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40';
  const fieldClass =
    'h-11 rounded-lg border-border/80 bg-background shadow-sm transition focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20';
  const textareaClass =
    'min-h-[110px] w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm leading-relaxed shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40';

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
    const first = catalog[0];
    if (!first) {
      toast.error('No products available to add. Add a service or custom item instead.');
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
      toast.error('No active services available to add.');
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
        toast.error('You can select at most 4 item images for the cover');
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
      toast.error('Add a tagline or description explaining what need this bundle solves');
      return;
    }

    if (!items.every(isValidPackageItem)) {
      toast.error('Complete all package items — custom items need a name and retail price');
      return;
    }

    if (coverMode === 'upload' && !uploadedImage) {
      toast.error('Upload a cover image or switch to item collage');
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
      toast.error('Add package items with images for the cover collage');
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

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href={listHref}
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
                ? 'Position a complete solution, add products, set the cover and price — then publish.'
                : `Update “${initialData?.name}” — customers shop bundles by purpose on /packages.`}
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <Link
              href={listHref}
              className={cn(saving && 'pointer-events-none opacity-50')}
              aria-disabled={saving}
            >
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              form="package-form"
              disabled={saving}
              className="min-w-[10.5rem]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create package' : 'Save changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form id="package-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Placement */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <SectionHeader
                icon={Target}
                title="Placement"
                description="Where this bundle sits in the catalog and who supplies it."
              />
              <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as PackageCategoryId);
                      setNameTemplate('');
                    }}
                    className={selectClass}
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
                    <FieldHint>
                      {PACKAGE_CATEGORIES.find((c) => c.id === category)?.shortDescription}
                    </FieldHint>
                  )}
                </div>

                {!isSupplierPortal && (
                  <div className="sm:col-span-2">
                    <SupplierSelect value={supplierId} onChange={setSupplierId} />
                  </div>
                )}

                {category === 'luxury' && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="tier">Queen tier</Label>
                    <select
                      id="tier"
                      value={tier}
                      onChange={(e) => setTier(e.target.value as PackageTierId | '')}
                      className={selectClass}
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

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-4 transition hover:bg-muted/30 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={isSignature}
                    onChange={(e) => setIsSignature(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
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

            {/* Storefront copy */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <SectionHeader
                icon={Sparkles}
                title="Storefront copy"
                description="Name, pitch, and highlights customers see on package cards and detail pages."
              />
              <CardContent className="space-y-5 pt-6">
                {nameTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="nameTemplate">Suggested names</Label>
                    <select
                      id="nameTemplate"
                      value={nameTemplate}
                      onChange={(e) => {
                        if (e.target.value) applyNameTemplate(e.target.value);
                      }}
                      className={selectClass}
                    >
                      <option value="">Pick a suggested name (optional)…</option>
                      {nameTemplates.map((template) => (
                        <option key={template} value={template}>
                          {template}
                        </option>
                      ))}
                    </select>
                    <FieldHint>Selecting a name can also seed a tagline and highlights.</FieldHint>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Bundle name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bridal Beauty Package"
                    className={fieldClass}
                    required
                    autoFocus={mode === 'create'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Complete solution for her wedding day glow"
                    className={fieldClass}
                    maxLength={120}
                  />
                  <FieldHint>
                    One-line pitch on package cards · {tagline.length}/120
                  </FieldHint>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the need, occasion, or lifestyle goal this bundle addresses…"
                    className={textareaClass}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label>Why this bundle</Label>
                      <FieldHint>Up to 5 selling points · shown on the package detail page</FieldHint>
                    </div>
                    <div className="flex gap-2">
                      {category && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addSuggestedHighlights}
                        >
                          Use suggested
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
                    <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                      Add a few reasons customers should choose this complete solution.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="flex h-11 w-8 shrink-0 items-center justify-center text-xs font-semibold tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                          <Input
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                            placeholder="Everything she needs in one order"
                            className={fieldClass}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
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
              </CardContent>
            </Card>

            {/* Package items */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle>Package items</CardTitle>
                      <CardDescription className="mt-0.5">
                        {items.length} item{items.length === 1 ? '' : 's'} · {compositionLabel} ·
                        retail value {formatUGX(basePrice)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Product
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addServiceItem}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Service
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomItem}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Custom
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {(catalog.length > 6 || serviceOptions.length > 6) && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={catalogQuery}
                      onChange={(e) => setCatalogQuery(e.target.value)}
                      placeholder="Filter products or services…"
                      className={cn(fieldClass, 'pl-9')}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const kind = getPackageItemKind(item);
                    const isCustom = kind === 'custom';
                    const isService = kind === 'service';
                    const itemImage = getPackageItemImage(item, products, serviceOptions);
                    const unitRetail = getPackageItemRetailUnit(item, itemRetailPrices);
                    const lineRetail = unitRetail * item.quantity;
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
                        className="rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/30 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold tabular-nums text-primary">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {isCustom ? 'Custom' : isService ? 'Service' : 'Product'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
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

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
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
                                <Boxes className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-12">
                            {isCustom ? (
                              <>
                                <div className="space-y-1.5 sm:col-span-5">
                                  <Label className="text-xs">Name</Label>
                                  <Input
                                    value={item.customName ?? ''}
                                    onChange={(e) =>
                                      updateItem(index, 'customName', e.target.value)
                                    }
                                    placeholder="Product name"
                                    className="h-10 rounded-lg border-border/80 shadow-sm"
                                  />
                                </div>
                                <div className="space-y-1.5 sm:col-span-3">
                                  <Label className="text-xs">Retail (UGX)</Label>
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
                                    placeholder="0"
                                    className="h-10 rounded-lg border-border/80 shadow-sm tabular-nums"
                                  />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
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
                                    className="h-10 w-full gap-1.5"
                                    disabled={uploadingItemIndex === index}
                                    onClick={() => itemImageRefs.current[index]?.click()}
                                  >
                                    {uploadingItemIndex === index ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Upload className="h-3.5 w-3.5" />
                                    )}
                                    {item.customImage ? 'Replace' : 'Upload'}
                                  </Button>
                                </div>
                              </>
                            ) : isService ? (
                              <div className="space-y-1.5 sm:col-span-7">
                                <Label className="text-xs">Service</Label>
                                <select
                                  value={getPackageItemRefId(item)}
                                  onChange={(e) =>
                                    updateItem(index, 'serviceId', e.target.value)
                                  }
                                  className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                              <div className="space-y-1.5 sm:col-span-7">
                                <Label className="text-xs">Product</Label>
                                <select
                                  value={item.productId}
                                  onChange={(e) =>
                                    updateItem(index, 'productId', e.target.value)
                                  }
                                  className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30"
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

                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs">Qty</Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                                }
                                className="h-10 rounded-lg border-border/80 shadow-sm tabular-nums"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-3">
                              <Label className="text-xs">Price override</Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Optional"
                                value={item.price ?? ''}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'price',
                                    e.target.value ? parseInt(e.target.value) : undefined
                                  )
                                }
                                className="h-10 rounded-lg border-border/80 shadow-sm tabular-nums"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cover */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <SectionHeader
                icon={ImageIcon}
                title="Cover image"
                description="Upload a photo or build a collage from up to 4 items in this package."
              />
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CoverModeCard
                    selected={coverMode === 'upload'}
                    title="Upload photo"
                    description="Single custom cover for a polished look"
                    onSelect={() => setCoverMode('upload')}
                  />
                  <CoverModeCard
                    selected={coverMode === 'products'}
                    title="Item collage"
                    description="Combine up to 4 included product or service photos"
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
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/80 bg-muted">
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
                        <button
                          type="button"
                          onClick={() => coverFileRef.current?.click()}
                          disabled={uploadingCover}
                          className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:bg-muted/80"
                        >
                          {uploadingCover ? (
                            <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                          ) : (
                            <Upload className="h-8 w-8 opacity-50" />
                          )}
                          <p className="text-sm font-medium">Click to upload cover</p>
                          <p className="text-xs">JPEG, PNG, WebP, or GIF · up to 5MB</p>
                        </button>
                      )}
                    </div>
                    {isRemoteProductImage(uploadedImage) && (
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
                        Replace cover
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/80 bg-muted">
                      <PackageCoverDisplay
                        images={previewCoverImages}
                        alt="Package cover preview"
                        sizes="(max-width:768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">
                        {coverProductIds.length} of {Math.min(4, coverOptions.length || 4)}{' '}
                        selected (max 4)
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCoverProductIds(getUniquePackageProductIds(items).slice(0, 4))
                        }
                      >
                        Select first 4
                      </Button>
                    </div>
                    {coverOptions.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                        Add package items with images above to build the collage.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                                !hasImage && 'cursor-not-allowed opacity-50',
                                selected
                                  ? 'border-primary ring-2 ring-primary/25'
                                  : 'border-border/80 hover:border-primary/40'
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

            {/* Pricing */}
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <SectionHeader
                icon={Tag}
                title="Behaviour & pricing"
                description="How items combine and what customers pay for the bundle."
              />
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
                            : 'border-border/80 hover:border-primary/40 hover:bg-muted/40'
                        )}
                      >
                        <p className="text-sm font-semibold">{type.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {type.description}
                        </p>
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
                      className={fieldClass}
                    />
                    <FieldHint>Maximum products a customer can pick in this mix.</FieldHint>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Retail value</Label>
                    <div className="flex h-11 items-center rounded-lg border border-border/80 bg-muted/40 px-3 text-sm font-medium tabular-nums">
                      {formatUGX(basePrice)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountedPrice">Package price (UGX) *</Label>
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
                        placeholder="550000"
                        className={cn(fieldClass, 'font-semibold tabular-nums')}
                        required
                      />
                    )}
                  </div>
                </div>

                {effectivePrice > 0 && savingsAmount > 0 && (
                  <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      Customer savings
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-accent">
                      {savingsPercentage.toFixed(1)}% · {formatUGX(savingsAmount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="flex gap-2 sm:hidden">
              <Link
                href={listHref}
                className={cn('flex-1', saving && 'pointer-events-none opacity-50')}
                aria-disabled={saving}
              >
                <Button type="button" variant="outline" className="w-full" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="min-w-[9rem] flex-1" disabled={saving}>
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

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <CardTitle>Storefront preview</CardTitle>
                <CardDescription>How this package appears on /packages</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
                  <PackageCoverDisplay
                    images={previewCoverImages}
                    alt={name || 'Package preview'}
                    sizes="320px"
                  />
                  {savingsAmount > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-sm">
                      âˆ’{savingsPercentage.toFixed(0)}%
                    </span>
                  )}
                </div>

                {category && (
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {PACKAGE_CATEGORIES.find((c) => c.id === category)?.label}
                  </p>
                )}
                <p className="font-semibold leading-snug">{name || 'Package name'}</p>
                {tagline.trim() ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tagline}</p>
                ) : (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {description || 'Add a tagline or description for the card pitch.'}
                  </p>
                )}

                {highlights.filter((h) => h.trim()).length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                    {highlights
                      .filter((h) => h.trim())
                      .slice(0, 3)
                      .map((h, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-xs text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span className="line-clamp-1">{h}</span>
                        </li>
                      ))}
                  </ul>
                )}

                <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{getPackageTypeLabel(draftRule.type)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
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
                          <span className="shrink-0 tabular-nums">Ã—{item.quantity}</span>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{items.length - 4} more
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Retail value</span>
                    <span className="font-medium tabular-nums">{formatUGX(basePrice)}</span>
                  </div>
                  <div className="flex justify-between gap-3 pt-1">
                    <span className="text-muted-foreground">Package price</span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {effectivePrice > 0 ? formatUGX(effectivePrice) : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Before you save</CardTitle>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {completionCount}/{completionTotal}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <ChecklistItem done={completionSteps.hasPositioning} label="Category & name" />
                <ChecklistItem done={completionSteps.hasDetails} label="Tagline or description" />
                <ChecklistItem done={completionSteps.hasItems} label="Complete package items" />
                <ChecklistItem done={completionSteps.hasCover} label="Cover image ready" />
                <ChecklistItem done={completionSteps.hasPricing} label="Package price set" />
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
                  Use <span className="font-medium text-foreground">calculated total</span> when
                  the package price should match the sum of items. Use{' '}
                  <span className="font-medium text-foreground">custom price</span> to offer a
                  discount or premium bundle fee.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminPage>
  );
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
      <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
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
          : 'border-border/80 hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
