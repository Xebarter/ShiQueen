import {
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
} from 'lucide-react';

export type AccountSection = 'overview' | 'orders' | 'wishlist' | 'settings';

export const ACCOUNT_SECTIONS: {
  id: AccountSection;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Account snapshot and quick links',
    icon: LayoutDashboard,
  },
  {
    id: 'orders',
    label: 'Orders',
    description: 'Order history and delivery details',
    icon: ShoppingBag,
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    description: 'Pieces you have saved for later',
    icon: Heart,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Profile, address & security',
    icon: Settings,
  },
];

export const ACCOUNT_BACK_LINK = {
  id: 'home',
  label: 'Back to shop',
  href: '/',
  icon: Home,
} as const;

export const ACCOUNT_LOGOUT_LINK = {
  id: 'logout',
  label: 'Sign out',
  icon: LogOut,
} as const;

export const ACCOUNT_FOOTER_LINKS = [ACCOUNT_BACK_LINK, ACCOUNT_LOGOUT_LINK] as const;

export function parseAccountSectionHash(hash: string): AccountSection {
  const value = hash.replace('#', '');
  if (value === 'orders' || value === 'wishlist' || value === 'settings') return value;
  return 'overview';
}

export function getAccountSectionMeta(section: AccountSection) {
  return ACCOUNT_SECTIONS.find((item) => item.id === section) ?? ACCOUNT_SECTIONS[0];
}
