'use client';

import { useQuery } from '@tanstack/react-query';
import { problemApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['institution-problems'], queryFn: () => problemApi.list({ limit: 50 }).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Problems" description="Problems available to this institution." />
      <ApiDataView title="Problems" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
