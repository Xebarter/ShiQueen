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
const COMMIT_RATIO = 0.22;
const COMMIT_PX_MIN = 56;
const COMMIT_VELOCITY = 0.45;
const EDGE_RESISTANCE = 0.28;
const EXIT_MS = 280;
const SNAP_MS = 320;
/** iOS-like interactive spring */
const SWIPE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [data-no-tab-swipe], .touch-pan-x'
    )
  );
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function clearPaneMotion(pane: HTMLElement) {
  pane.style.transition = '';
  pane.style.transform = '';
  pane.style.opacity = '';
  pane.classList.remove(
    'partner-tab-exit-next',
    'partner-tab-exit-prev',
    'partner-tab-enter-next',
    'partner-tab-enter-prev'
  );
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
  const velocitySample = useRef<{ x: number; t: number } | null>(null);
  const axis = useRef<'undecided' | 'x' | 'y'>('undecided');
  const dragging = useRef(false);
  const dragX = useRef(0);
  const busy = useRef(false);
  const navOpenRef = useRef(navOpen);
  const pathnameRef = useRef(pathname);
  const tabsRef = useRef(tabs);
  const homeHrefRef = useRef(homeHref);

  navOpenRef.current = navOpen;
  pathnameRef.current = pathname;
  tabsRef.current = tabs;
  homeHrefRef.current = homeHref;

  useEffect(() => {
    busy.current = false;
    const pane = paneRef.current;
    if (pane) {
      pane.style.transition = '';
      pane.style.transform = '';
      pane.style.opacity = '';
      pane.classList.remove('partner-tab-exit-next', 'partner-tab-exit-prev');
    }
  }, [pathname, paneRef]);

  useEffect(() => {
    if (!isMobileViewport()) return;
    for (const tab of tabs) {
      if (tab.href) router.prefetch(tab.href);
    }
  }, [router, tabs]);

  const applyDrag = useCallback(
    (dx: number, { animate = false, opacity }: { animate?: boolean; opacity?: number } = {}) => {
      const pane = paneRef.current;
      if (!pane) return;
      dragX.current = dx;
      pane.style.transition = animate ? `transform ${SNAP_MS}ms ${SWIPE_EASE}, opacity ${SNAP_MS}ms ${SWIPE_EASE}` : 'none';
      pane.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : 'translate3d(0, 0, 0)';
      if (opacity !== undefined) {
        pane.style.opacity = String(opacity);
      } else if (!dx && animate) {
        pane.style.opacity = '1';
      }
      if (animate) {
        window.setTimeout(() => {
          const current = paneRef.current;
          if (!current) return;
          if (dragX.current === 0) {
            current.style.transition = '';
            current.style.transform = '';
            current.style.opacity = '';
          }
        }, SNAP_MS + 20);
      }
    },
    [paneRef]
  );

  const finishExitThenNavigate = useCallback(
    async (href: string, direction: 1 | -1, fromDx: number) => {
      const pane = paneRef.current;
      const width = pane?.getBoundingClientRect().width || window.innerWidth;
      const targetX = direction === 1 ? -width : width;

      if (pane && !prefersReducedMotion()) {
        pane.classList.remove(
          'partner-tab-exit-next',
          'partner-tab-exit-prev',
          'partner-tab-enter-next',
          'partner-tab-enter-prev'
        );
        pane.style.transition = `transform ${EXIT_MS}ms ${SWIPE_EASE}`;
        pane.style.transform = `translate3d(${fromDx || targetX * 0.08}px, 0, 0)`;
        // Force style flush so the exit always animates from the finger position.
        void pane.offsetWidth;
        pane.style.transform = `translate3d(${targetX}px, 0, 0)`;
        pane.style.opacity = '1';
        await new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            pane.removeEventListener('transitionend', onEnd);
            resolve();
          };
          const onEnd = (event: TransitionEvent) => {
            if (event.target === pane && event.propertyName === 'transform') finish();
          };
          pane.addEventListener('transitionend', onEnd);
          window.setTimeout(finish, EXIT_MS + 40);
        });
      } else {
        applyDrag(0, { animate: true, opacity: 1 });
      }

      try {
        sessionStorage.setItem(PARTNER_TAB_SLIDE_KEY, direction === 1 ? 'next' : 'prev');
      } catch {
        /* ignore quota / private mode */
      }
      router.push(href);
    },
    [applyDrag, paneRef, router]
  );

  const goToIndex = useCallback(
    async (nextIndex: number, direction: 1 | -1, fromDx = 0) => {
      const tab = tabsRef.current[nextIndex];
      if (!tab || busy.current) return;
      busy.current = true;

      if (tab.action === 'more') {
        applyDrag(0, { animate: true, opacity: 1 });
        setNavOpen(true);
        busy.current = false;
        return;
      }

      setNavOpen(false);

      if (!tab.href) {
        busy.current = false;
        return;
      }

      if (isPartnerNavActive(pathnameRef.current, tab.href, homeHrefRef.current)) {
        applyDrag(0, { animate: true, opacity: 1 });
        busy.current = false;
        return;
      }

      try {
        await finishExitThenNavigate(tab.href, direction, fromDx);
      } catch {
        if (paneRef.current) clearPaneMotion(paneRef.current);
        busy.current = false;
      }
    },
    [applyDrag, finishExitThenNavigate, paneRef, setNavOpen]
  );

  const suppressClick = useCallback(() => {
    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', block, true);
    window.setTimeout(() => document.removeEventListener('click', block, true), 450);
  }, []);

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (busy.current || !isMobileViewport() || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      const now = performance.now();
      start.current = { x: touch.clientX, y: touch.clientY, t: now };
      velocitySample.current = { x: touch.clientX, t: now };
      axis.current = 'undecided';
      dragging.current = false;
      dragX.current = 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!start.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const now = performance.now();
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      // Keep a slightly stale sample so fling velocity stays meaningful.
      if (!velocitySample.current || now - velocitySample.current.t >= 24) {
        velocitySample.current = { x: touch.clientX, t: now };
      }

      if (axis.current === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        axis.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
        if (axis.current === 'x') {
          const pane = paneRef.current;
          if (pane) {
            pane.style.transition = 'none';
            pane.style.willChange = 'transform';
          }
        }
      }
      if (axis.current !== 'x') return;

      const index = getPartnerTabIndex(
        pathnameRef.current,
        tabsRef.current,
        homeHrefRef.current,
        navOpenRef.current
      );
      if (index < 0) return;

      event.preventDefault();
      dragging.current = true;
      if (navOpenRef.current) return;

      const atStart = index === 0 && dx > 0;
      const atEnd = index === tabsRef.current.length - 1 && dx < 0;
      const resisted = atStart || atEnd ? dx * EDGE_RESISTANCE : dx;
      const width = paneRef.current?.getBoundingClientRect().width || window.innerWidth;
      const progress = Math.min(1, Math.abs(resisted) / width);
      applyDrag(resisted, { opacity: 1 - progress * 0.08 });
    };

    const onEnd = (event: TouchEvent) => {
      const origin = start.current;
      const sample = velocitySample.current;
      start.current = null;
      velocitySample.current = null;

      const pane = paneRef.current;
      if (pane) pane.style.willChange = '';

      if (!origin || axis.current !== 'x') {
        axis.current = 'undecided';
        if (dragging.current) applyDrag(0, { animate: true, opacity: 1 });
        dragging.current = false;
        return;
      }
      axis.current = 'undecided';

      const touch = event.changedTouches[0];
      const dx = touch.clientX - origin.x;
      const now = performance.now();
      const sampleDt = Math.max(16, now - (sample?.t ?? origin.t));
      const sampleDx = touch.clientX - (sample?.x ?? origin.x);
      const velocity = sampleDx / sampleDt;

      const index = getPartnerTabIndex(
        pathnameRef.current,
        tabsRef.current,
        homeHrefRef.current,
        navOpenRef.current
      );

      if (index < 0) {
        applyDrag(0, { animate: true, opacity: 1 });
        dragging.current = false;
        return;
      }

      const width = pane?.getBoundingClientRect().width || window.innerWidth;
      const commitDistance = Math.max(COMMIT_PX_MIN, width * COMMIT_RATIO);
      const committed =
        Math.abs(dx) >= commitDistance || Math.abs(velocity) >= COMMIT_VELOCITY;

      if (!committed) {
        applyDrag(0, { animate: true, opacity: 1 });
        dragging.current = false;
        return;
      }

      const direction: 1 | -1 = dx < 0 || (Math.abs(dx) < 8 && velocity < 0) ? 1 : -1;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= tabsRef.current.length) {
        applyDrag(0, { animate: true, opacity: 1 });
        dragging.current = false;
        return;
      }

      if (dragging.current) suppressClick();
      dragging.current = false;
      void goToIndex(nextIndex, direction, dragX.current || dx);
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
  }, [applyDrag, goToIndex, paneRef, suppressClick]);
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

export function writePartnerTabSlide(direction: 'next' | 'prev') {
  try {
    sessionStorage.setItem(PARTNER_TAB_SLIDE_KEY, direction);
  } catch {
    /* ignore */
  }
}
