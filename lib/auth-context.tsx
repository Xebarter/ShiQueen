'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from './firebase';
import { ensureUserProfile, resolveUserRole } from './firebase/users';
import { UserProfile } from './types/database';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

    setPersistence(auth, browserLocalPersistence).catch(console.warn);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser?.email) {
        try {
          const userProfile = await ensureUserProfile(
            currentUser.uid,
            currentUser.email,
            currentUser.displayName ?? undefined
          );
          setProfile(userProfile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setProfile(
            buildAuthFallbackProfile(
              currentUser.uid,
              currentUser.email,
              currentUser.displayName ?? undefined
            )
          );
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
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

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        loading,
        signIn,
        signUp,
        logout,
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
