'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Search, ArrowRight, Plus, Trash2, CheckCircle2,
  RefreshCw, Code, AlertCircle, FileText
} from 'lucide-react';
import { seoApi } from '@/lib/api';

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'redirects' | 'sitemap' | 'audit'>('settings');

  const [settings, setSettings] = useState({
    siteTitle: 'CodeVerse',
    siteDescription: 'Multi-tenant coding education platform',
    defaultKeywords: ['coding', 'education', 'programming'],
    canonicalBaseUrl: 'https://codeverse.dev',
    defaultOgImage: 'https://codeverse.dev/og-default.png',
    ogTitle: 'CodeVerse — Premier Coding Education Platform',
    ogDescription: 'Master programming through interactive sandboxes and verified assessments.',
    twitterHandle: '@codeverse_dev',
    twitterCardType: 'summary_large_image',
    defaultLanguage: 'en',
    indexingPreference: 'all',
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /super-admin/\nDisallow: /api/\nSitemap: https://codeverse.dev/sitemap.xml',
    sitemapEnabled: true,
  });

  const [keywordsInput, setKeywordsInput] = useState('');
  const [redirectForm, setRedirectForm] = useState({ sourcePath: '', targetPath: '', statusCode: 301 });
  const [redirectSearch, setRedirectSearch] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const seoQuery = useQuery({
    queryKey: ['seo-settings'],
    queryFn: () => seoApi.getSettings().then((r) => r.data?.data || r.data || {}),
  });

  const redirectsQuery = useQuery({
    queryKey: ['seo-redirects', redirectSearch],
    queryFn: () => seoApi.getRedirects({ search: redirectSearch, limit: 50 }).then((r) => r.data?.data || []),
  });

  const auditQuery = useQuery({
    queryKey: ['seo-audit'],
    queryFn: () => seoApi.getAudit().then((r) => r.data?.data || {}),
  });

  const sitemapQuery = useQuery({
    queryKey: ['seo-sitemap'],
    queryFn: () => seoApi.generateSitemap().then((r) => r.data?.data || {}),
    enabled: activeTab === 'sitemap',
  });

  useEffect(() => {
    if (seoQuery.data && typeof seoQuery.data === 'object') {
      const data = seoQuery.data;
      setSettings((prev) => ({ ...prev, ...data }));
      if (Array.isArray(data.defaultKeywords)) {
        setKeywordsInput(data.defaultKeywords.join(', '));
      }
    }
  }, [seoQuery.data]);

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveSettingsMutation = useMutation({
    mutationFn: () => {
      const kwArray = keywordsInput.split(',').map((k) => k.trim()).filter(Boolean);
      return seoApi.updateSettings({ ...settings, defaultKeywords: kwArray });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      setFeedback({ text: 'Global SEO settings successfully updated and persisted.', type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to update settings', type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  const createRedirectMutation = useMutation({
    mutationFn: () => seoApi.createRedirect(redirectForm),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seo-redirects'] });
      void queryClient.invalidateQueries({ queryKey: ['seo-audit'] });
      setRedirectForm({ sourcePath: '', targetPath: '', statusCode: 301 });
      setFeedback({ text: 'Redirect rule created successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ text: err?.response?.data?.error?.message || 'Failed to create redirect rule', type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  const deleteRedirectMutation = useMutation({
    mutationFn: (id: string) => seoApi.deleteRedirect(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seo-redirects'] });
      void queryClient.invalidateQueries({ queryKey: ['seo-audit'] });
      setFeedback({ text: 'Redirect rule removed.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const generateSitemapMutation = useMutation({
    mutationFn: () => seoApi.generateSitemap(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seo-sitemap'] });
      setFeedback({ text: 'Dynamic XML sitemap regenerated successfully.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const redirects = redirectsQuery.data || [];
  const audit = auditQuery.data || {};
  const sitemap = sitemapQuery.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO & Metadata Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure platform-wide meta tags, social Open Graph cards, URL redirects, and XML sitemaps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'sitemap' && (
            <button
              onClick={() => generateSitemapMutation.mutate()}
              disabled={generateSitemapMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${generateSitemapMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate Sitemap
            </button>
          )}
          {activeTab === 'settings' && (
            <button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          )}
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
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">SEO Health Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{audit.healthScore !== undefined ? `${audit.healthScore}%` : '—'}</p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Platform baseline</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Configured Pages</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{audit.configuredPages ?? '—'}</p>
          <span className="text-xs text-gray-500 font-medium">Public content pages</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Active Redirects</span>
            <ArrowRight className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{audit.activeRedirects ?? '—'}</p>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Loop-safe rules</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-xs uppercase font-semibold">Missing Metadata</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{audit.missingMetadata ?? '—'}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Recommendations available</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Settings
          </button>
          <button
            onClick={() => setActiveTab('redirects')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'redirects'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Redirect Manager ({redirects.length})
          </button>
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'sitemap'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Code className="w-4 h-4" />
            XML Sitemap
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            SEO Audit & Issues
          </button>
        </nav>
      </div>

      {/* TAB 1: GLOBAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
                Core Website Metadata
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Website Title *
                </label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Canonical Base URL *
                </label>
                <input
                  type="text"
                  value={settings.canonicalBaseUrl}
                  onChange={(e) => setSettings({ ...settings, canonicalBaseUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Website Meta Description
                </label>
                <textarea
                  rows={3}
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Default Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">
                Social Cards & Indexing
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Default Open Graph Image URL
                </label>
                <input
                  type="text"
                  value={settings.defaultOgImage}
                  onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  value={settings.twitterHandle}
                  onChange={(e) => setSettings({ ...settings, twitterHandle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Indexing Policy
                  </label>
                  <select
                    value={settings.indexingPreference}
                    onChange={(e) => setSettings({ ...settings, indexingPreference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">Index & Follow (Default)</option>
                    <option value="noindex">No Index (Staging)</option>
                    <option value="nofollow">No Follow</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Robots.txt Content
                </label>
                <textarea
                  rows={4}
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REDIRECTS */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          {/* Create Redirect Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Add URL Redirect Rule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Source Path (Old URL)</label>
                <input
                  type="text"
                  placeholder="/old-course-link"
                  value={redirectForm.sourcePath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, sourcePath: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Path (New URL)</label>
                <input
                  type="text"
                  placeholder="/courses/new-syllabus"
                  value={redirectForm.targetPath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, targetPath: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status Code</label>
                <select
                  value={redirectForm.statusCode}
                  onChange={(e) => setRedirectForm({ ...redirectForm, statusCode: parseInt(e.target.value) || 301 })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                  <option value={307}>307 Temporary</option>
                  <option value={308}>308 Permanent</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <button
                  disabled={createRedirectMutation.isPending || !redirectForm.sourcePath || !redirectForm.targetPath}
                  onClick={() => createRedirectMutation.mutate()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Redirects List */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Active Redirect Rules ({redirects.length})</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter redirects..."
                  value={redirectSearch}
                  onChange={(e) => setRedirectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Source Path</th>
                    <th className="px-6 py-3 font-semibold">Destination</th>
                    <th className="px-6 py-3 font-semibold">Status Code</th>
                    <th className="px-6 py-3 font-semibold">Hits</th>
                    <th className="px-6 py-3 font-semibold">Created Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {redirects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No redirect rules found.</td>
                    </tr>
                  ) : (
                    redirects.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                        <td className="px-6 py-3 font-mono text-xs text-rose-600 dark:text-rose-400">{r.source_path}</td>
                        <td className="px-6 py-3 font-mono text-xs text-emerald-600 dark:text-emerald-400">{r.target_path}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-700">
                            {r.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs">{r.hit_count || 0}</td>
                        <td className="px-6 py-3 text-xs text-gray-500">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => deleteRedirectMutation.mutate(r.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* TAB 3: SITEMAP */}
      {activeTab === 'sitemap' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">XML Sitemap Index</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live generated XML feed of all published content pages, blog articles, and help guides.
              </p>
            </div>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Globe className="w-4 h-4" />
              Open /sitemap.xml
            </a>
          </div>

          <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
            Total Indexable URLs: <span className="text-blue-600 dark:text-blue-400">{sitemap.totalUrls ?? '—'}</span>
          </div>

          <pre className="bg-gray-950 text-gray-200 p-4 rounded-xl text-xs font-mono max-h-96 overflow-y-auto border border-gray-800">
            {sitemap.xml || 'Loading sitemap XML...'}
          </pre>
        </div>
      )}

      {/* TAB 4: AUDIT & ISSUES */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Metadata Audit & Diagnostics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The automated crawler analyzed <strong className="text-gray-900 dark:text-white">{audit.totalAudited || 0}</strong> platform resources across static pages, help articles, and editorial blogs.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Detected Optimization Opportunities</h4>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {audit.issues && audit.issues.length > 0 ? (
                audit.issues.map((issue: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-750/50 transition">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        {issue.entity}
                      </span>
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white">{issue.title}</h5>
                      <p className="text-xs text-gray-500 font-mono">/{issue.slug}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                        {issue.type === 'missing_title'
                          ? 'Missing explicit SEO title tag. Search engines will default to page headline.'
                          : issue.type === 'missing_desc'
                          ? 'Missing explicit SEO meta description snippet. Recommendation: Add 120-160 character description.'
                          : 'Duplicate title detected across multiple platform URLs.'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>No critical SEO issues detected! Your metadata coverage is stellar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
