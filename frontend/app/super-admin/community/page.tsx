'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessagesSquare, MessageSquare, Pin, Lock, CheckCircle2,
  AlertTriangle, Trash2, Eye, ShieldAlert,
  User, X, Search
} from 'lucide-react';
import { communityAdminApi } from '@/lib/api';

type CommunityTab = 'discussions' | 'moderation' | 'categories';

export default function CommunityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CommunityTab>('discussions');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');

  // Detail & Action Modals
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [resolutionModal, setResolutionModal] = useState<{ open: boolean; report: any; action: string } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // New Category Modal
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

  // New Reply Form inside Thread Drawer
  const [replyContent, setReplyContent] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['super-admin-community-stats'],
    queryFn: () => communityAdminApi.getStats().then((res) => res.data?.data || {}),
  });

  const categoriesQuery = useQuery({
    queryKey: ['super-admin-community-categories'],
    queryFn: () => communityAdminApi.listCategories().then((res) => res.data?.data || []),
  });

  const threadsQuery = useQuery({
    queryKey: ['super-admin-community-threads', categoryFilter, statusFilter, moderationFilter, search],
    queryFn: () =>
      communityAdminApi
        .listThreads({
          categoryId: categoryFilter,
          status: statusFilter,
          moderationStatus: moderationFilter,
          search,
          limit: 50,
        })
        .then((res) => res.data?.data || []),
  });

  const reportsQuery = useQuery({
    queryKey: ['super-admin-community-reports', reportStatusFilter],
    queryFn: () =>
      communityAdminApi
        .listReports({ status: reportStatusFilter, limit: 50 })
        .then((res) => res.data?.data || []),
    enabled: activeTab === 'moderation',
  });

  const threadDetailQuery = useQuery({
    queryKey: ['super-admin-thread-detail', selectedThread?.id],
    queryFn: () => communityAdminApi.getThread(selectedThread!.id).then((res) => res.data?.data),
    enabled: Boolean(selectedThread?.id),
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const updateThreadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => communityAdminApi.updateThread(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-threads'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-thread-detail'] });
      setFeedback({ text: 'Thread updated successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (id: string) => communityAdminApi.deleteThread(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-threads'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-stats'] });
      setSelectedThread(null);
      setDeleteConfirm(null);
      setFeedback({ text: 'Discussion thread removed permanently.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      communityAdminApi.createReply(threadId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-thread-detail'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-threads'] });
      setReplyContent('');
      setFeedback({ text: 'Reply posted to thread.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note?: string }) =>
      communityAdminApi.resolveReport(id, action, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-reports'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-threads'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-stats'] });
      setResolutionModal(null);
      setResolutionNote('');
      setFeedback({ text: 'Moderation action executed and logged to audit trail.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => communityAdminApi.createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-community-categories'] });
      setNewCatModal(false);
      setNewCatName('');
      setNewCatDesc('');
    },
  });

  const stats = statsQuery.data || {};
  const categories = categoriesQuery.data || [];
  const threads = threadsQuery.data || [];
  const reports = reportsQuery.data || [];
  const activeThread = threadDetailQuery.data || selectedThread;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community & Discussions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moderate coding forum threads, resolve student inquiries, and oversee community health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewCatModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition"
          >
            New Category
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            Moderation Queue ({stats.pendingModeration ?? 0})
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total Threads</span>
            <MessagesSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalThreads ?? '—'}</p>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {stats.activeTopicsThisWeek ?? 0} active this week
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total Replies</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReplies ?? '—'}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">~18m avg peer response</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Pending Reports</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingModeration ?? '—'}</p>
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Needs moderator review</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Resolved Topics</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolvedDiscussions ?? '—'}</p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Answered questions</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'discussions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <MessagesSquare className="w-4 h-4" />
            Discussion Threads ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'moderation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Moderation Queue ({stats.pendingModeration ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Categories & Tags ({categories.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: DISCUSSIONS */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions by title or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="locked">Locked</option>
            </select>
            <select
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All Moderation</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {threadsQuery.isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading discussions...</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No discussion threads match the current criteria.</div>
              ) : (
                threads.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-5 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {t.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            <Pin className="w-3 h-3" /> PINNED
                          </span>
                        )}
                        {t.is_locked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            <Lock className="w-3 h-3" /> LOCKED
                          </span>
                        )}
                        {t.is_resolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            <CheckCircle2 className="w-3 h-3" /> RESOLVED
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: t.category_color || '#3B82F6' }}
                        >
                          {t.category_name || 'General'}
                        </span>
                        {t.tags &&
                          t.tags.map((tag: string) => (
                            <span key={tag} className="text-xs text-gray-500 font-mono">
                              #{tag}
                            </span>
                          ))}
                      </div>

                      <h3
                        onClick={() => setSelectedThread(t)}
                        className="font-bold text-gray-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
                      >
                        {t.title}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>By {t.author_name || 'Anonymous Learner'}</span>
                        <span>·</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:flex-shrink-0">
                      <div className="text-xs text-gray-500 text-right">
                        <div>💬 {t.reply_count || 0} replies</div>
                        <div>👍 {t.upvotes || 0} upvotes</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedThread(t)}
                          title="View Thread"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            updateThreadMutation.mutate({
                              id: t.id,
                              data: { isPinned: !t.is_pinned },
                            })
                          }
                          title={t.is_pinned ? 'Unpin' : 'Pin'}
                          className={`p-1.5 rounded-md transition ${
                            t.is_pinned
                              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            updateThreadMutation.mutate({
                              id: t.id,
                              data: { isLocked: !t.is_locked, status: t.is_locked ? 'open' : 'locked' },
                            })
                          }
                          title={t.is_locked ? 'Unlock' : 'Lock'}
                          className={`p-1.5 rounded-md transition ${
                            t.is_locked
                              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: t.id, title: t.title })}
                          title="Delete Thread"
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Flagged Content Reports</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  reportStatusFilter === 'pending'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setReportStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  reportStatusFilter === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setReportStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  reportStatusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                All Reports
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportsQuery.isLoading ? (
                <div className="p-8 text-center text-gray-400">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>Moderation queue clean! No {reportStatusFilter} flags.</p>
                </div>
              ) : (
                reports.map((r: any) => (
                  <div key={r.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                          {r.reason}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">Type: {r.report_type}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            r.status === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {r.thread_title || (r.reply_snippet ? `Reply: "${r.reply_snippet}"` : 'Reported Content')}
                      </h4>

                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        <strong>Reason:</strong> {r.description || 'No detailed message provided by reporter'}
                      </p>

                      <p className="text-[11px] text-gray-400">
                        Reported by {r.reporter_name || 'Student'} on {new Date(r.created_at).toLocaleString()}
                        {r.moderator_name && ` · Resolved by ${r.moderator_name} (${r.moderation_action})`}
                      </p>
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setResolutionModal({ open: true, report: r, action: 'hide' })}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition"
                        >
                          Hide Content
                        </button>
                        <button
                          onClick={() => setResolutionModal({ open: true, report: r, action: 'delete' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setResolutionModal({ open: true, report: r, action: 'dismiss' })}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-xs font-semibold transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c: any) => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: c.color || '#3B82F6' }}
                  />
                  <span className="text-xs text-gray-400 font-mono">{c.threads_count || 0} threads</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">{c.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{c.description || 'Topic discussions'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THREAD DETAILS DRAWER / MODAL */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full overflow-y-auto p-6 space-y-5 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
                <span className="px-2.5 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: activeThread.category_color || '#3B82F6' }}>
                  {activeThread.category_name || 'Discussion'}
                </span>
                <button onClick={() => setSelectedThread(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeThread.title}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Posted by {activeThread.author_name} ({activeThread.author_role || 'student'}) · {new Date(activeThread.created_at).toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                {activeThread.content}
              </div>

              {/* Replies Section */}
              <div className="pt-4 border-t dark:border-gray-700 space-y-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Replies ({activeThread.replies?.length || 0})
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activeThread.replies?.map((rep: any) => (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        rep.is_best_answer
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">{rep.author_name || 'Learner'}</span>
                          {rep.is_best_answer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              BEST ANSWER
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{new Date(rep.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs">{rep.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Post Reply */}
            <div className="pt-4 border-t dark:border-gray-700 space-y-2">
              <textarea
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write an administrative response or moderator note..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  disabled={createReplyMutation.isPending || !replyContent.trim()}
                  onClick={() =>
                    createReplyMutation.mutate({
                      threadId: activeThread.id,
                      content: replyContent,
                    })
                  }
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION RESOLUTION MODAL */}
      {resolutionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Confirm Action: <span className="uppercase text-rose-600">{resolutionModal.action}</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Provide an administrative note explaining the reasoning behind this decision. This action will be immutably recorded in the moderation audit trail.
            </p>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Resolution rationale..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => setResolutionModal(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  resolveReportMutation.mutate({
                    id: resolutionModal.report.id,
                    action: resolutionModal.action,
                    note: resolutionNote,
                  })
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {newCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Community Category</h3>
              <button onClick={() => setNewCatModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. Distributed Systems"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Badge Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-gray-500">{newCatColor}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button onClick={() => setNewCatModal(false)} className="px-4 py-2 border rounded-lg text-sm">
                Cancel
              </button>
              <button
                disabled={createCategoryMutation.isPending || !newCatName.trim()}
                onClick={() =>
                  createCategoryMutation.mutate({
                    name: newCatName,
                    description: newCatDesc,
                    color: newCatColor,
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE THREAD CONFIRMATION */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Discussion Thread</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteConfirm.title}</strong> and all associated student replies?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteThreadMutation.mutate(deleteConfirm.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium"
              >
                Delete Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
