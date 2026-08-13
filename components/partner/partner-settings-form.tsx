'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { useAuth } from '@/lib/auth-context';
import { changeEmailAccountPassword, getSignInProvider } from '@/lib/firebase/auth-account';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { updateUserProfile } from '@/lib/firebase/users';
import { resolveUserPreferences } from '@/lib/account-settings';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { getVapidKey } from '@/lib/pwa/messaging';

export function PartnerSettingsForm() {
  const { user, profile, refreshProfile, resendVerificationEmail } = useAuth();
  const provider = getSignInProvider(user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState(() => resolveUserPreferences(profile?.preferences));

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await changeEmailAccountPassword(user, currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { preferences: prefs });
      await refreshProfile();
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <section className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold">Sign-in method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You signed in with {provider}.
          {user && !user.emailVerified && provider === 'Email' ? ' Email is not verified yet.' : ''}
        </p>
        {user && !user.emailVerified && provider === 'Email' && (
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await resendVerificationEmail();
                toast.success('Verification email sent');
              } catch (error) {
                toast.error(getAuthErrorMessage(error));
              }
            }}
          >
            Resend verification
          </Button>
        )}
      </section>

      {provider === 'Email' && (
        <form
          onSubmit={handlePassword}
          className="space-y-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-base font-semibold">Change password</h2>
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordField
              id="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordField
              id="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </form>
      )}

      <form
        onSubmit={handlePrefs}
        className="space-y-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Sound, vibration, and push alerts when new orders or bookings arrive.
        </p>
        {(
          [
            ['pushAlerts', 'New order & booking alerts'],
            ['orderUpdates', 'Order updates'],
            ['promotions', 'Promotions'],
            ['serviceReminders', 'Service reminders'],
            ['smsAlerts', 'SMS alerts'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
        <Button type="submit" variant="outline" disabled={saving}>
          Save preferences
        </Button>
      </form>

      <section className="space-y-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold">Install app</h2>
        <p className="text-sm text-muted-foreground">
          Add this dashboard to your home screen. On Android, Chrome can install it directly. On
          iPhone or iPad, use Safari → Share → Add to Home Screen.
        </p>
        <InstallAppButton />
        {!getVapidKey() ? (
          <p className="text-xs text-muted-foreground">
            Background push needs a VAPID key. Foreground sound and vibration still work while the
            app is open.
          </p>
        ) : null}
      </section>
    </div>
  );
}
