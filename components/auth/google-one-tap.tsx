'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  cancelGoogleOneTapPrompt,
  getGoogleClientId,
  loadGoogleIdentityScript,
  type GoogleCredentialResponse,
} from '@/lib/google-identity';

const EXCLUDED_PREFIXES = ['/admin'];

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function GoogleOneTap() {
  const { user, loading, signInWithGoogleCredential } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const initializedRef = useRef(false);
  const promptedRef = useRef(false);
  const signingInRef = useRef(false);
  const signInRef = useRef(signInWithGoogleCredential);

  signInRef.current = signInWithGoogleCredential;

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential || signingInRef.current) return;

      signingInRef.current = true;
      try {
        await signInRef.current(response.credential);
        toast.success('Signed in with Google');

        if (pathname === '/sign-in' || pathname === '/sign-up') {
          router.push('/account');
        }
      } catch (error) {
        toast.error(getAuthErrorMessage(error));
        console.error('Google One Tap sign-in failed:', error);
      } finally {
        signingInRef.current = false;
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    const clientId = getGoogleClientId();
    if (!clientId || !isFirebaseConfigured() || initializedRef.current) return;

    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || initializedRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: true,
          cancel_on_tap_outside: false,
          itp_support: true,
          use_fedcm_for_prompt: true,
          context: 'signin',
        });

        initializedRef.current = true;
      })
      .catch((error) => {
        console.warn('[SheQueen] Google One Tap unavailable:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [handleCredential]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      promptedRef.current = false;
      cancelGoogleOneTapPrompt();
      return;
    }

    if (
      promptedRef.current ||
      isExcludedPath(pathname) ||
      !getGoogleClientId() ||
      !isFirebaseConfigured()
    ) {
      return;
    }

    let cancelled = false;

    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        promptedRef.current = true;
        window.google.accounts.id.prompt();
      })
      .catch(() => {
        // Script load failure already logged during initialize.
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, pathname]);

  return null;
}
