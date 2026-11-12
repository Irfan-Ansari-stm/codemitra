'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, DollarSign, Building2, CheckCircle2,
  RefreshCw, Edit3, X, Users, AlertCircle
} from 'lucide-react';
import { superAdminBillingApi } from '@/lib/api';

export default function SuperAdminBillingPage() {
  const queryClient = useQueryClient();
  const [editingInstitute, setEditingInstitute] = useState<any | null>(null);
  const [formData, setFormData] = useState({ plan: 'pro', maxStudents: 500 });
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const billingQuery = useQuery({
    queryKey: ['super-admin-billing-overview'],
    queryFn: () => superAdminBillingApi.overview().then((res) => res.data?.data || {}),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: { plan: string; maxStudents: number } }) =>
      superAdminBillingApi.updatePlan(tenantId, data),
    onSuccess: () => {
      setFeedback({ text: 'Institute plan and quota updated successfully.', type: 'success' });
      setEditingInstitute(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-billing-overview'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to update plan.',
        type: 'error',
      });
    },
  });

  const data = billingQuery.data || {};
  const institutes = data.institutes || [];
  const planBreakdown = data.planBreakdown || { trial: 0, basic: 0, pro: 0, enterprise: 0 };

  const handleOpenEdit = (inst: any) => {
    setEditingInstitute(inst);
    setFormData({
      plan: inst.plan || 'trial',
      maxStudents: inst.max_students || 100,
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstitute) return;
    updatePlanMutation.mutate({
      tenantId: editingInstitute.id,
      data: {
        plan: formData.plan,
        maxStudents: Number(formData.maxStudents),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Billing & Subscription Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform-wide monetization overview, MRR metrics, tier breakdown, and institute student quotas
          </p>
        </div>
        <button
          onClick={() => billingQuery.refetch()}
          disabled={billingQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${billingQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated MRR</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            ${(data.estimatedMRR || 0).toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monthly recurring revenue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid Subscriptions</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {data.paidSubscriptions || 0}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Basic, Pro & Enterprise</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Trial Institutes</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {data.trialSubscriptions || 0}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Free evaluation tier</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Institutes</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {data.totalInstitutes || 0}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active tenant accounts</p>
        </div>
      </div>

      {/* Plan Tiers Reference Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Trial', price: '$0', limit: '50 students', count: planBreakdown.trial || 0, color: 'border-slate-200 dark:border-slate-800' },
          { name: 'Basic', price: '$99/mo', limit: '250 students', count: planBreakdown.basic || 0, color: 'border-blue-200 dark:border-blue-800' },
          { name: 'Pro', price: '$299/mo', limit: '1,000 students', count: planBreakdown.pro || 0, color: 'border-indigo-200 dark:border-indigo-800' },
          { name: 'Enterprise', price: '$999/mo', limit: 'Unlimited students', count: planBreakdown.enterprise || 0, color: 'border-purple-200 dark:border-purple-800' },
        ].map((tier) => (
          <div key={tier.name} className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${tier.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tier.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {tier.count} {tier.count === 1 ? 'inst' : 'insts'}
              </span>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{tier.price}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max capacity: {tier.limit}</div>
          </div>
        ))}
      </div>

      {/* Institutes Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Institute Subscription & Quota Allocation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time enrollment quotas and subscription plans per registered institute
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Institute</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Student Enrollment & Quota</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {institutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No institute subscriptions found.
                  </td>
                </tr>
              ) : (
                institutes.map((inst: any) => {
                  const currentStudents = inst.student_count || 0;
                  const maxStudents = inst.max_students || 100;
                  const usagePercent = Math.min(100, Math.round((currentStudents / maxStudents) * 100));

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{inst.name}</div>
                        <div className="text-xs text-slate-500">{inst.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                            inst.plan === 'enterprise'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : inst.plan === 'pro'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : inst.plan === 'basic'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {inst.plan || 'trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-48">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{currentStudents} / {maxStudents}</span>
                            <span className={usagePercent >= 90 ? 'text-red-500 font-bold' : 'text-slate-500'}>
                              {usagePercent}%
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercent >= 90
                                  ? 'bg-red-500'
                                  : usagePercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {inst.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                            <AlertCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(inst.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(inst)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Change Plan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingInstitute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Update Subscription: {editingInstitute.name}
              </h3>
              <button
                onClick={() => setEditingInstitute(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Subscription Tier
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => {
                    const newPlan = e.target.value;
                    const defaultMax: Record<string, number> = {
                      trial: 50,
                      basic: 250,
                      pro: 1000,
                      enterprise: 5000,
                    };
                    setFormData({
                      plan: newPlan,
                      maxStudents: defaultMax[newPlan] || 500,
                    });
                  }}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="trial">Trial ($0/mo)</option>
                  <option value="basic">Basic ($99/mo)</option>
                  <option value="pro">Pro ($299/mo)</option>
                  <option value="enterprise">Enterprise ($999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Student Enrollment Limit (Quota)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingInstitute(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePlanMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

