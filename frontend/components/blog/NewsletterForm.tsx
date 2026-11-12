'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Mail, Send, AlertCircle } from 'lucide-react';
import { useSubscribeNewsletter } from '@/hooks/useBlog';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const subscribeSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  name: z.string().max(255).optional(),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

type SubscribeState =
  | { status: 'idle' }
  | { status: 'success'; email: string }
  | { status: 'duplicate'; email: string }
  | { status: 'error'; message: string };

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className }: NewsletterFormProps) {
  const subscribe = useSubscribeNewsletter();
  const [state, setState] = useState<SubscribeState>({ status: 'idle' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: '', name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (subscribe.isPending) return;
    setState({ status: 'idle' });
    try {
      await subscribe.mutateAsync({
        email: values.email,
        name: values.name || undefined,
      });
      setState({ status: 'success', email: values.email });
      reset();
    } catch (error: any) {
      const code = error?.response?.data?.error?.code;
      if (code === 'ALREADY_SUBSCRIBED') {
        setState({ status: 'duplicate', email: values.email });
        reset();
        return;
      }
      setState({
        status: 'error',
        message: getErrorMessage(error),
      });
    }
  });

  if (state.status === 'success' || state.status === 'duplicate') {
    const isDuplicate = state.status === 'duplicate';
    return (
      <div
        role="status"
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4',
          isDuplicate
            ? 'border-amber-500/30 bg-amber-500/10'
            : 'border-emerald-500/30 bg-emerald-500/10',
          className
        )}
      >
        <CheckCircle2
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0',
            isDuplicate ? 'text-amber-500' : 'text-emerald-500'
          )}
          aria-hidden
        />
        <div>
          <p
            className={cn(
              'text-sm font-semibold',
              isDuplicate ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {isDuplicate ? 'Already subscribed' : 'Subscription confirmed'}
          </p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {isDuplicate
              ? `${state.email} is already on the list — no duplicate entries.`
              : `We sent a confirmation to ${state.email}. Welcome aboard!`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={subscribe.isPending}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
            {...register('email')}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-ink-950"
        >
          {subscribe.isPending ? (
            <>
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              Subscribing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              Subscribe
            </>
          )}
        </button>
      </div>

      {errors.email && (
        <p
          id="newsletter-email-error"
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          {errors.email.message}
        </p>
      )}

      {state.status === 'error' && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          {state.message}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Get new articles in your inbox. No spam, unsubscribe anytime.
      </p>
    </form>
  );
}
