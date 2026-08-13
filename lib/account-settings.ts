import type { UserNotificationPreferences, UserSavedAddress } from '@/lib/types/database';

export const DEFAULT_USER_PREFERENCES: UserNotificationPreferences = {
  orderUpdates: true,
  promotions: false,
  serviceReminders: true,
  smsAlerts: false,
  pushAlerts: true,
};

export function resolveUserPreferences(
  preferences?: UserNotificationPreferences | null
): UserNotificationPreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...(preferences ?? {}),
  };
}

export function emptySavedAddress(): UserSavedAddress {
  return {
    fullName: '',
    phone: '',
    address: '',
    city: 'Kampala',
    district: '',
    notes: '',
  };
}
