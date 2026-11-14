'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Save,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { roleApi, permissionApi, getErrorMessage } from '@/lib/api';
import { RoleItem, PermissionItem } from '@/types';

export default function PermissionsManagementPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialRoleId = searchParams.get('roleId');

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch all roles
  const { data: roles = [] } = useQuery<RoleItem[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await roleApi.list();
      return res.data.data;
    },
  });

  // Set default selected role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      if (initialRoleId && roles.some((r) => r.id === initialRoleId)) {
        setSelectedRoleId(initialRoleId);
      } else {
        // default to first role, prefer institution_admin or first role
        const defaultRole = roles.find((r) => r.slug === 'institution_admin') || roles[0];
        setSelectedRoleId(defaultRole.id);
      }
    }
  }, [roles, initialRoleId, selectedRoleId]);

  // Fetch all permissions grouped by module
  const { data: permsData, isLoading: permsLoading } = useQuery<{
    all: PermissionItem[];
    grouped: Record<string, PermissionItem[]>;
  }>({
    queryKey: ['admin-permissions-all'],
    queryFn: async () => {
      const res = await permissionApi.list();
      return res.data.data;
    },
  });

  // Fetch permissions assigned to currently selected role
  const { data: rolePerms = [], isLoading: rolePermsLoading } = useQuery<PermissionItem[]>({
    queryKey: ['admin-role-permissions', selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      const res = await roleApi.getPermissions(selectedRoleId);
      return res.data.data;
    },
    enabled: Boolean(selectedRoleId),
  });

  // Sync state when role permissions load
  useEffect(() => {
    if (rolePerms) {
      setSelectedPermissionIds(new Set(rolePerms.map((p) => p.id)));
      setHasUnsavedChanges(false);
    }
  }, [rolePerms]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdminRole = selectedRole?.slug === 'super_admin';

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const res = await roleApi.updatePermissions(roleId, permissionIds);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions', selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setHasUnsavedChanges(false);
      setSuccessMessage('Permissions matrix updated and applied successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  // Toggle single permission
  const togglePermission = (permId: string) => {
    if (isSuperAdminRole) return; // Super admin keeps full perms
    const next = new Set(selectedPermissionIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissionIds(next);
    setHasUnsavedChanges(true);
  };

  // Toggle entire module
  const toggleModule = (_moduleName: string, items: PermissionItem[]) => {
    if (isSuperAdminRole) return;
    const next = new Set(selectedPermissionIds);
    const allModuleSelected = items.every((item) => next.has(item.id));

    if (allModuleSelected) {
      items.forEach((item) => next.delete(item.id));
    } else {
      items.forEach((item) => next.add(item.id));
    }
    setSelectedPermissionIds(next);
    setHasUnsavedChanges(true);
  };

  // Select all permissions
  const selectAll = () => {
    if (isSuperAdminRole || !permsData?.all) return;
    setSelectedPermissionIds(new Set(permsData.all.map((p) => p.id)));
    setHasUnsavedChanges(true);
  };

  // Deselect all permissions
  const deselectAll = () => {
    if (isSuperAdminRole) return;
    setSelectedPermissionIds(new Set());
    setHasUnsavedChanges(true);
  };

  // Reset to saved state
  const resetToSaved = () => {
    if (rolePerms) {
      setSelectedPermissionIds(new Set(rolePerms.map((p) => p.id)));
      setHasUnsavedChanges(false);
    }
  };

  const grouped = permsData?.grouped || {};
  const moduleNames = Object.keys(grouped);

  // Filter modules/permissions
  const filteredModules = moduleNames.reduce<Record<string, PermissionItem[]>>((acc, mod) => {
    const items = grouped[mod].filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.action.toLowerCase().includes(search.toLowerCase()) ||
        mod.toLowerCase().includes(search.toLowerCase())
    );
    if (items.length > 0) acc[mod] = items;
    return acc;
  }, {});

  const totalAssigned = selectedPermissionIds.size;
  const totalAvailable = permsData?.all?.length || 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permission Management Matrix</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Granular RBAC
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure section access and module capabilities for every platform role in real time.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
              Unsaved changes
            </span>
          )}

          <button
            onClick={resetToSaved}
            disabled={!hasUnsavedChanges}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={() =>
              selectedRoleId &&
              saveMutation.mutate({
                roleId: selectedRoleId,
                permissionIds: Array.from(selectedPermissionIds),
              })
            }
            disabled={!selectedRoleId || !hasUnsavedChanges || saveMutation.isPending || isSuperAdminRole}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-40 transition"
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? 'Saving Matrix...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Select Role to Configure
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {roles.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (!confirm('You have unsaved changes for the current role. Discard and switch?')) return;
                  }
                  setSelectedRoleId(role.id);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {role.slug === 'super_admin' ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : role.isSystem ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                <span>{role.name}</span>
                {role.isSystem && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    sys
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Meta */}
        {selectedRole && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedRole.description || 'No description for this role.'}
              </p>
              <span className="font-mono text-gray-500">slug: {selectedRole.slug}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalAssigned} of {totalAvailable} permissions enabled
              </span>
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${totalAvailable ? (totalAssigned / totalAvailable) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Super Admin Notice */}
      {isSuperAdminRole && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3 text-xs text-purple-900 dark:text-purple-200">
          <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Super Admin is an unrestricted system role.</strong>
            <p className="mt-0.5 opacity-90">
              Super Admins have platform-wide wildcard permissions across every module and section by design. These permissions cannot be disabled.
            </p>
          </div>
        </div>
      )}

      {/* Controls: Search and Bulk Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search permissions by name, slug or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        {!isSuperAdminRole && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              <Square className="w-3.5 h-3.5" />
              Deselect All
            </button>
          </div>
        )}
      </div>

      {/* Permission Modules List */}
      {permsLoading || rolePermsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : Object.keys(filteredModules).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <KeyRound className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No permissions match your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredModules).map(([moduleName, items]) => {
            const isCollapsed = collapsedModules[moduleName];
            const allSelected = items.every((i) => selectedPermissionIds.has(i.id));

            return (
              <div
                key={moduleName}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition"
              >
                {/* Module Header */}
                <div className="p-4 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setCollapsedModules({
                          ...collapsedModules,
                          [moduleName]: !isCollapsed,
                        })
                      }
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </button>

                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-bold capitalize text-gray-900 dark:text-white">
                        {moduleName} Module
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                        {items.filter((i) => selectedPermissionIds.has(i.id)).length} / {items.length}
                      </span>
                    </div>
                  </div>

                  {!isSuperAdminRole && (
                    <button
                      type="button"
                      onClick={() => toggleModule(moduleName, items)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {allSelected ? 'Deselect Module' : 'Select Module'}
                    </button>
                  )}
                </div>

                {/* Module Permissions Grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((perm) => {
                      const isChecked = selectedPermissionIds.has(perm.id) || isSuperAdminRole;
                      return (
                        <div
                          key={perm.id}
                          onClick={() => !isSuperAdminRole && togglePermission(perm.id)}
                          className={`p-3 rounded-lg border text-left transition flex items-start gap-3 ${
                            isSuperAdminRole
                              ? 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-default'
                              : isChecked
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer shadow-sm'
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSuperAdminRole}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {perm.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {perm.action}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                              {perm.description || perm.slug}
                            </p>
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                              {perm.slug}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
