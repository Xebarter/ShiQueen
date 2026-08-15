'use client';

import { SupplierShell } from '@/components/supplier/supplier-shell';
import { PartnerSettingsForm } from '@/components/partner/partner-settings-form';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';

export default function SupplierSettingsPage() {
  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader title="Settings" />
        <PartnerSettingsForm />
      </PartnerPage>
    </SupplierShell>
  );
}
