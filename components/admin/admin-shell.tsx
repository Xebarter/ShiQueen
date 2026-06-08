'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type AdminShellContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

export function AdminShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  return (
    <AdminShellContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (!context) {
    throw new Error('useAdminShell must be used within AdminShellProvider');
  }
  return context;
}

const PAGE_TITLES: { match: string; title: string; exact?: boolean }[] = [
  { match: '/admin', title: 'Dashboard', exact: true },
  { match: '/admin/products/new', title: 'New Product' },
  { match: '/admin/products', title: 'Products' },
  { match: '/admin/ads/new', title: 'New Ad' },
  { match: '/admin/ads', title: 'Ads' },
  { match: '/admin/orders', title: 'Orders' },
  { match: '/admin/customers', title: 'Customers' },
  { match: '/admin/wholesale', title: 'Wholesale' },
  { match: '/admin/analytics', title: 'Analytics' },
  { match: '/admin/settings', title: 'Settings' },
];

export function getAdminPageTitle(pathname: string): string {
  for (const entry of PAGE_TITLES) {
    if (entry.exact ? pathname === entry.match : pathname.startsWith(entry.match)) {
      if (pathname.includes('/edit')) return 'Edit Product';
      return entry.title;
    }
  }
  return 'Admin';
}
