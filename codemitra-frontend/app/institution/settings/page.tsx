'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { PageHeading } from '@/components/data/ApiDataView';

export default function Page() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const profile = useQuery({ queryKey: ['profile'], queryFn: () => authApi.getProfile().then((r) => r.data.data) });
  const update = useMutation({ mutationFn: (body: Record<string, string>) => authApi.updateProfile(body), onSuccess: () => { setMessage('Profile updated.'); queryClient.invalidateQueries({ queryKey: ['profile'] }); } });
  const changePassword = useMutation({ mutationFn: (body: { currentPassword: string; newPassword: string }) => authApi.changePassword(body.currentPassword, body.newPassword), onSuccess: () => setMessage('Password changed. Sign in again with the new password.') });

  return (
    <div className="space-y-6">
      <PageHeading title="Account Settings" description="Update your profile and password." />
      {profile.error && <p role="alert" className="text-red-600">Could not load your profile. Sign in again and retry.</p>}
      <form className="max-w-xl space-y-4 rounded-lg border bg-white p-6 dark:bg-gray-900" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); update.mutate({ name: String(form.get('name') || ''), phone: String(form.get('phone') || ''), bio: String(form.get('bio') || '') }); }}>
        <h2 className="text-xl font-semibold">Profile</h2>
        <label className="block">Name<input name="name" defaultValue={profile.data?.name || ''} required className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" /></label>
        <label className="block">Phone<input name="phone" defaultValue={profile.data?.phone || ''} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" /></label>
        <label className="block">Bio<textarea name="bio" defaultValue={profile.data?.bio || ''} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" /></label>
        <button disabled={update.isPending} className="rounded bg-primary px-4 py-2 text-white">Save profile</button>
      </form>
      <form className="max-w-xl space-y-4 rounded-lg border bg-white p-6 dark:bg-gray-900" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); changePassword.mutate({ currentPassword: String(form.get('currentPassword')), newPassword: String(form.get('newPassword')) }); }}>
        <h2 className="text-xl font-semibold">Change password</h2>
        <label className="block">Current password<input name="currentPassword" type="password" required className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" /></label>
        <label className="block">New password<input name="newPassword" type="password" minLength={8} required className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" /></label>
        <button disabled={changePassword.isPending} className="rounded bg-primary px-4 py-2 text-white">Change password</button>
      </form>
      {(update.error || changePassword.error) && <p role="alert" className="text-red-600">{((update.error || changePassword.error) as Error).message}</p>}
      {message && <p role="status" className="text-green-700">{message}</p>}
    </div>
  );
}
