import type { ServiceProvider } from '@/lib/types/services';
import { canListCatalog } from '@/lib/partner-status';

export { canListCatalog };

/** Storefront may show this provider and their listings. */
export function isProviderPubliclyVisible(
  provider:
    | Pick<ServiceProvider, 'approvalStatus' | 'isActive'>
    | null
    | undefined
): boolean {
  if (!provider) return false;
  return canListCatalog(provider.approvalStatus, provider.isActive);
}
