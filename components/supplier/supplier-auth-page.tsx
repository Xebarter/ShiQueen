'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  Check,
  Loader2,
  Mail,
  Package,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandLogo } from '@/components/brand-logo';
import { AuthDivider } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { PhoneSignIn } from '@/components/auth/phone-sign-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { linkSupplierRegistration } from '@/lib/firebase/suppliers';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isSupplierProfile } from '@/lib/auth-redirect';
import { useFeature } from '@/lib/feature-flags-context';
import {
  formatNationalMobileInput,
  toE164UgandaPhone,
} from '@/lib/phone-utils';
import {
  SUPPLIER_CATEGORY_OPTIONS,
  type SupplierCategory,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';

const SIGNUP_CATEGORIES = SUPPLIER_CATEGORY_OPTIONS.filter(
  (item) => item.id === 'products' || item.id === 'packages'
);

const BENEFITS = [
  {
    icon: Package,
    title: 'List products',
    description: 'Photos, pricing, and stock in one catalog.',
  },
  {
    icon: Boxes,
    title: 'Build packages',
    description: 'Bundle bestsellers for wholesale buyers.',
  },
  {
    icon: ShieldCheck,
    title: 'Curated storefront',
    description: 'We review every partner before you go live.',
  },
] as const;

const STEPS = [
  'Create an account or sign in',
  'Get approved immediately',
  'List your products and start selling',
] as const;

type EmailStep = 'identify' | 'password';
type Phase = 'auth' | 'apply';

function resolveSupplierNext(next: string | null): string {
  if (!next) return '/suppliers/orders';
  const trimmed = next.trim();
  if (trimmed === '/suppliers' || trimmed.startsWith('/suppliers/sign')) {
    return '/suppliers/orders';
  }
  if (trimmed.startsWith('/suppliers/') || trimmed === '/supplier') {
    return trimmed.replace(/^\/supplier(\/|$)/, '/suppliers$1');
  }
  return '/suppliers/orders';
}

export function SupplierAuthPage({
  intent = 'welcome',
}: {
  intent?: 'welcome' | 'signin' | 'apply';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationsEnabled = useFeature('supplierApplications');
  const {
    user,
    profile,
    isSupplier,
    loading: authLoading,
    signInOrCreate,
    signInWithGoogle,
    refreshProfile,
    logout,
  } = useAuth();

  const [phase, setPhase] = useState<Phase>('auth');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<EmailStep>('identify');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: 'Kampala',
    categories: ['products', 'packages'] as SupplierCategory[],
  });

  const nextHref = resolveSupplierNext(searchParams.get('next'));
  const busy = loading || googleLoading || phoneBusy;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    if (authLoading) return;
    if (user && isSupplier) {
      router.replace(nextHref);
    }
  }, [authLoading, user, isSupplier, router, nextHref]);

  useEffect(() => {
    if (authLoading || !user || isSupplier) return;
    if (applicationsEnabled) setPhase('apply');
  }, [authLoading, user, isSupplier, applicationsEnabled]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      email: user.email || prev.email,
      contactName: prev.contactName || user.displayName || profile?.displayName || '',
      phone:
        prev.phone ||
        formatNationalMobileInput(profile?.phone || user.phoneNumber || ''),
    }));
  }, [user, profile?.displayName, profile?.phone, user?.displayName, user?.email, user?.phoneNumber]);

  const goToPortal = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/supabase/users');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    if (isSupplierProfile(nextProfile)) {
      router.push(nextHref);
      return true;
    }
    if (!applicationsEnabled) {
      toast.error('This account is not registered as a supplier.');
      return false;
    }
    setPhase('apply');
    return false;
  };

  const finishAuth = async (created: boolean) => {
    toast.success(created ? 'Account ready — add your business details' : 'Welcome back');
    await goToPortal();
  };

  const handleIdentify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailIsValid) {
      toast.error('Enter a valid email address');
      return;
    }
    setEmailStep('password');
  };

  const handleEmailContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { created } = await signInOrCreate(email.trim(), password);
      await finishAuth(created);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await finishAuth(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: SupplierCategory) => {
    setForm((prev) => {
      const has = prev.categories.includes(id);
      return {
        ...prev,
        categories: has ? prev.categories.filter((item) => item !== id) : [...prev.categories, id],
      };
    });
  };

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim()) {
      toast.error('Company and contact name are required');
      return;
    }
    const phone = toE164UgandaPhone(form.phone);
    if (!phone) {
      toast.error('Enter a valid Uganda mobile number, like 07XX XXX XXX.');
      return;
    }
    if (form.categories.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    const uid = user?.uid ?? getFirebaseAuth()?.currentUser?.uid;
    const applyEmail = (user?.email || form.email).trim().toLowerCase();
    if (!uid) {
      toast.error('Sign in to continue your application');
      setPhase('auth');
      return;
    }
    if (!applyEmail) {
      toast.error('Add an email so we can reach you about approval');
      return;
    }

    setLoading(true);
    try {
      await linkSupplierRegistration(uid, {
        companyName: form.companyName,
        contactName: form.contactName,
        email: applyEmail,
        phone,
        city: form.city,
        categories: form.categories,
      });
      await refreshProfile();
      toast.success('Application submitted — awaiting approval');
      router.push('/suppliers/orders?welcome=1');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    await logout();
    setPhase('auth');
    setEmailOpen(false);
    setEmailStep('identify');
    setPassword('');
  };

  const heading =
    phase === 'apply'
      ? 'Your business'
      : intent === 'signin'
        ? 'Welcome back'
        : intent === 'apply'
          ? 'Join as a supplier'
          : 'Sell with ShiQueen';
  const applySubheading = 'Add your business details and get approved immediately.';

  if (authLoading || (user && isSupplier)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[oklch(0.985_0.012_350)]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Opening supplier portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[oklch(0.985_0.012_350)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_55%_at_10%_-10%,oklch(0.92_0.04_340_/_0.75),transparent_58%),radial-gradient(ellipse_50%_40%_at_100%_0%,oklch(0.94_0.05_62_/_0.4),transparent_52%),radial-gradient(ellipse_45%_40%_at_80%_100%,oklch(0.93_0.03_350_/_0.4),transparent_55%)]"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:py-5">
        <BrandLogo variant="header" href="/" />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Shop
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-5 px-4 pb-8 sm:gap-8 sm:px-6 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center lg:gap-12 lg:pb-20">
        <section className="order-2 hidden lg:order-1 lg:block lg:pr-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Supplier partner
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-brand)] text-[2.55rem] font-medium leading-tight tracking-tight text-foreground">
            {heading}
          </h1>
          {phase === 'apply' ? (
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {applySubheading}
            </p>
          ) : null}

          <ol className="mt-6 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    phase === 'apply' && index === 0
                      ? 'bg-primary text-primary-foreground'
                      : index === (phase === 'apply' ? 1 : 0)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                  )}
                >
                  {phase === 'apply' && index === 0 ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="pt-0.5 text-sm text-foreground/85">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-card/70 px-3.5 py-3 shadow-sm backdrop-blur-sm"
                >
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="order-1 w-full lg:order-2">
          <div className="mb-4 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              Supplier partner
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-brand)] text-[1.65rem] font-medium leading-tight tracking-tight text-foreground">
              {heading}
            </h1>
            {phase === 'apply' ? (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {applySubheading}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/95 px-4 py-5 shadow-[0_24px_60px_-32px_oklch(0.40_0.13_340_/_0.4)] ring-1 ring-black/[0.03] backdrop-blur-sm sm:px-7 sm:py-7">
            {phase === 'auth' && user && !isSupplier && !applicationsEnabled ? (
              <div className="space-y-4 text-center">
                <h2 className="text-lg font-semibold tracking-tight">Not a supplier account</h2>
                <p className="text-sm text-muted-foreground">
                  You’re signed in, but this account isn’t registered as a supplier.
                </p>
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl"
                  onClick={() => void handleUseDifferentAccount()}
                >
                  Use a different account
                </Button>
                <Link
                  href="/"
                  className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Back to shop
                </Link>
              </div>
            ) : phase === 'auth' ? (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                    Continue with phone
                  </h2>
                </div>

                <PhoneSignIn
                  disabled={loading || googleLoading}
                  onBusyChange={setPhoneBusy}
                  onSuccess={({ created }) => void finishAuth(created)}
                />

                <AuthDivider />

                <GoogleSignInButton
                  loading={googleLoading}
                  disabled={busy}
                  onClick={() => void handleGoogle()}
                  label="Continue with Google"
                />

                {emailOpen ? (
                  emailStep === 'identify' ? (
                    <form onSubmit={handleIdentify} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="supplier-auth-email">Email</Label>
                        <Input
                          id="supplier-auth-email"
                          type="email"
                          autoComplete="username email"
                          placeholder="you@business.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-11 rounded-xl text-base md:text-sm"
                          required
                          disabled={busy}
                          autoFocus
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={busy || !emailIsValid}
                      >
                        Continue with email
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={(event) => void handleEmailContinue(event)} className="space-y-4">
                      <div className="rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3">
                        <p className="text-xs text-muted-foreground">Signing in as</p>
                        <div className="mt-0.5 flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold">{email}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailStep('identify');
                              setPassword('');
                            }}
                            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                            disabled={busy}
                          >
                            Change
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="supplier-auth-password">Password</Label>
                        <PasswordField
                          id="supplier-auth-password"
                          value={password}
                          onChange={setPassword}
                          disabled={busy}
                          autoFocus
                        />
                        <Link
                          href="/forgot-password"
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={busy || !password}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Continue
                          </>
                        ) : (
                          'Continue with email'
                        )}
                      </Button>
                    </form>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setEmailOpen(true)}
                    disabled={busy}
                    className={cn(
                      'flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background px-4',
                      'text-sm font-semibold text-foreground shadow-sm transition',
                      'hover:border-border hover:bg-muted/40',
                      'disabled:pointer-events-none disabled:opacity-50'
                    )}
                  >
                    <Mail className="h-[18px] w-[18px] shrink-0" />
                    Continue with email
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={(event) => void handleApply(event)} className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                    Step 2 of 2
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">Business details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Signed in
                    {user?.phoneNumber || user?.email
                      ? ` as ${user.phoneNumber || user.email}`
                      : ''}
                    . Submit to get approved and start listing.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supplier-company">Company or brand</Label>
                  <Input
                    id="supplier-company"
                    value={form.companyName}
                    onChange={(event) => setField('companyName', event.target.value)}
                    className="h-11 rounded-xl text-base md:text-sm"
                    placeholder="e.g. Atelier Kampala"
                    required
                    disabled={busy}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supplier-contact">Your name</Label>
                  <Input
                    id="supplier-contact"
                    value={form.contactName}
                    onChange={(event) => setField('contactName', event.target.value)}
                    className="h-11 rounded-xl text-base md:text-sm"
                    placeholder="Primary contact"
                    required
                    disabled={busy}
                  />
                </div>

                {!user?.email ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-apply-email">Email</Label>
                    <Input
                      id="supplier-apply-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      className="h-11 rounded-xl text-base md:text-sm"
                      placeholder="you@business.com"
                      required
                      disabled={busy}
                    />
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-apply-phone">Phone</Label>
                    <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                      <span className="flex shrink-0 items-center border-r border-input bg-muted/40 px-3 text-sm font-semibold">
                        +256
                      </span>
                      <Input
                        id="supplier-apply-phone"
                        type="tel"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(event) =>
                          setField('phone', formatNationalMobileInput(event.target.value))
                        }
                        className="h-11 rounded-none border-0 text-base shadow-none focus-visible:ring-0 md:text-sm"
                        placeholder="7XX XXX XXX"
                        required
                        disabled={busy}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier-city">City</Label>
                    <Input
                      id="supplier-city"
                      value={form.city}
                      onChange={(event) => setField('city', event.target.value)}
                      className="h-11 rounded-xl text-base md:text-sm"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label>What will you list?</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SIGNUP_CATEGORIES.map((category) => {
                      const active = form.categories.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          disabled={busy}
                          onClick={() => toggleCategory(category.id)}
                          className={cn(
                            'relative rounded-xl border px-3.5 py-3.5 text-left text-sm font-semibold transition',
                            active
                              ? 'border-primary/35 bg-primary/[0.06] text-primary shadow-sm'
                              : 'border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground'
                          )}
                        >
                          {active ? (
                            <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          ) : null}
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
                  disabled={busy}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit application'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => void handleUseDifferentAccount()}
                  className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  disabled={busy}
                >
                  Use a different account
                </button>
              </form>
            )}
          </div>

          {phase === 'auth' && applicationsEnabled ? (
            <p className="mt-4 hidden text-center text-sm text-muted-foreground sm:mt-5 sm:block">
              Already approved? Sign in above and you’ll go straight to orders.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
