'use client';

import { FileCode } from 'lucide-react';
import { PlatformModulePlaceholder } from '@/components/common/PlatformModulePlaceholder';

export default function GlobalSubmissionsPage() {
  return (
    <PlatformModulePlaceholder
      category="Platform Administration"
      title="Global Submissions & Code Reviews"
      description="Inspect real-time student code submissions across all problems, run MOSS-compatible similarity detection, and audit evaluation verdicts."
      icon={FileCode}
      badge="Live Evaluation Stream"
      features={[
        'Real-time stream of all problem submissions across institutes and general users',
        'Verdict breakdown: Accepted, Wrong Answer, TLE, Memory Limit, Runtime Error',
        'Multi-language telemetry: execution time (ms), memory (KB), engine (WASM / Judge0)',
        'MOSS-based plagiarism and code similarity scanning engine',
        'Detailed line-by-line diff inspector with submission diffing',
        'Manual re-judge and bulk evaluation triggers',
      ]}
      stats={[
        { label: 'Total Submissions', value: '48,920', hint: 'All-time evaluations' },
        { label: 'Accepted Rate', value: '62.4%', hint: 'Platform average' },
        { label: 'WASM Handled', value: '94.8%', hint: 'Zero server latency' },
        { label: 'Flagged for Review', value: '18 Submissions', hint: 'Similarity > 85%' },
      ]}
      primaryActionLabel="Run Plagiarism Scan"
    />
  );
}
