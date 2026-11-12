'use client';

import { Award } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function CertificatesPage() {
  return (
    <PlatformModulePlaceholder
      category="Platform Administration"
      title="Certificates & Credentials"
      description="Issue tamper-proof digital certificates, cryptographic badges, and verifiable course/contest completion credentials with QR verification."
      icon={Award}
      badge="Credentials & Badging"
      features={[
        'Automated credential issuance upon 100% course or contest completion',
        'Cryptographic hash signature and public verification URL with QR code',
        'Custom SVG / PDF certificate template visual builder',
        'LinkedIn Add-to-Profile and verifiable badge integrations',
        'Revocation registry and student honor certificate reissue workflows',
        'Institute co-branding with university signatures and official seals',
      ]}
      stats={[
        { label: 'Issued Certificates', value: '3,840', hint: 'Verified credentials' },
        { label: 'Templates Active', value: '12 Designs', hint: 'Co-branded formats' },
        { label: 'Verification Rate', value: '99.9%', hint: 'Public QR lookups' },
        { label: 'LinkedIn Shares', value: '1,420', hint: 'Social engagement' },
      ]}
      primaryActionLabel="Design Certificate Template"
    />
  );
}
