'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Headset, MessageSquare, AlertCircle, CheckCircle2,
  Clock, Send, RefreshCw, X, User, Trash2
} from 'lucide-react';
import { ticketApi } from '@/lib/api';

export default function SuperAdminSupportPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [page] = useState(1);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tickets list
  const ticketsQuery = useQuery({
    queryKey: ['super-admin-tickets', selectedStatus, page],
    queryFn: () =>
      ticketApi
        .list(selectedStatus || undefined, page, 20)
        .then((res) => res.data?.data || res.data || {}),
  });

  // Selected ticket detail
  const ticketDetailQuery = useQuery({
    queryKey: ['super-admin-ticket-detail', selectedTicketId],
    queryFn: () =>
      selectedTicketId ? ticketApi.get(selectedTicketId).then((res) => res.data?.data) : null,
    enabled: !!selectedTicketId,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, message, isInternal }: { id: string; message: string; isInternal: boolean }) =>
      ticketApi.reply(id, message, isInternal),
    onSuccess: () => {
      setReplyMessage('');
      setIsInternalNote(false);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-ticket-detail', selectedTicketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] });
      setFeedback({ text: 'Reply posted successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to post reply.',
        type: 'error',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ticketApi.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-ticket-detail', selectedTicketId] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] });
      setFeedback({ text: 'Ticket status updated.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Delete ticket mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketApi.delete(id),
    onSuccess: () => {
      setSelectedTicketId(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] });
      setFeedback({ text: 'Ticket deleted.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const ticketsData = ticketsQuery.data;
  const tickets: any[] = Array.isArray(ticketsData)
    ? ticketsData
    : Array.isArray(ticketsData?.data)
    ? ticketsData.data
    : Array.isArray(ticketsData?.items)
    ? ticketsData.items
    : [];

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  const currentTicket = ticketDetailQuery.data;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage.trim()) return;
    replyMutation.mutate({
      id: selectedTicketId,
      message: replyMessage.trim(),
      isInternal: isInternalNote,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Ticket Help Desk
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform-wide customer queries, instructor requests, bug reports, and resolution threads
          </p>
        </div>
        <button
          onClick={() => ticketsQuery.refetch()}
          disabled={ticketsQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${ticketsQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Alert */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tickets</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Headset className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {tickets.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Received support requests</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Open Tickets</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {openCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awaiting initial response</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inProgressCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Under staff investigation</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved / Closed</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Successfully resolved</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              selectedStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {status ? status.replace('_', ' ') : 'All Statuses'}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Subject & User</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No support tickets found for this filter.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: any) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</div>
                      <div className="text-xs text-slate-500">
                        {ticket.user_name || 'User'} &bull; {ticket.user_email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {ticket.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          ticket.priority === 'urgent'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : ticket.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ticket.status === 'open'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : ticket.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicketId(ticket.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Reply Modal */}
      {selectedTicketId && currentTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                      currentTicket.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {currentTicket.priority}
                  </span>
                  <span className="text-xs text-slate-500">#{currentTicket.id.slice(0, 8)}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {currentTicket.subject}
                </h3>
                <p className="text-xs text-slate-500">
                  By {currentTicket.user_name} ({currentTicket.user_email}) &bull; {new Date(currentTicket.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={currentTicket.status}
                  onChange={(e) => updateStatusMutation.mutate({ id: currentTicket.id, status: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Original ticket description */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  {currentTicket.user_name} (Original Request)
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                  {currentTicket.description}
                </p>
              </div>

              {/* Replies */}
              {(currentTicket.replies || []).map((reply: any) => (
                <div
                  key={reply.id}
                  className={`rounded-xl border p-4 ${
                    reply.is_internal
                      ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {reply.user_name || 'Admin'}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400">
                      {reply.is_internal && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          INTERNAL NOTE
                        </span>
                      )}
                      <span>{new Date(reply.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                    {reply.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="border-t border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between pb-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Add Response
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Internal Note (Private)</span>
                </label>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply to the user or an internal note for staff..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
              <div className="mt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this ticket?')) {
                      deleteMutation.mutate(currentTicket.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Ticket
                </button>
                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {replyMutation.isPending ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

