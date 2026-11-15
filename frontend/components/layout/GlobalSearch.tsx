'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import * as Navigation from 'next/navigation';
import {
  BookOpen,
  Code2,
  Compass,
  GraduationCap,
  HelpCircle,
  Layers,
  Newspaper,
  Search,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { problemApi, courseApi, blogApi, publicApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: 'Pages' | 'Problems' | 'Courses' | 'Articles' | 'FAQs';
  icon: any;
}

const quickNavItems: SearchResultItem[] = [
  {
    id: 'nav-problems',
    title: 'Problem Library',
    subtitle: 'Browse 35+ curated algorithmic challenges',
    href: '/problems',
    category: 'Pages',
    icon: Code2,
  },
  {
    id: 'nav-courses',
    title: 'Explore Courses',
    subtitle: 'Structured paths for Web Development, Python, DSA, and Cloud',
    href: '/courses',
    category: 'Pages',
    icon: GraduationCap,
  },
  {
    id: 'nav-platform',
    title: 'Platform Architecture & Engine',
    subtitle: '16+ compilers, microVM sandboxing, and execution specs',
    href: '/platform',
    category: 'Pages',
    icon: Layers,
  },
  {
    id: 'nav-ide',
    title: 'Playground IDE',
    subtitle: 'In-browser code editor with WASM and cloud execution',
    href: '/platform/ide',
    category: 'Pages',
    icon: Terminal,
  },
  {
    id: 'nav-resources',
    title: 'Resources Directory',
    subtitle: 'Guides, tutorials, FAQs, and developer docs',
    href: '/resources',
    category: 'Pages',
    icon: Compass,
  },
  {
    id: 'nav-faqs',
    title: 'Frequently Asked Questions',
    subtitle: 'Searchable FAQ knowledge base and support answers',
    href: '/faqs',
    category: 'Pages',
    icon: HelpCircle,
  },
  {
    id: 'nav-status',
    title: 'System Health & Status',
    subtitle: 'Live uptime and cluster latency telemetry',
    href: '/status',
    category: 'Pages',
    icon: Sparkles,
  },
  {
    id: 'nav-blog',
    title: 'Engineering Blog & Tutorials',
    subtitle: 'Articles, architecture deep dives, and system guides',
    href: '/blog',
    category: 'Pages',
    icon: Newspaper,
  },
  {
    id: 'nav-apply',
    title: 'Institutional Partnerships',
    subtitle: 'Set up an institutional portal for colleges, bootcamps, and teams',
    href: '/apply-institution',
    category: 'Pages',
    icon: Layers,
  },
  {
    id: 'nav-about',
    title: 'About CodeVerse',
    subtitle: 'Learn about our mission, sandboxing engine, and team',
    href: '/about',
    category: 'Pages',
    icon: Compass,
  },
  {
    id: 'nav-contact',
    title: 'Help & Support Desk',
    subtitle: 'Contact support, view FAQs, and submit feedback',
    href: '/contact',
    category: 'Pages',
    icon: HelpCircle,
  },
];

function useSafeRouter() {
  try {
    const nav = Navigation as any;
    if (typeof nav.useRouter === 'function') {
      return nav.useRouter();
    }
  } catch {
    return null;
  }
  return null;
}

export function GlobalSearch({ className }: { className?: string }) {
  const router = useSafeRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(quickNavItems);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          // Filter quick nav
          const matchedNav = quickNavItems.filter(
            (item) =>
              item.title.toLowerCase().includes(trimmed.toLowerCase()) ||
              item.subtitle.toLowerCase().includes(trimmed.toLowerCase())
          );

          // Fetch from public unified search API
          const dynamicResults: SearchResultItem[] = [...matchedNav];

          try {
            const searchRes = await publicApi.search(trimmed);
            const searchData = searchRes.data?.data;

            if (searchData?.problems && Array.isArray(searchData.problems)) {
              searchData.problems.slice(0, 3).forEach((p: any) => {
                dynamicResults.push({
                  id: `prob-${p.id}`,
                  title: p.title,
                  subtitle: `${p.difficulty || 'General'} • Coding Challenge`,
                  href: `/problems/${p.id}`,
                  category: 'Problems',
                  icon: Code2,
                });
              });
            }

            if (searchData?.courses && Array.isArray(searchData.courses)) {
              searchData.courses.slice(0, 3).forEach((c: any) => {
                dynamicResults.push({
                  id: `course-${c.id}`,
                  title: c.title,
                  subtitle: `${(c.languageTags || []).join(', ') || 'Curriculum'} • Course Track`,
                  href: `/courses/${c.id}`,
                  category: 'Courses',
                  icon: BookOpen,
                });
              });
            }

            if (searchData?.articles && Array.isArray(searchData.articles)) {
              searchData.articles.slice(0, 2).forEach((b: any) => {
                dynamicResults.push({
                  id: `blog-${b.id}`,
                  title: b.title,
                  subtitle: `Article • ${b.readingTimeMinutes || 5} min read`,
                  href: `/blog/${b.slug || b.id}`,
                  category: 'Articles',
                  icon: Newspaper,
                });
              });
            }

            if (searchData?.faqs && Array.isArray(searchData.faqs)) {
              searchData.faqs.slice(0, 2).forEach((f: any) => {
                dynamicResults.push({
                  id: `faq-${f.id}`,
                  title: f.question,
                  subtitle: `FAQ • ${f.category || 'General'}`,
                  href: `/faqs`,
                  category: 'FAQs',
                  icon: HelpCircle,
                });
              });
            }
          } catch {
            // Fall back to matched navigation items
          }

          setResults(dynamicResults);
          setSelectedIndex(0);
        } catch {
          setResults(quickNavItems);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigate on enter or arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = results[selectedIndex];
      if (current) {
        setIsOpen(false);
        if (router?.push) {
          router.push(current.href);
        } else if (typeof window !== 'undefined') {
          window.location.href = current.href;
        }
      }
    }
  };

  const handleSelect = (href: string) => {
    setIsOpen(false);
    if (router?.push) {
      router.push(href);
    } else if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  return (
    <>
      {/* Header Search Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Global search (Ctrl+K)"
        className={cn(
          'group relative hidden items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white md:flex',
          className
        )}
      >
        <Search className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300" />
        <span className="truncate">Search CodeVerse...</span>
        <kbd className="ml-2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-xs dark:border-white/10 dark:bg-white/10 dark:text-slate-400 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search icon trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Command Palette Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick search navigation"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search courses, challenges, articles, or jump to..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear query"
                  className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd
                onClick={() => setIsOpen(false)}
                className="cursor-pointer rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20"
              >
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Try searching for &quot;Python&quot;, &quot;IDE&quot;, &quot;Arrays&quot;, or &quot;Courses&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {query ? 'Search Results' : 'Quick Navigation'}
                  </div>
                  {results.map((item, index) => {
                    const Icon = item.icon || Sparkles;
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-brand-50 text-brand-900 dark:bg-white/[0.08] dark:text-white'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            isSelected
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {item.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Keyboard Guide */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500 dark:border-white/10 dark:bg-ink-900/50 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[9px] dark:border-white/10 dark:bg-white/10">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[9px] dark:border-white/10 dark:bg-white/10">
                    ↓
                  </kbd>{' '}
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[9px] dark:border-white/10 dark:bg-white/10">
                    ↵
                  </kbd>{' '}
                  to select
                </span>
              </div>
              <span className="hidden sm:inline">CodeVerse Command Hub</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalSearch;
