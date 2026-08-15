'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useRouter, type AppRouterInstance } from 'next/navigation';
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
const SLIDE_MS = 320;
/** iOS-like interactive spring */
const SWIPE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const COVER_ID = 'partner-tab-page-cover';

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

function removePartnerTabCover() {
  document.getElementById(COVER_ID)?.remove();
}

/**
 * Keeps the outgoing page painted while the next route mounts, then slides both
 * panes together like a continuous scroll — no empty white frame in between.
 */
function presentPartnerTabCover(pane: HTMLElement, direction: 1 | -1, fromDx = 0) {
  removePartnerTabCover();
  if (prefersReducedMotion()) return false;

  const rect = pane.getBoundingClientRect();
  const width = rect.width || window.innerWidth;
  const targetX = direction === 1 ? -width : width;

  const cover = document.createElement('div');
  cover.id = COVER_ID;
  cover.className = 'partner-tab-page-cover';
  cover.setAttribute('aria-hidden', 'true');
  cover.style.cssText = [
    'position:fixed',
    `top:${rect.top}px`,
    'left:0',
    'right:0',
    `height:${rect.height}px`,
    'z-index:50',
    'overflow:hidden',
    'pointer-events:none',
    'background:var(--background)',
    `transform:translate3d(${fromDx}px,0,0)`,
    'will-change:transform',
  ].join(';');

  const clone = pane.cloneNode(true) as HTMLElement;
  clone.classList.remove(
    'partner-tab-exit-next',
    'partner-tab-exit-prev',
    'partner-tab-enter-next',
    'partner-tab-enter-prev'
  );
  clone.style.cssText = [
    'transform:none',
    'opacity:1',
    'transition:none',
    'animation:none',
    'min-height:100%',
    'background:var(--background)',
  ].join(';');
  cover.appendChild(clone);
  document.body.appendChild(cover);

  const outgoingPane = pane;
  let exited = false;
  const startExit = () => {
    if (exited || !cover.isConnected) return;
    exited = true;

    let incoming: HTMLElement | null = null;
    for (const el of document.querySelectorAll<HTMLElement>('.partner-tab-pane')) {
      if (el === outgoingPane || cover.contains(el)) continue;
      incoming = el;
      break;
    }

    if (incoming) {
      incoming.classList.remove('partner-tab-enter-next', 'partner-tab-enter-prev');
      const startX = fromDx + (direction === 1 ? width : -width);
      incoming.style.transition = 'none';
      incoming.style.animation = 'none';
      incoming.style.transform = `translate3d(${startX}px, 0, 0)`;
      void incoming.offsetWidth;
      incoming.style.transition = `transform ${SLIDE_MS}ms ${SWIPE_EASE}`;
      incoming.style.transform = 'translate3d(0, 0, 0)';
      window.setTimeout(() => {
        if (!incoming?.isConnected) return;
        incoming.style.transition = '';
        incoming.style.transform = '';
        incoming.style.animation = '';
      }, SLIDE_MS + 40);
    }

    cover.style.transition = `transform ${SLIDE_MS}ms ${SWIPE_EASE}`;
    cover.style.transform = `translate3d(${targetX}px, 0, 0)`;
    window.setTimeout(removePartnerTabCover, SLIDE_MS + 60);
  };

  const incomingReady = () => {
    for (const el of document.querySelectorAll<HTMLElement>('.partner-tab-pane')) {
      if (el === outgoingPane || cover.contains(el)) continue;
      return true;
    }
    return false;
  };

  const poll = window.setInterval(() => {
    if (incomingReady()) {
      window.clearInterval(poll);
      startExit();
    }
  }, 16);

  window.setTimeout(() => {
    window.clearInterval(poll);
    startExit();
  }, 220);

  return true;
}

function writeSlideDirection(direction: 1 | -1) {
  try {
    sessionStorage.setItem(PARTNER_TAB_SLIDE_KEY, direction === 1 ? 'next' : 'prev');
  } catch {
    /* ignore */
  }
}

/** Shared tab transition used by swipe commits and footer taps. */
export function navigatePartnerTab(
  router: AppRouterInstance,
  href: string,
  direction: 1 | -1,
  fromDx = 0
) {
  const pane = document.querySelector<HTMLElement>('.partner-tab-pane');
  if (pane && isMobileViewport()) {
    const covered = presentPartnerTabCover(pane, direction, fromDx);
    clearPaneMotion(pane);
    if (!covered) writeSlideDirection(direction);
    router.push(href);
    return;
  }
  writeSlideDirection(direction);
  router.push(href);
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

  useEffect(() => () => removePartnerTabCover(), []);

  const applyDrag = useCallback(
    (dx: number, { animate = false }: { animate?: boolean } = {}) => {
      const pane = paneRef.current;
      if (!pane) return;
      dragX.current = dx;
      pane.style.transition = animate
        ? `transform ${SLIDE_MS}ms ${SWIPE_EASE}`
        : 'none';
      pane.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : 'translate3d(0, 0, 0)';
      pane.style.opacity = '1';
      if (animate) {
        window.setTimeout(() => {
          const current = paneRef.current;
          if (!current) return;
          if (dragX.current === 0) {
            current.style.transition = '';
            current.style.transform = '';
            current.style.opacity = '';
          }
        }, SLIDE_MS + 20);
      }
    },
    [paneRef]
  );

  const goToIndex = useCallback(
    (nextIndex: number, direction: 1 | -1, fromDx = 0) => {
      const tab = tabsRef.current[nextIndex];
      if (!tab || busy.current) return;
      busy.current = true;

      if (tab.action === 'more') {
        applyDrag(0, { animate: true });
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
        applyDrag(0, { animate: true });
        busy.current = false;
        return;
      }

      try {
        navigatePartnerTab(router, tab.href, direction, fromDx);
      } catch {
        if (paneRef.current) clearPaneMotion(paneRef.current);
        removePartnerTabCover();
        busy.current = false;
      }
    },
    [applyDrag, paneRef, router, setNavOpen]
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
      applyDrag(resisted);
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
        if (dragging.current) applyDrag(0, { animate: true });
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
        applyDrag(0, { animate: true });
        dragging.current = false;
        return;
      }

      const width = pane?.getBoundingClientRect().width || window.innerWidth;
      const commitDistance = Math.max(COMMIT_PX_MIN, width * COMMIT_RATIO);
      const committed =
        Math.abs(dx) >= commitDistance || Math.abs(velocity) >= COMMIT_VELOCITY;

      if (!committed) {
        applyDrag(0, { animate: true });
        dragging.current = false;
        return;
      }

      const direction: 1 | -1 = dx < 0 || (Math.abs(dx) < 8 && velocity < 0) ? 1 : -1;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= tabsRef.current.length) {
        applyDrag(0, { animate: true });
        dragging.current = false;
        return;
      }

      if (dragging.current) suppressClick();
      dragging.current = false;
      goToIndex(nextIndex, direction, dragX.current || dx);
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
