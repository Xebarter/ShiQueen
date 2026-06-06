'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { useMarketingAds } from '@/lib/marketing-ads-context';
import { deleteMarketingAd, isMarketingAdLive } from '@/lib/firebase/marketing-ads';
import { isRemoteProductImage } from '@/components/product-image';
import { Plus, Edit, Trash2, Search, Loader2, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEMENT_LABELS: Record<string, string> = {
  'home-hero': 'Home Hero',
  'shop-hero': 'Shop Hero',
};

export default function AdminAdsPage() {
  const { products } = useProducts();
  const { ads, loading } = useMarketingAds();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAds = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return ads;
    return ads.filter((ad) => {
      const product = products.find((item) => item.id === ad.productId);
      return (
        ad.headline.toLowerCase().includes(term) ||
        ad.placement.includes(term) ||
        product?.name.toLowerCase().includes(term)
      );
    });
  }, [ads, products, searchTerm]);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await deleteMarketingAd(id);
      toast.success('Ad deleted');
    } catch {
      toast.error('Failed to delete ad');
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ads</h1>
            <p className="mt-1 text-muted-foreground">
              Manage hero marketing banners and featured product promotions
            </p>
          </div>
          <Link href="/admin/ads/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ad
            </Button>
          </Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ads or products…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Marketing Campaigns
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading ads…' : `${filteredAds.length} campaign${filteredAds.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No ads yet. Create your first hero banner.</p>
              <Link href="/admin/ads/new" className="mt-4 inline-block">
                <Button>Create Ad</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAds.map((ad) => {
                const product = products.find((item) => item.id === ad.productId);
                const live = isMarketingAdLive(ad);
                const title = ad.headline || product?.name || 'Untitled ad';

                return (
                  <div
                    key={ad.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="relative aspect-[16/10] bg-secondary">
                      {isRemoteProductImage(ad.bannerImage) ? (
                        <Image src={ad.bannerImage} alt={title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          No banner
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex gap-2">
                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                          {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${
                            live
                              ? 'bg-emerald-600/90 text-white'
                              : 'bg-black/60 text-white/80'
                          }`}
                        >
                          {live ? 'Live' : ad.isActive ? 'Scheduled' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">
                          {product?.name ?? 'Product missing'} · Priority {ad.priority}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/ads/${ad.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(ad.id, title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
