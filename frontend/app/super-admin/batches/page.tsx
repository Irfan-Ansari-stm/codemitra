'use client';

import { GraduationCap } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function BatchesPage() {
  return (
    <PlatformModulePlaceholder
      category="Platform Administration"
      title="Batches & Cohorts"
      description="Manage academic student batches, graduation cohorts, section allocations, and semester-wise learning schedules across enrolled institutes."
      icon={GraduationCap}
      badge="Academic Structure"
      features={[
        'Cohort and batch grouping by academic year, semester, and section',
        'Bulk student enrollment and batch transfer workflows',
        'Curriculum milestone tracking per batch with pacing indicators',
        'Batch-level performance metrics, attendance, and assignment completion',
        'Instructor and TA assignment per cohort',
        'Automated batch graduation and academic archiving',
      ]}
      stats={[
        { label: 'Active Batches', value: '14 Cohorts', hint: 'Across 6 Institutes' },
        { label: 'Enrolled Students', value: '1,280', hint: 'Active learners' },
        { label: 'Average Progress', value: '78%', hint: 'On-track pacing' },
        { label: 'Graduation Due', value: '3 Batches', hint: 'Spring 2026' },
      ]}
      primaryActionLabel="Create New Batch"
    />
  );
}
