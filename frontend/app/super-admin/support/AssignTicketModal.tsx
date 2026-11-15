'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserCheck, Loader2, ShieldCheck, Check } from 'lucide-react';
import { superAdminSupportApi } from '@/lib/api';

interface AssignTicketModalProps {
  isOpen: boolean;
  ticket: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssignTicketModal({
  isOpen,
  ticket,
  onClose,
  onSuccess,
}: AssignTicketModalProps) {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ticket?.assigned_to_id || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const agentsQuery = useQuery({
    queryKey: ['support-agents'],
    queryFn: () => superAdminSupportApi.getAgents().then((res) => res.data.data || []),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: () => superAdminSupportApi.assignTicket(ticket.id, selectedAgentId, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticket.id] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to assign ticket.');
    },
  });

  if (!isOpen || !ticket) return null;

  const agents = agentsQuery.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Please select an agent to assign.');
      return;
    }
    assignMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Ticket</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ticket.ticket_number} • {ticket.subject.slice(0, 32)}...
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Support Agent
            </label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
              {agentsQuery.isLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading agents...</div>
              ) : agents.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">No agents available.</div>
              ) : (
                agents.map((ag: any) => {
                  const isSelected = selectedAgentId === ag.id;
                  return (
                    <div
                      key={ag.id}
                      onClick={() => {
                        setSelectedAgentId(ag.id);
                        setError(null);
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs">
                          {ag.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {ag.name}
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {ag.role.replace('_', ' ')}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400">{ag.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {ag.active_tickets_count || 0} active
                        </span>
                        {isSelected && (
                          <div className="mt-1 flex justify-end text-blue-600 dark:text-blue-400">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assignment Note (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Assigned for technical bug reproduction."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
              disabled={assignMutation.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {assignMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              <span>{assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
