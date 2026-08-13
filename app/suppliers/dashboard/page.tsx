import { redirect } from 'next/navigation';
import { SUPPLIER_HOME_HREF } from '@/lib/pwa/paths';

export default function SupplierDashboardRedirect() {
  redirect(SUPPLIER_HOME_HREF);
}
