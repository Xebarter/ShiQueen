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
import { ArrowLeft, Save, Loader2, Upload, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupplierSelect } from '@/components/admin/supplier-select';
import { useSuppliers } from '@/lib/suppliers-context';

const CATEGORIES = ['Clothing', 'Beauty', 'Wellness', 'Accessories', 'Home'];

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function createPendingImages(files: FileList | File[]): PendingImage[] {
  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

function revokePendingImages(items: PendingImage[]) {
  items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
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
  const [saving, setSaving] = useState(false);
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

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingImages((prev) => [...prev, ...createPendingImages(files)]);
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
      wholesalePrice &&
      wholesalePrice > 0 &&
      wholesalePrice >= price
    ) {
      toast.error('Wholesale must be lower than retail.');
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls = await uploadProductImages(
        productId,
        pendingImages.map((item) => item.file)
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
        minOrderQuantity: parseInt(formData.minOrderQuantity, 10) || 10,
        maxOrderQuantity: initialProduct?.maxOrderQuantity ?? null,
        rating: initialProduct?.rating ?? 0,
        reviews: initialProduct?.reviews ?? 0,
        status: computeStatus(stock),
      };

      if (mode === 'create') {
        await createProduct(payload);
        toast.success('Product created');
      } else {
        await updateProduct(productId, payload);
        toast.success('Product saved');
      }

      revokePendingImages(pendingImages);
      setPendingImages([]);
      setImageUrls(allImages);
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
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
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />

              {imageUrls.length > 0 || pendingImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.map((url, index) => (
                    <div
                      key={`saved-${url}`}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary"
                    >
                      {isRemoteProductImage(url) ? (
                        <Image src={url} alt="" fill className="object-cover" sizes="200px" />
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
                        className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 hover:bg-background text-red-600"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-12 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Upload className="h-7 w-7" />
                  <span className="text-sm">Add photos</span>
                </button>
              )}

              {(imageUrls.length > 0 || pendingImages.length > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
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
                <Label htmlFor="price">Retail (UGX)</Label>
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
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isWholesaleEnabled"
                    checked={formData.isWholesaleEnabled}
                    onChange={handleInputChange}
                    className="rounded border-border"
                  />
                  Wholesale
                </label>
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
          <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-secondary">
                {imageUrls.length > 0 && isRemoteProductImage(imageUrls[0]) ? (
                  <Image
                    src={imageUrls[0]}
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
