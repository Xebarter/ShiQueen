import { Suspense } from 'react';
import { AdminMessagesPage } from '@/components/admin/admin-messages-page';
import { Loader2 } from 'lucide-react';

export default function AdminMessagesRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminMessagesPage />
    </Suspense>
  );
}
