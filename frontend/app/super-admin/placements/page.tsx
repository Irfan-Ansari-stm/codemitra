'use client';

import { Briefcase } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function PlacementsPage() {
  return (
    <PlatformModulePlaceholder
      category="Operations & Workflow"
      title="Campus Drives & Placements"
      description="Connect university students with hiring partners, organize campus placement coding rounds, and manage candidate shortlists."
      icon={Briefcase}
      badge="Career Portal"
      features={[
        'Corporate partner job board with coding eligibility cutoffs',
        'Company-specific screening assessments with custom problem tags',
        'Student resume, GitHub, and verified CodeMitra coding portfolio exports',
        'Institute placement cell dashboard for tracking hiring ratios',
        'Interview scheduling and candidate status progression tracker',
        'Salary offer benchmarks and placement analytics per batch',
      ]}
      stats={[
        { label: 'Hiring Partners', value: '38 Companies', hint: 'Tech recruiters' },
        { label: 'Open Drives', value: '14 Active', hint: 'Across tech stacks' },
        { label: 'Shortlisted', value: '420 Students', hint: 'Passed screening' },
        { label: 'Average Package', value: '$72,000 / ₹12 LPA', hint: 'Placement metric' },
      ]}
      primaryActionLabel="Post Campus Drive"
    />
  );
}
