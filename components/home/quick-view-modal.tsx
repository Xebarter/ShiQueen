'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Star } from 'lucide-react';
import { Product } from '@/lib/types/database';
import { useCart } from '@/lib/cart-context';
import { formatUGX } from '@/lib/wholesale-data';
import { getDiscountPercent } from '@/lib/home-merchandising';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/product-image';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();

  if (!product) return null;

  const discount = getDiscountPercent(product);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    toast.success('Added to cart');
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-background rounded-2xl shadow-2xl z-[70] overflow-hidden border border-border"
          >
            <div className="relative h-48 md:h-56 overflow-hidden">
              <ProductImage
                product={product}
                className="absolute inset-0"
                sizes="512px"
              />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {discount > 0 && (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground z-10">
                  -{discount}%
                </span>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.category}</p>
                <h3 className="text-xl font-semibold mt-1">{product.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {product.rating} · {product.reviews} reviews
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatUGX(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm line-through text-muted-foreground">
                    {formatUGX(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 gap-2" onClick={handleAdd}>
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </Button>
                <Link href={`/products/${product.id}`} onClick={onClose}>
                  <Button variant="outline">Full Details</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
