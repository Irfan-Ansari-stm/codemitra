import Image from 'next/image';
import type { BlogPost } from '@/types';
import { getInitials } from '@/lib/utils';

interface AuthorBioProps {
  post: BlogPost;
  className?: string;
}

export function AuthorBio({ post, className }: AuthorBioProps) {
  return (
    <aside
      aria-label={`About the author ${post.authorName}`}
      className={className}
    >
      <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/[0.08] dark:bg-ink-900/50">
        {post.authorAvatarUrl ? (
          <Image
            src={post.authorAvatarUrl}
            alt={`${post.authorName} avatar`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-lg font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300"
          >
            {getInitials(post.authorName)}
          </span>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Written by
          </p>
          <p className="mt-0.5 text-base font-semibold text-slate-950 dark:text-white">
            {post.authorName}
          </p>
          {post.authorBio ? (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {post.authorBio}
            </p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Contributor to the CodeVerse publication.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
