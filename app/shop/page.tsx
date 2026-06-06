import { Suspense } from 'react';
import { ShopPage } from '@/components/shop/shop-page';

export default function Shop() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading shop...</p>
        </main>
      }
    >
      <ShopPage />
    </Suspense>
  );
}
