# Wholesale, Bulk Ordering & Bundle Management Guide

## Overview

The wholesale system provides comprehensive features for B2B operations, bulk ordering, and package management. Customers can purchase at wholesale prices with volume-based discounts, while businesses can manage bundles, pricing tiers, and wholesale accounts.

## Features

### 1. Wholesale Pricing Tiers

Products support automatic tiered pricing based on order quantity:

- **1-9 units**: Retail price
- **10-49 units**: 12% discount
- **50-99 units**: 18% discount
- **100+ units**: 25% discount

### 2. Bulk Order Builder

Interactive interface at `/wholesale/bulk-orders` that allows customers to:

- Add multiple products with custom quantities
- See real-time price calculations with volume discounts
- View total savings
- Proceed to checkout with automatic tax calculation (18% VAT)

**Features:**
- Dynamic pricing tier application
- Real-time savings calculation
- Quantity increment/decrement controls
- Product quick-add buttons

### 3. Package Management

Pre-configured bundles with three types:

#### Fixed Bundles
Complete packages with specific items and quantities. Customers cannot modify contents but receive guaranteed wholesale pricing.

#### Customizable Bundles
Base packages that allow quantity modifications while maintaining the bundle price.

#### Mix & Match Bundles
Flexible combinations where customers select from available products within the bundle limit.

### 4. Wholesale Accounts

Account system for wholesale customers:

- Account status tracking (pending/approved/rejected/suspended)
- Company information storage
- Tax ID management
- Account-level discounts
- Credit limits

## Customer-Facing Pages

### `/wholesale`
Wholesale landing page with:
- Program overview and features
- Volume pricing tiers display
- Featured packages
- Call-to-action for account applications

### `/wholesale/bulk-orders`
Bulk order builder where customers can:
- Browse all products
- Add to custom order
- See tiered pricing automatically applied
- Review order summary with savings

### `/wholesale/bundles`
Bundle showcase displaying:
- All active packages
- Savings calculations
- Bundle type badges
- Add to cart functionality

### `/wholesale/bundles/[id]`
Detailed bundle view with:
- Complete item listing
- Retail vs. wholesale pricing comparison
- Quantity selection
- Order summary with tax calculation

## Admin Pages

### `/admin/wholesale`
Dashboard showing:
- Wholesale metrics (active packages, bulk orders, revenue)
- Recent packages
- Quick action links
- Bulk order activity

### `/admin/wholesale/packages`
Package management interface with:
- Grid view of all packages
- CRUD operations
- Status indicators
- Quick edit/delete actions

### `/admin/wholesale/packages/new`
Package creation form (template available)

## Data Models

### WholesaleProduct
```typescript
interface WholesaleProduct {
  productId: string;
  isWholesaleEnabled: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  pricingTiers: PricingTier[];
  wholesaleDescription?: string;
  leadTime?: number; // days
}
```

### Package
```typescript
interface Package {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
  rule: PackageRule;
  basePrice: number;
  discountedPrice: number;
  savingsPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### BulkOrder
```typescript
interface BulkOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  orderType: 'retail' | 'wholesale' | 'package';
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  requestedAt: Date;
}
```

## Utilities

### `lib/package-utils.ts`

#### calculateTieredPrice()
Calculates effective unit price and total based on quantity and pricing tiers.

```typescript
const { unitPrice, totalPrice, discount } = calculateTieredPrice(
  basePrice,
  quantity,
  pricingTiers
);
```

#### calculatePackageSavings()
Computes savings from a package deal vs. retail prices.

```typescript
const { retailTotal, packagePrice, savingsAmount, savingsPercentage } = 
  calculatePackageSavings(packageItems, retailPrices);
```

#### validateWholesaleQuantity()
Validates if quantity meets wholesale requirements.

```typescript
const { valid, error } = validateWholesaleQuantity(
  quantity,
  minOrderQuantity,
  maxOrderQuantity
);
```

## Context Management

### WholesaleProvider
Manages wholesale state globally:

```typescript
const { 
  packages,
  addPackage,
  updatePackage,
  deletePackage,
  bulkOrders,
  createBulkOrder,
  updateBulkOrder,
  isWholesaleMode,
  setWholesaleMode,
  selectedPackage,
  setSelectedPackage,
} = useWholesale();
```

## Integration Points

### Product Detail Page
- Displays tiered pricing table for wholesale
- "Place Bulk Order" quick action button
- Links to bulk order builder

### Shop Page
- Optional wholesale badge on products
- MOQ (Minimum Order Quantity) display
- Direct links to tiered pricing info

### Cart & Checkout
- Detects wholesale vs. retail orders
- Applies appropriate tax rates
- Validates quantity requirements
- Preserves order type through checkout

## Future Enhancements

1. **Wholesale Account Approval Workflow**
   - Application form submission
   - Admin review interface
   - Email notifications

2. **Advanced Analytics**
   - Wholesale revenue by customer
   - Top-selling packages
   - Discount effectiveness analysis
   - Wholesale vs. retail revenue comparison

3. **Dynamic Pricing**
   - Season-based tier adjustments
   - Account-specific discounts
   - Volume-cumulative discounts across orders

4. **Inventory Management**
   - Wholesale inventory separate from retail
   - Allocation percentage controls
   - Bulk reserve system

5. **Automated Workflows**
   - Wholesale order approval automation
   - Scheduled reorder support
   - Wholesale catalog exports

## Best Practices

### Creating Packages
1. Ensure items have consistent themes
2. Set discounts between 8-25% for profitability
3. Use clear, marketing-focused names
4. Include detailed descriptions
5. Test pricing calculations before activation

### Pricing Tiers
1. Maintain at least 5% difference between tiers
2. MOQ should align with shipping economics
3. Consider manufacturing batch sizes
4. Review tier effectiveness quarterly

### Customer Communication
1. Display tier requirements prominently
2. Show savings calculations automatically
3. Highlight limited-time bundle offers
4. Provide wholesale account benefits summary

## Troubleshooting

### Prices Not Updating
- Verify package `updatedAt` timestamp
- Check WholesaleProvider context wrapping
- Clear browser cache

### Tiers Not Applied
- Verify `pricingTiers` array is properly populated
- Check quantity is within tier `minQuantity` and `maxQuantity`
- Ensure product has `isWholesaleEnabled: true`

### Bundle Savings Wrong
- Recalculate using `calculatePackageSavings()`
- Verify all item prices are current
- Check `basePrice` vs. `discountedPrice` values
