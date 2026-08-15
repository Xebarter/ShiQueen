'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
    sku: '',
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
    sku: product.sku,
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((file) => URL.createObjectURL(file)),
    [pendingFiles]
  );

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
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

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
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeExistingImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Name and SKU are required.');
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
      toast.error('Wholesale price must be lower than retail price.');
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls = await uploadProductImages(productId, pendingFiles);
      const allImages = [...imageUrls, ...uploadedUrls];
      const stock = parseInt(formData.stock, 10) || 0;
      const originalPrice = formData.originalPrice
        ? parseInt(formData.originalPrice, 10)
        : undefined;

      const payload: Omit<Product, 'createdAt' | 'updatedAt'> = {
        id: productId,
        name: formData.name.trim(),
        sku: formData.sku.trim(),
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

      setPendingFiles([]);
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

  const allPreviews = [
    ...imageUrls.map((url, index) => ({ type: 'saved' as const, url, index })),
    ...pendingPreviews.map((url, index) => ({ type: 'pending' as const, url, index })),
  ];

  return (
    <AdminPage>
      <div className="mb-6 sm:mb-8">
        <Link
          href={listHref}
          className="mb-4 flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {mode === 'create' ? 'Create Product' : 'Edit Product'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {mode === 'create'
            ? 'Add a new product with photos to your catalog.'
            : 'Update product details and images.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
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

              {allPreviews.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.map((url, index) => (
                    <div
                      key={`saved-${url}`}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary"
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          <Star className="w-3 h-3" />
                          Primary
                        </span>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="rounded-full bg-background/90 p-1.5 hover:bg-background"
                            title="Set as primary"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="rounded-full bg-background/90 p-1.5 hover:bg-background text-red-600"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingPreviews.map((url, index) => (
                    <div
                      key={`pending-${url}`}
                      className="relative aspect-square rounded-xl overflow-hidden border border-dashed border-primary/40 bg-secondary"
                    >
                      <Image src={url} alt="" fill className="object-cover opacity-90" />
                      <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        New
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 hover:bg-background text-red-600"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
                  <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload product photos. The first image is used as the cover.
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF · up to 5MB each
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} />
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
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Retail Price (UGX)</Label>
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
                <Label htmlFor="wholesalePrice">Wholesale Price (UGX)</Label>
                <Input
                  id="wholesalePrice"
                  name="wholesalePrice"
                  type="number"
                  min="0"
                  value={formData.wholesalePrice}
                  onChange={handleInputChange}
                  placeholder="Bulk unit price at MOQ"
                  disabled={!formData.isWholesaleEnabled}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Per-unit price for wholesale orders. Leave blank to use automatic volume tiers from
                  retail price.
                </p>
              </div>
              <div>
                <Label htmlFor="originalPrice">Compare-at Price (UGX)</Label>
                <Input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  min="0"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="Optional strikethrough price for retail"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
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
                <Label htmlFor="minOrderQuantity">Min Wholesale Qty</Label>
                <Input
                  id="minOrderQuantity"
                  name="minOrderQuantity"
                  type="number"
                  min="1"
                  value={formData.minOrderQuantity}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sizes">Sizes (comma-separated)</Label>
                <Input
                  id="sizes"
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleInputChange}
                  placeholder="XS, S, M, L, XL"
                />
              </div>
              <div>
                <Label htmlFor="colors">Colors (comma-separated)</Label>
                <Input
                  id="colors"
                  name="colors"
                  value={formData.colors}
                  onChange={handleInputChange}
                  placeholder="Black, Cream, Navy"
                />
              </div>
              <div>
                <Label htmlFor="details">Product Details (one per line)</Label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder={'100% silk\nDry clean only'}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isWholesaleEnabled"
                  checked={formData.isWholesaleEnabled}
                  onChange={handleInputChange}
                  className="rounded border-border"
                />
                Enable wholesale pricing for this product
              </label>
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
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                {allPreviews.length > 0 && isRemoteProductImage(imageUrls[0]) ? (
                  <Image src={imageUrls[0]} alt="" fill className="object-cover" />
                ) : pendingPreviews[0] ? (
                  <Image src={pendingPreviews[0]} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary text-sm text-muted-foreground">
                    No image yet
                  </div>
                )}
              </div>
              <p className="font-medium">{formData.name || 'Product name'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.category || 'Category'} · {formData.sku || 'SKU'}
              </p>
              {formData.price && (
                <p className="mt-2 text-sm tabular-nums">
                  Retail: USh {Number(formData.price).toLocaleString('en-UG')}
                </p>
              )}
              {formData.isWholesaleEnabled && formData.wholesalePrice && (
                <p className="text-sm tabular-nums text-primary">
                  Wholesale: USh {Number(formData.wholesalePrice).toLocaleString('en-UG')}
                </p>
              )}
              <p className="text-sm capitalize mt-3">
                Status: {computeStatus(parseInt(formData.stock, 10) || 0)}
              </p>
            </CardContent>
          </Card>

          {mode === 'edit' && initialProduct && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full text-red-600"
                  onClick={handleDelete}
                >
                  Delete Product
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
