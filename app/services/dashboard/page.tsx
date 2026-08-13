import { redirect } from 'next/navigation';
import { PROVIDER_HOME_HREF } from '@/lib/pwa/paths';

export default function ProviderDashboardRedirect() {
  redirect(PROVIDER_HOME_HREF);
}
