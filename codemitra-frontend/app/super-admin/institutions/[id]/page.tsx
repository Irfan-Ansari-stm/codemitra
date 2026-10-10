'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: ['tenant', id], queryFn: () => tenantApi.get(id).then((r) => r.data.data), enabled: !!id });

  return (
    <div className="space-y-6">
      <PageHeading title={query.data?.name || 'Institution Details'} />
      <ApiDataView title="Institution" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    </div>
  );
}
