'use client';

import { useState } from 'react';
import { Link2, Check, Linkedin, Facebook, Twitter, Share2 } from 'lucide-react';
import { copyToClipboard, cn } from '@/lib/utils';

interface ShareButtonsProps {
  title: string;
  slug: string;
  className?: string;
}

function buildShareUrl(base: string, slug: string, title: string): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  switch (base) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    default:
      return url;
  }
}

export function ShareButtons({ title, slug, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/blog/${slug}`;

  const handleCopy = async () => {
    try {
      await copyToClipboard(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — ignore silently.
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: articleUrl });
      } catch {
        // User cancelled or share failed — ignore.
      }
    } else {
      handleCopy();
    }
  };

  const buttonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-500/40 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:text-brand-400';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Share
      </span>
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share article"
        className={buttonClass}
      >
        <Share2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy article link'}
        className={buttonClass}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" aria-hidden />
        ) : (
          <Link2 className="h-4 w-4" aria-hidden />
        )}
      </button>
      <a
        href={buildShareUrl('twitter', slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className={buttonClass}
      >
        <Twitter className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={buildShareUrl('linkedin', slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={buttonClass}
      >
        <Linkedin className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={buildShareUrl('facebook', slug, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={buttonClass}
      >
        <Facebook className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}
