import {
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';

const ANALYTICS_SETTINGS_DOC = 'analytics';

export interface AnalyticsGoals {
  monthlyRevenueTarget?: number;
  monthlyOrdersTarget?: number;
  averageOrderValueTarget?: number;
  updatedAt?: Date;
}

function analyticsSettingsRef() {
  const db = getFirebaseDb();
  if (!db) throw new Error('Database not available');
  return doc(db, COLLECTIONS.settings, ANALYTICS_SETTINGS_DOC);
}

function mapAnalyticsGoals(data: Record<string, unknown> | undefined): AnalyticsGoals {
  if (!data) return {};
  return {
    monthlyRevenueTarget:
      data.monthlyRevenueTarget !== undefined ? Number(data.monthlyRevenueTarget) : undefined,
    monthlyOrdersTarget:
      data.monthlyOrdersTarget !== undefined ? Number(data.monthlyOrdersTarget) : undefined,
    averageOrderValueTarget:
      data.averageOrderValueTarget !== undefined
        ? Number(data.averageOrderValueTarget)
        : undefined,
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
  };
}

export function subscribeAnalyticsGoals(
  onData: (goals: AnalyticsGoals) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData({});
    return () => {};
  }

  return onSnapshot(
    analyticsSettingsRef(),
    (snapshot) => {
      onData(snapshot.exists() ? mapAnalyticsGoals(snapshot.data()) : {});
    },
    (error) => onError?.(error)
  );
}

export async function saveAnalyticsGoals(goals: AnalyticsGoals): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (goals.monthlyRevenueTarget !== undefined) {
    payload.monthlyRevenueTarget = goals.monthlyRevenueTarget;
  }
  if (goals.monthlyOrdersTarget !== undefined) {
    payload.monthlyOrdersTarget = goals.monthlyOrdersTarget;
  }
  if (goals.averageOrderValueTarget !== undefined) {
    payload.averageOrderValueTarget = goals.averageOrderValueTarget;
  }

  await setDoc(analyticsSettingsRef(), payload, { merge: true });
}

export async function clearAnalyticsGoals(): Promise<void> {
  await setDoc(
    analyticsSettingsRef(),
    {
      monthlyRevenueTarget: deleteField(),
      monthlyOrdersTarget: deleteField(),
      averageOrderValueTarget: deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
