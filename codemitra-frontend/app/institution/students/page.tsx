'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['students'], queryFn: () => userApi.list({ role: 'institution_student', limit: 50 }).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Students" description="Student accounts in your institution." />
      <ApiDataView title="Students" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
