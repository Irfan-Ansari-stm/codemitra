'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getErrorMessage, seoApi } from '@/lib/api';

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteTitle: 'CodeVerse',
    siteDescription: 'Multi-tenant coding education platform',
    defaultKeywords: ['coding', 'education', 'programming'],
    robotsTxt: 'User-agent: *\nAllow: /',
  });
  const [redirectForm, setRedirectForm] = useState({ sourcePath: '', targetPath: '', statusCode: 301 });
  const [redirectsDialog, setRedirectsDialog] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['seo-settings'] });

  const seo = useQuery({
    queryKey: ['seo-settings'],
    queryFn: () => seoApi.getSettings().then((r) => r.data as any),
  });

  useEffect(() => {
    if (seo.data) {
      const payload = seo.data.data || seo.data;
      if (payload && typeof payload === 'object') {
        setSettings((prev) => ({ ...prev, ...payload }));
      }
    }
  }, [seo.data]);

  const save = useMutation({
    mutationFn: () => seoApi.updateSettings(settings),
    onSuccess: refresh,
  });

  const redirects = useQuery({
    queryKey: ['seo-redirects'],
    queryFn: () => seoApi.getRedirects().then((r) => r.data as any),
  });

  const createRedirect = useMutation({
    mutationFn: () => seoApi.createRedirect(redirectForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-redirects'] });
      setRedirectForm({ sourcePath: '', targetPath: '', statusCode: 301 });
    },
  });

  const deleteRedirect = useMutation({
    mutationFn: (id: string) => seoApi.deleteRedirect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo-redirects'] }),
  });

  const data = redirects.data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">SEO management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">SEO settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure global SEO, redirects, and sitemap.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRedirectsDialog(true)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Manage redirects
          </button>
          <button type="button" onClick={() => seoApi.generateSitemap()} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Generate sitemap
          </button>
        </div>
      </header>

      {seo.error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(seo.error)} <button type="button" onClick={() => seo.refetch()} className="ml-1 font-medium underline">Retry</button>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Global SEO</h2>
        <p className="mt-1 text-xs text-slate-500">Configure site title, description, keywords, and robots.txt.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Site title
            <input
              value={settings.siteTitle}
              onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Site description
            <input
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Keywords (comma separated)
            <input
              value={settings.defaultKeywords.join(', ')}
              onChange={(e) => setSettings({
                ...settings,
                defaultKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Robots.txt
            <textarea
              rows={6}
              value={settings.robotsTxt}
              onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          {save.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">{getErrorMessage(save.error)}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:col-span-2">
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {save.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </section>

      {redirectsDialog && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Redirects</h2>
                <p className="mt-1 text-xs text-slate-500">Manage URL redirects</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setRedirectsDialog(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); createRedirect.mutate(); }}
              className="mt-4 grid grid-cols-4 gap-2 items-end"
            >
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                Source path
                <input
                  required
                  value={redirectForm.sourcePath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, sourcePath: e.target.value })}
                  placeholder="/old-path"
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 col-span-2">
                Target path
                <input
                  required
                  value={redirectForm.targetPath}
                  onChange={(e) => setRedirectForm({ ...redirectForm, targetPath: e.target.value })}
                  placeholder="/new-path"
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Status
                <select
                  value={redirectForm.statusCode}
                  onChange={(e) => setRedirectForm({ ...redirectForm, statusCode: parseInt(e.target.value) })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value={301}>301</option>
                  <option value={302}>302</option>
                  <option value={307}>307</option>
                  <option value={308}>308</option>
                </select>
              </label>
              <button type="submit" disabled={createRedirect.isPending} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
                {createRedirect.isPending ? 'Adding…' : 'Add redirect'}
              </button>
            </form>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map((r: any) => (
                    <tr key={r.id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3 text-xs">{r.source_path}</td>
                      <td className="px-4 py-3 text-xs">{r.target_path}</td>
                      <td className="px-4 py-3 text-xs">{r.status_code}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteRedirect.mutate(r.id)}
                          disabled={deleteRedirect.isPending}
                          className="text-xs text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No redirects yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
