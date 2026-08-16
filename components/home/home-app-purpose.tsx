import Link from 'next/link';
import { BRAND_NAME, BRAND_PURPOSE, BRAND_PURPOSE_POINTS } from '@/lib/brand';

/** Server-rendered so Google’s branding crawler sees the exact app name and purpose. */
export function HomeAppPurpose() {
  return (
    <div className="max-w-xl">
      <h1 className="font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        {BRAND_NAME}
      </h1>
      <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        Purpose of this application
      </h2>
      <p data-speakable className="mt-2 text-sm leading-relaxed text-foreground/90 sm:text-base">
        {BRAND_PURPOSE}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
        {BRAND_PURPOSE_POINTS.map((point) => (
          <li key={point.title}>
            <span className="font-medium text-foreground">{point.title}.</span> {point.text}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <Link href="/shop" className="font-medium text-primary hover:underline">
          Shop
        </Link>
        <span aria-hidden>·</span>
        <Link href="/packages" className="hover:text-foreground">
          Packages
        </Link>
        <span aria-hidden>·</span>
        <Link href="/services" className="hover:text-foreground">
          Book services
        </Link>
        <span aria-hidden>·</span>
        <Link href="/sign-in" className="hover:text-foreground">
          Sign in with Google
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
