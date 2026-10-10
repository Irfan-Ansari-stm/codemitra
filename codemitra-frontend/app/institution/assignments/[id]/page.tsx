'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { assignmentApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';
import { useAuthStore } from '@/store/authStore';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const role = useAuthStore((state) => state.user?.role);
  const query = useQuery({ queryKey: ['assignment', id], queryFn: () => assignmentApi.get(id).then((r) => r.data.data), enabled: !!id });
  const submit = useMutation({ mutationFn: () => assignmentApi.submit(id) });

  return (
    <div className="space-y-6">
      <PageHeading title={query.data?.title || 'Assignment Details'} description={query.data?.description} />
      <ApiDataView title="Assignment" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
      {(role === 'institution_student' || role === 'general_student') && <button onClick={() => submit.mutate()} disabled={submit.isPending} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">{submit.isPending ? 'Submitting…' : 'Submit assignment'}</button>}
      {submit.error && <p role="alert" className="text-red-600">Unable to submit assignment. Check your access and try again.</p>}
    </div>
  );
}
