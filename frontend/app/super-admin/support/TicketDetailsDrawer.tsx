'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, CheckCircle2, Clock, AlertCircle,
  Send, User, Building2, ShieldCheck, Lock,
  Flame, RotateCcw, Loader2, MessageSquare
} from 'lucide-react';
import { superAdminSupportApi } from '@/lib/api';

interface TicketDetailsDrawerProps {
  isOpen: boolean;
  ticketId: string | null;
  onClose: () => void;
  onOpenAssignModal: (ticket: any) => void;
}

export function TicketDetailsDrawer({
  isOpen,
  ticketId,
  onClose,
  onOpenAssignModal,
}: TicketDetailsDrawerProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'conversation' | 'activity'>('conversation');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details
  const ticketQuery = useQuery({
    queryKey: ['super-admin-support-ticket', ticketId],
    queryFn: () => (ticketId ? superAdminSupportApi.getTicket(ticketId).then((res) => res.data.data) : null),
    enabled: isOpen && !!ticketId,
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: () => {
      if (isInternalNote) {
        return superAdminSupportApi.addInternalNote(ticketId!, replyText);
      }
      return superAdminSupportApi.reply(ticketId!, replyText);
    },
    onSuccess: () => {
      setReplyText('');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to send reply.');
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: (status: string) => superAdminSupportApi.updateStatus(ticketId!, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
    },
  });

  // Priority Mutation
  const priorityMutation = useMutation({
    mutationFn: (priority: string) => superAdminSupportApi.updatePriority(ticketId!, priority),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
    },
  });

  // Escalate Mutation
  const escalateMutation = useMutation({
    mutationFn: () => superAdminSupportApi.escalate(ticketId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
    },
  });

  // Reopen Mutation
  const reopenMutation = useMutation({
    mutationFn: () => superAdminSupportApi.reopen(ticketId!, 'Reopened by Super Admin via Help Desk'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
    },
  });

  if (!isOpen || !ticketId) return null;

  const ticket = ticketQuery.data;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setError('Please enter a message before sending.');
      return;
    }
    replyMutation.mutate();
  };

  const getPriorityBadge = (p: string) => {
    const pr = (p || 'medium').toLowerCase();
    switch (pr) {
      case 'urgent':
        return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">Urgent</span>;
      case 'high':
        return <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">High</span>;
      case 'low':
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Low</span>;
      default:
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">Medium</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    const st = (s || 'open').toLowerCase();
    switch (st) {
      case 'resolved':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"><CheckCircle2 size={12} /> Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Closed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"><Clock size={12} /> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"><AlertCircle size={12} /> Open</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-2xl dark:bg-slate-900 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            {ticketQuery.isLoading ? (
              <div className="py-2 text-sm text-slate-400">Loading ticket details...</div>
            ) : ticket ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {ticket.ticket_number}
                  </span>
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {ticket.category}
                  </span>
                </div>
                <h2 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                  {ticket.subject}
                </h2>
              </div>
            ) : null}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          {ticket && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Profile & Assignment Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requester Profile</span>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold text-xs">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{ticket.user_name}</p>
                      <p className="text-[11px] text-slate-500">{ticket.user_email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{ticket.institution_name || 'Independent Learner'}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Agent</span>
                    <button
                      type="button"
                      onClick={() => onOpenAssignModal(ticket)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {ticket.assigned_to_name ? 'Reassign' : 'Assign Agent'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-bold text-xs">
                      <ShieldCheck size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {ticket.assigned_to_name || 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-slate-500">{ticket.department || 'Customer Support'}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Created {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tabs: Conversation vs Activity */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('conversation')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === 'conversation'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Conversation Thread</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {ticket.messages?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === 'activity'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Clock size={14} />
                  <span>Activity Timeline</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {ticket.activities?.length || 0}
                  </span>
                </button>
              </div>

              {/* Tab 1: Conversation Thread */}
              {activeTab === 'conversation' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {ticket.messages?.map((msg: any) => {
                      const isNote = msg.is_internal || msg.message_type === 'INTERNAL_NOTE';
                      const isAdmin = msg.message_type === 'ADMIN_REPLY' || msg.sender_role === 'super_admin' || msg.sender_role === 'institution_admin';

                      return (
                        <div
                          key={msg.id}
                          className={`rounded-xl border p-4 transition ${
                            isNote
                              ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30'
                              : isAdmin
                              ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {msg.sender_name}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  isNote
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                    : isAdmin
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {isNote ? 'Internal Note' : isAdmin ? 'Support Team' : 'User'}
                              </span>
                              {isNote && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                  <Lock size={10} /> Hidden from user
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2.5 text-xs text-slate-800 whitespace-pre-wrap dark:text-slate-200">
                            {msg.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendReply} className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isInternalNote ? 'Add Confidential Internal Note' : 'Send Reply to User'}
                      </span>
                      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(false)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                            !isInternalNote
                              ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          Public Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(true)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                            isInternalNote
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                        >
                          Internal Note
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={
                        isInternalNote
                          ? 'Add notes only visible to support team...'
                          : 'Type your message to the user...'
                      }
                      className="mt-2.5 w-full resize-none rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />

                    {error && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                        {error}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        {isInternalNote ? 'Will not notify user' : 'User will be notified via email & dashboard'}
                      </span>
                      <button
                        type="submit"
                        disabled={replyMutation.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                          isInternalNote
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {replyMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>{replyMutation.isPending ? 'Sending...' : isInternalNote ? 'Save Note' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Activity Timeline */}
              {activeTab === 'activity' && (
                <div className="relative border-l-2 border-slate-200 pl-6 dark:border-slate-800 space-y-4">
                  {ticket.activities?.length === 0 ? (
                    <div className="text-xs text-slate-400">No activity recorded yet.</div>
                  ) : (
                    ticket.activities.map((act: any) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white dark:ring-slate-900">
                          <Clock size={10} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                              {act.action.replace('_', ' ')}
                            </span>
                            {act.new_value && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {act.new_value}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {act.description} • By {act.actor_name || 'System'} • {new Date(act.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Footer */}
          {ticket && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Quick Actions:</span>
                {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate('resolved')}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate('closed')}
                      disabled={statusMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => reopenMutation.mutate()}
                    disabled={reopenMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
                  >
                    <RotateCcw size={13} /> Reopen Ticket
                  </button>
                )}

                {ticket.priority !== 'urgent' && ticket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => escalateMutation.mutate()}
                    disabled={escalateMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                  >
                    <Flame size={13} /> Escalate
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={ticket.priority}
                  onChange={(e) => priorityMutation.mutate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
