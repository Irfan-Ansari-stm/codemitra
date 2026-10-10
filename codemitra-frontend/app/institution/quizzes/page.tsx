'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';
import { useAuthStore } from '@/store/authStore';

export default function QuizzesPage() {
  const client = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const [title, setTitle] = useState('');
  const query = useQuery({ queryKey: ['quizzes'], queryFn: () => quizApi.list().then((r) => r.data.data) });
  const create = useMutation({ mutationFn: (body: { title: string }) => quizApi.create(body), onSuccess: () => { setTitle(''); client.invalidateQueries({ queryKey: ['quizzes'] }); } });
  const start = useMutation({ mutationFn: (id: string) => quizApi.startAttempt(id) });
  return <main className="space-y-5"><PageHeading title="Quizzes" description="Assessments available to your institution." />
    {(role === 'super_admin' || role === 'institution_admin') && <form className="flex max-w-xl gap-2" onSubmit={(e) => { e.preventDefault(); if (title.trim()) create.mutate({ title: title.trim() }); }}><input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="New quiz title" className="min-w-0 flex-1 rounded border px-3 py-2 dark:bg-gray-900" /><button disabled={create.isPending} className="rounded bg-primary px-4 py-2 text-white">Create quiz</button></form>}
    {(create.error || start.error) && <p role="alert" className="text-red-600">{((create.error || start.error) as Error).message}</p>}
    <ApiDataView title="Quizzes" data={query.data} isLoading={query.isLoading} error={query.error} onRetry={() => query.refetch()} />
    <div className="flex flex-wrap gap-2">{(query.data || []).map((quiz: any) => <button key={quiz.id} onClick={() => start.mutate(quiz.id)} disabled={start.isPending} className="rounded border px-3 py-2">Start: {quiz.title}</button>)}</div>
    {start.data && <ApiDataView title="Quiz attempt" data={start.data.data.data} />}
  </main>;
}
