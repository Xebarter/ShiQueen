'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';
import { ensureUserProfile, resolveUserRole } from './firebase/users';
import { UserProfile } from './types/database';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { disableGoogleOneTapAutoSelect } from '@/lib/google-identity';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSupplier: boolean;
  supplierId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAuthFallbackProfile(
  uid: string,
  email: string,
  displayName?: string
): UserProfile {
  return {
    uid,
    email,
    displayName,
    role: resolveUserRole(email),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function loadUserProfile(currentUser: User): Promise<UserProfile> {
  try {
    return await ensureUserProfile(
      currentUser.uid,
      currentUser.email!,
      currentUser.displayName ?? undefined
    );
  } catch (error) {
    console.error('Failed to load user profile:', error);
    return buildAuthFallbackProfile(
      currentUser.uid,
      currentUser.email!,
      currentUser.displayName ?? undefined
    );
  }
}

function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  return provider;
}

function isPopupFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = String((error as { code: string }).code);
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('Firebase Auth not initialized. Set NEXT_PUBLIC_FIREBASE_* environment variables.');
      setLoading(false);
      return;
    }

    let mounted = true;

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!mounted || !result?.user.email) return;
        await ensureUserProfile(
          result.user.uid,
          result.user.email,
          result.user.displayName ?? undefined
        );
      })
      .catch((error) => {
        console.error('Google redirect sign-in failed:', error);
      });

    void auth.authStateReady().then(async () => {
      if (!mounted) return;

      const currentUser = auth.currentUser;
      setUser(currentUser);

      if (currentUser?.email) {
        const userProfile = await loadUserProfile(currentUser);
        if (mounted) setProfile(userProfile);
      } else if (mounted) {
        setProfile(null);
      }

      if (mounted) setLoading(false);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      const currentUser = firebaseUser ?? auth.currentUser;
      setUser(currentUser);

      if (currentUser?.email) {
        const userProfile = await loadUserProfile(currentUser);
        if (mounted) setProfile(userProfile);
      } else if (mounted) {
        setProfile(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(credential.user.uid, email);
  };

  const signInWithGoogleCredential = async (idToken: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const googleUser = result.user;

    if (googleUser.email) {
      await ensureUserProfile(
        googleUser.uid,
        googleUser.email,
        googleUser.displayName ?? undefined
      );
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    const provider = getGoogleProvider();

    try {
      const credential = await signInWithPopup(
        auth,
        provider,
        browserPopupRedirectResolver
      );
      const { user: googleUser } = credential;

      if (googleUser.email) {
        await ensureUserProfile(
          googleUser.uid,
          googleUser.email,
          googleUser.displayName ?? undefined
        );
      }
    } catch (error) {
      if (isPopupFlowError(error)) {
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
        return;
      }
      throw error;
    }
  };

  const refreshProfile = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser?.email) {
      setProfile(null);
      return;
    }
    const userProfile = await loadUserProfile(currentUser);
    setProfile(userProfile);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    disableGoogleOneTapAutoSelect();
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        isSupplier: profile?.role === 'supplier',
        supplierId: profile?.supplierId ?? null,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGoogleCredential,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
