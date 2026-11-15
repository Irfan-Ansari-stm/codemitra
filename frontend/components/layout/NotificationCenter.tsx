'use client';

import React, { useEffect, useRef, useState, useContext } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Clock, ExternalLink, Inbox, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import { useMutation, useQuery, useQueryClient, QueryClientContext } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  created_at?: string;
}

function NotificationCenterInner({ className }: { className?: string }) {
  const user = useAuthStore((state) => state.user);
  const tenantQuery = useCurrentTenant();
  const tenantSlug = tenantQuery.data?.slug;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', 'header-list'],
    queryFn: async () => {
      try {
        const res = await notificationApi.list({ limit: 10 });
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark all as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      await notificationApi.markRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Handle outside click & escape
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const viewAllHref =
    user.role === 'super_admin'
      ? '/super-admin/notifications'
      : user.role === 'general_student'
        ? '/dashboard'
        : institutionHref('/institution/notifications', tenantSlug);

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'security':
      case 'alert':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'execution':
      case 'ide':
        return <Terminal className="h-4 w-4 text-indigo-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-brand-500" />;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:hover:text-white"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm shadow-brand-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-0 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-ink-950/95 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markReadMutation.mutate()}
                disabled={markReadMutation.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-brand-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-brand-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-2/3" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 mb-2.5">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No new notifications at this time.
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]',
                    !item.isRead && 'bg-brand-50/30 dark:bg-brand-950/20'
                  )}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.06]">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(item.createdAt || item.created_at)}
                      </span>
                    </div>
                    {(item.message || item.content) && (
                      <p className="line-clamp-2 mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {item.message || item.content}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-ink-900/60">
            <Link
              href={viewAllHref}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-brand-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-brand-400"
            >
              View all notifications
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationCenter({ className }: { className?: string }) {
  const queryContext = useContext(QueryClientContext);

  // If QueryClientContext is missing (e.g. isolated test environments), render a minimal standalone bell
  if (!queryContext) {
    return (
      <button
        type="button"
        aria-label="Notifications"
        className={cn(
          'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-600 transition-all duration-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
          className
        )}
      >
        <Bell className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return <NotificationCenterInner className={className} />;
}

export default NotificationCenter;
