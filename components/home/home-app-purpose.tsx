import { BRAND_NAME, OAUTH_PRIVACY_URL, OAUTH_TERMS_URL } from '@/lib/brand';

/** Static HTML (no animation) so Google’s branding crawler can read name, purpose, and privacy. */
export function HomeAppPurpose() {
  return (
    <section
      id="app-purpose"
      aria-labelledby="app-name"
      className="border-b border-border/70 bg-secondary/25"
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Application name
        </p>
        <h1
          id="app-name"
          className="mt-2 font-[family-name:var(--font-brand)] text-4xl font-medium tracking-tight text-foreground sm:text-5xl"
        >
          {BRAND_NAME}
        </h1>

        <h2 className="mt-8 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Purpose of this application
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">
          ShiQueen is a web application for women in Uganda. It lets customers shop fashion,
          beauty, and wellness products, buy curated packages, and book lifestyle services such
          as makeup, hair, and nails. You can browse the shop, packages, and services without
          creating an account or signing in.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90 sm:text-base">
          <li>Shop ladies&apos; fashion, beauty, and wellness products with delivery across Uganda.</li>
          <li>Buy curated packages that bundle products and beauty services.</li>
          <li>Book makeup, hair, nails, and other lifestyle appointments.</li>
          <li>Optionally create an account to save favorites, place orders, and manage bookings.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Why this application requests Google user data
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">
          ShiQueen offers optional Sign in with Google so you can create or open a ShiQueen
          account without a password. We request only basic identity information: your name,
          email address, and profile photo. We use that data solely to create and authenticate
          your account, show your name and photo in the app, save favorites, place orders, and
          manage bookings. We do not access Gmail, Contacts, Drive, Calendar, or any other
          Google service. We do not sell Google user data and we do not use it for advertising.
        </p>

        <p className="mt-6 text-sm leading-relaxed text-foreground sm:text-base">
          Read how we collect, use, store, and share this information in our{' '}
          <a
            href={OAUTH_PRIVACY_URL}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Privacy Policy
          </a>
          . The same policy is linked from the Google sign-in consent screen. You can also read
          our{' '}
          <a
            href={OAUTH_TERMS_URL}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Terms of Service
          </a>
          .
        </p>
      </div>
    </section>
  );
}
