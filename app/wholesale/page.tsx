import { BulkOrdersPage } from '@/components/wholesale/bulk-orders-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { PAGE_SEO } from '@/lib/seo/site';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

export const metadata = PAGE_SEO.wholesale;

export default async function WholesalePage() {
  await assertPublicFeature('wholesale');
  return (
    <>
      <BulkOrdersPage />
      <NoscriptPageSummary
        title="Wholesale Women's Fashion & Beauty Uganda"
        description="ShiQueen wholesale for bulk women's clothing, beauty products, and packages in Uganda. Affordable ladies wholesale from Kampala with delivery."
      />
    </>
  );
}
