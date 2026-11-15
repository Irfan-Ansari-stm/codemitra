'use client';

import { Github, Linkedin, Mail, MessageSquare, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialLinkItem {
  label: string;
  href: string;
  icon: any;
}

const socialItems: SocialLinkItem[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/Irfan-Ansari-stm/codemitra',
    icon: Github,
  },
  {
    label: 'Twitter / X',
    href: 'https://twitter.com',
    icon: Twitter,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: Linkedin,
  },
  {
    label: 'Community Discord',
    href: 'https://discord.com',
    icon: MessageSquare,
  },
  {
    label: 'Contact Email',
    href: 'mailto:support@codeverse.io',
    icon: Mail,
  },
];

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {socialItems.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            aria-label={item.label}
            title={item.label}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}

export default SocialLinks;
