'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgeCheck,
  Car,
  Clock,
  Loader2,
  MapPin,
  Star,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ContactActions } from '@/components/services/contact-actions';
import { ServiceBookingSheet } from '@/components/services/service-booking-sheet';
import { isRemoteProductImage } from '@/components/product-image';
import { useServices } from '@/lib/services-context';
import { incrementServiceViewCount } from '@/lib/firebase/service-listings';
import { getProviderById, resolveListingImage } from '@/lib/services-utils';
import { buildTelLink, buildWhatsAppLink } from '@/lib/phone-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { useSmartBack } from '@/lib/hooks/use-smart-back';

interface ServiceDetailPageProps {
  slug: string;
}

export function ServiceDetailPage({ slug }: ServiceDetailPageProps) {
  const { activeListings, activeProviders, activeCategories, reviews, loading } = useServices();
  const [bookingOpen, setBookingOpen] = useState(false);

  const listing = activeListings.find((l) => l.slug === slug);
  const provider = listing ? getProviderById(activeProviders, listing.providerId) : undefined;
  const category = listing ? activeCategories.find((c) => c.id === listing.categoryId) : undefined;
  const goBack = useSmartBack(category ? `/services/category/${category.id}` : '/services');
  const serviceReviews = listing
    ? reviews.filter((r) => r.serviceId === listing.id && r.isVisible)
    : [];

  useEffect(() => {
    if (listing?.id) {
      incrementServiceViewCount(listing.id);
    }
  }, [listing?.id]);

  const heroImage = listing ? resolveListingImage(listing) : null;
  const gallery = listing
    ? [...listing.galleryImages, ...(provider?.portfolioImages ?? [])].filter(isRemoteProductImage)
    : [];

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!listing || !provider) {
    return (
      <main>
        <Header />
        <div className="py-20 text-center">
          <h1 className="text-2xl font-light">Service not found</h1>
          <Link href="/services" className="mt-4 inline-block text-primary hover:underline">
            Browse all services
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-28 md:pb-0">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {category?.name ?? 'Services'}
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15">
              {heroImage ? (
                <Image src={heroImage} alt={listing.name} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">✨</div>
              )}
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              {category && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {category.name}
                </span>
              )}
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{listing.serviceType}</span>
              {listing.supportsMobile && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Car className="h-3 w-3" />
                  Home service
                </span>
              )}
            </div>

            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">{listing.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {listing.rating.toFixed(1)} ({listing.reviewCount} reviews)
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {listing.durationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </span>
            </div>

            <p className="mt-6 text-lg font-bold text-primary">
              From {formatUGX(listing.basePrice)}
              {provider.mobileServiceEnabled && provider.travelFee > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (+{formatUGX(provider.travelFee)} home visit)
                </span>
              )}
            </p>

            <div className="mt-8">
              <h2 className="text-lg font-semibold">About this service</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{listing.description}</p>
            </div>

            {listing.benefits.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold">Benefits</h2>
                <ul className="mt-2 space-y-1">
                  {listing.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Gallery</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 6).map((src, i) => (
                    <div key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-xl">
                      <Image src={src} alt="" fill className="object-cover" sizes="200px" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {serviceReviews.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Reviews</h2>
                <ul className="mt-4 space-y-4">
                  {serviceReviews.slice(0, 5).map((r) => (
                    <li key={r.id} className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.customerName}</span>
                        <span className="text-amber-600">★ {r.rating}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
                  {isRemoteProductImage(provider.profileImage) ? (
                    <Image src={provider.profileImage} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">👩‍💼</div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{provider.businessName}</p>
                  <p className="text-sm text-muted-foreground">{provider.name}</p>
                </div>
              </div>
              {provider.isVerified && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified provider
                </span>
              )}
              <p className="mt-3 text-sm text-muted-foreground">{provider.bio}</p>
              <p className="mt-2 text-sm">
                <span className="font-medium">{provider.experienceYears}+ years</span>
                {' · '}
                {provider.completedJobs} jobs completed
              </p>
              <div className="mt-6">
                <ContactActions
                  phone={provider.phone}
                  whatsapp={provider.whatsapp}
                  serviceName={listing.name}
                  onBook={() => setBookingOpen(true)}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile provider card */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 lg:hidden">
          <p className="font-semibold">{provider.businessName}</p>
          <p className="text-sm text-muted-foreground">{provider.bio}</p>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-4 backdrop-blur-md lg:hidden">
        <div className="flex gap-2">
          <a href={buildTelLink(provider.phone)} className="flex-1">
            <Button variant="outline" className="h-12 w-full rounded-xl" type="button">
              Call
            </Button>
          </a>
          <a
            href={buildWhatsAppLink(provider.whatsapp, `Hi, I'm interested in ${listing.name} on SheQueen.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="h-12 w-full rounded-xl border-emerald-500/30 text-emerald-700">
              WhatsApp
            </Button>
          </a>
          <Button className="h-12 flex-[1.2] rounded-xl font-semibold" onClick={() => setBookingOpen(true)}>
            Book &amp; pay
          </Button>
        </div>
      </div>

      <Footer />

      <ServiceBookingSheet
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        listing={listing}
        provider={provider}
      />
    </main>
  );
}
