'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { useProducts } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { deleteProduct } from '@/lib/firebase/products';
import { formatUGX } from '@/lib/wholesale-data';
import { DEFAULT_SUPPLIER_ID, type Supplier } from '@/lib/types/suppliers';
import type { Product } from '@/lib/types/database';
import { Plus, Edit, Trash2, Search, Loader2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { isRemoteProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type SupplierGroup = {
  supplierId: string;
  supplier: Supplier | undefined;
  products: Product[];
};

function productStatusClass(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Low Stock') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function resolveSupplierLabel(
  supplierId: string,
  supplier: Supplier | undefined,
  defaultSupplierId: string
) {
  if (supplier?.name) return supplier.name;
  if (supplierId === defaultSupplierId || supplierId === DEFAULT_SUPPLIER_ID) return 'ShiQueen';
  return 'Unknown supplier';
}

function buildSupplierGroups(
  products: Product[],
  getSupplierById: (id: string) => Supplier | undefined,
  defaultSupplierId: string
): SupplierGroup[] {
  const byId = new Map<string, Product[]>();

  for (const product of products) {
    const supplierId = product.supplierId?.trim() || defaultSupplierId || DEFAULT_SUPPLIER_ID;
    const list = byId.get(supplierId);
    if (list) list.push(product);
    else byId.set(supplierId, [product]);
  }

  const groups: SupplierGroup[] = Array.from(byId.entries()).map(([supplierId, groupProducts]) => ({
    supplierId,
    supplier: getSupplierById(supplierId),
    products: [...groupProducts].sort((a, b) => a.name.localeCompare(b.name)),
  }));

  groups.sort((a, b) => {
    const aDefault = a.supplierId === defaultSupplierId || a.supplier?.isDefault;
    const bDefault = b.supplierId === defaultSupplierId || b.supplier?.isDefault;
    if (aDefault && !bDefault) return -1;
    if (!aDefault && bDefault) return 1;
    const aName = resolveSupplierLabel(a.supplierId, a.supplier, defaultSupplierId);
    const bName = resolveSupplierLabel(b.supplierId, b.supplier, defaultSupplierId);
    return aName.localeCompare(bName);
  });

  return groups;
}

function SupplierSectionMeta({
  group,
  defaultSupplierId,
}: {
  group: SupplierGroup;
  defaultSupplierId: string;
}) {
  const name = resolveSupplierLabel(group.supplierId, group.supplier, defaultSupplierId);
  const companyName = group.supplier?.companyName?.trim();
  const showCompany = Boolean(companyName && companyName !== name);
  const countLabel = `${group.products.length} product${group.products.length === 1 ? '' : 's'}`;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
      <div className="min-w-0">
        {group.supplier ? (
          <Link
            href={`/admin/suppliers/${group.supplierId}`}
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
          >
            <span className="truncate">{name}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          </Link>
        ) : (
          <span className="font-semibold text-foreground">{name}</span>
        )}
        {showCompany && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">{companyName}</span>
        )}
      </div>
      <span className="rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
        {countLabel}
      </span>
    </div>
  );
}

export default function AdminProducts() {
  const { products, loading } = useProducts();
  const { suppliers, getSupplierById, defaultSupplierId } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const supplierId = product.supplierId?.trim() || defaultSupplierId || DEFAULT_SUPPLIER_ID;
      if (supplierFilter !== 'all' && supplierId !== supplierFilter) return false;
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query)
      );
    });
  }, [products, searchTerm, supplierFilter, defaultSupplierId]);

  const supplierGroups = useMemo(
    () => buildSupplierGroups(filteredProducts, getSupplierById, defaultSupplierId),
    [filteredProducts, getSupplierById, defaultSupplierId]
  );

  const supplierOptions = useMemo(() => {
    return [...suppliers].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [suppliers]);

  const inventorySummary = loading
    ? 'Loading products…'
    : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} · ${supplierGroups.length} supplier${supplierGroups.length === 1 ? '' : 's'}`;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Products"
        action={
          <Link
            href="/admin/products/new"
            className={cn(buttonVariants({ size: 'lg' }), 'gap-2 md:hidden')}
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      <div className="mb-6 space-y-3 md:hidden">
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
          aria-label="Filter by supplier"
        >
          <option value="all">All suppliers</option>
          {supplierOptions.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or SKU…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/60 md:bg-muted/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Product inventory</CardTitle>
              <CardDescription>{inventorySummary}</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="hidden w-full gap-2 sm:max-w-md md:flex">
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Filter by supplier"
                >
                  <option value="all">All suppliers</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search by name or SKU…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <Link
                href="/admin/products/new"
                className={cn(buttonVariants({ size: 'lg' }), 'hidden shrink-0 gap-2 md:inline-flex')}
              >
                <Plus className="h-4 w-4" />
                Add product
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No products found.{' '}
              <Link href="/admin/products/new" className="text-primary hover:underline">
                Create your first product
              </Link>
            </p>
          ) : (
            <>
              {/* Mobile list */}
              <div className="space-y-8 md:hidden">
                {supplierGroups.map((group) => (
                  <section key={group.supplierId} className="space-y-3">
                    <div className="flex items-center border-b border-border/60 pb-2">
                      <SupplierSectionMeta group={group} defaultSupplierId={defaultSupplierId} />
                    </div>
                    <div className="space-y-3">
                      {group.products.map((product) => (
                        <div
                          key={product.id}
                          className="rounded-xl border border-border/70 bg-card p-4"
                        >
                          <div className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {isRemoteProductImage(product.image) ? (
                                <Image src={product.image} alt="" fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl opacity-40">
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="line-clamp-2 font-semibold hover:text-primary"
                              >
                                {product.name}
                              </Link>
                              <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {formatUGX(product.price)}
                                </span>
                                <span
                                  className={cn(
                                    'rounded px-2 py-0.5 text-[11px] font-medium',
                                    productStatusClass(product.status)
                                  )}
                                >
                                  {product.status}
                                </span>
                                <span
                                  className={cn(
                                    'text-xs',
                                    product.stock === 0
                                      ? 'font-semibold text-red-600'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  Stock: {product.stock}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className={cn(
                                buttonVariants({ variant: 'outline', size: 'sm' }),
                                'min-h-10 flex-1 gap-1.5'
                              )}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-10 min-w-10 px-3 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(product.id, product.name)}
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium">Product</th>
                      <th className="px-4 py-3 text-left font-medium">SKU</th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Stock</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierGroups.map((group) => (
                      <FragmentGroup
                        key={group.supplierId}
                        group={group}
                        defaultSupplierId={defaultSupplierId}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}

function FragmentGroup({
  group,
  defaultSupplierId,
  onDelete,
}: {
  group: SupplierGroup;
  defaultSupplierId: string;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-border bg-muted/40">
        <td colSpan={7} className="px-4 py-2.5">
          <SupplierSectionMeta group={group} defaultSupplierId={defaultSupplierId} />
        </td>
      </tr>
      {group.products.map((product) => (
        <tr
          key={product.id}
          className="border-b border-border transition hover:bg-secondary/60"
        >
          <td className="px-4 py-3 font-medium">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {isRemoteProductImage(product.image) ? (
                  <Image src={product.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg opacity-40">
                    📦
                  </div>
                )}
              </div>
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="hover:text-primary hover:underline"
              >
                {product.name}
              </Link>
            </div>
          </td>
          <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
          <td className="px-4 py-3">{product.category}</td>
          <td className="px-4 py-3 font-semibold">{formatUGX(product.price)}</td>
          <td className="px-4 py-3">
            <span className={product.stock === 0 ? 'font-semibold text-red-600' : ''}>
              {product.stock}
            </span>
          </td>
          <td className="px-4 py-3">
            <span
              className={cn(
                'rounded px-2 py-1 text-xs font-medium',
                productStatusClass(product.status)
              )}
            >
              {product.status}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(product.id, product.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
