'use client';

import { ProviderShell } from '@/components/provider/provider-shell';
import { PartnerSettingsForm } from '@/components/partner/partner-settings-form';
import { PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';

export default function ProviderSettingsPage() {
  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Account"
          title="Settings"
          description="Account security and notification preferences."
        />
        <PartnerSettingsForm />
      </PartnerPage>
    </ProviderShell>
  );
}
