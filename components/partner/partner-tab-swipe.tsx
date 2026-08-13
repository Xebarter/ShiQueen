'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPartnerTabIndex,
  isPartnerNavActive,
  PARTNER_TAB_SLIDE_KEY,
  type PartnerTabItem,
} from '@/components/partner/partner-nav';

const MOBILE_MQ = '(max-width: 767px)';
const AXIS_LOCK_PX = 10;
const COMMIT_PX = 56;
const COMMIT_VELOCITY = 0.35;
const EXIT_MS = 200;

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]')
  );
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_MQ).matches;
}

export function usePartnerTabSwipe({
  tabs,
  homeHref,
  pathname,
  navOpen,
  setNavOpen,
  paneRef,
}: {
  tabs: readonly PartnerTabItem[];
  homeHref: string;
  pathname: string;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  paneRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const axis = useRef<'undecided' | 'x' | 'y'>('undecided');
  const dragging = useRef(false);
  const busy = useRef(false);
  const navOpenRef = useRef(navOpen);
  const pathnameRef = useRef(pathname);

  navOpenRef.current = navOpen;
  pathnameRef.current = pathname;

  const applyDrag = useCallback(
    (dx: number) => {
      const pane = paneRef.current;
      if (!pane) return;
      pane.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : '';
    },
    [paneRef]
  );

  const goToIndex = useCallback(
    async (nextIndex: number, direction: 1 | -1) => {
      const tab = tabs[nextIndex];
      if (!tab || busy.current) return;
      busy.current = true;

      if (tab.action === 'more') {
        applyDrag(0);
        setNavOpen(true);
        busy.current = false;
        return;
      }

      setNavOpen(false);

      if (!tab.href) {
        busy.current = false;
        return;
      }

      if (isPartnerNavActive(pathnameRef.current, tab.href, homeHref)) {
        applyDrag(0);
        busy.current = false;
        return;
      }

      const pane = paneRef.current;
      if (pane && !prefersReducedMotion()) {
        pane.style.transform = '';
        pane.classList.add(direction === 1 ? 'partner-tab-exit-next' : 'partner-tab-exit-prev');
        await new Promise((resolve) => window.setTimeout(resolve, EXIT_MS));
      } else {
        applyDrag(0);
      }

      try {
        sessionStorage.setItem(PARTNER_TAB_SLIDE_KEY, direction === 1 ? 'next' : 'prev');
      } catch {
        /* ignore quota / private mode */
      }
      router.push(tab.href);
    },
    [applyDrag, homeHref, paneRef, router, setNavOpen, tabs]
  );

  const suppressClick = useCallback(() => {
    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', block, true);
    window.setTimeout(() => document.removeEventListener('click', block, true), 400);
  }, []);

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (busy.current || !isMobileViewport() || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
      axis.current = 'undecided';
      dragging.current = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!start.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      if (axis.current === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis.current !== 'x') return;

      const index = getPartnerTabIndex(
        pathnameRef.current,
        tabs,
        homeHref,
        navOpenRef.current
      );
      if (index < 0) return;

      event.preventDefault();
      dragging.current = true;
      if (navOpenRef.current) return;
      const atStart = index === 0 && dx > 0;
      const atEnd = index === tabs.length - 1 && dx < 0;
      applyDrag(atStart || atEnd ? dx * 0.28 : dx);
    };

    const onEnd = (event: TouchEvent) => {
      const origin = start.current;
      start.current = null;
      if (!origin || axis.current !== 'x') {
        axis.current = 'undecided';
        applyDrag(0);
        return;
      }
      axis.current = 'undecided';

      const touch = event.changedTouches[0];
      const dx = touch.clientX - origin.x;
      const dt = Math.max(1, Date.now() - origin.t);
      const velocity = dx / dt;
      const index = getPartnerTabIndex(
        pathnameRef.current,
        tabs,
        homeHref,
        navOpenRef.current
      );

      applyDrag(0);

      if (index < 0) return;

      const committed =
        Math.abs(dx) >= COMMIT_PX || Math.abs(velocity) >= COMMIT_VELOCITY;
      if (!committed) return;

      const direction: 1 | -1 = dx < 0 ? 1 : -1;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= tabs.length) return;

      if (dragging.current) suppressClick();
      void goToIndex(nextIndex, direction);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [applyDrag, goToIndex, homeHref, suppressClick, tabs]);
}

export function readPartnerTabSlideIn(): 'next' | 'prev' | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(PARTNER_TAB_SLIDE_KEY);
    if (value === 'next' || value === 'prev') {
      sessionStorage.removeItem(PARTNER_TAB_SLIDE_KEY);
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}
