'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { deleteProduct } from '@/lib/firebase/products';
import { formatUGX } from '@/lib/wholesale-data';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { isRemoteProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-1 text-muted-foreground">Manage your product inventory in Firebase</p>
          </div>
          <Link href="/admin/products/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            {loading ? 'Loading products...' : `${filteredProducts.length} products found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No products found.{' '}
                        <Link href="/admin/products/new" className="text-primary hover:underline">
                          Create your first product
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
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
                              product.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : product.status === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
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
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
