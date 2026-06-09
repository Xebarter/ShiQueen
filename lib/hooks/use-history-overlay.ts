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
export function useHistoryOverlay(isOpen: boolean, onClose: () => void) {
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    attachPopStateListener();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const entry: OverlayEntry = {
      id,
      closedByPop: false,
      close: () => onCloseRef.current(),
    };

    overlayStack.push(entry);
    window.history.pushState({ sqOverlay: id }, '');

    return () => {
      removeFromStack(id);

      if (!entry.closedByPop) {
        ignoreNextPop = true;
        window.history.back();
      }
    };
  }, [isOpen, id]);
}
