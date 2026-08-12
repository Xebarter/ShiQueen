import { figtree } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={cn(figtree.className, 'min-h-[100dvh]')}>{children}</div>;
}
