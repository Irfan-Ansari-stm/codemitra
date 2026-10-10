'use client';

import { useQuery } from '@tanstack/react-query';
import { assignmentApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['assignments'], queryFn: () => assignmentApi.list().then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Assignments" description="Assignment data loaded from the API." />
      <ApiDataView title="Assignments" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
