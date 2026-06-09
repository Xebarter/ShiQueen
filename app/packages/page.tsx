import { Suspense } from 'react';
import { PackagesPage } from '@/components/packages/packages-page';

export default function Packages() {
  return (
    <Suspense fallback={null}>
      <PackagesPage />
    </Suspense>
  );
}
