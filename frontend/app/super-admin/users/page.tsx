'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage, tenantApi, userApi } from '@/lib/api';

type UserRole = 'institution_admin' | 'institution_student';
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
};
type TenantRow = { id: string; name: string; slug: string };
type UserForm = { name: string; email: string; password: string; role: UserRole; tenantId: string; isActive: boolean };

const blankForm: UserForm = { name: '', email: '', password: '', role: 'institution_student', tenantId: '', isActive: true };

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserForm>(blankForm);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
  const institutionAdmins = useQuery({
    queryKey: ['super-admin-users', 'institution_admin'],
    queryFn: () => userApi.list({ role: 'institution_admin', page: 1, limit: 100 }).then((response) => response.data.data as UserRow[]),
  });
  const institutionStudents = useQuery({
    queryKey: ['super-admin-users', 'institution_student'],
    queryFn: () => userApi.list({ role: 'institution_student', page: 1, limit: 100 }).then((response) => response.data.data as UserRow[]),
  });
  const tenants = useQuery({
    queryKey: ['tenants', 'super-admin-users'],
    queryFn: () => tenantApi.list(1, 100).then((response) => response.data.data as TenantRow[]),
  });
  const selectedUser = useQuery({
    queryKey: ['super-admin-user', viewing],
    queryFn: () => userApi.get(viewing!).then((response) => response.data.data),
    enabled: !!viewing,
  });
  const saveMutation = useMutation({
    mutationFn: () => editing
      ? userApi.update(editing.id, { name: form.name.trim(), isActive: form.isActive })
      : userApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        tenantId: form.tenantId,
      }),
    onSuccess: () => {
      void refreshUsers();
      setDialogOpen(false);
      setEditing(null);
      setForm(blankForm);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: refreshUsers,
  });

  function openCreate(role: UserRole) {
    setEditing(null);
    setForm({ ...blankForm, role });
    saveMutation.reset();
    setDialogOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setForm({ ...blankForm, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id ?? '', isActive: user.is_active });
    saveMutation.reset();
    setDialogOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const loadError = institutionAdmins.error || institutionStudents.error || tenants.error;

  function renderSection(title: string, description: string, records: UserRow[], loading: boolean, role: UserRole) {
    const addLabel = role === 'institution_admin' ? 'institution admin' : 'institution student';
    return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div><h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">{description} · {records.length} shown</p></div>
        <button type="button" onClick={() => openCreate(role)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={15} /> Add {addLabel}</button>
      </header>
      {loading ? <p className="p-5 text-sm text-slate-500">Loading users…</p> : records.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No users in this section yet.</p> : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40"><tr>{['User', 'Role', 'Institution', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map((user) => <tr key={user.id} className="text-slate-700 dark:text-slate-300">
            <td className="px-4 py-3"><p className="font-medium text-slate-900 dark:text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td>
            <td className="px-4 py-3 capitalize">{user.role.replaceAll('_', ' ')}</td>
            <td className="px-4 py-3">{tenants.data?.find((tenant) => tenant.id === user.tenant_id)?.name ?? (user.tenant_id ? 'Institution' : '—')}</td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${user.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td className="px-4 py-3"><div className="flex items-center gap-1">
              <button type="button" title="View user" aria-label={`View ${user.name}`} onClick={() => setViewing(user.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={15} /></button>
              <button type="button" title="Edit user" aria-label={`Edit ${user.name}`} onClick={() => openEdit(user)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15} /></button>
              <button type="button" title="Delete user" aria-label={`Delete ${user.name}`} disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${user.name}'s account?`)) deleteMutation.mutate(user.id); }} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15} /></button>
            </div></td>
          </tr>)}
        </tbody></table>
      </div>}
    </section>;
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Institution users</h1><p className="mt-1 text-sm text-slate-500">Manage institution administrators and students separately from general users.</p></div><Link href="/super-admin/general-users" className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/60">View general users</Link></header>
    {loadError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{getErrorMessage(loadError)} <button type="button" onClick={() => { void institutionAdmins.refetch(); void institutionStudents.refetch(); void tenants.refetch(); }} className="ml-2 font-medium underline">Retry</button></div>}
    {deleteMutation.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(deleteMutation.error)}</p>}
    {renderSection('Institution admins', 'Administrators assigned to an institution', institutionAdmins.data ?? [], institutionAdmins.isLoading, 'institution_admin')}
    {renderSection('Institution students', 'Students assigned to an institution', institutionStudents.data ?? [], institutionStudents.isLoading, 'institution_student')}

    {dialogOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4"><div><h2 id="user-form-title" className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? 'Update user' : 'Create user'}</h2><p className="mt-1 text-xs text-slate-500">{editing ? 'Update profile details or access status.' : 'The account is created in the selected user section.'}</p></div><button type="button" aria-label="Close form" onClick={() => setDialogOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full name<input required minLength={2} maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        {!editing && <>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Initial password<input type="password" required minLength={8} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">Account type: {form.role.replaceAll('_', ' ')}</p>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Institution<select required value={form.tenantId} onChange={(event) => setForm({ ...form, tenantId: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Select an institution</option>{(tenants.data ?? []).map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
        </>}
        {editing && <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Account active</label>}
        {saveMutation.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(saveMutation.error)}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" disabled={saveMutation.isPending || !form.tenantId} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create account'}</button></div>
      </form>
    </section></div>}

    {viewing && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="user-detail-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between"><h2 id="user-detail-title" className="text-lg font-semibold text-slate-950 dark:text-white">User details</h2><button type="button" aria-label="Close details" onClick={() => setViewing(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>{selectedUser.isLoading ? <p className="py-6 text-sm text-slate-500">Loading user…</p> : selectedUser.error ? <p role="alert" className="py-6 text-sm text-rose-700">{getErrorMessage(selectedUser.error)}</p> : <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">{Object.entries(selectedUser.data ?? {}).filter(([key]) => !/password|token|secret/i.test(key)).map(([key, value]) => <div key={key} className="contents"><dt className="capitalize text-slate-500">{key.replaceAll('_', ' ')}</dt><dd className="break-words text-slate-800 dark:text-slate-200">{value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>}</section></div>}
  </div>;
}
