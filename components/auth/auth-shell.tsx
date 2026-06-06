import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  children: React.ReactNode;
  heading: string;
  subheading?: string;
};

export function AuthShell({ children, heading, subheading }: AuthShellProps) {
  const defaultSubheading = `to continue to ${BRAND_NAME}`;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div
          className={cn(
            'w-full max-w-[28rem] rounded-lg border border-border bg-card px-6 py-9 sm:px-10 sm:py-11',
            'shadow-sm'
          )}
        >
          <div className="mb-7">
            <BrandLogo variant="icon" href="/" className="mb-6" />
            <h1 className="text-2xl font-normal tracking-tight text-foreground">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
              {subheading ?? defaultSubheading}
            </p>
          </div>

          {children}
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 pb-8 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/contact" className="hover:text-foreground">
          Help
        </Link>
      </footer>
    </div>
  );
}
