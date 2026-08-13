'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import {
  Bell,
  Check,
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AccountAvatar } from '@/components/account/account-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  emptySavedAddress,
  resolveUserPreferences,
} from '@/lib/account-settings';
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, contactWhatsAppHref } from '@/lib/contact-info';
import {
  changeEmailAccountPassword,
  getSignInProvider,
  updateAuthDisplayName,
} from '@/lib/firebase/auth-account';
import { updateUserProfile } from '@/lib/firebase/users';
import type {
  UserNotificationPreferences,
  UserProfile,
  UserSavedAddress,
} from '@/lib/types/database';
import { getDisplayName } from '@/lib/user-display';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'address' | 'preferences' | 'security';

const SETTINGS_TABS: {
  id: SettingsTab;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Name & contact',
    icon: UserRound,
  },
  {
    id: 'address',
    label: 'Address',
    description: 'Delivery details',
    icon: MapPin,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Notifications',
    icon: Bell,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password & access',
    icon: Shield,
  },
];

function formatMemberSince(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function SettingsPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02]">
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent px-5 py-4 sm:px-6">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {footer ? (
        <div className="border-t border-border/50 bg-muted/15 px-5 py-4 sm:px-6">{footer}</div>
      ) : null}
    </section>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left transition',
        checked
          ? 'border-primary/25 bg-primary/[0.04]'
          : 'border-border/60 bg-muted/15 hover:border-border',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/25'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </span>
    </button>
  );
}

function fieldClassName(extra?: string) {
  return cn(
    'h-11 rounded-xl border-border/80 bg-background px-3 text-sm shadow-sm',
    'focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20',
    extra
  );
}

interface AccountSettingsProps {
  user: User;
  profile: UserProfile | null;
  isAdmin?: boolean;
  onLogout: () => Promise<void> | void;
  signingOut?: boolean;
  onProfileUpdated?: () => Promise<void> | void;
}

export function AccountSettings({
  user,
  profile,
  isAdmin,
  onLogout,
  signingOut = false,
  onProfileUpdated,
}: AccountSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const signInMethod = getSignInProvider(user);
  const isEmailAccount = signInMethod === 'Email';
  const displayName = getDisplayName(profile?.displayName ?? user.displayName, user.email);
  const memberSince = profile?.createdAt
    ? profile.createdAt
    : user.metadata.creationTime
      ? new Date(user.metadata.creationTime)
      : null;

  const [name, setName] = useState(profile?.displayName ?? user.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState<UserSavedAddress>(
    profile?.defaultAddress ?? emptySavedAddress()
  );
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(
    resolveUserPreferences(profile?.preferences)
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(profile?.displayName ?? user.displayName ?? '');
    setPhone(profile?.phone ?? '');
    setAddress(
      profile?.defaultAddress ?? {
        ...emptySavedAddress(),
        fullName: profile?.displayName ?? user.displayName ?? '',
        phone: profile?.phone ?? '',
      }
    );
    setPreferences(resolveUserPreferences(profile?.preferences));
  }, [profile, user.displayName]);

  const completion = useMemo(() => {
    const checks = [
      Boolean((name || profile?.displayName || user.displayName)?.trim()),
      Boolean(phone.trim()),
      Boolean(address.address.trim() && address.city.trim()),
      Boolean(preferences.orderUpdates || preferences.serviceReminders),
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
  }, [name, phone, address, preferences, profile?.displayName, user.displayName]);

  const refresh = async () => {
    await onProfileUpdated?.();
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      toast.error('Please enter your display name');
      return;
    }

    setSavingProfile(true);
    try {
      await updateAuthDisplayName(user, nextName);
      await updateUserProfile(user.uid, {
        displayName: nextName,
        phone: phone.trim(),
        photoURL: user.photoURL ?? undefined,
      });
      await refresh();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.fullName.trim() || !address.phone.trim() || !address.address.trim()) {
      toast.error('Name, phone, and street address are required');
      return;
    }

    setSavingAddress(true);
    try {
      await updateUserProfile(user.uid, {
        defaultAddress: {
          ...address,
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          address: address.address.trim(),
          city: address.city.trim() || 'Kampala',
          district: address.district?.trim() || undefined,
          notes: address.notes?.trim() || undefined,
        },
        phone: phone.trim() || address.phone.trim(),
      });
      await refresh();
      toast.success('Delivery address saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await updateUserProfile(user.uid, { preferences });
      await refresh();
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changeEmailAccountPassword(user, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        toast.error('Current password is incorrect');
      } else if (message.includes('weak-password')) {
        toast.error('Choose a stronger password (8+ characters)');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to update password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02]">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.12] via-card to-accent/[0.08] px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-accent/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AccountAvatar email={user.email} variant="email-letter" size="lg" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Account settings
                </p>
                <h2 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {displayName}
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium ring-1 ring-border/60">
                    <Shield className="h-3 w-3 text-primary" />
                    {signInMethod} sign-in
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium ring-1 ring-border/60">
                    <Sparkles className="h-3 w-3 text-accent" />
                    Member since {formatMemberSince(memberSince)}
                  </span>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/20">
                      <Crown className="h-3 w-3" />
                      Admin
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-border/50 bg-background/80 p-4 backdrop-blur sm:max-w-[220px]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Profile strength
                </p>
                <p className="text-sm font-semibold tabular-nums">{completion.percent}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {completion.done}/{completion.total} essentials complete
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible">
        {SETTINGS_TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex min-w-[9.5rem] flex-1 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition sm:min-w-0',
                active
                  ? 'border-primary/30 bg-primary/[0.06] shadow-sm ring-1 ring-primary/15'
                  : 'border-border/60 bg-card hover:border-primary/20 hover:bg-muted/30'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight">{item.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile}>
          <SettingsPanel
            title="Personal details"
            description="How we address you across ShiQueen — checkout, bookings, and support."
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Email is managed by your sign-in provider and cannot be changed here.
                </p>
                <Button type="submit" disabled={savingProfile} className="gap-2 rounded-xl">
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save profile
                </Button>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="settings-name">Display name</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={fieldClassName()}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  value={user.email ?? ''}
                  disabled
                  className={fieldClassName('opacity-70')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="settings-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                    className={fieldClassName('pl-9')}
                  />
                </div>
              </div>
            </div>
          </SettingsPanel>
        </form>
      )}

      {tab === 'address' && (
        <form onSubmit={handleSaveAddress}>
          <SettingsPanel
            title="Default delivery address"
            description="Saved for faster checkout. You can still edit addresses when placing an order."
            footer={
              <div className="flex justify-end">
                <Button type="submit" disabled={savingAddress} className="gap-2 rounded-xl">
                  {savingAddress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save address
                </Button>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-name">Full name</Label>
                <Input
                  id="addr-name"
                  value={address.fullName}
                  onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                  className={fieldClassName()}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-phone">Phone</Label>
                <Input
                  id="addr-phone"
                  value={address.phone}
                  onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  className={fieldClassName()}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addr-street">Street address</Label>
                <Input
                  id="addr-street"
                  value={address.address}
                  onChange={(e) => setAddress((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Road, building, landmark"
                  className={fieldClassName()}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  value={address.city}
                  onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                  className={fieldClassName()}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-district">District / area</Label>
                <Input
                  id="addr-district"
                  value={address.district ?? ''}
                  onChange={(e) => setAddress((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="e.g. Nakawa, Kololo"
                  className={fieldClassName()}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addr-notes">Delivery notes</Label>
                <Input
                  id="addr-notes"
                  value={address.notes ?? ''}
                  onChange={(e) => setAddress((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Gate code, preferred time, etc."
                  className={fieldClassName()}
                />
              </div>
            </div>
          </SettingsPanel>
        </form>
      )}

      {tab === 'preferences' && (
        <SettingsPanel
          title="Notifications & communication"
          description="Choose how ShiQueen keeps you informed. You can change these anytime."
          footer={
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={savingPreferences}
                onClick={() => void handleSavePreferences()}
                className="gap-2 rounded-xl"
              >
                {savingPreferences ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save preferences
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <PreferenceToggle
              label="Order updates"
              description="Shipping, delivery confirmation, and order status emails."
              checked={preferences.orderUpdates}
              onChange={(orderUpdates) => setPreferences((prev) => ({ ...prev, orderUpdates }))}
              disabled={savingPreferences}
            />
            <PreferenceToggle
              label="Service reminders"
              description="Booking confirmations and reminders for beauty & lifestyle services."
              checked={preferences.serviceReminders}
              onChange={(serviceReminders) =>
                setPreferences((prev) => ({ ...prev, serviceReminders }))
              }
              disabled={savingPreferences}
            />
            <PreferenceToggle
              label="Promotions & new arrivals"
              description="Curated offers, bundles, and seasonal drops from ShiQueen."
              checked={preferences.promotions}
              onChange={(promotions) => setPreferences((prev) => ({ ...prev, promotions }))}
              disabled={savingPreferences}
            />
            <PreferenceToggle
              label="SMS alerts"
              description="Urgent delivery updates by text when phone number is on file."
              checked={preferences.smsAlerts}
              onChange={(smsAlerts) => setPreferences((prev) => ({ ...prev, smsAlerts }))}
              disabled={savingPreferences}
            />
          </div>
        </SettingsPanel>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          {isEmailAccount ? (
            <form onSubmit={handleChangePassword}>
              <SettingsPanel
                title="Change password"
                description="Use a strong password you don’t reuse on other sites."
                footer={
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingPassword} className="gap-2 rounded-xl">
                      {savingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Update password
                    </Button>
                  </div>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={fieldClassName()}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={fieldClassName()}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={fieldClassName()}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </SettingsPanel>
            </form>
          ) : (
            <SettingsPanel
              title="Password"
              description="Your account is secured through Google sign-in."
            >
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Managed by Google</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Update your Google password in your Google Account if you need to change it.
                  </p>
                </div>
              </div>
            </SettingsPanel>
          )}

          <SettingsPanel title="Session" description="Sign out of ShiQueen on this device.">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Sign out</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Your cart and wishlist stay on this device until you clear them.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void onLogout()}
                disabled={signingOut}
                className="gap-2 rounded-xl sm:shrink-0"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign out
              </Button>
            </div>
          </SettingsPanel>

          <SettingsPanel title="Need help?" description="We’re here for account and order support.">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={CONTACT_PHONE_HREF}
                className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3.5 transition hover:border-primary/25 hover:bg-primary/[0.03]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Call
                </p>
                <p className="mt-1 text-sm font-medium">{CONTACT_PHONE_DISPLAY}</p>
              </a>
              <a
                href={contactWhatsAppHref('Hi ShiQueen, I need help with my account settings.')}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3.5 transition hover:border-primary/25 hover:bg-primary/[0.03]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  WhatsApp
                </p>
                <p className="mt-1 text-sm font-medium">Message support</p>
              </a>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3.5 transition hover:border-primary/35 sm:col-span-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Admin
                  </p>
                  <p className="mt-1 text-sm font-medium">Open admin console</p>
                </Link>
              ) : null}
            </div>
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
