'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Pencil, Trash2, X, Search, Eye,
  Calendar, Clock, CheckCircle2, AlertTriangle, FolderPlus
} from 'lucide-react';
import { blogAdminApi } from '@/lib/api';

export default function SuperAdminBlogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [articleModal, setArticleModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [categoriesModal, setCategoriesModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Forms
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    categoryId: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'draft',
    isFeatured: false,
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['super-admin-blog-stats'],
    queryFn: () => blogAdminApi.getStats().then((res) => res.data?.data || {}),
  });

  const categoriesQuery = useQuery({
    queryKey: ['super-admin-blog-categories'],
    queryFn: () => blogAdminApi.listCategories().then((res) => res.data?.data || []),
  });

  const articlesQuery = useQuery({
    queryKey: ['super-admin-blog-articles', statusFilter, categoryFilter, search],
    queryFn: () =>
      blogAdminApi
        .listArticles({ status: statusFilter, categoryId: categoryFilter, search, limit: 50 })
        .then((res) => res.data?.data || []),
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveArticleMutation = useMutation({
    mutationFn: (data: any) =>
      articleModal.item
        ? blogAdminApi.updateArticle(articleModal.item.id, data)
        : blogAdminApi.createArticle(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-articles'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-stats'] });
      setArticleModal({ open: false });
      setFeedback({ text: 'Editorial blog article saved successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to save article', type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => blogAdminApi.deleteArticle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-articles'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-stats'] });
      setDeleteConfirm(null);
      setFeedback({ text: 'Article deleted successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => blogAdminApi.createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-stats'] });
      setNewCatName('');
      setNewCatDesc('');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => blogAdminApi.deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-blog-stats'] });
    },
  });

  // Handlers
  const openCreateArticle = () => {
    setArticleForm({
      title: '',
      slug: '',
      categoryId: categoriesQuery.data?.[0]?.id || '',
      excerpt: '',
      content: '',
      tags: '',
      status: 'draft',
      isFeatured: false,
      scheduledAt: '',
      seoTitle: '',
      seoDescription: '',
    });
    setArticleModal({ open: true });
  };

  const openEditArticle = (item: any) => {
    setArticleForm({
      title: item.title || '',
      slug: item.slug || '',
      categoryId: item.category_id || '',
      excerpt: item.excerpt || '',
      content: item.content || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      status: item.status || 'draft',
      isFeatured: item.is_featured || false,
      scheduledAt: item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '',
      seoTitle: item.seo_title || '',
      seoDescription: item.seo_description || '',
    });
    setArticleModal({ open: true, item });
  };

  const stats = statsQuery.data || {};
  const categories = categoriesQuery.data || [];
  const articles = articlesQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog & Editorial Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Publish educational roadmaps, technology news, tutorials, and schedule upcoming editorial articles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCategoriesModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition"
          >
            <FolderPlus className="w-4 h-4 text-purple-500" />
            Categories ({categories.length})
          </button>
          <button
            onClick={openCreateArticle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Blog Post
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
            <span className="text-xs uppercase font-semibold">Total Articles</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalArticles ?? '—'}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {stats.publishedArticles ?? 0} published
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Scheduled</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduledArticles ?? '—'}</p>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Upcoming releases</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Drafts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftArticles ?? '—'}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Work in progress</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total Readers</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews ?? '—'}</p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Article views</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title, excerpt, or tags..."
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
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 font-semibold">Title & Details</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Read Time & Views</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {articlesQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading editorial articles...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No blog articles match the filters.</td>
                </tr>
              ) : (
                articles.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {a.is_featured && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                            FEATURED
                          </span>
                        )}
                        <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">/{a.slug}</span>
                      {a.tags && Array.isArray(a.tags) && a.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {a.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-mono text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        {a.category_name || 'Programming'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === 'published'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : a.status === 'scheduled'
                            ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                            : a.status === 'draft'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>⏱️ {a.read_time_minutes || 5}m</span> · <span>👁️ {a.view_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {a.status === 'scheduled' && a.scheduled_at
                        ? `Scheduled: ${new Date(a.scheduled_at).toLocaleDateString()}`
                        : a.published_at
                        ? new Date(a.published_at).toLocaleDateString()
                        : new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/blog/${a.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on site"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEditArticle(a)}
                          title="Edit"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: a.id, title: a.title })}
                          title="Delete"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-rose-600 dark:text-rose-400 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ARTICLE CREATE/EDIT MODAL */}
      {articleModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {articleModal.item ? 'Edit Blog Article' : 'Create Editorial Post'}
              </h3>
              <button onClick={() => setArticleModal({ open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setArticleForm((prev) => ({
                      ...prev,
                      title: t,
                      slug: prev.slug || t.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-'),
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. Mastering Asynchronous JavaScript in 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={articleForm.categoryId}
                    onChange={(e) => setArticleForm({ ...articleForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={articleForm.status}
                    onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                {articleForm.status === 'scheduled' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      value={articleForm.scheduledAt}
                      onChange={(e) => setArticleForm({ ...articleForm, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isFeaturedBlog"
                      checked={articleForm.isFeatured}
                      onChange={(e) => setArticleForm({ ...articleForm, isFeatured: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isFeaturedBlog" className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      Feature on Blog Hero
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={articleForm.tags}
                  onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                  placeholder="javascript, async, nodejs"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Short Excerpt *</label>
                <textarea
                  rows={2}
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="Lead paragraph / summary for card displays..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Article Body (Markdown / HTML) *</label>
                <textarea
                  rows={6}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  placeholder="Write full article here..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setArticleModal({ open: false })}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={saveArticleMutation.isPending || !articleForm.title || !articleForm.content || !articleForm.excerpt}
                onClick={() => {
                  const tagList = articleForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
                  saveArticleMutation.mutate({
                    ...articleForm,
                    tags: tagList,
                    scheduledAt: articleForm.status === 'scheduled' && articleForm.scheduledAt ? new Date(articleForm.scheduledAt).toISOString() : null,
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saveArticleMutation.isPending ? 'Saving...' : articleModal.item ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {categoriesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blog Categories</h3>
              <button onClick={() => setCategoriesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">New Category</h4>
              <input
                type="text"
                placeholder="Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-1.5 border rounded text-xs dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Description"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3 py-1.5 border rounded text-xs dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              <button
                disabled={createCategoryMutation.isPending || !newCatName.trim()}
                onClick={() => createCategoryMutation.mutate({ name: newCatName, description: newCatDesc })}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Add Category
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</h5>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                      {c.articles_count || 0} articles
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCategoryMutation.mutate(c.id)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Blog Article</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteConfirm.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteArticleMutation.mutate(deleteConfirm.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium"
              >
                Delete Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
