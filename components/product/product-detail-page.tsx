'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Heart,
  ArrowLeft,
  Star,
  Loader2,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Reviews } from '@/components/reviews';
import { PricingTiers } from '@/components/pricing-tiers';
import { ProductImage, isRemoteProductImage } from '@/components/product-image';
import { ShareProductButton } from '@/components/shared/share-button';
import { useCart } from '@/lib/cart-context';
import { usePublicProducts } from '@/lib/hooks/use-public-catalog';
import { createDefaultPricingTiers, formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import { shopCategoryPath } from '@/lib/seo/shop-categories';
import { useSmartBack } from '@/lib/hooks/use-smart-back';

function ProductBreadcrumb({ category, name }: { category: string; name: string }) {
  const categoryLabel = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : '';
  return (
    <nav aria-label="Product" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm sm:mb-6">
      <Link href="/" className="text-muted-foreground transition hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      <Link href="/shop" className="text-muted-foreground transition hover:text-foreground">
        Shop
      </Link>
      {categoryLabel ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
          <Link
            href={shopCategoryPath(category)}
            className="text-muted-foreground transition hover:text-foreground"
          >
            {categoryLabel}
          </Link>
        </>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      <span className="line-clamp-1 font-medium text-foreground">{name}</span>
      <span className="sr-only"> · {category}</span>
    </nav>
  );
}

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-primary/40'
      )}
    >
      {children}
    </button>
  );
}

export function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const goBack = useSmartBack('/shop');
  const { getProductById, loading } = usePublicProducts();
  const product = getProductById(id);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!product) return;

    const images = product.images.filter(isRemoteProductImage);
    const primary =
      images[0] ?? (isRemoteProductImage(product.image) ? product.image : '');
    setSelectedImage(primary);
    setSelectedSize(product.sizes[0] ?? '');
    setSelectedColor(product.colors[0] ?? '');

    try {
      const key = 'recently_viewed';
      const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [product.id, ...stored.filter((pid) => pid !== product.id)].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [product]);

  const size = selectedSize || product?.sizes[0] || 'One Size';
  const color = selectedColor || product?.colors[0] || 'Default';

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      size,
      color,
    });
    toast.success(`${product.name} added to cart`);
  }, [addItem, color, product, quantity, size]);

  if (loading) {
    return (
      <main>
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <Header />
        <section className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="mb-3 text-2xl font-light tracking-tight sm:text-3xl">Product not found</h1>
          <p className="mb-8 max-w-sm text-sm text-muted-foreground">
            This item may have been removed or the link is incorrect.
          </p>
          <Link href="/shop">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Button>
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const wholesaleTiers = createDefaultPricingTiers(product.price);

  const galleryImages =
    product.images.filter(isRemoteProductImage).length > 0
      ? product.images.filter(isRemoteProductImage)
      : isRemoteProductImage(product.image)
        ? [product.image]
        : [];

  const activeImage = selectedImage || galleryImages[0] || '';
  const lineTotal = product.price * quantity;

  return (
    <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
      <Header />

      <section className="py-6 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground sm:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <ProductBreadcrumb category={product.category} name={product.name} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Gallery */}
            <div className="min-w-0">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary ring-1 ring-border/40 sm:rounded-2xl">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <ProductImage product={product} className="absolute inset-0" priority />
                )}
                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground sm:left-4 sm:top-4">
                    -{discount}%
                  </span>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div
                  className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide sm:mt-4 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible"
                  role="tablist"
                  aria-label="Product images"
                >
                  {galleryImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      role="tab"
                      aria-selected={activeImage === url}
                      aria-label="View product image"
                      onClick={() => setSelectedImage(url)}
                      className={cn(
                        'relative aspect-square w-[4.5rem] shrink-0 snap-start overflow-hidden rounded-lg border-2 transition sm:w-auto',
                        activeImage === url ? 'border-primary' : 'border-transparent ring-1 ring-border/50'
                      )}
                    >
                      <Image src={url} alt="" fill className="object-cover" sizes="72px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="min-w-0">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm">
                {product.category}
              </p>
              <h1 className="text-2xl font-light leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 sm:mt-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(product.rating)
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2 sm:mt-6">
                <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {formatUGX(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-muted-foreground line-through sm:text-xl">
                      {formatUGX(product.originalPrice)}
                    </span>
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground sm:text-sm">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
                {product.description}
              </p>

              {product.isWholesaleEnabled && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
                  <h3 className="mb-3 text-sm font-semibold text-primary sm:mb-4 sm:text-base">
                    Wholesale pricing available
                  </h3>
                  <PricingTiers tiers={wholesaleTiers} basePrice={product.price} />
                  <Link href="/wholesale" className="mt-4 block">
                    <Button variant="outline" className="w-full" size="sm">
                      Place bulk order
                    </Button>
                  </Link>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div className="mt-6 sm:mt-8">
                  <label className="mb-3 block text-sm font-semibold">
                    Size <span className="font-normal text-muted-foreground">· {size}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <OptionPill
                        key={s}
                        selected={size === s}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s}
                      </OptionPill>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div className="mt-6">
                  <label className="mb-3 block text-sm font-semibold">
                    Color <span className="font-normal text-muted-foreground">· {color}</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        title={c}
                        aria-label={`Color ${c}`}
                        aria-pressed={color === c}
                        className={cn(
                          'h-11 w-11 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          color === c ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        )}
                        style={{ backgroundColor: c.toLowerCase() }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="mb-3 block text-sm font-semibold">Quantity</label>
                <div className="inline-flex items-center rounded-lg border border-border bg-background">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3rem] px-2 text-center text-base font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Desktop / tablet actions */}
              <div className="mt-8 hidden gap-3 sm:flex">
                <Button size="lg" className="min-h-11 flex-1" onClick={handleAddToCart}>
                  Add to cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-11 min-w-11 px-3"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    className={cn('h-5 w-5', isWishlisted && 'fill-current text-accent')}
                  />
                </Button>
                <ShareProductButton
                  product={product}
                  className="min-h-11 min-w-11 rounded-lg"
                />
              </div>

              {/* Mobile secondary actions */}
              <div className="mt-6 flex gap-3 sm:hidden">
                <Button
                  variant="outline"
                  className="min-h-11 flex-1 gap-2"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart
                    className={cn('h-4 w-4', isWishlisted && 'fill-current text-accent')}
                  />
                  Wishlist
                </Button>
                <ShareProductButton
                  product={product}
                  variant="button"
                  size="lg"
                  className="min-h-11 flex-1"
                />
              </div>

              <div className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8">
                <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Product details</h3>
                <ul className="space-y-2.5 sm:space-y-3">
                  {product.details.map((detail, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <Reviews />
        </div>
      </section>

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
        <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{product.name}</p>
            <p className="text-lg font-semibold tabular-nums">{formatUGX(lineTotal)}</p>
          </div>
          <Button size="lg" className="min-h-11 shrink-0 px-6" onClick={handleAddToCart}>
            Add to cart
          </Button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
