'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts h2/h3 headings from markdown source to build a
 * table of contents. Slug generation matches the heading
 * ids rendered by BlogMarkdown.
 */
export function parseHeadings(markdown: string): TocItem[] {
  const headingPattern = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(markdown)) !== null) {
    const level = match[1].length === 2 ? 2 : 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (id) items.push({ id, text, level });
  }
  return items;
}

interface TableOfContentsProps {
  headings: TocItem[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={className}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        On this page
      </h2>
      <ul className="mt-4 space-y-1 border-l border-slate-200 dark:border-white/[0.08]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={cn(
              heading.level === 3 && 'pl-4'
            )}
          >
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(heading.id);
                if (target) {
                  target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  history.replaceState(null, '', `#${heading.id}`);
                }
              }}
              className={cn(
                'block border-l-2 py-1.5 text-sm transition-colors',
                activeId === heading.id
                  ? 'border-brand-500 font-medium text-brand-700 dark:border-brand-400 dark:text-brand-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                heading.level === 3 && 'pl-2 text-[13px]'
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
