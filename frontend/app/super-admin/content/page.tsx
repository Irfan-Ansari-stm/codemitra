'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Image as ImageIcon, HelpCircle, Plus,
  Pencil, Trash2, X
} from 'lucide-react';
import { contentApi } from '@/lib/api';

type ContentTab = 'pages' | 'banners' | 'faqs';

export default function SuperAdminContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ContentTab>('pages');
  const [pageModal, setPageModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    pageType: 'custom',
  });

  const pagesQuery = useQuery({
    queryKey: ['super-admin-content-pages'],
    queryFn: () => contentApi.listPages().then((res) => res.data?.data || []),
  });

  const bannersQuery = useQuery({
    queryKey: ['super-admin-content-banners'],
    queryFn: () => contentApi.listBanners().then((res) => res.data?.data || []),
  });

  const faqsQuery = useQuery({
    queryKey: ['super-admin-content-faqs'],
    queryFn: () => contentApi.listFaqs().then((res) => res.data?.data || []),
  });

  const savePageMutation = useMutation({
    mutationFn: (data: any) =>
      pageModal.item
        ? contentApi.updatePage(pageModal.item.id, data)
        : contentApi.createPage(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-pages'] });
      setPageModal({ open: false });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => contentApi.deletePage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-pages'] });
    },
  });

  const openCreatePage = () => {
    setPageForm({ title: '', slug: '', content: '', status: 'draft', pageType: 'custom' });
    setPageModal({ open: true });
  };

  const openEditPage = (item: any) => {
    setPageForm({
      title: item.title,
      slug: item.slug,
      content: item.content || '',
      status: item.status || 'draft',
      pageType: item.page_type || 'custom',
    });
    setPageModal({ open: true, item });
  };

  const pages = pagesQuery.data || [];
  const banners = bannersQuery.data || [];
  const faqs = faqsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Content Management Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Platform-wide management for public pages, promotional banners, FAQs, and content revisions
          </p>
        </div>
        {activeTab === 'pages' && (
          <button
            onClick={openCreatePage}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={14} />
            Create Page
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'pages'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileText size={15} />
          <span>Pages ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'banners'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <ImageIcon size={15} />
          <span>Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
            activeTab === 'faqs'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <HelpCircle size={15} />
          <span>FAQs ({faqs.length})</span>
        </button>
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-3">Title & Slug</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pagesQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading content pages...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No custom content pages created yet.
                  </td>
                </tr>
              ) : (
                pages.map((p: any) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                      <p className="text-[11px] text-slate-400">/{p.slug}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.page_type || 'custom'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.status || 'draft'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(p.updated_at || p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditPage(p)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deletePageMutation.mutate(p.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
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
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-3">Banner Title</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Active Status</th>
                <th className="py-3 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No active banners currently displayed.
                  </td>
                </tr>
              ) : (
                banners.map((b: any) => (
                  <tr key={b.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3 font-semibold text-slate-900 dark:text-white">
                      {b.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{b.placement || 'homepage_top'}</td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              No platform FAQs configured.
            </div>
          ) : (
            faqs.map((f: any) => (
              <div
                key={f.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{f.question}</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{f.answer}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Page Edit/Create Modal */}
      {pageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {pageModal.item ? 'Edit Page' : 'Create Custom Page'}
              </h3>
              <button
                onClick={() => setPageModal({ open: false })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Page Title</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                  placeholder="e.g., Code of Conduct"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">URL Slug</label>
                <input
                  type="text"
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                  placeholder="code-of-conduct"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={pageForm.status}
                  onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Page Content (Markdown / HTML)
                </label>
                <textarea
                  rows={6}
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  placeholder="Enter markdown body..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                onClick={() => setPageModal({ open: false })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => savePageMutation.mutate(pageForm)}
                disabled={savePageMutation.isPending || !pageForm.title || !pageForm.slug}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

