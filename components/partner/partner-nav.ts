import type { LucideIcon } from 'lucide-react';

export type PartnerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
};

export type PartnerTabItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: 'more';
};

export type PartnerPageTitle = {
  match: string;
  title: string;
  exact?: boolean;
};

export const PARTNER_TAB_SLIDE_KEY = 'shequeen-partner-tab-slide';

/** Nested home routes (e.g. booking detail) stay highlighted on the home tab. */
export function isPartnerNavActive(
  pathname: string,
  href: string,
  homeHref: string
): boolean {
  if (href === homeHref) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPartnerPageTitle(
  pathname: string,
  titles: readonly PartnerPageTitle[]
): string {
  for (const entry of titles) {
    if (entry.exact ? pathname === entry.match : pathname.startsWith(entry.match)) {
      if (pathname.includes('/edit')) {
        if (pathname.includes('/listings')) return 'Edit listing';
        if (pathname.includes('/products')) return 'Edit product';
        if (pathname.includes('/packages')) return 'Edit package';
        return `Edit ${entry.title.toLowerCase()}`;
      }
      if (pathname.endsWith('/new')) {
        if (pathname.includes('/listings')) return 'New listing';
        if (pathname.includes('/products')) return 'New product';
        if (pathname.includes('/packages')) return 'New package';
        return `New ${entry.title.toLowerCase()}`;
      }
      return entry.title;
    }
  }
  return 'Dashboard';
}

/** Index of the footer tab for swipe paging. More is active while the drawer is open. */
export function getPartnerTabIndex(
  pathname: string,
  tabs: readonly PartnerTabItem[],
  homeHref: string,
  navOpen: boolean
): number {
  if (navOpen) {
    const more = tabs.findIndex((tab) => tab.action === 'more');
    return more;
  }
  if (pathname.includes('/edit') || pathname.endsWith('/new')) return -1;
  return tabs.findIndex((tab) => {
    if (!tab.href) return false;
    return isPartnerNavActive(pathname, tab.href, homeHref);
  });
}
