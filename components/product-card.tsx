'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  rating,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${id}`}>
      <div className="group cursor-pointer">
        {/* Image Container */}
        <div className="relative mb-4 bg-secondary rounded-lg overflow-hidden h-64">
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
            {/* Placeholder for product image */}
            <div className="text-muted-foreground text-sm">Product Image</div>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-3 right-3 p-2 rounded-lg bg-background/80 hover:bg-background transition"
          >
            <Heart
              className={`w-5 h-5 ${
                isWishlisted ? 'fill-accent text-accent' : 'text-muted-foreground'
              }`}
            />
          </button>

          {/* Sale Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
              {discount}% OFF
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Product Info */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {category}
          </p>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition">
            {name}
          </h3>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < Math.round(rating) ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({rating})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">USh {price.toLocaleString('en-UG', { maximumFractionDigits: 0 })}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                USh {originalPrice.toLocaleString('en-UG', { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
