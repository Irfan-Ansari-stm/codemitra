'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  Building2,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { getErrorMessage, tenantApi } from '@/lib/api';
import { ApplicationQueue } from './ApplicationQueue';

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
  total_students?: number;
  active_students?: number;
  total_courses?: number;
  admins?: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
    created_at: string;
  }>;
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

const blankForm: FormValues = {
  name: '',
  slug: '',
  plan: 'trial',
  maxStudents: '50',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  address: '',
  isActive: true,
};

export default function SuperAdminInstitutionsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormValues>(blankForm);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const institutions = useQuery({
    queryKey: ['super-admin-institutions', search],
    queryFn: () => tenantApi.list(1, 100, search).then((response) => (response.data.data || []) as Institution[]),
  });

  const selected = useQuery({
    queryKey: ['super-admin-institution', viewing],
    queryFn: () => tenantApi.get(viewing!).then((response) => response.data.data as Institution),
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
      void queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });
      setDialogOpen(false);
      setEditing(null);
      setForm(blankForm);
      setBannerSuccess(editing ? 'Institution updated successfully.' : 'Institution created successfully.');
      setTimeout(() => setBannerSuccess(null), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-institutions'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });
      setBannerSuccess('Institution archived successfully.');
      setTimeout(() => setBannerSuccess(null), 4000);
    },
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

  const rawList = institutions.data || [];
  const filteredInstitutions = rawList.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.slug.toLowerCase().includes(search.toLowerCase()) ||
      (inst.contact_email && inst.contact_email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (planFilter !== 'all' && inst.plan !== planFilter) return false;
    if (statusFilter === 'active' && !inst.is_active) return false;
    if (statusFilter === 'inactive' && inst.is_active) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
            Platform administration
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Institutions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {rawList.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, review, update, and manage all platform institutions, tenants, and campus administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
        >
          <Plus size={16} /> Add institution
        </button>
      </header>

      {/* Banner Feedback */}
      {bannerSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{bannerSuccess}</span>
          </div>
          <button onClick={() => setBannerSuccess(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Applications Section */}
      <ApplicationQueue />

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, slug, or contact email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => institutions.refetch()}
            title="Refresh Institutions"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw size={14} className={institutions.isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {institutions.error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(institutions.error)}{' '}
          <button type="button" onClick={() => institutions.refetch()} className="ml-2 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {deleteMutation.error && (
        <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
          {getErrorMessage(deleteMutation.error)}
        </p>
      )}

      {/* Institutions Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-colors">
        {institutions.isLoading ? (
          <p className="p-6 text-xs text-slate-500">Loading institutions…</p>
        ) : !filteredInstitutions.length ? (
          <p className="p-10 text-center text-xs text-slate-500">
            {search || planFilter !== 'all' || statusFilter !== 'all'
              ? 'No institutions match the selected filters.'
              : 'No institutions yet. Create one to get started.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  {['Institution', 'Slug', 'Plan', 'Student limit', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInstitutions.map((institution) => (
                  <tr key={institution.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewing(institution.id)}
                        className="font-semibold text-blue-600 hover:underline dark:text-blue-400 text-left"
                      >
                        {institution.name}
                      </button>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {institution.contact_email || 'No contact email'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{institution.slug}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {institution.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{institution.max_students}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          institution.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {institution.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`View ${institution.name}`}
                          title="View institution details"
                          onClick={() => setViewing(institution.id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${institution.name}`}
                          title="Edit institution"
                          onClick={() => openEdit(institution)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${institution.name}`}
                          title="Delete institution"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete ${institution.name}? Existing student and course history will be retained.`)) {
                              deleteMutation.mutate(institution.id);
                            }
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Institution Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="institution-form-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 id="institution-form-title" className="text-base font-semibold text-slate-950 dark:text-white">
                  {editing ? 'Update Institution' : 'Create Institution'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Institution slug is used in dedicated workspace URLs and tenant identification.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close institution form"
                onClick={() => setDialogOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Name
                <input
                  required
                  minLength={2}
                  maxLength={255}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                URL slug
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="stanford-university"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Plan
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value as Institution['plan'] })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Student limit
                <input
                  type="number"
                  min="1"
                  required
                  value={form.maxStudents}
                  onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Contact email
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="admin@institution.edu"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Contact phone
                <input
                  maxLength={30}
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                Website URL
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://institution.edu"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                Address
                <textarea
                  maxLength={500}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Campus address, city, state, country"
                  className="mt-1 min-h-16 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {editing && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Institution account active</span>
                </label>
              )}

              {saveMutation.error && (
                <p role="alert" className="text-xs text-rose-700 dark:text-rose-400 sm:col-span-2">
                  {getErrorMessage(saveMutation.error)}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create institution'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* View Institution Details Modal */}
      {viewing && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="institution-detail-title"
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 id="institution-detail-title" className="text-base font-semibold text-slate-950 dark:text-white">
                  Institution Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive profile, active administrators, and student metrics.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setViewing(null)}
                className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            {selected.isLoading ? (
              <p className="py-6 text-xs text-slate-500">Loading institution…</p>
            ) : selected.error ? (
              <p role="alert" className="py-6 text-xs text-rose-700">
                {getErrorMessage(selected.error)}
              </p>
            ) : (
              <div className="mt-4 space-y-5 text-xs">
                {/* Basic Details */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        {selected.data?.name}
                      </h3>
                      <p className="font-mono text-slate-500 text-[11px] mt-0.5">{selected.data?.slug}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                        selected.data?.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {selected.data?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subscription Plan</span>
                      <span className="font-medium capitalize">{selected.data?.plan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Student Capacity</span>
                      <span className="font-medium">{selected.data?.max_students} students limit</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Email</span>
                      <span>{selected.data?.contact_email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                      <span>{selected.data?.contact_phone || '—'}</span>
                    </div>
                    {selected.data?.website_url && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Website</span>
                        <a href={selected.data.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          {selected.data.website_url}
                        </a>
                      </div>
                    )}
                    {selected.data?.address && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Campus Address</span>
                        <span>{selected.data.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-center">
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {selected.data?.total_students ?? 0}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Enrolled Students</span>
                  </div>
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {selected.data?.active_students ?? 0}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active Students</span>
                  </div>
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 text-center">
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {selected.data?.total_courses ?? 0}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned Courses</span>
                  </div>
                </div>

                {/* Administration */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Institution Administrators ({selected.data?.admins?.length || 0})
                  </h4>
                  {!selected.data?.admins || selected.data.admins.length === 0 ? (
                    <p className="text-slate-500 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-center">
                      No administrators assigned to this institution yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      {selected.data.admins.map((adm) => (
                        <div key={adm.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{adm.name}</span>
                            <span className="text-slate-500 block text-[11px]">{adm.email}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${adm.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {adm.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
