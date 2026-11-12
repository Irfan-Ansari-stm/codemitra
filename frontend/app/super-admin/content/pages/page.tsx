'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { getErrorMessage, contentApi } from '@/lib/api';

type Page = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  page_type: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
};

const blank = { slug: '', title: '', content: '', excerpt: '', pageType: 'page', status: 'draft', isFeatured: false, seoTitle: '', seoDescription: '' };

export default function ContentPagesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Page | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['content-pages'] });

  const pages = useQuery({
    queryKey: ['content-pages'],
    queryFn: () => contentApi.listPages().then((r) => r.data as any),
  });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? contentApi.updatePage(editing.id, form)
        : contentApi.createPage(form),
    onSuccess: () => { refresh(); setDialogOpen(false); setEditing(null); setForm(blank); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deletePage(id),
    onSuccess: refresh,
  });

  const data = pages.data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(blank);
    save.reset();
    setDialogOpen(true);
  }
  function openEdit(p: Page) {
    setEditing(p);
    setForm({
      slug: p.slug, title: p.title, content: '', excerpt: p.excerpt || '',
      pageType: p.page_type, status: p.status, isFeatured: p.is_featured,
      seoTitle: '', seoDescription: '',
    });
    save.reset();
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">Content management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Pages</h1>
          <p className="mt-1 text-sm text-slate-500">Manage static pages, articles, and landing pages.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus size={16} /> Create page
        </button>
      </header>

      {pages.error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(pages.error)} <button type="button" onClick={() => pages.refetch()} className="ml-1 font-medium underline">Retry</button>
        </div>
      )}
      {remove.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{getErrorMessage(remove.error)}</p>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {pages.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading pages…</p>
        ) : data.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No pages yet. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40">
                <tr>{['Title', 'Slug', 'Type', 'Status', 'Updated', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((p: Page) => (
                  <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.title}</td>
                    <td className="px-4 py-3 text-xs">{p.slug}</td>
                    <td className="px-4 py-3 text-xs capitalize">{p.page_type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs capitalize ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.updated_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" title="Edit" aria-label={`Edit ${p.title}`} onClick={() => openEdit(p)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800">
                          <FileText size={15} />
                        </button>
                        <button type="button" title="Delete" aria-label={`Delete ${p.title}`} disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete page "${p.title}"?`)) remove.mutate(p.id); }} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/40">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialogOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? 'Update page' : 'Create page'}</h2>
                <p className="mt-1 text-xs text-slate-500">Slug is used in the page URL.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setDialogOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={17} />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Title
                <input required maxLength={500} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Slug
                <input required maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="about-us" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Type
                <select value={form.pageType} onChange={(e) => setForm({ ...form, pageType: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <option value="page">Page</option>
                  <option value="article">Article</option>
                  <option value="faq">FAQ</option>
                  <option value="banner">Banner</option>
                  <option value="landing">Landing</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                Excerpt
                <input maxLength={500} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                Content
                <textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                SEO title
                <input maxLength={70} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                SEO description
                <input maxLength={160} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
              </label>
              {save.isError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">{getErrorMessage(save.error)}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:col-span-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={save.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create page'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
