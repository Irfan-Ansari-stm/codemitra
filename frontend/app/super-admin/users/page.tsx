'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  UserX,
  Download,
} from 'lucide-react';
import { getErrorMessage, tenantApi, userApi, roleApi } from '@/lib/api';
import { RoleItem } from '@/types';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string | null;
  tenantId?: string | null;
  is_active: boolean;
  isActive?: boolean;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  created_at: string;
  createdAt?: string;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
  institution_name?: string | null;
  institutionName?: string | null;
  metadata?: any;
};

type TenantRow = { id: string; name: string; slug: string };
type UserForm = {
  name: string;
  email: string;
  password: string;
  role: string;
  tenantId: string;
  phone?: string;
  isActive: boolean;
};

const blankForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'institution_student',
  tenantId: '',
  phone: '',
  isActive: true,
};

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();

  // Tab mode: 'institution' (institutional division view) or 'all' (unified master directory)
  const [activeTab, setActiveTab] = useState<'institution' | 'all'>('institution');

  // Filters & Pagination for Unified Table
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLoginAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog & Modal States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [newRoleSlug, setNewRoleSlug] = useState<string>('');
  const [tenantModalUser, setTenantModalUser] = useState<UserRow | null>(null);
  const [newTenantId, setNewTenantId] = useState<string>('');
  const [statusModalUser, setStatusModalUser] = useState<{ user: UserRow; action: 'activate' | 'deactivate' | 'suspend' } | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');
  const [passwordResetUser, setPasswordResetUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

  // Forms and Feedback
  const [form, setForm] = useState<UserForm>(blankForm);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-users-master'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-users-total-count'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard-stats'] });
  };

  // Overall total registered users count query
  const totalUsersQuery = useQuery({
    queryKey: ['super-admin-users-total-count'],
    queryFn: () => userApi.list({ limit: 1 }).then((res) => res.data.total),
  });

  // Roles list
  const { data: roles = [] } = useQuery<RoleItem[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await roleApi.list();
      return res.data.data;
    },
  });

  // Tenants list
  const tenants = useQuery({
    queryKey: ['tenants', 'super-admin-users'],
    queryFn: () => tenantApi.list(1, 100).then((res) => res.data.data as TenantRow[]),
  });

  // Unified master user list query
  const masterUsersQuery = useQuery({
    queryKey: ['super-admin-users-master', page, limit, selectedRole, selectedTenant, selectedStatus, search, dateFrom, dateTo, sortBy, sortOrder],
    queryFn: async () => {
      const res = await userApi.list({
        page,
        limit,
        role: selectedRole === 'all' ? undefined : selectedRole,
        tenantId: selectedTenant === 'all' ? undefined : selectedTenant,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: search.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder,
      });
      return res.data;
    },
  });

  // Queries for the "institution" view to preserve test expectations
  const institutionAdmins = useQuery({
    queryKey: ['super-admin-users', 'institution_admin'],
    queryFn: () => userApi.list({ role: 'institution_admin', page: 1, limit: 100 }).then((res) => res.data.data as UserRow[]),
  });

  const institutionStudents = useQuery({
    queryKey: ['super-admin-users', 'institution_student'],
    queryFn: () => userApi.list({ role: 'institution_student', page: 1, limit: 100 }).then((res) => res.data.data as UserRow[]),
  });

  // Selected single user details query
  const selectedUser = useQuery({
    queryKey: ['super-admin-user', viewing],
    queryFn: () => userApi.get(viewing!).then((res) => res.data.data),
    enabled: !!viewing,
  });

  // Save mutation (create or basic update)
  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? userApi.update(editing.id, { name: form.name.trim(), phone: form.phone?.trim() || null, isActive: form.isActive })
        : userApi.create({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            tenantId: form.tenantId || null,
            phone: form.phone?.trim() || undefined,
          }),
    onSuccess: () => {
      refreshAll();
      setDialogOpen(false);
      setEditing(null);
      setForm(blankForm);
      setSuccessMsg(editing ? 'User updated successfully.' : 'User account created successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  // Role change mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => userApi.updateRole(userId, role),
    onSuccess: () => {
      refreshAll();
      setRoleModalUser(null);
      setSuccessMsg('User role updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => setErrorMsg(getErrorMessage(err)),
  });

  // Institution change mutation
  const tenantMutation = useMutation({
    mutationFn: ({ userId, tenantId }: { userId: string; tenantId: string | null }) => userApi.updateInstitution(userId, tenantId),
    onSuccess: () => {
      refreshAll();
      setTenantModalUser(null);
      setSuccessMsg('User institution association updated.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => setErrorMsg(getErrorMessage(err)),
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive, isSuspended, reason }: { userId: string; isActive: boolean; isSuspended: boolean; reason?: string }) =>
      userApi.updateStatus(userId, { isActive, isSuspended, reason }),
    onSuccess: () => {
      refreshAll();
      setStatusModalUser(null);
      setStatusReason('');
      setSuccessMsg('User account status updated.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => setErrorMsg(getErrorMessage(err)),
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, pass }: { userId: string; pass: string }) => userApi.resetPassword(userId, pass),
    onSuccess: () => {
      setPasswordResetUser(null);
      setNewPassword('');
      setSuccessMsg('Password has been securely reset.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => setErrorMsg(getErrorMessage(err)),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      refreshAll();
      setDeletingUser(null);
      setSuccessMsg('User account deactivated / soft-deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => setErrorMsg(getErrorMessage(err)),
  });

  function openCreate(role: string = 'institution_student') {
    setEditing(null);
    setForm({ ...blankForm, role });
    saveMutation.reset();
    setDialogOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setForm({
      ...blankForm,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id ?? user.tenantId ?? '',
      phone: user.phone || '',
      isActive: user.is_active ?? user.isActive ?? true,
    });
    saveMutation.reset();
    setDialogOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const exportUsersCsv = () => {
    const usersData = masterUsersQuery.data?.data || [];
    if (usersData.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Institution', 'Status', 'Phone', 'Created At'];
    const rows = usersData.map((u: any) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.institution_name || u.institutionName || 'None'}"`,
      u.metadata?.isSuspended ? 'Suspended' : u.is_active ? 'Active' : 'Inactive',
      u.phone || '',
      new Date(u.created_at || u.createdAt).toLocaleDateString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `codemitra_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const masterList = (masterUsersQuery.data?.data as unknown as UserRow[]) || [];
  const masterTotal = masterUsersQuery.data?.total || 0;
  const registeredUsersCount = totalUsersQuery.data ?? masterTotal;
  const totalPages = Math.ceil(masterTotal / limit);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {registeredUsersCount} Registered Users
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Centralized control over Super Admins, Institution Administrators, Students, and Custom Roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportUsersCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => openCreate('institution_student')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create User
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          All Users (Unified Directory)
        </button>

        <button
          onClick={() => setActiveTab('institution')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'institution'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Institution users
        </button>
      </div>

      {/* TAB 1: ALL USERS (UNIFIED MASTER TABLE) */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Role filter */}
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="institution_admin">Institute Admins</option>
                <option value="institution_student">Institute Students</option>
                <option value="general_student">General Students</option>
                {roles
                  .filter((r) => !['super_admin', 'institution_admin', 'institution_student', 'general_student'].includes(r.slug))
                  .map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name} (Custom)
                    </option>
                  ))}
              </select>

              {/* Institution filter */}
              <select
                value={selectedTenant}
                onChange={(e) => {
                  setSelectedTenant(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Institutions</option>
                {(tenants.data || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                title="Registered from"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Date To */}
              <input
                type="date"
                title="Registered until"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Sort: Date</option>
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="role">Sort: Role</option>
                <option value="status">Sort: Status</option>
                <option value="lastLoginAt">Sort: Last Login</option>
              </select>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Toggle Sort Order"
              >
                {sortOrder.toUpperCase()}
              </button>

              <button
                onClick={() => masterUsersQuery.refetch()}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                title="Refresh Directory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick role filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
              <span className="text-gray-400 font-medium">Quick Filters:</span>
              {[
                { label: 'All Users', val: 'all', count: masterTotal },
                { label: 'Super Admins', val: 'super_admin' },
                { label: 'Institute Admins', val: 'institution_admin' },
                { label: 'Institute Students', val: 'institution_student' },
                { label: 'General Users', val: 'general_student' },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => {
                    setSelectedRole(pill.val);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    selectedRole === pill.val
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unified Users Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {masterUsersQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading platform users...</div>
            ) : masterList.length === 0 ? (
              <div className="p-12 text-center">
                <UserX className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No users match this filter</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try resetting the filters or search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/60 uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3">User & Contact</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Institution</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Registration</th>
                      <th className="px-4 py-3">Last Login</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {masterList.map((user: UserRow) => {
                      const isSuspended = user.metadata?.isSuspended === true || user.metadata?.isSuspended === 'true';
                      const isActive = (user.is_active ?? user.isActive) && !isSuspended;

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                          {/* User info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-xs flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                                  {user.name}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="text-[10px] text-gray-400">{user.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                user.role === 'super_admin'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : user.role === 'institution_admin'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : user.role === 'institution_student'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              {user.role === 'super_admin' && <ShieldAlert className="w-3 h-3 text-purple-600" />}
                              {user.role === 'institution_admin' && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                              {user.role}
                            </span>
                          </td>

                          {/* Institution */}
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {user.institution_name || user.institutionName ? (
                              <div className="flex items-center gap-1.5 font-medium truncate max-w-[160px]">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{user.institution_name || user.institutionName}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">None (Public)</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                Suspended
                              </span>
                            ) : isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Registration date */}
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {new Date(user.created_at || user.createdAt!).toLocaleDateString()}
                          </td>

                          {/* Last login */}
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {user.last_login_at || user.lastLoginAt
                              ? new Date(user.last_login_at || user.lastLoginAt!).toLocaleDateString()
                              : 'Never'}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewing(user.id)}
                                title="View Details"
                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openEdit(user)}
                                title="Edit User"
                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setRoleModalUser(user);
                                  setNewRoleSlug(user.role);
                                }}
                                title="Change Role"
                                className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <Shield className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setTenantModalUser(user);
                                  setNewTenantId(user.tenant_id ?? user.tenantId ?? '');
                                }}
                                title="Assign / Change Institution"
                                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <Building2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setPasswordResetUser(user);
                                  setNewPassword('');
                                }}
                                title="Reset Password"
                                className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {isSuspended ? (
                                <button
                                  onClick={() =>
                                    setStatusModalUser({ user, action: 'activate' })
                                  }
                                  title="Reactivate Account"
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setStatusModalUser({ user, action: 'suspend' })
                                  }
                                  title="Suspend Account"
                                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setDeletingUser(user)}
                                title="Delete / Deactivate"
                                className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, masterTotal)} of {masterTotal} users
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-semibold text-gray-900 dark:text-white">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INSTITUTION USERS (MAINTAINS STRICT ACCORDANCE WITH TEST EXPECTATIONS) */}
      {activeTab === 'institution' && (
        <div className="space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Institution users</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Segmented view dedicated to academic leadership and campus students across partnered tenants.
              </p>
            </div>
            <Link
              href="/super-admin/general-users"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View general users
            </Link>
          </header>

          {/* Institution Admins Section */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Institution admins</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Campus administrators managing institutional programs · {institutionAdmins.data?.length || 0} shown
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreate('institution_admin')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={15} /> Add institution admin
              </button>
            </header>
            {institutionAdmins.isLoading ? (
              <p className="p-5 text-sm text-slate-500">Loading users…</p>
            ) : !institutionAdmins.data?.length ? (
              <p className="p-8 text-center text-sm text-slate-500">No users in this section yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40">
                    <tr>
                      {['User', 'Role', 'Institution', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {institutionAdmins.data.map((user) => (
                      <tr key={user.id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {user.name}
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">{user.role}</td>
                        <td className="px-4 py-3 text-xs">{user.tenant_id || 'None'}</td>
                        <td className="px-4 py-3 text-xs">{user.is_active ? 'Active' : 'Inactive'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setViewing(user.id)} className="p-1 text-slate-400 hover:text-blue-600">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEdit(user)} className="p-1 text-slate-400 hover:text-blue-600">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(user.id)} className="p-1 text-slate-400 hover:text-rose-600">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Institution Students Section */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Institution students</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enrolled students participating in campus curriculum · {institutionStudents.data?.length || 0} shown
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreate('institution_student')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={15} /> Add institution student
              </button>
            </header>
            {institutionStudents.isLoading ? (
              <p className="p-5 text-sm text-slate-500">Loading users…</p>
            ) : !institutionStudents.data?.length ? (
              <p className="p-8 text-center text-sm text-slate-500">No users in this section yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/40">
                    <tr>
                      {['User', 'Role', 'Institution', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {institutionStudents.data.map((user) => (
                      <tr key={user.id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {user.name}
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">{user.role}</td>
                        <td className="px-4 py-3 text-xs">{user.tenant_id || 'None'}</td>
                        <td className="px-4 py-3 text-xs">{user.is_active ? 'Active' : 'Inactive'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setViewing(user.id)} className="p-1 text-slate-400 hover:text-blue-600">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEdit(user)} className="p-1 text-slate-400 hover:text-blue-600">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteMutation.mutate(user.id)} className="p-1 text-slate-400 hover:text-rose-600">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? `Edit User: ${editing.name}` : 'Create New Account'}
              </h3>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="userFullName" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full name *
                </label>
                <input
                  id="userFullName"
                  aria-label="Full name"
                  type="text"
                  required
                  placeholder="e.g. Aditi Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="userEmail" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  id="userEmail"
                  aria-label="Email"
                  type="email"
                  required
                  disabled={!!editing}
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {!editing && (
                <div>
                  <label htmlFor="userPassword" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Initial password *
                  </label>
                  <input
                    id="userPassword"
                    aria-label="Initial password"
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="userPhone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  id="userPhone"
                  aria-label="Phone Number"
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="userRole" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Role *
                </label>
                <select
                  id="userRole"
                  aria-label="Assigned Role"
                  disabled={!!editing}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="institution_student">Institution Student</option>
                  <option value="institution_admin">Institution Admin</option>
                  <option value="general_student">General Student</option>
                  <option value="super_admin">Super Admin</option>
                  {roles
                    .filter((r) => !['super_admin', 'institution_admin', 'institution_student', 'general_student'].includes(r.slug))
                    .map((r) => (
                      <option key={r.id} value={r.slug}>
                        {r.name} (Custom)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="userTenant" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Institution
                </label>
                <select
                  id="userTenant"
                  aria-label="Institution"
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Institution (Public / Standalone)</option>
                  {(tenants.data || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {editing && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="editActive" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Account is active and permitted to login
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS DRAWER / MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Profile Details</h3>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {selectedUser.isLoading ? (
              <p className="py-8 text-center text-sm text-gray-500 animate-pulse">Loading profile…</p>
            ) : selectedUser.data ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                    {selectedUser.data.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedUser.data.name}</h4>
                    <span className="text-gray-500 dark:text-gray-400">{selectedUser.data.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Role:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedUser.data.role}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Institution:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                      {selectedUser.data.institution_name || selectedUser.data.institutionName || 'None'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Phone:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedUser.data.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                      {selectedUser.data.metadata?.isSuspended ? 'Suspended' : selectedUser.data.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {selectedUser.data.bio && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Bio:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{selectedUser.data.bio}</p>
                  </div>
                )}

                {/* Academic/coding stats */}
                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                  <span className="font-semibold text-blue-900 dark:text-blue-300">Coding & Learning Progress:</span>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded shadow-xs">
                      <span className="text-gray-400 text-[10px]">Problems Solved</span>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedUser.data.total_problems_solved || selectedUser.data.totalProblemsSolved || 0}</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded shadow-xs">
                      <span className="text-gray-400 text-[10px]">Submissions</span>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedUser.data.total_submissions || selectedUser.data.totalSubmissions || 0}</p>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded shadow-xs">
                      <span className="text-gray-400 text-[10px]">Platform Score</span>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedUser.data.total_score || selectedUser.data.totalScore || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setViewing(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Change Role: {roleModalUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Select the new role and permission tier for this account.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Target Role:
              </label>
              <select
                value={newRoleSlug}
                onChange={(e) => setNewRoleSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="super_admin">Super Admin</option>
                <option value="institution_admin">Institution Admin</option>
                <option value="institution_student">Institution Student</option>
                <option value="general_student">General Student</option>
                {roles
                  .filter((r) => !['super_admin', 'institution_admin', 'institution_student', 'general_student'].includes(r.slug))
                  .map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name} (Custom Role)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-800 mt-5">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={roleMutation.isPending || !newRoleSlug}
                onClick={() => roleMutation.mutate({ userId: roleModalUser.id, role: newRoleSlug })}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {roleMutation.isPending ? 'Updating...' : 'Confirm Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE INSTITUTION MODAL */}
      {tenantModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Assign Institution: {tenantModalUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Associate this account with an institutional partner or set to None for public access.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Partner Institution:
              </label>
              <select
                value={newTenantId}
                onChange={(e) => setNewTenantId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Public / General)</option>
                {(tenants.data || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-800 mt-5">
              <button
                type="button"
                onClick={() => setTenantModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={tenantMutation.isPending}
                onClick={() => tenantMutation.mutate({ userId: tenantModalUser.id, tenantId: newTenantId || null })}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {tenantMutation.isPending ? 'Updating...' : 'Save Association'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE / SUSPENSION MODAL */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {statusModalUser.action === 'suspend'
                ? `Suspend Account: ${statusModalUser.user.name}`
                : `Reactivate Account: ${statusModalUser.user.name}`}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {statusModalUser.action === 'suspend'
                ? 'Suspending an account revokes active sessions and prevents further logins.'
                : 'Reactivating allows this user to resume platform access.'}
            </p>

            {statusModalUser.action === 'suspend' && (
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Suspension Reason (Logged to Audit):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Terms violation, honor code breach, administrative hold..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    userId: statusModalUser.user.id,
                    isActive: statusModalUser.action === 'activate',
                    isSuspended: statusModalUser.action === 'suspend',
                    reason: statusReason || undefined,
                  })
                }
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50 ${
                  statusModalUser.action === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusMutation.isPending ? 'Updating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Reset Password: {passwordResetUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Enter a new secure password. This revokes all existing sessions for this user.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                New Temporary Password:
              </label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetPasswordMutation.isPending || newPassword.length < 8}
                onClick={() =>
                  resetPasswordMutation.mutate({
                    userId: passwordResetUser.id,
                    pass: newPassword,
                  })
                }
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Deactivate Account: {deletingUser.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to deactivate <strong className="text-gray-900 dark:text-white">{deletingUser.email}</strong>?
              Student submissions, course records, and audit logs are safely preserved.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingUser.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
