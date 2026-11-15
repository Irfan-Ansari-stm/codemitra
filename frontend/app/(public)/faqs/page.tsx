'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { publicApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PublicFaqsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['public-faqs'],
    queryFn: async () => {
      const res = await publicApi.getFaqs();
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const faqs = useMemo(() => data?.faqs ?? [], [data?.faqs]);
  const categories: string[] = useMemo(() => data?.categories ?? [], [data?.categories]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq: any) => {
      const matchesCategory =
        activeCategory === 'all' || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        (faq.category && faq.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d18] dark:text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0c1322]">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help & Knowledge Center</span>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Everything you need to know about the CodeVerse online compiler, user accounts,
            campus partnerships, and challenge evaluations.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by topic, compiler, or keyword..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#0e1728] dark:text-white dark:focus:bg-[#111d31]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main FAQ Content */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-8">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-semibold transition',
              activeCategory === 'all'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1728] dark:text-slate-300 dark:hover:bg-white/5'
            )}
          >
            All Questions ({faqs.length})
          </button>

          {categories.map((cat: string) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold transition',
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0e1728] dark:text-slate-300 dark:hover:bg-white/5'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0e1728]"
              />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-[#0e1728]">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              No matching questions found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try adjusting your search terms or selecting another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq: any) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 dark:border-white/10 dark:bg-[#0e1728] dark:hover:border-white/20"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-white sm:text-base"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-600 dark:text-brand-400">
                        Q
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
                        isOpen && 'rotate-180 text-brand-600'
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-300">
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                        <span>Category: {faq.category}</span>
                      </div>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still have questions card */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0e1728]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Still have questions?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Our support and academic partnership teams are available to provide dedicated assistance.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500"
            >
              <span>Contact Support Desk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <span>Explore Platform Docs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
