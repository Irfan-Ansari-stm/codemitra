'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const query = useQuery({ queryKey: ['tenants'], queryFn: () => tenantApi.list().then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <PageHeading title="Institutions" description="Tenant records from the API." />
      <ApiDataView title="Institutions" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
