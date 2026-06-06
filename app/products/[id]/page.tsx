'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Reviews } from '@/components/reviews';
import { PricingTiers } from '@/components/pricing-tiers';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import { createDefaultPricingTiers, formatUGX } from '@/lib/wholesale-data';
import toast from 'react-hot-toast';
import { Heart, Share2, ArrowLeft, Star, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ProductImage, isRemoteProductImage } from '@/components/product-image';

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const { getProductById, loading } = useProducts();
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

    try {
      const key = 'recently_viewed';
      const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [product.id, ...stored.filter((pid) => pid !== product.id)].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [product]);

  if (loading) {
    return (
      <main>
        <Header />
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <Header />
        <section className="py-20 text-center">
          <h1 className="text-3xl font-light mb-4">Product Not Found</h1>
          <Link href="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const size = selectedSize || product.sizes[0] || 'One Size';
  const color = selectedColor || product.colors[0] || 'Default';

  const handleAddToCart = () => {
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
  };

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

  return (
    <main>
      <Header />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="relative bg-secondary rounded-lg aspect-square mb-4 h-96 overflow-hidden">
                {activeImage ? (
                  <Image src={activeImage} alt={product.name} fill className="object-cover" priority />
                ) : (
                  <ProductImage product={product} className="absolute inset-0" priority />
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedImage(url)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        activeImage === url ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl font-light tracking-tight mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating)
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-semibold">{formatUGX(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatUGX(product.originalPrice)}
                    </span>
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              <p className="text-muted-foreground mb-8">{product.description}</p>

              {product.isWholesaleEnabled && (
                <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-primary mb-4">Wholesale Pricing Available</h3>
                  <PricingTiers tiers={wholesaleTiers} basePrice={product.price} />
                  <Link href="/wholesale/bulk-orders">
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      Place Bulk Order
                    </Button>
                  </Link>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Size: <span className="text-primary">{size}</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-lg border transition ${
                          size === s
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">
                    Color: <span className="text-primary">{color}</span>
                  </label>
                  <div className="flex gap-3">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-10 h-10 rounded-full border-2 transition ${
                          color === c ? 'border-primary' : 'border-border'
                        }`}
                        title={c}
                        style={{ backgroundColor: c.toLowerCase() }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Quantity</label>
                <div className="flex items-center gap-3 w-fit border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="gap-2"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-accent' : ''}`} />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              <div className="border-t border-border pt-8">
                <h3 className="font-semibold text-lg mb-4">Product Details</h3>
                <ul className="space-y-3">
                  {product.details.map((detail, i) => (
                    <li key={i} className="flex gap-3 text-muted-foreground">
                      <span className="text-primary">•</span>
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

      <Footer />
    </main>
  );
}
