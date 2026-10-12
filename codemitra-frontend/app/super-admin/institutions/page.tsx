'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage, tenantApi } from '@/lib/api';

type Institution = {
  id: string;
  name: string;
  slug: string;
  plan: 'trial' | 'basic' | 'pro' | 'enterprise';
  max_students: number;
  is_active: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  address?: string | null;
  created_at: string;
};
type FormValues = {
  name: string;
  slug: string;
  plan: Institution['plan'];
  maxStudents: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  address: string;
  isActive: boolean;
};

const blankForm: FormValues = { name: '', slug: '', plan: 'trial', maxStudents: '50', contactEmail: '', contactPhone: '', websiteUrl: '', address: '', isActive: true };

export default function SuperAdminInstitutionsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormValues>(blankForm);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const institutions = useQuery({
    queryKey: ['super-admin-institutions'],
    queryFn: () => tenantApi.list(1, 100).then((response) => response.data.data as Institution[]),
  });
  const selected = useQuery({
    queryKey: ['super-admin-institution', viewing],
    queryFn: () => tenantApi.get(viewing!).then((response) => response.data.data),
    enabled: !!viewing,
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        plan: form.plan,
        maxStudents: Number(form.maxStudents),
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        address: form.address.trim() || undefined,
        ...(editing ? { isActive: form.isActive } : {}),
      };
      return editing ? tenantApi.update(editing.id, payload) : tenantApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institutions'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(blankForm);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-institutions'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    saveMutation.reset();
    setDialogOpen(true);
  }
  function openEdit(institution: Institution) {
    setEditing(institution);
    setForm({
      name: institution.name,
      slug: institution.slug,
      plan: institution.plan,
      maxStudents: String(institution.max_students),
      contactEmail: institution.contact_email ?? '',
      contactPhone: institution.contact_phone ?? '',
      websiteUrl: institution.website_url ?? '',
      address: institution.address ?? '',
      isActive: institution.is_active,
    });
    saveMutation.reset();
    setDialogOpen(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Platform administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Institutions</h1><p className="mt-1 text-sm text-slate-500">Create, review, update, and deactivate platform institutions.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Add institution</button></header>
    {institutions.error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{getErrorMessage(institutions.error)} <button type="button" onClick={() => institutions.refetch()} className="ml-2 font-medium underline">Retry</button></div>}
    {deleteMutation.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(deleteMutation.error)}</p>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {institutions.isLoading ? <p className="p-6 text-sm text-slate-500">Loading institutions…</p> : !institutions.data?.length ? <p className="p-10 text-center text-sm text-slate-500">No institutions yet. Create one to get started.</p> : <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40"><tr>{['Institution', 'Slug', 'Plan', 'Student limit', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {institutions.data?.map((institution) => <tr key={institution.id} className="text-slate-700 dark:text-slate-300">
            <td className="px-4 py-3"><Link href={`/super-admin/institutions/${institution.id}`} className="font-medium text-blue-700 hover:underline dark:text-blue-300">{institution.name}</Link><p className="mt-0.5 text-xs text-slate-500">{institution.contact_email || 'No contact email'}</p></td>
            <td className="px-4 py-3 text-xs">{institution.slug}</td><td className="px-4 py-3 capitalize">{institution.plan}</td><td className="px-4 py-3 tabular-nums">{institution.max_students}</td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${institution.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{institution.is_active ? 'Active' : 'Inactive'}</span></td>
            <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" aria-label={`View ${institution.name}`} title="View institution" onClick={() => setViewing(institution.id)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={15} /></button><button type="button" aria-label={`Edit ${institution.name}`} title="Edit institution" onClick={() => openEdit(institution)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800"><Pencil size={15} /></button><button type="button" aria-label={`Delete ${institution.name}`} title="Delete institution" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${institution.name}? Existing student and course history will be retained.`)) deleteMutation.mutate(institution.id); }} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40"><Trash2 size={15} /></button></div></td>
          </tr>)}
        </tbody></table>
      </div>}
    </section>

    {dialogOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="institution-form-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4"><div><h2 id="institution-form-title" className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? 'Update institution' : 'Create institution'}</h2><p className="mt-1 text-xs text-slate-500">Institution slug is used in workspace URLs.</p></div><button type="button" aria-label="Close institution form" onClick={() => setDialogOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Name<input required minLength={2} maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">URL slug<input required minLength={2} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="institution-name" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Plan<select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value as Institution['plan'] })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="trial">Trial</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Student limit<input type="number" min="1" required value={form.maxStudents} onChange={(event) => setForm({ ...form, maxStudents: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Contact email<input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Contact phone<input maxLength={30} value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Website URL<input type="url" value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Address<textarea maxLength={500} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        {editing && <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Institution active</label>}
        {saveMutation.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">{getErrorMessage(saveMutation.error)}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:col-span-2"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" disabled={saveMutation.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create institution'}</button></div>
      </form>
    </section></div>}

    {viewing && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="institution-detail-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-start justify-between"><h2 id="institution-detail-title" className="text-lg font-semibold text-slate-950 dark:text-white">Institution details</h2><button type="button" aria-label="Close details" onClick={() => setViewing(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></div>{selected.isLoading ? <p className="py-6 text-sm text-slate-500">Loading institution…</p> : selected.error ? <p role="alert" className="py-6 text-sm text-rose-700">{getErrorMessage(selected.error)}</p> : <dl className="mt-4 grid grid-cols-[130px_1fr] gap-3 text-sm">{Object.entries(selected.data ?? {}).filter(([key]) => !/secret|token/i.test(key)).map(([key, value]) => <div key={key} className="contents"><dt className="capitalize text-slate-500">{key.replaceAll('_', ' ')}</dt><dd className="break-words text-slate-800 dark:text-slate-200">{value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>}</section></div>}
  </div>;
}
