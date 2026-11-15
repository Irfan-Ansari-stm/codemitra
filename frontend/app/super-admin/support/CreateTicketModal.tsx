'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import { superAdminSupportApi, userApi } from '@/lib/api';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [priority, setPriority] = useState('medium');
  const [department, setDepartment] = useState('Customer Support');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch users for requester selection
  const usersQuery = useQuery({
    queryKey: ['users-for-ticket-creation'],
    queryFn: () => userApi.list({ limit: 50 }).then((res) => res.data.data || []),
    enabled: isOpen,
  });

  // Fetch agents for initial assignment
  const agentsQuery = useQuery({
    queryKey: ['support-agents'],
    queryFn: () => superAdminSupportApi.getAgents().then((res) => res.data.data || []),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      superAdminSupportApi.createTicket({
        userId,
        subject,
        description,
        category,
        priority,
        department,
        assignedTo: assignedTo || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create support ticket.');
    },
  });

  if (!isOpen) return null;

  const users = usersQuery.data || [];
  const agents = agentsQuery.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Please select a target user / requester.');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide a ticket subject.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a ticket description.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Support Ticket</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log a platform request or customer query as Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target User / Requester <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select a user...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Unable to submit assignment in lab 3"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Technical Issue">Technical Issue</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Billing">Billing</option>
                <option value="Course Issue">Course Issue</option>
                <option value="Assignment Issue">Assignment Issue</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Bug Report">Bug Report</option>
                <option value="General Query">General Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Customer Support">Customer Support</option>
                <option value="Technical Tier-2">Technical Tier-2</option>
                <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                <option value="Academic & Courses">Academic & Courses</option>
                <option value="Platform & Infrastructure">Platform & Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Initial Assignee (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Leave Unassigned</option>
                {agents.map((ag: any) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.active_tickets_count || 0} active)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description / Query Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Detailed description of the issue or inquiry..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              <span>{createMutation.isPending ? 'Filing Ticket...' : 'File Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
