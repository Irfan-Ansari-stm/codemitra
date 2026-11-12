'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { announcementApi } from '@/lib/api';
import { ApiDataView, PageHeading } from '@/components/data/ApiDataView';

export default function AnnouncementsPage() {
  const [result, setResult] = useState<unknown>();
  const create = useMutation({ mutationFn: (body: { title: string; content: string }) => announcementApi.create(body), onSuccess: (response) => setResult(response.data.data) });
  return <main className="space-y-5"><PageHeading title="Announcements" description="Send an announcement to the students in your institution." />
    <form className="max-w-2xl space-y-3 rounded-lg border bg-white p-5 dark:bg-gray-900" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); create.mutate({ title: String(form.get('title')), content: String(form.get('content')) }); }}>
      <input name="title" required minLength={2} placeholder="Announcement title" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
      <textarea name="content" required placeholder="Announcement message" className="min-h-32 w-full rounded border px-3 py-2 dark:bg-gray-800" />
      <button disabled={create.isPending} className="rounded bg-primary px-4 py-2 text-white">Send announcement</button>
    </form>
    {create.error && <p role="alert" className="text-red-600">{(create.error as Error).message}</p>}
    {result !== undefined && <ApiDataView title="Created announcement" data={result} />}
  </main>;
}
