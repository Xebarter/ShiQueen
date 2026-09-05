'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminPage } from '@/components/admin/admin-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/lib/types/database';
import { createProduct, updateProduct, deleteProduct } from '@/lib/firebase/products';
import { uploadProductImages } from '@/lib/firebase/storage';
import { isRemoteProductImage } from '@/components/product-image';
import { productImageVariant } from '@/lib/image-optimization/variants';
import { ArrowLeft, Save, Loader2, Upload, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupplierSelect } from '@/components/admin/supplier-select';
import { useSuppliers } from '@/lib/suppliers-context';
import { optimizeImageForUpload, isLikelyImageFile } from '@/lib/image-optimization/client';
import { IMAGE_ACCEPT_ATTRIBUTE, IMAGE_OPTIMIZATION } from '@/lib/image-optimization/config';
import { formatFileSize, reductionPercent } from '@/lib/image-optimization/format';
import type { PendingImageStatus } from '@/lib/image-optimization/types';
import { cn } from '@/lib/utils';
import {
  getProductSalesChannel,
  salesChannelToFlags,
} from '@/lib/product-channels';

const CATEGORIES = ['Clothing', 'Beauty', 'Wellness', 'Accessories', 'Home'];

type PendingImage = {
  id: string;
  originalFile: File;
  file: File;
  previewUrl: string;
  originalBytes: number;
  optimizedBytes: number;
  status: PendingImageStatus;
  progress: number;
  error?: string;
};

function createPendingImages(files: File[]): PendingImage[] {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    originalFile: file,
    file,
    previewUrl: URL.createObjectURL(file),
    originalBytes: file.size,
    optimizedBytes: file.size,
    status: 'optimizing',
    progress: 0,
  }));
}

function revokePendingImages(items: PendingImage[]) {
  items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
}

function pendingStatusLabel(item: PendingImage): string {
  if (item.status === 'optimizing') return 'Optimizing…';
  if (item.status === 'uploading') return `Uploading ${item.progress}%`;
  if (item.status === 'duplicate') return 'Already stored';
  if (item.status === 'error') return item.error || 'Failed';
  const reduced = reductionPercent(item.originalBytes, item.optimizedBytes);
  if (reduced <= 0 || item.optimizedBytes >= item.originalBytes) {
    return `${formatFileSize(item.optimizedBytes)} · ready`;
  }
  return `${formatFileSize(item.originalBytes)} → ${formatFileSize(item.optimizedBytes)} (−${reduced}%)`;
}

type ProductFormProps = {
  mode: 'create' | 'edit';
  productId: string;
  initialProduct?: Product;
  onSaved?: () => void;
  /** Admin catalog vs supplier portal. */
  portal?: 'admin' | 'supplier';
  forcedSupplierId?: string;
  backHref?: string;
};

function emptyForm(defaultSupplierId = '') {
  return {
    name: '',
    category: 'Clothing',
    supplierId: defaultSupplierId,
    price: '',
    originalPrice: '',
    wholesalePrice: '',
    stock: '',
    description: '',
    sizes: '',
    colors: '',
    details: '',
    isWholesaleEnabled: true,
    isRetailEnabled: true,
    minOrderQuantity: '10',
  };
}

function productToFormState(product: Product) {
  return {
    name: product.name,
    category: product.category,
    supplierId: product.supplierId,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
    stock: String(product.stock),
    description: product.description,
    sizes: product.sizes.join(', '),
    colors: product.colors.join(', '),
    details: product.details.join('\n'),
    isWholesaleEnabled: product.isWholesaleEnabled,
    isRetailEnabled: product.isRetailEnabled !== false,
    minOrderQuantity: String(product.minOrderQuantity),
  };
}

function productToImageUrls(product: Product): string[] {
  if (product.images.length > 0) return product.images;
  if (product.image) return [product.image];
  return [];
}

function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLineList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function computeStatus(stock: number): Product['status'] {
  if (stock === 0) return 'Out of Stock';
  if (stock < 15) return 'Low Stock';
  return 'Active';
}

export function ProductForm({
  mode,
  productId,
  initialProduct,
  onSaved,
  portal = 'admin',
  forcedSupplierId,
  backHref,
}: ProductFormProps) {
  const { defaultSupplierId } = useSuppliers();
  const resolvedSupplierId = forcedSupplierId || defaultSupplierId;
  const isSupplierPortal = portal === 'supplier';
  const listHref = backHref ?? (isSupplierPortal ? '/suppliers/products' : '/admin/products');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveAbortRef = useRef<AbortController | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState(() =>
    initialProduct
      ? productToFormState(initialProduct)
      : emptyForm(forcedSupplierId || defaultSupplierId)
  );
  const [imageUrls, setImageUrls] = useState<string[]>(() =>
    initialProduct ? productToImageUrls(initialProduct) : []
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  useEffect(() => {
    if (mode === 'create' && !formData.supplierId && resolvedSupplierId) {
      setFormData((prev) => ({ ...prev, supplierId: resolvedSupplierId }));
    }
  }, [mode, formData.supplierId, resolvedSupplierId]);

  useEffect(() => {
    if (forcedSupplierId) {
      setFormData((prev) =>
        prev.supplierId === forcedSupplierId
          ? prev
          : { ...prev, supplierId: forcedSupplierId }
      );
    }
  }, [forcedSupplierId]);

  useEffect(() => {
    return () => {
      revokePendingImages(pendingImagesRef.current);
      saveAbortRef.current?.abort();
    };
  }, []);

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

  const applyOptimizeResult = async (item: PendingImage) => {
    try {
      const result = await optimizeImageForUpload(item.originalFile);
      setPendingImages((prev) => {
        const exists = prev.some((entry) => entry.id === item.id);
        if (!exists) {
          URL.revokeObjectURL(result.previewUrl);
          return prev;
        }
        return prev.map((entry) => {
          if (entry.id !== item.id) return entry;
          URL.revokeObjectURL(entry.previewUrl);
          return {
            ...entry,
            file: result.file,
            previewUrl: result.previewUrl,
            originalBytes: result.originalBytes,
            optimizedBytes: result.optimizedBytes,
            status: 'ready',
            progress: 0,
            error: undefined,
          };
        });
      });
    } catch (error) {
      setPendingImages((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: 'error',
                error:
                  error instanceof Error ? error.message : 'Could not optimize this image.',
              }
            : entry
        )
      );
    }
  };

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    if (!incoming.length) return;

    const usable: File[] = [];
    for (const file of incoming) {
      if (!isLikelyImageFile(file)) {
        toast.error(`${file.name}: use JPEG, PNG, WebP, AVIF, or GIF.`);
        continue;
      }
      if (file.size > IMAGE_OPTIMIZATION.pickerMaxBytes) {
        toast.error(`${file.name}: each image must be 40MB or smaller.`);
        continue;
      }
      usable.push(file);
    }
    if (!usable.length) return;

    const remaining =
      IMAGE_OPTIMIZATION.galleryMax - imageUrls.length - pendingImagesRef.current.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${IMAGE_OPTIMIZATION.galleryMax} photos.`);
      return;
    }
    const accepted = usable.slice(0, remaining);
    if (accepted.length < usable.length) {
      toast.error(`You can add up to ${IMAGE_OPTIMIZATION.galleryMax} photos.`);
    }

    const next = createPendingImages(accepted);
    setPendingImages((prev) => [...prev, ...next]);
    next.forEach((item) => {
      void applyOptimizeResult(item);
    });
  };

  const removeExistingImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removePendingFile = (index: number) => {
    setPendingImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const setPrimaryImage = (index: number) => {
    setImageUrls((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!(forcedSupplierId || formData.supplierId)) {
      toast.error('Select a supplier.');
      return;
    }
    const price = parseInt(formData.price, 10) || 0;
    const wholesalePrice = formData.wholesalePrice
      ? parseInt(formData.wholesalePrice, 10)
      : undefined;
    if (
      formData.isWholesaleEnabled &&
      formData.isRetailEnabled &&
      wholesalePrice &&
      wholesalePrice > 0 &&
      wholesalePrice >= price
    ) {
      toast.error('Wholesale must be lower than retail.');
      return;
    }
    if (!formData.isRetailEnabled && !formData.isWholesaleEnabled) {
      toast.error('Choose shop, wholesale, or both.');
      return;
    }
    if (!formData.isRetailEnabled && formData.isWholesaleEnabled && !(price > 0 || (wholesalePrice && wholesalePrice > 0))) {
      toast.error('Set a wholesale or list price.');
      return;
    }

    const pending = pendingImagesRef.current;
    if (pending.some((item) => item.status === 'optimizing')) {
      toast.error('Wait for photos to finish optimizing.');
      return;
    }

    const ready = pending.filter(
      (item) => item.status === 'ready' || item.status === 'duplicate'
    );
    const failed = pending.filter((item) => item.status === 'error');
    if (failed.length > 0 && ready.length === 0 && pending.length > 0) {
      toast.error('Fix or remove photos that failed to optimize.');
      return;
    }

    setSaving(true);
    saveAbortRef.current?.abort();
    const abort = new AbortController();
    saveAbortRef.current = abort;
    try {
      const uploadedUrls = await uploadProductImages(
        productId,
        ready.map((item) => item.file),
        {
          alreadyOptimized: true,
          signal: abort.signal,
          onFileProgress: (index, percent) => {
            const id = ready[index]?.id;
            if (!id) return;
            setPendingImages((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: 'uploading', progress: percent } : item
              )
            );
          },
          onFileStatus: (index, status) => {
            const id = ready[index]?.id;
            if (!id) return;
            setPendingImages((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: status === 'duplicate' ? 'duplicate' : 'uploading',
                      progress: status === 'done' || status === 'duplicate' ? 100 : item.progress,
                    }
                  : item
              )
            );
          },
        }
      );
      const allImages = [...imageUrls, ...uploadedUrls];
      const stock = parseInt(formData.stock, 10) || 0;
      const originalPrice = formData.originalPrice
        ? parseInt(formData.originalPrice, 10)
        : undefined;

      const payload: Omit<Product, 'createdAt' | 'updatedAt'> = {
        id: productId,
        name: formData.name.trim(),
        sku: initialProduct?.sku ?? '',
        category: formData.category,
        supplierId: forcedSupplierId || formData.supplierId,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        wholesalePrice:
          formData.isWholesaleEnabled && wholesalePrice && wholesalePrice > 0
            ? wholesalePrice
            : undefined,
        stock,
        description: formData.description.trim(),
        image: allImages[0] ?? '',
        images: allImages,
        sizes: parseCommaList(formData.sizes),
        colors: parseCommaList(formData.colors),
        details: parseLineList(formData.details),
        isWholesaleEnabled: formData.isWholesaleEnabled,
        isRetailEnabled: formData.isRetailEnabled !== false,
        minOrderQuantity: parseInt(formData.minOrderQuantity, 10) || 10,
        maxOrderQuantity: initialProduct?.maxOrderQuantity ?? null,
        rating: initialProduct?.rating ?? 0,
        reviews: initialProduct?.reviews ?? 0,
        status: computeStatus(stock),
      };

      if (mode === 'create') {
        await createProduct(payload);
      } else {
        await updateProduct(productId, payload);
      }

      revokePendingImages(pending);
      setPendingImages([]);
      setImageUrls(allImages);
      if (failed.length > 0) {
        toast.success(
          mode === 'create'
            ? `Product created. ${failed.length} photo${failed.length === 1 ? '' : 's'} skipped.`
            : `Product saved. ${failed.length} photo${failed.length === 1 ? '' : 's'} skipped.`
        );
      } else {
        toast.success(mode === 'create' ? 'Product created' : 'Product saved');
      }
      onSaved?.();
    } catch (error) {
      console.error(error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error('Upload cancelled.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to save product');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !initialProduct) return;
    if (!confirm(`Delete "${initialProduct.name}"?`)) return;

    try {
      await deleteProduct(productId);
      toast.success('Product deleted');
      onSaved?.();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href={listHref}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {mode === 'create' ? 'New product' : 'Edit product'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent
              className="space-y-4"
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFilesSelected(event.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_ACCEPT_ATTRIBUTE}
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  handleFilesSelected(files);
                  e.target.value = '';
                }}
              />

              {imageUrls.length > 0 || pendingImages.length > 0 ? (
                <div
                  className={cn(
                    'grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl p-1 transition-colors',
                    dragActive && 'ring-2 ring-primary/40 bg-primary/5'
                  )}
                >
                  {imageUrls.map((url, index) => (
                    <div
                      key={`saved-${url}`}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary"
                    >
                      {isRemoteProductImage(url) ? (
                        <Image src={productImageVariant(url, 'card')} alt="" fill className="object-cover" sizes="200px" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      {index === 0 && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          <Star className="w-3 h-3" />
                          Cover
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="rounded-full bg-background/90 p-1.5 hover:bg-background"
                            title="Set as cover"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="rounded-full bg-background/90 p-1.5 hover:bg-background text-red-600"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingImages.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-dashed border-primary/40 bg-secondary"
                    >
                      {/* Blob previews must use <img>; next/image cannot optimize blob: URLs */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-90"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        New
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        disabled={saving}
                        className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 hover:bg-background text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-background/85 px-2 py-1.5 text-[10px] leading-tight text-foreground">
                        {item.status === 'optimizing' && (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Optimizing…
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <div>
                            <div className="mb-1 flex justify-between gap-2">
                              <span>Uploading {item.progress}%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {item.status !== 'optimizing' && item.status !== 'uploading' && (
                          <span className={item.status === 'error' ? 'text-red-600' : undefined}>
                            {pendingStatusLabel(item)}
                          </span>
                        )}
                        {item.status === 'error' && (
                          <button
                            type="button"
                            className="mt-0.5 underline"
                            onClick={() => {
                              setPendingImages((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, status: 'optimizing', error: undefined }
                                    : entry
                                )
                              );
                              void applyOptimizeResult(item);
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-secondary/40 px-6 py-12 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
                    dragActive ? 'border-primary bg-primary/5 text-foreground' : 'border-border'
                  )}
                >
                  <Upload className="h-7 w-7" />
                  <span className="text-sm">Add photos</span>
                  <span className="text-xs">Drag and drop or click · JPEG, PNG, WebP, AVIF, GIF</span>
                </button>
              )}

              {(imageUrls.length > 0 || pendingImages.length > 0) && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      imageUrls.length + pendingImages.length >= IMAGE_OPTIMIZATION.galleryMax
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {imageUrls.length + pendingImages.length}/{IMAGE_OPTIMIZATION.galleryMax} photos
                    {dragActive ? ' · Drop to add' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {!isSupplierPortal && (
                <SupplierSelect
                  value={formData.supplierId}
                  onChange={(supplierId) => setFormData((prev) => ({ ...prev, supplierId }))}
                />
              )}
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">
                  {formData.isRetailEnabled === false ? 'List price (UGX)' : 'Retail (UGX)'}
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="wholesalePrice">Wholesale (UGX)</Label>
                <Input
                  id="wholesalePrice"
                  name="wholesalePrice"
                  type="number"
                  min="0"
                  value={formData.wholesalePrice}
                  onChange={handleInputChange}
                  disabled={!formData.isWholesaleEnabled}
                />
              </div>
              <div>
                <Label htmlFor="originalPrice">Compare at (UGX)</Label>
                <Input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  min="0"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="minOrderQuantity">Min qty</Label>
                <Input
                  id="minOrderQuantity"
                  name="minOrderQuantity"
                  type="number"
                  min="1"
                  value={formData.minOrderQuantity}
                  onChange={handleInputChange}
                  disabled={!formData.isWholesaleEnabled}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Listed on</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        id: 'both',
                        label: 'Shop & wholesale',
                        hint: 'Buyers can purchase in the shop or in bulk',
                      },
                      {
                        id: 'retail',
                        label: 'Shop only',
                        hint: 'Hidden from wholesale',
                      },
                      {
                        id: 'wholesale',
                        label: 'Wholesale only',
                        hint: 'Hidden from the shop',
                      },
                    ] as const
                  ).map((option) => {
                    const selected =
                      getProductSalesChannel({
                        isRetailEnabled: formData.isRetailEnabled !== false,
                        isWholesaleEnabled: formData.isWholesaleEnabled,
                      }) === option.id;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-sm transition',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            type="radio"
                            name="salesChannel"
                            className="accent-primary"
                            checked={selected}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                ...salesChannelToFlags(option.id),
                              }))
                            }
                          />
                          {option.label}
                        </span>
                        <span className="pl-6 text-xs text-muted-foreground">{option.hint}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sizes">Sizes</Label>
                <Input
                  id="sizes"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="XS, S, M, L, XL"
                />
              </div>
              <div>
                <Label htmlFor="colors">Colors</Label>
                <Input
                  id="colors"
                  name="colors"
                  value={formData.colors}
                  onChange={handleInputChange}
                  placeholder="Black, Cream, Navy"
                />
              </div>
              <div>
                <Label htmlFor="details">Highlights</Label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder={'100% silk\nDry clean only'}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={saving || pendingImages.some((item) => item.status === 'optimizing')}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving
              ? 'Uploading…'
              : pendingImages.some((item) => item.status === 'optimizing')
                ? 'Optimizing…'
                : mode === 'create'
                  ? 'Create'
                  : 'Save'}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-secondary">
                {imageUrls.length > 0 && isRemoteProductImage(imageUrls[0]) ? (
                  <Image
                    src={productImageVariant(imageUrls[0], 'card')}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                ) : pendingImages[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingImages[0].previewUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <p className="font-medium">{formData.name || 'Untitled'}</p>
              <p className="text-sm text-muted-foreground mt-1">{formData.category}</p>
              {formData.price && (
                <p className="mt-2 text-sm tabular-nums">
                  USh {Number(formData.price).toLocaleString('en-UG')}
                </p>
              )}
              {formData.isWholesaleEnabled && formData.wholesalePrice && (
                <p className="text-sm tabular-nums text-muted-foreground">
                  Wholesale USh {Number(formData.wholesalePrice).toLocaleString('en-UG')}
                </p>
              )}
            </CardContent>
          </Card>

          {mode === 'edit' && initialProduct && (
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
