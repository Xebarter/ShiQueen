import { BulkOrdersPage } from '@/components/wholesale/bulk-orders-page';
import { NoscriptPageSummary } from '@/components/seo/noscript-page-summary';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata = PAGE_SEO.wholesale;

export default function WholesalePage() {
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
