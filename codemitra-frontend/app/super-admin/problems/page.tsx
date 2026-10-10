'use client';

import { useQuery } from '@tanstack/react-query';
import { problemApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['global-problems'], queryFn: () => problemApi.list({ scope: 'public', limit: 50 }).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Global Problems" description="Public coding problems managed on the platform." />
      <ApiDataView title="Global problems" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
