'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, Zap, Clock, Flame } from 'lucide-react';
import { Product } from '@/lib/types/database';
import { useCart } from '@/lib/cart-context';
import {
  getDiscountPercent,
  isSellingFast,
  isNewArrival,
  toggleStoredWishlist,
} from '@/lib/home-merchandising';
import { formatUGX } from '@/lib/wholesale-data';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/product-image';
import toast from 'react-hot-toast';

export type ProductBadge = 'sale' | 'new' | 'selling-fast' | 'limited' | 'trending';

interface HomeProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'editorial';
  badges?: ProductBadge[];
  index?: number;
  onQuickView?: (product: Product) => void;
  wishlistIds?: string[];
  onWishlistChange?: (ids: string[]) => void;
}

function getAutoBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (getDiscountPercent(product) > 0) badges.push('sale');
  if (isNewArrival(product)) badges.push('new');
  if (isSellingFast(product)) badges.push('selling-fast');
  if (product.stock > 0 && product.stock <= 10) badges.push('limited');
  return badges;
}

const BADGE_CONFIG: Record<ProductBadge, { label: string; className: string; icon?: typeof Zap }> = {
  sale: { label: 'Sale', className: 'bg-accent text-accent-foreground' },
  new: { label: 'New', className: 'bg-primary text-primary-foreground' },
  'selling-fast': { label: 'Selling fast', className: 'bg-accent/90 text-accent-foreground', icon: Flame },
  limited: { label: 'Only a few left', className: 'bg-primary/85 text-primary-foreground', icon: Clock },
  trending: { label: 'Trending', className: 'bg-secondary text-secondary-foreground ring-1 ring-primary/15', icon: Zap },
};

export function HomeProductCard({
  product,
  variant = 'default',
  badges,
  index = 0,
  onQuickView,
  wishlistIds = [],
  onWishlistChange,
}: HomeProductCardProps) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const isWishlisted = wishlistIds.includes(product.id);
  const discount = getDiscountPercent(product);
  const displayBadges = badges ?? getAutoBadges(product);
  const imageHeight = variant === 'compact' ? 'h-44' : variant === 'editorial' ? 'h-80' : 'h-56';

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
      toast.success(`${product.name} added to cart`);
    },
    [addItem, product]
  );

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleStoredWishlist(product.id);
    onWishlistChange?.(next);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.id}`} className="block">
        <div
          className={`relative ${imageHeight} overflow-hidden rounded-2xl bg-secondary shadow-sm ring-1 ring-border/50 transition-shadow duration-300 group-hover:shadow-xl`}
        >
          <ProductImage
            product={product}
            className="absolute inset-0"
            imageClassName={`transition-transform duration-500 ${hovered ? 'scale-105' : ''}`}
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
            {displayBadges.slice(0, 2).map((badge) => {
              const config = BADGE_CONFIG[badge];
              const Icon = config.icon;
              return (
                <span
                  key={badge}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {config.label}
                </span>
              );
            })}
            {discount > 0 && !displayBadges.includes('sale') && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-foreground">
                -{discount}%
              </span>
            )}
          </div>

          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/70 backdrop-blur-md border border-border/50 hover:bg-background transition z-10"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
            />
          </button>

          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
            className="absolute bottom-3 inset-x-3 flex gap-2 z-10"
          >
            <Button
              size="sm"
              className="flex-1 h-9 text-xs backdrop-blur-md bg-primary/90 hover:bg-primary shadow-lg"
              onClick={handleQuickAdd}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
              Quick Add
            </Button>
            {onQuickView && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 backdrop-blur-md bg-background/80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        </div>

        <div className={`pt-3 ${variant === 'compact' ? 'space-y-0.5' : 'space-y-1'}`}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.category}</p>
          <h3 className={`font-medium leading-snug group-hover:text-primary transition line-clamp-2 ${variant === 'editorial' ? 'text-lg' : 'text-sm'}`}>
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-accent text-accent" />
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="font-semibold text-sm">{formatUGX(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatUGX(product.originalPrice)}
              </span>
            )}
          </div>
          {product.stock <= 10 && product.stock > 0 && (
            <p className="text-[10px] text-orange-600 font-medium">Only {product.stock} left in stock</p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export function ProductCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'editorial' }) {
  const imageHeight = variant === 'compact' ? 'h-44' : variant === 'editorial' ? 'h-80' : 'h-56';
  return (
    <div className="animate-pulse">
      <div className={`${imageHeight} rounded-2xl bg-muted`} />
      <div className="pt-3 space-y-2">
        <div className="h-2 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}
