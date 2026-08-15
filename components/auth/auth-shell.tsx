import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  children: React.ReactNode;
  heading: string;
  subheading?: string;
  /** Wider panel for multi-step partner applications. */
  size?: 'default' | 'wide';
  /** Optional eyebrow above the heading (e.g. Supplier · Apply). */
  eyebrow?: string;
  footer?: React.ReactNode;
};

export function AuthShell({
  children,
  heading,
  subheading,
  size = 'default',
  eyebrow,
  footer,
}: AuthShellProps) {
  const defaultSubheading = `Welcome to ${BRAND_NAME}`;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[oklch(0.985_0.012_350)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.92_0.04_340_/_0.7),transparent_58%),radial-gradient(ellipse_55%_45%_at_100%_20%,oklch(0.94_0.05_62_/_0.35),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,oklch(0.93_0.03_350_/_0.45),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-primary/[0.06] to-transparent"
      />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div
          className={cn(
            'w-full',
            size === 'wide' ? 'max-w-[34rem]' : 'max-w-[26.5rem]'
          )}
        >
          <div className="mb-8 flex flex-col items-center text-center sm:mb-9">
            <BrandLogo variant="auth" href="/" className="mb-7" />
            {eyebrow ? (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-[family-name:var(--font-brand)] text-[1.85rem] font-medium leading-tight tracking-tight text-foreground sm:text-[2.15rem]">
              {heading}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {subheading ?? defaultSubheading}
            </p>
          </div>

          <div
            className={cn(
              'rounded-2xl border border-border/70 bg-card/90 px-5 py-7 shadow-[0_20px_50px_-28px_oklch(0.40_0.13_340_/_0.35)] backdrop-blur-sm sm:px-8 sm:py-8',
              'ring-1 ring-black/[0.03]'
            )}
          >
            {children}
          </div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 pb-8 text-xs text-muted-foreground">
        <Link href="/" className="transition hover:text-foreground">
          Home
        </Link>
        <Link href="/privacy" className="transition hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="transition hover:text-foreground">
          Terms
        </Link>
        <Link href="/contact" className="transition hover:text-foreground">
          Help
        </Link>
      </footer>
    </div>
  );
}

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/80" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

export function AuthSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}
