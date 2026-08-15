export {
  getFirebaseApp,
  isFirebaseAuthConfigured,
  isFirebaseAuthConfigured as isFirebaseConfigured,
} from '@/lib/firebase/auth';

export function isFcmConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim())
  );
}
