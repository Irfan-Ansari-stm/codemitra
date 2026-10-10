'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['all-users'], queryFn: () => userApi.list({ limit: 50 }).then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Users" description="User records in your institution." />
      <ApiDataView title="Users" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
