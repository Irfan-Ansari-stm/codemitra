'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterColumn {
  title: string;
  links: {
    label: string;
    href: string;
    isExternal?: boolean;
    badge?: string;
  }[];
}

const footerColumns: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Coding Challenges', href: '/problems' },
      { label: 'Course Catalog', href: '/courses' },
      { label: 'Architecture & Engine', href: '/platform' },
      { label: 'Online IDE & WASM', href: '/dashboard/ide', badge: 'v2.0' },
      { label: 'Campus Institutions', href: '/apply-institution' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Resources Directory', href: '/resources' },
      { label: 'Blog & Insights', href: '/blog' },
      { label: 'Frequently Asked Questions', href: '/faqs' },
      { label: 'Help Desk & Support', href: '/contact' },
      {
        label: 'GitHub Repository',
        href: 'https://github.com/Irfan-Ansari-stm/codemitra',
        isExternal: true,
      },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About CodeVerse', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Institutional Portals', href: '/apply-institution' },
      { label: 'System Health & Status', href: '/status' },
    ],
  },
  {
    title: 'Legal & Trust',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security & Sandboxing', href: '/platform' },
    ],
  },
];

export function FooterNavigation({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-12', className)}>
      {footerColumns.map((col) => (
        <div key={col.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
            {col.title}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {col.links.map((link) => (
              <li key={link.label}>
                {link.isExternal ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60 transition-opacity group-hover:opacity-100" />
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default FooterNavigation;
