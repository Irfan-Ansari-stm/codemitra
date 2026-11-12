'use client';

import { useState } from 'react';
import { Github, Mail, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPORT_EMAIL = 'support@codeverse.io';
const REPO_URL = 'https://github.com/Irfan-Ansari-stm/codemitra';

const channels = [
  {
    icon: Mail,
    title: 'Email support',
    description: 'Questions, bug reports, and feature requests.',
    action: `mailto:${SUPPORT_EMAIL}`,
    actionLabel: SUPPORT_EMAIL,
  },
  {
    icon: Github,
    title: 'GitHub repository',
    description: 'Browse the source, open issues, or contribute.',
    action: REPO_URL,
    actionLabel: 'github.com/Irfan-Ansari-stm/codemitra',
  },
];

export default function ContactPage() {
  const [topic, setTopic] = useState('General question');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`CodeVerse — ${topic}`);
    const body = encodeURIComponent(message.trim() || '(no message)');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white pb-16 text-slate-950 antialiased dark:bg-ink-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Get in touch
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl dark:text-white">
              Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              We would love to hear from you. Reach out with questions,
              feedback, or ideas — or open an issue directly on GitHub.
            </p>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {channels.map((channel) => (
            <a
              key={channel.title}
              href={channel.action}
              target={channel.action.startsWith('http') ? '_blank' : undefined}
              rel={channel.action.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-500/40 hover:bg-brand-500/[0.03] dark:border-white/[0.08] dark:bg-ink-900 dark:hover:border-brand-500/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
                <channel.icon className="h-5 w-5 text-brand-400" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                {channel.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {channel.description}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 group-hover:underline dark:text-brand-400">
                {channel.actionLabel}
                <Send className="h-3.5 w-3.5" aria-hidden />
              </p>
            </a>
          ))}
        </div>

        <section
          aria-label="Send a message"
          className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-brand-500/[0.06] p-8 dark:border-white/[0.08] dark:from-ink-900 dark:via-ink-900 dark:to-brand-500/[0.08] sm:p-10"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
            Send us a message
          </h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            This opens your email client with a pre-filled message to our
            support team. We typically reply within two business days.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
            <div>
              <label
                htmlFor="contact-topic"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Topic
              </label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className={cn(
                  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'
                )}
              >
                <option>General question</option>
                <option>Bug report</option>
                <option>Feature request</option>
                <option>Partnership</option>
                <option>Feedback</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="How can we help?"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Send className="h-4 w-4" aria-hidden />
              Open in email app
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
