'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Package, PackageItem, PackageRule } from '@/lib/types/wholesale';
import { useProducts } from '@/lib/products-context';
import { productsToCatalog, getRetailPricesMap, formatUGX } from '@/lib/wholesale-data';
import { Plus, Trash2 } from 'lucide-react';

interface PackageFormProps {
  initialData?: Package;
  onSubmit: (data: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>) => void;
  submitLabel: string;
}

export function PackageForm({ initialData, onSubmit, submitLabel }: PackageFormProps) {
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const retailPrices = getRetailPricesMap(catalog);

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [items, setItems] = useState<PackageItem[]>(
    initialData?.items ?? [{ productId: '1', quantity: 1 }]
  );
  const [ruleType, setRuleType] = useState<PackageRule['type']>(
    initialData?.rule.type ?? 'fixed'
  );
  const [itemLimit, setItemLimit] = useState(initialData?.rule.itemLimit ?? 2);
  const [discountedPrice, setDiscountedPrice] = useState(
    initialData?.discountedPrice?.toString() ?? ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const basePrice = items.reduce(
    (sum, item) => sum + (retailPrices[item.productId] || 0) * item.quantity,
    0
  );

  const savingsPercentage =
    basePrice > 0 && discountedPrice
      ? ((basePrice - parseInt(discountedPrice)) / basePrice) * 100
      : 0;

  const addItem = () => {
    setItems([...items, { productId: '1', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PackageItem, value: string | number) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !discountedPrice || items.length === 0) return;

    const rule: PackageRule =
      ruleType === 'mix-and-match'
        ? { type: ruleType, itemLimit }
        : { type: ruleType };

    onSubmit({
      name,
      description,
      items,
      rule,
      basePrice,
      discountedPrice: parseInt(discountedPrice),
      savingsPercentage: Math.max(0, savingsPercentage),
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Package Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Beauty Essentials Bundle"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the package contents and benefits"
            className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="isActive">Active (visible to customers)</Label>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Package Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label>Product</Label>
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {catalog.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatUGX(product.basePrice)})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-2">
              <Label>Qty</Label>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Retail value: <span className="font-semibold">{formatUGX(basePrice)}</span>
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Bundle Rules & Pricing</h2>
        <div className="space-y-2">
          <Label htmlFor="ruleType">Bundle Type</Label>
          <select
            id="ruleType"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as PackageRule['type'])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="fixed">Fixed Bundle</option>
            <option value="customizable">Customizable</option>
            <option value="mix-and-match">Mix & Match</option>
          </select>
        </div>
        {ruleType === 'mix-and-match' && (
          <div className="space-y-2">
            <Label htmlFor="itemLimit">Item Limit</Label>
            <Input
              id="itemLimit"
              type="number"
              min={1}
              value={itemLimit}
              onChange={(e) => setItemLimit(parseInt(e.target.value) || 1)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="discountedPrice">Wholesale Price (UGX)</Label>
          <Input
            id="discountedPrice"
            type="number"
            min={0}
            value={discountedPrice}
            onChange={(e) => setDiscountedPrice(e.target.value)}
            placeholder="550000"
            required
          />
        </div>
        {discountedPrice && (
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Estimated Savings</p>
            <p className="text-lg font-bold text-accent">
              {savingsPercentage.toFixed(1)}% ({formatUGX(basePrice - parseInt(discountedPrice))})
            </p>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Link href="/admin/wholesale/packages">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
