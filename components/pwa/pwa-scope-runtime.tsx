'use client';

import { useEffect, useRef, type MouseEventHandler, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isStandaloneDisplay } from '@/lib/pwa/install';
import {
  getPartnerPwaHome,
  isPathInPwaScope,
  markPwaSessionLaunched,
  openInSystemBrowser,
  resolveStandalonePartnerApp,
  toAbsoluteSameOriginUrl,
  wasPwaSessionLaunched,
} from '@/lib/pwa/scope';

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function PwaScopeRuntime() {
  const pathname = usePathname();
  const router = useRouter();
  const bouncedHref = useRef<string | null>(null);

  useEffect(() => {
    if (!isStandaloneDisplay()) return;

    const app = resolveStandalonePartnerApp(pathname);
    if (!app) return;

    if (!wasPwaSessionLaunched()) {
      markPwaSessionLaunched();
      const home = getPartnerPwaHome(app);
      if (pathname !== home) {
        router.replace(home);
        return;
      }
    }

    if (isPathInPwaScope(app, pathname)) return;

    const href = window.location.href;
    if (bouncedHref.current !== href) {
      bouncedHref.current = href;
      openInSystemBrowser(href);
    }
    router.replace(getPartnerPwaHome(app));
  }, [pathname, router]);

  useEffect(() => {
    if (!isStandaloneDisplay()) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const app = resolveStandalonePartnerApp(window.location.pathname);
      if (!app) return;

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      const sameOrigin = url.origin === window.location.origin;
      const inScope = sameOrigin && isPathInPwaScope(app, url.pathname);
      if (inScope) return;

      event.preventDefault();
      event.stopPropagation();
      openInSystemBrowser(url.href);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}

export function PwaExternalLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!isStandaloneDisplay()) return;
        event.preventDefault();
        const url = toAbsoluteSameOriginUrl(href);
        openInSystemBrowser(url?.href ?? href);
      }}
    >
      {children}
    </a>
  );
}
