'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  sendPasswordResetEmail,
  sendEmailVerification,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseAuthConfigured } from '@/lib/firebase/auth';
import { ensureUserProfile, resolveUserRole } from '@/lib/supabase/users';
import { resetSupabaseClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types/database';
import { isServiceProviderProfile, isSupplierProfile } from '@/lib/auth-redirect';
import { disableGoogleOneTapAutoSelect, cancelGoogleOneTapPrompt } from '@/lib/google-identity';

function getAuthCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSupplier: boolean;
  isServiceProvider: boolean;
  supplierId: string | null;
  providerId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInOrCreate: (email: string, password: string) => Promise<{ created: boolean }>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildAuthFallbackProfile(
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): UserProfile {
  return {
    uid,
    email,
    displayName,
    photoURL,
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
      currentUser.displayName ?? undefined,
      currentUser.photoURL ?? undefined
    );
  } catch (error) {
    console.error('Failed to load user profile:', error);
    return buildAuthFallbackProfile(
      currentUser.uid,
      currentUser.email!,
      currentUser.displayName ?? undefined,
      currentUser.photoURL ?? undefined
    );
  }
}

function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  return provider;
}

function isPopupFlowError(error: unknown): boolean {
  const code = getAuthCode(error);
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}

function isMissingAccountError(error: unknown): boolean {
  const code = getAuthCode(error);
  return (
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/wrong-password'
  );
}

async function maybeSendVerification(user: User) {
  if (user.emailVerified) return;
  const isPassword = user.providerData.some((p) => p.providerId === 'password');
  if (!isPassword) return;
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.warn('Could not send verification email', error);
  }
}

/** Force-refresh ID token so Supabase sees role: authenticated custom claim. */
async function refreshFirebaseToken(user: User, force = false): Promise<void> {
  try {
    await user.getIdToken(force);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn(
        'Firebase Auth not initialized. Set NEXT_PUBLIC_FIREBASE_* environment variables.'
      );
      setLoading(false);
      return;
    }

    let mounted = true;

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!mounted || !result?.user.email) return;
        await refreshFirebaseToken(result.user, true);
        await ensureUserProfile(
          result.user.uid,
          result.user.email,
          result.user.displayName ?? undefined,
          result.user.photoURL ?? undefined
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
        await refreshFirebaseToken(currentUser, true);
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
        await refreshFirebaseToken(currentUser, false);
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
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await refreshFirebaseToken(credential.user, true);
  };

  const signInOrCreate = async (
    email: string,
    password: string
  ): Promise<{ created: boolean }> => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    if (password.length < 6) {
      throw Object.assign(new Error('Password must be at least 6 characters.'), {
        code: 'auth/weak-password',
      });
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await refreshFirebaseToken(credential.user, true);
      return { created: false };
    } catch (error) {
      if (!isMissingAccountError(error)) throw error;

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(credential.user.uid, email, credential.user.displayName ?? undefined);
        await refreshFirebaseToken(credential.user, true);
        await maybeSendVerification(credential.user);
        return { created: true };
      } catch (createError) {
        if (getAuthCode(createError) === 'auth/email-already-in-use') {
          throw error;
        }
        throw createError;
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(credential.user.uid, email);
    await refreshFirebaseToken(credential.user, true);
    await maybeSendVerification(credential.user);
  };

  const signInWithGoogleCredential = async (idToken: string) => {
    if (!isFirebaseAuthConfigured()) {
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
        googleUser.displayName ?? undefined,
        googleUser.photoURL ?? undefined
      );
      await refreshFirebaseToken(googleUser, true);
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseAuthConfigured()) {
      throw new Error('Firebase is not configured');
    }

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    const provider = getGoogleProvider();
    cancelGoogleOneTapPrompt();

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
          googleUser.displayName ?? undefined,
          googleUser.photoURL ?? undefined
        );
        await refreshFirebaseToken(googleUser, true);
      }
    } catch (error) {
      if (isPopupFlowError(error)) {
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
        return;
      }
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    const auth = getFirebaseAuth();
    const current = auth?.currentUser;
    if (!current) throw new Error('You need to be signed in.');
    await sendEmailVerification(current);
  };

  const refreshProfile = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!auth || !currentUser?.email) {
      setProfile(null);
      return;
    }
    try {
      await currentUser.reload();
    } catch {
      // ignore reload failures
    }
    const reloaded = auth.currentUser ?? currentUser;
    setUser(reloaded);
    await refreshFirebaseToken(reloaded, true);
    const userProfile = await loadUserProfile(reloaded);
    setProfile(userProfile);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    disableGoogleOneTapAutoSelect();
    await signOut(auth);
    resetSupabaseClient();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        isSupplier: isSupplierProfile(profile),
        isServiceProvider: isServiceProviderProfile(profile),
        supplierId: profile?.supplierId ?? null,
        providerId: profile?.providerId ?? null,
        loading,
        signIn,
        signInOrCreate,
        signUp,
        signInWithGoogle,
        signInWithGoogleCredential,
        sendPasswordReset,
        resendVerificationEmail,
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
