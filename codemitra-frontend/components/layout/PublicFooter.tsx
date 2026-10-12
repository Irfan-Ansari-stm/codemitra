import Link from 'next/link';
import { Code2, Github } from 'lucide-react';

const productLinks = [
  { label: 'Problems', href: '/problems' },
  { label: 'Courses', href: '/courses' },
  { label: 'Assignments', href: '/institution/assignments' },
  { label: 'Quizzes', href: '/institution/quizzes' },
];

const platformLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Create account', href: '/register' },
  { label: 'Blog', href: '/blog' },
];

const resourceLinks = [
  { label: 'GitHub repository', href: 'https://github.com/Irfan-Ansari-stm/codemitra' },
  { label: 'Postman API collection', href: 'https://github.com/Irfan-Ansari-stm/codemitra' },
];

const capabilities = ['JWT auth', 'PostgreSQL RLS', 'Judge0 execution', 'RBAC'];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/[0.06] dark:bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="CodeVerse home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
                <Code2 className="h-5 w-5 text-brand-400" aria-hidden />
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-slate-950 dark:text-white">
                CodeVerse
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Multi-tenant coding education platform for universities, bootcamps, and training teams.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <span
                  key={capability}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          <nav aria-label="Product">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Product</h2>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Platform">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Platform</h2>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Resources</h2>
            <ul className="mt-4 space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-white/[0.06] sm:flex-row">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {year} CodeVerse. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Built for modern coding education.</p>
        </div>
      </div>
    </footer>
  );
}
