import { Suspense } from 'react';
import { ServicesPage } from '@/components/services/services-page';

export default function ServicesRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading services...</p>
        </main>
      }
    >
      <ServicesPage />
    </Suspense>
  );
}
