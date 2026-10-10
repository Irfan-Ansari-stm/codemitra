'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function NotificationsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.list({ unreadOnly: false }).then((r) => r.data.data) });
  const markRead = useMutation({ mutationFn: () => notificationApi.markRead(), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  return <main className="space-y-4"><PageHeading title="Notifications" description="Your account and institution updates." />
    <button onClick={() => markRead.mutate()} disabled={markRead.isPending} className="rounded bg-primary px-4 py-2 text-white">Mark all read</button>
    {markRead.error && <p role="alert" className="text-red-600">Could not update notifications.</p>}
    <ApiDataView title="Notifications" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
  </main>;
}
