import { BulkOrdersPage } from '@/components/wholesale/bulk-orders-page';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata = PAGE_SEO.wholesale;

export default function WholesalePage() {
  return <BulkOrdersPage />;
}
