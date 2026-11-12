'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Edit3, Trash2,
  RefreshCw, X, Search, FileText, CheckCircle2
} from 'lucide-react';
import { contentApi } from '@/lib/api';

export default function SuperAdminHelpCenterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Getting Started');
  const [content, setContent] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const articlesQuery = useQuery({
    queryKey: ['super-admin-help-articles'],
    queryFn: () => contentApi.listHelpArticles().then((res) => res.data?.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contentApi.createHelpArticle(data),
    onSuccess: () => {
      setFeedback({ text: 'Help article created successfully.', type: 'success' });
      handleCloseModal();
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to create article.',
        type: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contentApi.updateHelpArticle(id, data),
    onSuccess: () => {
      setFeedback({ text: 'Help article updated successfully.', type: 'success' });
      handleCloseModal();
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({
        text: err?.response?.data?.error?.message || 'Failed to update article.',
        type: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.deleteHelpArticle(id),
    onSuccess: () => {
      setFeedback({ text: 'Help article deleted.', type: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-help-articles'] });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const articles: any[] = articlesQuery.data || [];
  const filteredArticles = articles.filter(
    (a) =>
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setTitle('');
    setSlug('');
    setCategory('Getting Started');
    setContent('');
    setShowModal(true);
  };

  const handleOpenEdit = (article: any) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setCategory(article.category || 'Getting Started');
    setContent(article.content || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) return;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      category: category.trim(),
      content: content.trim(),
    };

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Help Center Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Author and publish student guides, instructor documentation, and platform tutorials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => articlesQuery.refetch()}
            disabled={articlesQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${articlesQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Articles</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {articles.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Published guide documents</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Categories</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {categories.length || 1}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Distinct topic groupings</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Public
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Accessible to all visitors</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles by title, slug, or category..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Articles Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Article Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">URL Slug</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    No help articles found. Click &quot;New Article&quot; to create your first guide.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article: any) => (
                  <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{article.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{article.content}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {article.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      /help-center/{article.slug}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(article.updated_at || article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(article)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete article "${article.title}"?`)) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
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

      {/* Create / Edit Article Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingArticle ? 'Edit Help Article' : 'Create Help Article'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Article Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. How to Submit Python Assignments"
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="how-to-submit-python-assignments"
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Getting Started, Coding Sandbox, Billing"
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Markdown Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Write article guide content in Markdown format..."
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

