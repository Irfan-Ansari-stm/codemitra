'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Headset, AlertCircle, Clock, CheckCircle2,
  RefreshCw, Search, Plus, Download, Eye, UserCheck,
  ChevronLeft, ChevronRight, Trash2, X, Check, Inbox
} from 'lucide-react';
import { superAdminSupportApi } from '@/lib/api';
import { TicketDetailsDrawer } from './TicketDetailsDrawer';
import { AssignTicketModal } from './AssignTicketModal';
import { CreateTicketModal } from './CreateTicketModal';

export default function SuperAdminSupportPage() {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Modals & Drawers state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [assignTicketTarget, setAssignTicketTarget] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1. Statistics Query
  const statsQuery = useQuery({
    queryKey: ['super-admin-support-stats'],
    queryFn: () => superAdminSupportApi.getStatistics().then((res) => res.data.data),
    refetchInterval: 30000,
  });

  // 2. Ticket Listing Query
  const ticketsQuery = useQuery({
    queryKey: [
      'super-admin-support-tickets',
      debouncedSearch,
      selectedStatus,
      selectedPriority,
      selectedCategory,
      page,
      limit,
    ],
    queryFn: () =>
      superAdminSupportApi
        .listTickets({
          search: debouncedSearch || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          priority: selectedPriority !== 'all' ? selectedPriority : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          page,
          limit,
        })
        .then((res) => {
          setLastRefreshed(new Date());
          return res.data.data;
        }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => superAdminSupportApi.deleteTicket(id),
    onSuccess: () => {
      setDeleteConfirmTicket(null);
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
      showFeedback('Ticket deleted successfully.');
    },
  });

  // Quick Status Mutation
  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      superAdminSupportApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-support-stats'] });
      showFeedback('Ticket status updated.');
    },
  });

  const stats = statsQuery.data || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    resolvedOrClosedTickets: 0,
  };

  const ticketsData = ticketsQuery.data || { items: [], total: 0, totalPages: 1 };
  const tickets = ticketsData.items || [];

  const handleExportCSV = () => {
    window.location.href = superAdminSupportApi.exportCSVUrl({
      search: debouncedSearch || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      priority: selectedPriority !== 'all' ? selectedPriority : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
  };

  const getPriorityBadge = (p: string) => {
    const pr = (p || 'medium').toLowerCase();
    switch (pr) {
      case 'urgent':
        return (
          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
            High
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            Medium
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    const st = (s || 'open').toLowerCase();
    switch (st) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 size={11} /> Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Closed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock size={11} /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <AlertCircle size={11} /> Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
          <Check size={14} className="text-emerald-400 dark:text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

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

        <div className="flex items-center gap-2.5">
          <span className="hidden lg:inline text-[11px] text-slate-400">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>

          <button
            onClick={() => {
              void statsQuery.refetch();
              void ticketsQuery.refetch();
            }}
            disabled={ticketsQuery.isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw size={13} className={ticketsQuery.isFetching ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download size={13} />
            Export CSV
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={14} />
            File Ticket
          </button>
        </div>
      </div>

      {/* Dashboard Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Card 1: Total Tickets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tickets</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Headset size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalTickets}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Received support requests</p>
        </div>

        {/* Card 2: Open Tickets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.openTickets}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awaiting initial response</p>
        </div>

        {/* Card 3: In Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stats.inProgressTickets}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Under active investigation</p>
        </div>

        {/* Card 4: Resolved / Closed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved / Closed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.resolvedOrClosedTickets || stats.resolvedTickets + stats.closedTickets}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Successfully resolved & closed</p>
        </div>
      </div>

      {/* Ticket Status Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {[
          { label: 'All Statuses', value: 'all', count: stats.totalTickets },
          { label: 'Open', value: 'open', count: stats.openTickets },
          { label: 'In Progress', value: 'in_progress', count: stats.inProgressTickets },
          { label: 'Resolved', value: 'resolved', count: stats.resolvedTickets },
          { label: 'Closed', value: 'closed', count: stats.closedTickets },
        ].map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket ID, subject, requester name, email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Account Issue">Account Issue</option>
            <option value="Billing">Billing</option>
            <option value="Course Issue">Course Issue</option>
            <option value="Assignment Issue">Assignment Issue</option>
            <option value="Payment Issue">Payment Issue</option>
            <option value="Bug Report">Bug Report</option>
            <option value="General Query">General Query</option>
          </select>

          {(selectedPriority !== 'all' || selectedCategory !== 'all' || debouncedSearch !== '') && (
            <button
              onClick={() => {
                setSelectedPriority('all');
                setSelectedCategory('all');
                setSearchTerm('');
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Support Ticket Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="py-3.5 pl-5 pr-3">Subject & User</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ticketsQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Inbox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No support tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((item: any) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {/* Subject & User */}
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {item.ticket_number}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white max-w-sm truncate">{item.subject}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.user_name}</span>
                        <span>•</span>
                        <span>{item.user_email}</span>
                        <span>•</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {item.user_role}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">{getPriorityBadge(item.priority)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-3">{getStatusBadge(item.status)}</td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-5 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(item.id)}
                          title="View Details & Reply"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye size={12} /> Details
                        </button>

                        <button
                          type="button"
                          onClick={() => setAssignTicketTarget(item)}
                          title="Assign Agent"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <UserCheck size={12} /> Assign
                        </button>

                        {item.status !== 'resolved' && item.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => quickStatusMutation.mutate({ id: item.id, status: 'resolved' })}
                            title="Quick Resolve"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            <CheckCircle2 size={12} /> Resolve
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmTicket(item)}
                          title="Delete Ticket"
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{tickets.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{ticketsData.total}</span> tickets
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || ticketsQuery.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {Math.max(1, ticketsData.totalPages || 1)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(ticketsData.totalPages || 1, p + 1))}
              disabled={page >= (ticketsData.totalPages || 1) || ticketsQuery.isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Details Drawer */}
      {selectedTicketId && (
        <TicketDetailsDrawer
          isOpen={Boolean(selectedTicketId)}
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onOpenAssignModal={(t) => setAssignTicketTarget(t)}
        />
      )}

      {/* Assign Agent Modal */}
      {assignTicketTarget && (
        <AssignTicketModal
          isOpen={Boolean(assignTicketTarget)}
          ticket={assignTicketTarget}
          onClose={() => setAssignTicketTarget(null)}
          onSuccess={() => showFeedback('Ticket assigned successfully.')}
        />
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => showFeedback('Support ticket filed successfully.')}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Support Ticket?</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete ticket{' '}
              <strong className="text-slate-900 dark:text-white">{deleteConfirmTicket.ticket_number}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmTicket(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmTicket.id)}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
