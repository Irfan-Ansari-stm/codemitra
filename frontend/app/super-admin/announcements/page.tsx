'use client';

import { Megaphone } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function AnnouncementsPage() {
  return (
    <PlatformModulePlaceholder
      category="Operations & Workflow"
      title="Broadcast & Announcements"
      description="Publish platform-wide announcements, scheduled maintenance banners, contest news, and targeted messages to specific institutes."
      icon={Megaphone}
      badge="Global Broadcast"
      features={[
        'Global dismissible top-bar banners with rich text and CTA buttons',
        'Targeted broadcasts: all students, specific institutes, or faculty only',
        'Scheduled publishing with automated expiry and archive states',
        'Emergency maintenance alerts with countdown timer widget',
        'In-app notification sync and email digest integration',
        'Click-through tracking and announcement acknowledgment logs',
      ]}
      stats={[
        { label: 'Active Broadcasts', value: '2 Banners', hint: 'Platform-wide' },
        { label: 'Total Reach', value: '18,400 Users', hint: 'Delivered in-app' },
        { label: 'Click Rate', value: '24.6%', hint: 'Engagement metric' },
        { label: 'Targeting', value: 'Role & Institute', hint: 'Multi-tenant filtered' },
      ]}
      primaryActionLabel="Create Announcement"
    />
  );
}
