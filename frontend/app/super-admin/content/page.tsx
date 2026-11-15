'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Image as ImageIcon, HelpCircle, Plus,
  Pencil, Trash2, X, Search, Globe, Eye,
  History, RotateCcw, AlertTriangle
} from 'lucide-react';
import { contentApi } from '@/lib/api';

type ContentTab = 'pages' | 'banners' | 'faqs';

export default function SuperAdminContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ContentTab>('pages');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');

  // Modals state
  const [pageModal, setPageModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [bannerModal, setBannerModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [faqModal, setFaqModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [revisionsModal, setRevisionsModal] = useState<{ open: boolean; pageId?: string; revisions: any[] }>({ open: false, revisions: [] });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'page' | 'banner' | 'faq'; id: string; title: string } | null>(null);

  // Form states
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    pageType: 'page',
    category: 'General',
    excerpt: '',
    content: '',
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    keywords: '',
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: 'Learn More',
    ctaUrl: '/',
    position: 'top',
    priority: 5,
    isActive: true,
  });

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    displayOrder: 1,
    status: 'published',
  });

  // ── Queries ─────────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['super-admin-content-stats'],
    queryFn: () => contentApi.getStats().then((res) => res.data?.data || {}),
  });

  const pagesQuery = useQuery({
    queryKey: ['super-admin-content-pages', statusFilter, pageTypeFilter, search],
    queryFn: () =>
      contentApi
        .listPages({ status: statusFilter, pageType: pageTypeFilter, search, limit: 50 })
        .then((res) => res.data?.data || []),
  });

  const bannersQuery = useQuery({
    queryKey: ['super-admin-content-banners', search],
    queryFn: () => contentApi.listBanners().then((res) => res.data?.data || []),
  });

  const faqsQuery = useQuery({
    queryKey: ['super-admin-content-faqs', faqCategoryFilter, search],
    queryFn: () =>
      contentApi
        .listFaqs({ category: faqCategoryFilter, search })
        .then((res) => res.data?.data || []),
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const savePageMutation = useMutation({
    mutationFn: (data: any) =>
      pageModal.item
        ? contentApi.updatePage(pageModal.item.id, data)
        : contentApi.createPage(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-pages'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setPageModal({ open: false });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => contentApi.deletePage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-pages'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setDeleteConfirm(null);
    },
  });

  const saveBannerMutation = useMutation({
    mutationFn: (data: any) =>
      bannerModal.item
        ? contentApi.updateBanner(bannerModal.item.id, data)
        : contentApi.createBanner(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-banners'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setBannerModal({ open: false });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => contentApi.deleteBanner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-banners'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setDeleteConfirm(null);
    },
  });

  const saveFaqMutation = useMutation({
    mutationFn: (data: any) =>
      faqModal.item
        ? contentApi.updateFaq(faqModal.item.id, data)
        : contentApi.createFaq(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-faqs'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setFaqModal({ open: false });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => contentApi.deleteFaq(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-faqs'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-stats'] });
      setDeleteConfirm(null);
    },
  });

  // Revisions
  const openRevisions = async (pageId: string) => {
    try {
      const res = await contentApi.getRevisions(pageId);
      setRevisionsModal({ open: true, pageId, revisions: res.data?.data || [] });
    } catch {
      setRevisionsModal({ open: true, pageId, revisions: [] });
    }
  };

  const restoreRevisionMutation = useMutation({
    mutationFn: ({ pageId, revId }: { pageId: string; revId: string }) =>
      contentApi.restoreRevision(pageId, revId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-content-pages'] });
      setRevisionsModal({ open: false, revisions: [] });
    },
  });

  // Handlers
  const openCreatePage = () => {
    setPageForm({
      title: '',
      slug: '',
      pageType: 'page',
      category: 'General',
      excerpt: '',
      content: '',
      status: 'draft',
      seoTitle: '',
      seoDescription: '',
      keywords: '',
    });
    setPageModal({ open: true });
  };

  const openEditPage = (item: any) => {
    setPageForm({
      title: item.title || '',
      slug: item.slug || '',
      pageType: item.page_type || 'page',
      category: item.category || 'General',
      excerpt: item.excerpt || '',
      content: item.content || '',
      status: item.status || 'draft',
      seoTitle: item.seo_title || '',
      seoDescription: item.seo_description || '',
      keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
    });
    setPageModal({ open: true, item });
  };

  const openCreateBanner = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      ctaText: 'Learn More',
      ctaUrl: '/',
      position: 'top',
      priority: 5,
      isActive: true,
    });
    setBannerModal({ open: true });
  };

  const openEditBanner = (item: any) => {
    setBannerForm({
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      ctaText: item.cta_text || 'Learn More',
      ctaUrl: item.cta_url || '/',
      position: item.position || 'top',
      priority: item.priority || 5,
      isActive: item.is_active ?? true,
    });
    setBannerModal({ open: true, item });
  };

  const openCreateFaq = () => {
    setFaqForm({
      question: '',
      answer: '',
      category: 'General',
      displayOrder: 1,
      status: 'published',
    });
    setFaqModal({ open: true });
  };

  const openEditFaq = (item: any) => {
    setFaqForm({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'General',
      displayOrder: item.display_order || 1,
      status: item.status || 'published',
    });
    setFaqModal({ open: true, item });
  };

  const stats = statsQuery.data || {};
  const pages = pagesQuery.data || [];
  const banners = bannersQuery.data || [];
  const faqs = faqsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Author and publish static pages, marketing hero banners, and student FAQs platform-wide.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'pages' && (
            <button
              onClick={openCreatePage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Page
            </button>
          )}
          {activeTab === 'banners' && (
            <button
              onClick={openCreateBanner}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Banner
            </button>
          )}
          {activeTab === 'faqs' && (
            <button
              onClick={openCreateFaq}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New FAQ
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Total Pages</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPages ?? '—'}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{stats.publishedPages ?? 0} published</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Drafts</span>
            <Pencil className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftPages ?? '—'}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{stats.archivedPages ?? 0} archived</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Active Banners</span>
            <ImageIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBanners ?? '—'}</p>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">of {stats.totalBanners ?? 0} total</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Live FAQs</span>
            <HelpCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFaqs ?? '—'}</p>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">in {stats.faqCategories ?? 0} categories</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => { setActiveTab('pages'); setSearch(''); }}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'pages'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Content Pages ({pages.length})
          </button>
          <button
            onClick={() => { setActiveTab('banners'); setSearch(''); }}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'banners'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Promotional Banners ({banners.length})
          </button>
          <button
            onClick={() => { setActiveTab('faqs'); setSearch(''); }}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'faqs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQs ({faqs.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: PAGES */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages by title, slug, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
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
            <select
              value={pageTypeFilter}
              onChange={(e) => setPageTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All Page Types</option>
              <option value="page">Page</option>
              <option value="legal">Legal</option>
              <option value="guide">Guide</option>
              <option value="faq">FAQ</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title & Slug</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Views</th>
                    <th className="px-6 py-3 font-semibold">Last Updated</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {pagesQuery.isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading pages...</td>
                    </tr>
                  ) : pages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No content pages found matching criteria.</td>
                    </tr>
                  ) : (
                    pages.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{p.title}</p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">/{p.slug}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {p.page_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.category || 'General'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.status === 'published'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                : p.status === 'draft'
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.view_count || 0}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewModal({ open: true, item: p })}
                              title="Preview"
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRevisions(p.id)}
                              title="Revisions"
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 rounded-md transition"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditPage(p)}
                              title="Edit"
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ open: true, type: 'page', id: p.id, title: p.title })}
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
        </div>
      )}

      {/* TAB 2: BANNERS */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bannersQuery.isLoading ? (
              <p className="text-gray-400 py-8">Loading promotional banners...</p>
            ) : banners.length === 0 ? (
              <p className="text-gray-400 py-8">No banners configured yet.</p>
            ) : (
              banners.map((b: any) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          b.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Priority: {b.priority}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{b.title}</h3>
                    {b.subtitle && <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{b.subtitle}</p>}
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{b.description}</p>
                    <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>CTA: {b.cta_text || 'None'}</span>
                      <span className="font-mono">{b.position}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={() => openEditBanner(b)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, type: 'banner', id: b.id, title: b.title })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FAQS */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs by question or answer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={faqCategoryFilter}
              onChange={(e) => setFaqCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="Account & Registration">Account & Registration</option>
              <option value="Courses & Enrollment">Courses & Enrollment</option>
              <option value="Payments & Billing">Payments & Billing</option>
              <option value="Certificates & Verification">Certificates & Verification</option>
              <option value="Online IDE & Assessments">Online IDE & Assessments</option>
              <option value="Technical Issues">Technical Issues</option>
            </select>
          </div>

          <div className="space-y-3">
            {faqsQuery.isLoading ? (
              <p className="text-gray-400 py-8">Loading FAQs...</p>
            ) : faqs.length === 0 ? (
              <p className="text-gray-400 py-8">No FAQs found matching criteria.</p>
            ) : (
              faqs.map((f: any) => (
                <div
                  key={f.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">
                        {f.category}
                      </span>
                      <span className="text-xs text-gray-400">Order: {f.display_order}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base pt-1">{f.question}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditFaq(f)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, type: 'faq', id: f.id, title: f.question })}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-rose-600 dark:text-rose-400 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PAGE CREATE/EDIT MODAL */}
      {pageModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {pageModal.item ? 'Edit Content Page' : 'Create New Content Page'}
              </h3>
              <button
                onClick={() => setPageModal({ open: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Page Title *</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setPageForm((prev) => ({
                      ...prev,
                      title: t,
                      slug: prev.slug || t.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-'),
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. Campus Onboarding Guide"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                    placeholder="campus-onboarding-guide"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Page Type</label>
                  <select
                    value={pageForm.pageType}
                    onChange={(e) => setPageForm({ ...pageForm, pageType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="page">Page</option>
                    <option value="legal">Legal</option>
                    <option value="guide">Guide</option>
                    <option value="faq">FAQ</option>
                    <option value="archive">Archive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={pageForm.category}
                    onChange={(e) => setPageForm({ ...pageForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    placeholder="e.g. Education, Support, Legal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={pageForm.status}
                    onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Short Excerpt</label>
                <textarea
                  rows={2}
                  value={pageForm.excerpt}
                  onChange={(e) => setPageForm({ ...pageForm, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="Summary of this content page..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Rich Content (HTML / Markdown) *</label>
                <textarea
                  rows={6}
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                  placeholder="<h1>Title</h1><p>Content goes here...</p>"
                />
              </div>

              {/* SEO Sub-section */}
              <div className="pt-2 border-t dark:border-gray-700 space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase">SEO & Metadata</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={pageForm.seoTitle}
                      onChange={(e) => setPageForm({ ...pageForm, seoTitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                      placeholder="Title tag for search engines"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={pageForm.keywords}
                      onChange={(e) => setPageForm({ ...pageForm, keywords: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                      placeholder="coding, campus, placement"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">SEO Description</label>
                  <input
                    type="text"
                    value={pageForm.seoDescription}
                    onChange={(e) => setPageForm({ ...pageForm, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    placeholder="Meta description snippet"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setPageModal({ open: false })}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={savePageMutation.isPending || !pageForm.title || !pageForm.content}
                onClick={() => {
                  const kwArray = pageForm.keywords.split(',').map((k) => k.trim()).filter(Boolean);
                  savePageMutation.mutate({
                    ...pageForm,
                    keywords: kwArray,
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {savePageMutation.isPending ? 'Saving...' : pageModal.item ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER CREATE/EDIT MODAL */}
      {bannerModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {bannerModal.item ? 'Edit Banner' : 'Create Promotional Banner'}
              </h3>
              <button
                onClick={() => setBannerModal({ open: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Banner Title *</label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. Masterclass with FAANG Engineers"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subtitle / Badge</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. Live This Saturday"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="Short promotional copy..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CTA URL</label>
                  <input
                    type="text"
                    value={bannerForm.ctaUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Position</label>
                  <select
                    value={bannerForm.position}
                    onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="top">Top Bar</option>
                    <option value="hero">Hero</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="modal">Modal Pop-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <input
                    type="number"
                    value={bannerForm.priority}
                    onChange={(e) => setBannerForm({ ...bannerForm, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerIsActive"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bannerIsActive" className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Active (visible to students)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setBannerModal({ open: false })}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={saveBannerMutation.isPending || !bannerForm.title}
                onClick={() => saveBannerMutation.mutate(bannerForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saveBannerMutation.isPending ? 'Saving...' : bannerModal.item ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ CREATE/EDIT MODAL */}
      {faqModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {faqModal.item ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button
                onClick={() => setFaqModal({ open: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Question *</label>
                <input
                  type="text"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="e.g. How do I download my course certificate?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Answer *</label>
                <textarea
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  placeholder="Detailed answer for learners..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    placeholder="e.g. Payments, IDE, Certificates"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={faqForm.displayOrder}
                    onChange={(e) => setFaqForm({ ...faqForm, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setFaqModal({ open: false })}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={saveFaqMutation.isPending || !faqForm.question || !faqForm.answer}
                onClick={() => saveFaqMutation.mutate(faqForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saveFaqMutation.isPending ? 'Saving...' : faqModal.item ? 'Update FAQ' : 'Add FAQ'}
              </button>
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
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Page Preview</h3>
                <span className="text-xs font-mono text-gray-400">/{previewModal.item?.slug}</span>
              </div>
              <button onClick={() => setPreviewModal({ open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{previewModal.item?.title}</h1>
              {previewModal.item?.excerpt && (
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 italic">
                  {previewModal.item?.excerpt}
                </p>
              )}
              <div
                className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: previewModal.item?.content || '' }}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewModal({ open: false })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm"
              >
                Close Preview
              </button>
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
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revision History</h3>
              </div>
              <button onClick={() => setRevisionsModal({ open: false, revisions: [] })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {revisionsModal.revisions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No previous revisions recorded for this page.</p>
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
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{rev.change_summary || 'Edit update'}</p>
                    </div>
                    <button
                      onClick={() =>
                        restoreRevisionMutation.mutate({ pageId: revisionsModal.pageId!, revId: rev.id })
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteConfirm.title}</strong>? This operation is permanent.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'page') deletePageMutation.mutate(deleteConfirm.id);
                  else if (deleteConfirm.type === 'banner') deleteBannerMutation.mutate(deleteConfirm.id);
                  else if (deleteConfirm.type === 'faq') deleteFaqMutation.mutate(deleteConfirm.id);
                }}
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
