'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye, Pencil, Plus, Trash2, X, Search, Download, RefreshCw,
  CheckCircle2, XCircle, ShieldAlert, KeyRound
} from 'lucide-react';
import { getErrorMessage, userApi } from '@/lib/api';

type GeneralUser = {
  id: string;
  name: string;
  email: string;
  role: 'general_student';
  isActive?: boolean;
  is_active?: boolean;
  isEmailVerified?: boolean;
  is_email_verified?: boolean;
  createdAt?: string;
  created_at?: string;
  lastLoginAt?: string;
  last_login_at?: string;
  phone?: string;
  metadata?: any;
};

type Form = { name: string; email: string; password: string; isActive: boolean; phone: string };
const blankForm: Form = { name: '', email: '', password: '', isActive: true, phone: '' };

export default function GeneralUsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(blankForm);
  const [editing, setEditing] = useState<GeneralUser | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<GeneralUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const usersQuery = useQuery({
    queryKey: ['super-admin-general-users', search, statusFilter, verificationFilter, page],
    queryFn: async () => {
      const res = await userApi.list({
        role: 'general_student',
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        verificationStatus: verificationFilter !== 'all' ? verificationFilter : undefined,
        page,
        limit,
        standaloneOnly: true,
      });
      return res.data;
    },
  });

  const selectedUser = useQuery({
    queryKey: ['super-admin-general-user', viewing],
    queryFn: () => userApi.get(viewing!).then((response) => response.data.data),
    enabled: !!viewing,
  });

  const save = useMutation({
    mutationFn: () => {
      const payload: any = { name: form.name.trim(), isActive: form.isActive };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      return editing
        ? userApi.update(editing.id, payload)
        : userApi.create({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: 'general_student',
            tenantId: null,
            ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-general-users'] });
      setFormOpen(false);
      setEditing(null);
      setForm(blankForm);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['super-admin-general-users'] }),
  });

  const toggleSuspension = useMutation({
    mutationFn: async ({ id, isSuspended }: { id: string; isSuspended: boolean }) => {
      return userApi.updateStatus(id, {
        isSuspended,
        isActive: !isSuspended,
        reason: isSuspended ? 'Suspended by Super Admin' : undefined,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['super-admin-general-users'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, pass }: { id: string; pass: string }) => {
      return userApi.resetPassword(id, pass);
    },
    onSuccess: () => {
      setResetPasswordOpen(null);
      setNewPassword('');
      alert('Password has been successfully updated.');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    save.reset();
    setFormOpen(true);
  }

  function openEdit(user: GeneralUser) {
    setEditing(user);
    setForm({
      ...blankForm,
      name: user.name,
      email: user.email,
      isActive: Boolean(user.isActive ?? user.is_active ?? true),
      phone: user.phone || '',
    });
    save.reset();
    setFormOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  const handleExport = () => {
    const rows = (usersQuery.data?.data as GeneralUser[]) || [];
    if (!rows.length) return;
    const csvRows = [
      ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Verification', 'Joined Date'],
      ...rows.map((u) => {
        const isSusp = Boolean(u.metadata?.isSuspended);
        const isAct = Boolean(u.isActive ?? u.is_active);
        const status = isSusp ? 'Suspended' : isAct ? 'Active' : 'Inactive';
        const isVer = Boolean(u.isEmailVerified ?? u.is_email_verified);
        const joined = u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at!).toISOString().slice(0, 10) : 'N/A';
        return [
          `"${u.id}"`,
          `"${u.name.replace(/"/g, '""')}"`,
          `"${u.email}"`,
          'general_student',
          status,
          isVer ? 'Verified' : 'Unverified',
          joined,
        ];
      }),
    ];
    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `general_users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const usersList: GeneralUser[] = (usersQuery.data?.data as any) || [];
  const totalCount = (usersQuery.data as any)?.total ?? usersList.length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            Platform Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            General users
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Standalone general-student accounts; these users are not attached to an institution.
          </p>
          <Link
            href="/super-admin/users"
            className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Go to institution users
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={15} />
            Add general student
          </button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => usersQuery.refetch()}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={13} className={usersQuery.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error alert with retry */}
      {usersQuery.error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 flex items-center justify-between"
        >
          <span>{getErrorMessage(usersQuery.error)}</span>
          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="ml-2 font-semibold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Accounts Card */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              General student accounts
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {usersQuery.isLoading ? 'Loading accounts…' : `${totalCount} general student accounts total`}
            </p>
          </div>
        </header>

        {usersQuery.isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading general users…</div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No general student accounts found matching criteria.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Institution admins and institution students are listed separately under Institution users.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                <tr>
                  <th className="px-4 py-3">General Student</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {usersList.map((user) => {
                  const isSuspended = Boolean(user.metadata?.isSuspended);
                  const isActive = Boolean(user.isActive ?? user.is_active);
                  const isVerified = Boolean(user.isEmailVerified ?? user.is_email_verified);
                  const joinedDate = user.createdAt || user.created_at;

                  return (
                    <tr
                      key={user.id}
                      className="text-slate-700 hover:bg-slate-50/70 dark:text-slate-300 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                            <p className="text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                            isVerified
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 size={11} /> Verified
                            </>
                          ) : (
                            <>
                              <XCircle size={11} /> Unverified
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {joinedDate ? new Date(joinedDate).toLocaleDateString() : 'Not available'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`View ${user.name}`}
                            title="View student profile"
                            onClick={() => setViewing(user.id)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${user.name}`}
                            title="Edit general student"
                            onClick={() => openEdit(user)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Reset password for ${user.name}`}
                            title="Reset password"
                            onClick={() => {
                              setResetPasswordOpen(user);
                              setNewPassword('');
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-800 transition"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`${isSuspended ? 'Reactivate' : 'Suspend'} ${user.name}`}
                            title={isSuspended ? 'Reactivate account' : 'Suspend account'}
                            onClick={() => toggleSuspension.mutate({ id: user.id, isSuspended: !isSuspended })}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-slate-800 transition"
                          >
                            <ShieldAlert size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${user.name}`}
                            title="Delete general student"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (window.confirm(`Delete ${user.name}'s general student account?`)) {
                                remove.mutate(user.id);
                              }
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit General Student Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="general-user-form-title"
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="general-user-form-title" className="text-base font-bold text-slate-950 dark:text-white">
                  {editing ? 'Update general student' : 'Create general student'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Standalone account: assigned to role `general_student` without institution affiliation.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close form"
                onClick={() => setFormOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={255}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Irfan Ansari"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </label>

              {!editing && (
                <>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      placeholder="student@example.com"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Initial password
                    <input
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="At least 8 characters (uppercase, lowercase, number)"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </label>
                </>
              )}

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone number (Optional)
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </label>

              {editing && (
                <label className="flex items-center gap-2 pt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Account is Active
                </label>
              )}

              {save.error && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {getErrorMessage(save.error)}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create general student'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  Reset student password
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Set a new secure password for {resetPasswordOpen.name} ({resetPasswordOpen.email}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordOpen(null)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                resetPasswordMutation.mutate({ id: resetPasswordOpen.id, pass: newPassword });
              }}
              className="mt-4 space-y-3.5"
            >
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters (uppercase, lowercase, number)"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </label>

              {resetPasswordMutation.error && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {getErrorMessage(resetPasswordMutation.error)}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetPasswordOpen(null)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? 'Updating…' : 'Set new password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* View Student Details Modal */}
      {viewing && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="general-user-details-title"
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {(selectedUser.data?.name || 'ST').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 id="general-user-details-title" className="text-base font-bold text-slate-950 dark:text-white">
                    {selectedUser.data?.name || 'Student Details'}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedUser.data?.email}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setViewing(null)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {selectedUser.isLoading ? (
              <p className="py-8 text-center text-xs text-slate-500">Loading student details…</p>
            ) : selectedUser.error ? (
              <p role="alert" className="py-6 text-center text-xs text-rose-600">
                {getErrorMessage(selectedUser.error)}
              </p>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {/* Account & Affiliation */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Role</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Standalone General Student
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Institution Affiliation</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      None (Direct Platform Account)
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Status</span>
                    <span
                      className={`inline-block font-semibold ${
                        selectedUser.data?.metadata?.isSuspended
                          ? 'text-rose-600'
                          : (selectedUser.data?.isActive ?? selectedUser.data?.is_active)
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {selectedUser.data?.metadata?.isSuspended
                        ? 'Suspended'
                        : (selectedUser.data?.isActive ?? selectedUser.data?.is_active)
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Email Verification</span>
                    <span
                      className={`inline-block font-semibold ${
                        selectedUser.data?.isEmailVerified ?? selectedUser.data?.is_email_verified
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {selectedUser.data?.isEmailVerified ?? selectedUser.data?.is_email_verified
                        ? 'Verified'
                        : 'Unverified'}
                    </span>
                  </div>
                </div>

                {/* Coding Performance */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Coding Performance
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400 block">
                        {selectedUser.data?.totalProblemsSolved ?? selectedUser.data?.total_problems_solved ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Solved</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400 block">
                        {Math.round(selectedUser.data?.totalScore ?? selectedUser.data?.total_score ?? 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Score</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">
                        {selectedUser.data?.totalSubmissions ?? selectedUser.data?.total_submissions ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Submissions</span>
                    </div>
                  </div>
                </div>

                {/* Meta details */}
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <p>
                    <strong>User ID:</strong> <span className="font-mono text-slate-600 dark:text-slate-400">{selectedUser.data?.id}</span>
                  </p>
                  <p>
                    <strong>Registered Date:</strong>{' '}
                    {selectedUser.data?.createdAt || selectedUser.data?.created_at
                      ? new Date(selectedUser.data?.createdAt || selectedUser.data?.created_at).toLocaleString()
                      : 'Not available'}
                  </p>
                  <p>
                    <strong>Last Login:</strong>{' '}
                    {selectedUser.data?.lastLoginAt || selectedUser.data?.last_login_at
                      ? new Date(selectedUser.data?.lastLoginAt || selectedUser.data?.last_login_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
