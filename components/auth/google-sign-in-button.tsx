import { cn } from '@/lib/utils';
import { GoogleIcon } from '@/components/auth/google-icon';
import { Loader2 } from 'lucide-react';

type GoogleSignInButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
};

export function GoogleSignInButton({
  loading = false,
  disabled = false,
  onClick,
  label = 'Sign in with Google',
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background px-4',
        'text-sm font-semibold text-foreground shadow-sm transition',
        'hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
    >
      {loading ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      ) : (
        <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
      )}
      {label}
    </button>
  );
}
