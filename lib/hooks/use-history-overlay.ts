'use client';

import { useEffect, useId, useRef } from 'react';

type OverlayEntry = {
  id: string;
  closedByPop: boolean;
  close: () => void;
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

/**
 * Syncs overlays (menus, modals, sheets) with browser history so the Android
 * system back button closes them before navigating away from the page.
 */
function getLocationKey() {
  return `${window.location.pathname}${window.location.search}`;
}

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
        if (openedAt !== null && getLocationKey() === openedAt) {
          ignoreNextPop = true;
          window.history.back();
        }
      }, 0);
    };
  }, [isOpen, id]);
}
