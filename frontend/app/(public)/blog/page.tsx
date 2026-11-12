'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  LayoutGrid,
  Mail,
  Rss,
} from 'lucide-react';
import { useBlogPosts, useFeaturedPost, useBlogCategories, useBlogTags, buildBlogParams } from '@/hooks/useBlog';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BlogSort } from '@/types';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { FeaturedArticle } from '@/components/blog/FeaturedArticle';
import { BlogSearchInput } from '@/components/blog/BlogSearchInput';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { SortSelect } from '@/components/blog/SortSelect';
import { NewsletterForm } from '@/components/blog/NewsletterForm';
import { BlogPostSkeleton, FeaturedSkeleton } from '@/components/blog/BlogPostSkeleton';
import { BlogErrorState, BlogEmptyState } from '@/components/blog/BlogStates';
import { Pagination } from '@/components/common/Pagination';
import {
  DEFAULT_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from '@/components/blog/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuthStore } from '@/store/authStore';

function BlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // Initialize filter state from the URL so shared links work.
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [category, setCategory] = useState(() => searchParams.get('category') ?? 'all');
  const [tag, setTag] = useState(() => searchParams.get('tag') ?? 'all');
  const [sort, setSort] = useState<BlogSort>(() => {
    const value = searchParams.get('sort');
    return ['newest', 'oldest', 'updated', 'popular', 'title'].includes(value || '')
      ? (value as BlogSort)
      : 'newest';
  });
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get('page'));
    return Number.isFinite(value) && value > 0 ? value : 1;
  });

  const limit = DEFAULT_PAGE_SIZE;
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const params = useMemo(
    () =>
      buildBlogParams({
        search: debouncedSearch.trim() || undefined,
        category,
        tag,
        sort,
        page,
        limit,
      }),
    [debouncedSearch, category, tag, sort, page, limit]
  );

  const hasActiveFilters =
    debouncedSearch.trim() !== '' || category !== 'all' || tag !== 'all';

  const listQuery = useBlogPosts(params);
  const featuredQuery = useFeaturedPost();
  const categoriesQuery = useBlogCategories();
  const tagsQuery = useBlogTags();

  const posts = useMemo(() => listQuery.data?.posts ?? [], [listQuery.data]);
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? 1;
  const featuredPost = featuredQuery.data ?? null;

  // Hide the featured hero once the visitor applies filters.
  const showFeatured = !hasActiveFilters && page === 1 && !!featuredPost;

  // Avoid repeating the featured article inside the grid.
  const gridPosts = useMemo(
    () =>
      showFeatured && featuredPost
        ? posts.filter((post) => post.id !== featuredPost.id)
        : posts,
    [posts, showFeatured, featuredPost]
  );

  // Sync filter state to the URL so views stay shareable.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
    if (category !== 'all') next.set('category', category);
    if (tag !== 'all') next.set('tag', tag);
    if (sort !== 'newest') next.set('sort', sort);
    if (page > 1) next.set('page', String(page));
    const query = next.toString();
    router.replace(query ? `/blog?${query}` : '/blog', { scroll: false });
  }, [debouncedSearch, category, tag, sort, page, router]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, tag, sort]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setCategory('all');
    setTag('all');
    setSort('newest');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isFirstLoad = listQuery.isLoading && !listQuery.data;
  const isEmpty = !isFirstLoad && !listQuery.isLoading && total === 0;

  return (
    <div className="min-h-screen bg-white pb-16 text-slate-950 antialiased dark:bg-ink-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="relative overflow-hidden pt-14 pb-10 sm:pt-20">
          <div
            aria-hidden
            className="bg-grid-pattern mask-fade-b absolute inset-0"
          />
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-brand-500/[0.10] blur-3xl dark:bg-brand-500/[0.07]"
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/[0.08] dark:text-brand-300">
              <Rss className="h-3.5 w-3.5" aria-hidden />
              Insights &amp; tutorials
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl dark:text-white">
              CodeVerse Blog
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Practical guides on coding education, problem solving, curriculum
              design, and engineering — written for learners, instructors, and
              institutions.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <BlogSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search articles, topics, authors…"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-brand-500" aria-hidden />
                <span className="tabular-nums">{total}</span> articles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-brand-500" aria-hidden />
                <span className="tabular-nums">{categoriesQuery.data?.length ?? 0}</span> topics
              </span>
            </div>
          </div>
        </header>

        {/* ── Featured article ───────────────────────────────── */}
        {featuredQuery.isLoading && !featuredQuery.data ? (
          <FeaturedSkeleton className="mb-12" />
        ) : showFeatured ? (
          <div className="mb-12">
            <FeaturedArticle post={featuredPost!} />
          </div>
        ) : null}

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="mb-8 space-y-4">
          <CategoryFilter
            categories={categoriesQuery.data ?? []}
            activeCategory={category}
            onSelect={setCategory}
            totalCount={total}
          />

          {tagsQuery.data && tagsQuery.data.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tags:
              </span>
              {tagsQuery.data.slice(0, 10).map(({ tag: tagName }) => (
                <button
                  key={tagName}
                  type="button"
                  onClick={() => setTag(tag === tagName ? 'all' : tagName)}
                  aria-pressed={tag === tagName}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    tag === tagName
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:border-brand-500/50 dark:text-brand-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-brand-500/40 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-brand-300'
                  )}
                >
                  #{tagName}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
              {listQuery.isFetching && !isFirstLoad
                ? 'Updating results…'
                : total === 0
                  ? 'No results'
                  : `Showing ${gridPosts.length} of ${total} article${total === 1 ? '' : 's'}`}
            </p>
            <SortSelect value={sort} onChange={setSort} className="w-48" />
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        {listQuery.isError ? (
          <BlogErrorState
            message={`We could not load the articles. ${getErrorMessage(listQuery.error)}`}
            onRetry={() => listQuery.refetch()}
          />
        ) : isFirstLoad ? (
          <BlogPostSkeleton count={limit > 9 ? 9 : limit} />
        ) : isEmpty ? (
          <BlogEmptyState
            hasFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {gridPosts.map((post) => (
                <ArticleCard
                  key={post.id}
                  post={post}
                  showBookmark={!!user}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Newsletter CTA ─────────────────────────────────── */}
        <section
          aria-label="Newsletter subscription"
          className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-brand-500/[0.06] p-8 dark:border-white/[0.08] dark:from-ink-900 dark:via-ink-900 dark:to-brand-500/[0.08] sm:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
                <Mail className="h-4 w-4" aria-hidden />
                Newsletter
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                New articles, straight to your inbox
              </h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                Join the mailing list for weekly tutorials, curriculum
                deep-dives, and platform updates. No spam — unsubscribe anytime.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </section>

        {/* ── Empty archive hint ─────────────────────────────── */}
        {!isFirstLoad && !listQuery.isError && total === 0 && !hasActiveFilters && (
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Looking for older content?{' '}
            <Link
              href="/problems"
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Browse the problem library
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white pb-16 dark:bg-ink-950">
          <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
            <FeaturedSkeleton />
            <BlogPostSkeleton count={DEFAULT_PAGE_SIZE} className="mt-12" />
          </div>
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
