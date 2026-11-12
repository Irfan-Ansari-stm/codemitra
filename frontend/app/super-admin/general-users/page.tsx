'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage, userApi } from '@/lib/api';

type GeneralUser = {
  id: string;
  name: string;
  email: string;
  role: 'general_student';
  is_active: boolean;
  created_at: string;
};
type Form = { name: string; email: string; password: string; isActive: boolean };
const blankForm: Form = { name: '', email: '', password: '', isActive: true };

export default function GeneralUsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(blankForm);
  const [editing, setEditing] = useState<GeneralUser | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const users = useQuery({
    queryKey: ['super-admin-general-users'],
    queryFn: () => userApi.list({ role: 'general_student', page: 1, limit: 100 }).then((response) => response.data.data as GeneralUser[]),
  });
  const selectedUser = useQuery({
    queryKey: ['super-admin-general-user', viewing],
    queryFn: () => userApi.get(viewing!).then((response) => response.data.data),
    enabled: !!viewing,
  });
  const save = useMutation({
    mutationFn: () => editing
      ? userApi.update(editing.id, { name: form.name.trim(), isActive: form.isActive })
      : userApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'general_student',
        tenantId: null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-general-users'] });
      setFormOpen(false);
      setEditing(null);
      setForm(blankForm);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-general-users'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    save.reset();
    setFormOpen(true);
  }
  function openEdit(user: GeneralUser) {
    setEditing(user);
    setForm({ ...blankForm, name: user.name, email: user.email, isActive: user.is_active });
    save.reset();
    setFormOpen(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">General users</h1><p className="mt-1 text-sm text-slate-500">Standalone general-student accounts; these users are not attached to an institution.</p><Link href="/super-admin/users" className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">Go to institution users</Link></div>
      <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Add general student</button>
    </header>
    {users.error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{getErrorMessage(users.error)} <button type="button" onClick={() => users.refetch()} className="ml-2 font-medium underline">Retry</button></div>}
    {remove.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(remove.error)}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 p-4 dark:border-slate-800"><h2 className="text-sm font-semibold text-slate-900 dark:text-white">General student accounts</h2><p className="mt-1 text-xs text-slate-500">{users.isLoading ? 'Loading accounts…' : `${users.data?.length ?? 0} accounts shown`}</p></header>
      {users.isLoading ? <p className="p-6 text-sm text-slate-500">Loading general users…</p> : !users.data?.length ? <div className="p-10 text-center"><p className="text-sm text-slate-500">No general student accounts found.</p><p className="mt-1 text-xs text-slate-400">Institution admins and institution students are listed separately under Institution users.</p></div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40"><tr>{['General student', 'Status', 'Joined', 'Actions'].map((title) => <th key={title} className="px-4 py-3 font-medium">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.data.map((user) => <tr key={user.id} className="text-slate-700 dark:text-slate-300">
            <td className="px-4 py-3"><p className="font-medium text-slate-900 dark:text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${user.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td className="px-4 py-3 text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" aria-label={`View ${user.name}`} title="View general student" onClick={() => setViewing(user.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={15} /></button><button type="button" aria-label={`Edit ${user.name}`} title="Edit general student" onClick={() => openEdit(user)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15} /></button><button type="button" aria-label={`Delete ${user.name}`} title="Delete general student" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete ${user.name}'s general account?`)) remove.mutate(user.id); }} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15} /></button></div></td>
          </tr>)}
        </tbody></table>
      </div>}
    </section>

    {formOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="general-user-form-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
      <div className="flex items-start justify-between"><div><h2 id="general-user-form-title" className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? 'Update general student' : 'Create general student'}</h2><p className="mt-1 text-xs text-slate-500">General students do not belong to an institution.</p></div><button type="button" aria-label="Close form" onClick={() => setFormOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full name<input required minLength={2} maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        {!editing && <><label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Initial password<input type="password" required minLength={8} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label></>}
        {editing && <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Account active</label>}
        {save.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(save.error)}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" disabled={save.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create general student'}</button></div>
      </form>
    </section></div>}

    {viewing && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="general-user-details-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between"><h2 id="general-user-details-title" className="text-lg font-semibold text-slate-950 dark:text-white">General student details</h2><button type="button" aria-label="Close details" onClick={() => setViewing(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>{selectedUser.isLoading ? <p className="py-6 text-sm text-slate-500">Loading account…</p> : selectedUser.error ? <p role="alert" className="py-6 text-sm text-rose-700">{getErrorMessage(selectedUser.error)}</p> : <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">{Object.entries(selectedUser.data ?? {}).filter(([key]) => !/password|token|secret/i.test(key)).map(([key, value]) => <div key={key} className="contents"><dt className="capitalize text-slate-500">{key.replaceAll('_', ' ')}</dt><dd className="break-words text-slate-800 dark:text-slate-200">{value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>}</section></div>}
  </div>;
}
