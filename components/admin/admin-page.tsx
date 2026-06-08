import { cn } from '@/lib/utils';

export function AdminPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-4 pb-8 sm:px-6 sm:py-6 md:p-8', className)}>{children}</div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 justify-end md:ml-6 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_button]:inline-flex">
          {action}
        </div>
      )}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-base sm:text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
    />
  );
}
