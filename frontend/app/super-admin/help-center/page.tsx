'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Edit3, Trash2, X, Search, CheckCircle2,
  FolderPlus, Eye, History, RotateCcw, ThumbsUp, AlertTriangle
} from 'lucide-react';
import { helpCenterApi } from '@/lib/api';

export default function SuperAdminHelpCenterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [articleModal, setArticleModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [categoriesModal, setCategoriesModal] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [revisionsModal, setRevisionsModal] = useState<{ open: boolean; articleId?: string; revisions: any[] }>({ open: false, revisions: [] });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Forms
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    categoryId: '',
    category: 'Getting Started',
    shortDescription: '',
    content: '',
    status: 'published',
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['super-admin-help-stats'],
    queryFn: () => helpCenterApi.getStats().then((res) => res.data?.data || {}),
  });

  const categoriesQuery = useQuery({
    queryKey: ['super-admin-help-categories'],
    queryFn: () => helpCenterApi.listCategories().then((res) => res.data?.data || []),
  });

  const articlesQuery = useQuery({
    queryKey: ['super-admin-help-articles', statusFilter, categoryFilter, search],
    queryFn: () =>
      helpCenterApi
        .listArticles({ status: statusFilter, categoryId: categoryFilter, search, limit: 50 })
        .then((res) => res.data?.data || []),
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveArticleMutation = useMutation({
    mutationFn: (data: any) =>
      articleModal.item
        ? helpCenterApi.updateArticle(articleModal.item.id, data)
        : helpCenterApi.createArticle(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-stats'] });
      setArticleModal({ open: false });
      setFeedback({ text: 'Knowledge base article saved successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to save article', type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => helpCenterApi.deleteArticle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-stats'] });
      setDeleteConfirm(null);
      setFeedback({ text: 'Article deleted successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => helpCenterApi.createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-stats'] });
      setNewCatName('');
      setNewCatDesc('');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => helpCenterApi.deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-stats'] });
    },
  });

  const openRevisions = async (articleId: string) => {
    try {
      const res = await helpCenterApi.getRevisions(articleId);
      setRevisionsModal({ open: true, articleId, revisions: res.data?.data || [] });
    } catch {
      setRevisionsModal({ open: true, articleId, revisions: [] });
    }
  };

  const restoreRevisionMutation = useMutation({
    mutationFn: ({ articleId, revId }: { articleId: string; revId: string }) =>
      helpCenterApi.restoreRevision(articleId, revId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      setRevisionsModal({ open: false, revisions: [] });
      setFeedback({ text: 'Revision restored.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Handlers
  const openCreateArticle = () => {
    setArticleForm({
      title: '',
      slug: '',
      categoryId: categoriesQuery.data?.[0]?.id || '',
      category: categoriesQuery.data?.[0]?.name || 'Getting Started',
      shortDescription: '',
      content: '',
      status: 'published',
      isFeatured: false,
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
      category: item.category || 'Getting Started',
      shortDescription: item.short_description || '',
      content: item.content || '',
      status: item.status || 'published',
      isFeatured: item.is_featured || false,
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center Knowledge Base</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Author and organize self-service support documentation, FAQs, and onboarding walkthroughs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCategoriesModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition"
          >
            <FolderPlus className="w-4 h-4 text-purple-500" />
            Manage Categories ({categories.length})
          </button>
          <button
            onClick={openCreateArticle}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Article
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
            <span className="text-xs uppercase font-semibold">Categories</span>
            <FolderPlus className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCategories ?? '—'}</p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Topic clusters</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Article Views</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews ?? '—'}</p>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Self-service solutions</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Helpful Feedback</span>
            <ThumbsUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.helpfulRatio !== undefined ? `${stats.helpfulRatio}%` : '—'}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Positive student rating</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title, slug, or content..."
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
                <th className="px-6 py-3 font-semibold">Article Title</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Helpful / Views</th>
                <th className="px-6 py-3 font-semibold">Updated</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {articlesQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading help articles...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No help articles match the current filters.</td>
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
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">
                        {a.category_name || a.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === 'published'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : a.status === 'draft'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>👍 {a.helpful_count || 0}</span> · <span>👁️ {a.view_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {a.updated_at ? new Date(a.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewModal({ open: true, item: a })}
                          title="Preview"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRevisions(a.id)}
                          title="Revisions"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 rounded-md transition"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditArticle(a)}
                          title="Edit"
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
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
                {articleModal.item ? 'Edit Knowledge Base Article' : 'Create Help Article'}
              </h3>
              <button onClick={() => setArticleModal({ open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Article Title *</label>
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
                  placeholder="e.g. How to connect custom GitHub repositories"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select
                    value={articleForm.categoryId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const c = categories.find((cat: any) => cat.id === selectedId);
                      setArticleForm({
                        ...articleForm,
                        categoryId: selectedId,
                        category: c ? c.name : 'Getting Started',
                      });
                    }}
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
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeaturedArticle"
                    checked={articleForm.isFeatured}
                    onChange={(e) => setArticleForm({ ...articleForm, isFeatured: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isFeaturedArticle" className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    Pin as Featured Article
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={articleForm.shortDescription}
                  onChange={(e) => setArticleForm({ ...articleForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="Summary for search results and previews..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Article Content (HTML / Markdown) *</label>
                <textarea
                  rows={6}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  placeholder="<h3>Instructions</h3><p>Step-by-step guidance...</p>"
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
                disabled={saveArticleMutation.isPending || !articleForm.title || !articleForm.content}
                onClick={() => saveArticleMutation.mutate(articleForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saveArticleMutation.isPending ? 'Saving...' : articleModal.item ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL */}
      {categoriesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Help Center Categories</h3>
              <button onClick={() => setCategoriesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Add Category</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="px-3 py-1.5 border rounded text-xs dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="px-3 py-1.5 border rounded text-xs dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                disabled={createCategoryMutation.isPending || !newCatName.trim()}
                onClick={() => createCategoryMutation.mutate({ name: newCatName, description: newCatDesc })}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Add Category
              </button>
            </div>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</h5>
                    <p className="text-xs text-gray-500">{c.description || 'No description'}</p>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
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

      {/* PREVIEW MODAL */}
      {previewModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{previewModal.item?.title}</h3>
              </div>
              <button onClick={() => setPreviewModal({ open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              {previewModal.item?.short_description && (
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 italic">
                  {previewModal.item?.short_description}
                </p>
              )}
              <div
                className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: previewModal.item?.content || '' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* REVISIONS HISTORY MODAL */}
      {revisionsModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Article Version History</h3>
              </div>
              <button onClick={() => setRevisionsModal({ open: false, revisions: [] })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {revisionsModal.revisions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No recorded revisions.</p>
              ) : (
                revisionsModal.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Version {rev.version}</span>
                        <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">{rev.title}</p>
                    </div>
                    <button
                      onClick={() =>
                        restoreRevisionMutation.mutate({ articleId: revisionsModal.articleId!, revId: rev.id })
                      }
                      disabled={restoreRevisionMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Article</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteConfirm.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteArticleMutation.mutate(deleteConfirm.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
