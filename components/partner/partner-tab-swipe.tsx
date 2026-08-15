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
/** Small lock distance so horizontal intent feels immediate */
const AXIS_LOCK_PX = 6;
const COMMIT_RATIO = 0.18;
const COMMIT_PX_MIN = 48;
const COMMIT_VELOCITY = 0.35;
const EDGE_RESISTANCE = 0.22;
const SLIDE_MS = 280;
/** Smooth decelerating ease — no spring overshoot hesitation */
const SWIPE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
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
  pane.style.visibility = '';
  pane.style.pointerEvents = '';
  pane.style.willChange = '';
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
 * Freezes the outgoing page as a lightweight sliding cover, then lets the
 * incoming route enter via CSS. Animation starts immediately — no mount poll.
 */
function presentPartnerTabCover(pane: HTMLElement, direction: 1 | -1, fromDx = 0) {
  removePartnerTabCover();
  if (prefersReducedMotion()) return false;

  const rect = pane.getBoundingClientRect();
  const width = Math.max(1, rect.width || window.innerWidth);
  const targetX = direction === 1 ? -width : width;

  const cover = document.createElement('div');
  cover.id = COVER_ID;
  cover.className = 'partner-tab-page-cover';
  cover.setAttribute('aria-hidden', 'true');
  cover.style.cssText = [
    'position:fixed',
    `top:${Math.round(rect.top)}px`,
    'left:0',
    'right:0',
    `height:${Math.round(rect.height)}px`,
    'z-index:50',
    'overflow:hidden',
    'pointer-events:none',
    'background:var(--background)',
    `transform:translate3d(${fromDx}px,0,0)`,
    'will-change:transform',
    'backface-visibility:hidden',
  ].join(';');

  // Shallow visual freeze: clone once, strip heavy effects, clip to viewport.
  const clone = pane.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.classList.remove(
    'partner-tab-exit-next',
    'partner-tab-exit-prev',
    'partner-tab-enter-next',
    'partner-tab-enter-prev',
    'will-change-transform'
  );
  clone.style.cssText = [
    'transform:none',
    'opacity:1',
    'visibility:visible',
    'transition:none',
    'animation:none',
    'pointer-events:none',
    'will-change:auto',
    `height:${Math.round(rect.height)}px`,
    'overflow:hidden',
    'background:var(--background)',
  ].join(';');
  cover.appendChild(clone);

  // Hide the live pane so route swap is invisible under the cover.
  pane.style.visibility = 'hidden';
  pane.style.pointerEvents = 'none';
  pane.style.transition = 'none';
  pane.style.transform = 'none';

  document.body.appendChild(cover);

  // Double-rAF ensures the browser paints the cover at fromDx before sliding.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!cover.isConnected) return;
      cover.style.transition = `transform ${SLIDE_MS}ms ${SWIPE_EASE}`;
      cover.style.transform = `translate3d(${targetX}px,0,0)`;
    });
  });

  window.setTimeout(removePartnerTabCover, SLIDE_MS + 48);
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
    // Always seed CSS enter so the new page slides in without a blank frame.
    writeSlideDirection(direction);
    try {
      document.documentElement.style.setProperty('--partner-tab-from', `${Math.round(fromDx)}px`);
    } catch {
      /* ignore */
    }
    presentPartnerTabCover(pane, direction, fromDx);
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
  const lastMove = useRef<{ x: number; t: number } | null>(null);
  const axis = useRef<'undecided' | 'x' | 'y'>('undecided');
  const dragging = useRef(false);
  const dragX = useRef(0);
  const pendingDx = useRef(0);
  const rafId = useRef(0);
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
      // Keep enter animation classes — only clear drag styles from the previous page.
      pane.style.transition = '';
      pane.style.transform = '';
      pane.style.opacity = '';
      pane.style.visibility = '';
      pane.style.pointerEvents = '';
      pane.style.willChange = '';
      pane.classList.remove('partner-tab-exit-next', 'partner-tab-exit-prev');
    }
    try {
      window.setTimeout(() => {
        document.documentElement.style.removeProperty('--partner-tab-from');
      }, SLIDE_MS + 40);
    } catch {
      /* ignore */
    }
  }, [pathname, paneRef]);

  useEffect(() => {
    if (!isMobileViewport()) return;
    for (const tab of tabs) {
      if (tab.href) router.prefetch(tab.href);
    }
  }, [router, tabs]);

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      removePartnerTabCover();
    },
    []
  );

  const flushDrag = useCallback(() => {
    rafId.current = 0;
    const pane = paneRef.current;
    if (!pane) return;
    const dx = pendingDx.current;
    dragX.current = dx;
    pane.style.transform = `translate3d(${dx}px, 0, 0)`;
  }, [paneRef]);

  const applyDrag = useCallback(
    (dx: number, { animate = false }: { animate?: boolean } = {}) => {
      const pane = paneRef.current;
      if (!pane) return;
      pendingDx.current = dx;

      if (animate) {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = 0;
        }
        dragX.current = dx;
        pane.style.transition = `transform ${SLIDE_MS}ms ${SWIPE_EASE}`;
        pane.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : 'translate3d(0, 0, 0)';
        window.setTimeout(() => {
          const current = paneRef.current;
          if (!current || dragX.current !== 0) return;
          current.style.transition = '';
          current.style.transform = '';
          current.style.willChange = '';
        }, SLIDE_MS + 24);
        return;
      }

      pane.style.transition = 'none';
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(flushDrag);
      }
    },
    [flushDrag, paneRef]
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
    window.setTimeout(() => document.removeEventListener('click', block, true), 380);
  }, []);

  useEffect(() => {
    const stage = () =>
      paneRef.current?.closest('.partner-tab-stage') ?? paneRef.current ?? document;

    const onStart = (event: TouchEvent) => {
      if (busy.current || !isMobileViewport() || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      const now = performance.now();
      start.current = { x: touch.clientX, y: touch.clientY, t: now };
      lastMove.current = { x: touch.clientX, t: now };
      axis.current = 'undecided';
      dragging.current = false;
      dragX.current = 0;
      pendingDx.current = 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!start.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const now = performance.now();
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      lastMove.current = { x: touch.clientX, t: now };

      if (axis.current === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        // Prefer horizontal slightly so swipes feel decisive.
        axis.current = Math.abs(dx) > Math.abs(dy) * 1.05 ? 'x' : 'y';
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
      const sample = lastMove.current;
      start.current = null;
      lastMove.current = null;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
        flushDrag();
      }

      const pane = paneRef.current;
      if (pane && !busy.current) pane.style.willChange = '';

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
      // Velocity from the last tracked move sample — more stable than a long window.
      const sampleDt = Math.max(12, now - (sample?.t ?? origin.t));
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

      const direction: 1 | -1 =
        dx < 0 || (Math.abs(dx) < 8 && velocity < 0) ? 1 : -1;
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

    const root = stage();
    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd);
    root.addEventListener('touchcancel', onEnd);

    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
  }, [applyDrag, flushDrag, goToIndex, paneRef, suppressClick]);
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
