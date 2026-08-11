import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Building2,
  Megaphone,
  Scissors,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Boxes, label: 'Packages', href: '/admin/packages' },
  { icon: Truck, label: 'Suppliers', href: '/admin/suppliers' },
  { icon: Megaphone, label: 'Ads', href: '/admin/ads' },
  { icon: Scissors, label: 'Services', href: '/admin/services' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Building2, label: 'Wholesale', href: '/admin/wholesale' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function isAdminNavActive(pathname: string, path: string): boolean {
  if (path === '/admin/wholesale') {
    return (
      pathname.startsWith('/admin/wholesale') &&
      !pathname.startsWith('/admin/wholesale/packages')
    );
  }
  if (path === '/admin') return pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}
