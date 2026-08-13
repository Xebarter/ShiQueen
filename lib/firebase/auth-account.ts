import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';

export function getSignInProvider(user: User | null | undefined): 'Google' | 'Email' | 'Unknown' {
  if (!user) return 'Unknown';
  const providers = user.providerData.map((p) => p.providerId);
  if (providers.includes('google.com')) return 'Google';
  if (providers.includes('password')) return 'Email';
  return 'Unknown';
}

export async function updateAuthDisplayName(user: User, displayName: string): Promise<void> {
  await updateProfile(user, { displayName: displayName.trim() || null });
}

export async function changeEmailAccountPassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!user.email) {
    throw new Error('Your account does not have an email address.');
  }
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
