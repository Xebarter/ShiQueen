'use client';

import { useEffect, useId, useRef } from 'react';

type OverlayEntry = {
  id: string;
  closedByPop: boolean;
  close: () => void;
};

type OverlayRouter = {
  push: (href: string) => void;
};

const overlayStack: OverlayEntry[] = [];
let listenerAttached = false;
let ignoreNextPop = false;

function attachPopStateListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;

  window.addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }

    const top = overlayStack.pop();
    if (!top) return;

    top.closedByPop = true;
    top.close();
  });
}

function removeFromStack(id: string) {
  const index = overlayStack.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    overlayStack.splice(index, 1);
  }
}

function getLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function isOverlayHistoryState(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === 'object' &&
      'sqOverlay' in state &&
      (state as { sqOverlay?: unknown }).sqOverlay != null
  );
}

/**
 * Clears the synthetic overlay history entry, then navigates.
 * Prevents history.back() from racing with / undoing Next.js client navigations
 * (common when closing the header account menu into a dashboard route).
 */
export function navigateFromHistoryOverlay(
  router: OverlayRouter,
  href: string,
  closeOverlay?: () => void
) {
  if (typeof window === 'undefined') {
    router.push(href);
    return;
  }

  const top = overlayStack[overlayStack.length - 1];
  if (top) {
    top.closedByPop = true;
    removeFromStack(top.id);
  }
  closeOverlay?.();

  const go = () => {
    router.push(href);
  };

  if (!isOverlayHistoryState(window.history.state)) {
    go();
    return;
  }

  let navigated = false;
  const finish = () => {
    if (navigated) return;
    navigated = true;
    window.removeEventListener('popstate', onPop);
    go();
  };

  const onPop = () => {
    // Consumed by this helper — do not also treat as overlay close.
    ignoreNextPop = false;
    finish();
  };

  ignoreNextPop = true;
  window.addEventListener('popstate', onPop);
  window.history.back();
  window.setTimeout(finish, 120);
}

/**
 * Syncs overlays (menus, modals, sheets) with browser history so the Android
 * system back button closes them before navigating away from the page.
 */
export function useHistoryOverlay(isOpen: boolean, onClose: () => void) {
  const id = useId();
  const onCloseRef = useRef(onClose);
  const openedLocationRef = useRef<string | null>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    attachPopStateListener();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    openedLocationRef.current = getLocationKey();

    const entry: OverlayEntry = {
      id,
      closedByPop: false,
      close: () => onCloseRef.current(),
    };

    overlayStack.push(entry);
    window.history.pushState({ sqOverlay: id }, '');

    return () => {
      removeFromStack(id);

      if (entry.closedByPop) {
        openedLocationRef.current = null;
        return;
      }

      const openedAt = openedLocationRef.current;
      openedLocationRef.current = null;

      // Defer so overlay actions that navigate (e.g. search result clicks) can
      // update the URL before we decide whether to pop the overlay history entry.
      window.setTimeout(() => {
        if (entry.closedByPop) return;
        if (openedAt !== null && getLocationKey() === openedAt) {
          ignoreNextPop = true;
          window.history.back();
        }
      }, 0);
    };
  }, [isOpen, id]);
}
