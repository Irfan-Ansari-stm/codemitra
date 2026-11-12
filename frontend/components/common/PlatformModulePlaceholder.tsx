'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Settings,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';

interface PlatformModulePlaceholderProps {
  category: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  features: string[];
  stats?: Array<{ label: string; value: string; hint?: string }>;
  primaryActionLabel?: string;
}

export function PlatformModulePlaceholder({
  category,
  title,
  description,
  icon: Icon,
  badge = 'Architecture Mapped',
  features,
  stats = [
    { label: 'Status', value: 'Ready for Schema', hint: 'Database ready' },
    { label: 'Module Stage', value: 'Foundation', hint: 'Phase 2 Architecture' },
    { label: 'API Policy', value: 'Super Admin', hint: 'Role-protected' },
    { label: 'Multi-Tenant', value: 'Supported', hint: 'Tenant scoped' },
  ],
  primaryActionLabel = 'Configure Module',
}: PlatformModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/super-admin/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200">
          Super Admin
        </Link>
        <ChevronRight size={12} />
        <span>{category}</span>
        <ChevronRight size={12} />
        <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
      </nav>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Icon size={28} strokeWidth={2.2} />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                  <Sparkles size={11} />
                  {badge}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/super-admin/configuration"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Settings size={14} />
              <span>Platform Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => alert(`Module "${title}" is ready. You can connect your database models and API endpoints.`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800/80 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              {stat.hint && <p className="text-[11px] text-slate-400">{stat.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Planned Capabilities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Layers size={18} className="text-blue-500" />
              <span>Architectural Capabilities & Scope</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
            <Clock size={32} className="mx-auto text-slate-400 mb-2 opacity-60" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Module Ready For Implementation
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              This module is registered in your platform sidebar and architecture. As you build out details for each section, your UI components and backend controllers connect directly here.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              <BookOpen size={13} />
              <span>Reference docs/platform-architecture.md for implementation standards</span>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Integration Status */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Module Hierarchy
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{category}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Access Level</span>
                <span className="font-mono text-[11px] font-semibold text-purple-600 dark:text-purple-400">super_admin</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Multi-Tenancy</span>
                <span className="text-slate-800 dark:text-slate-200">Global & Tenant Scope</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Navigation Group</span>
                <span className="text-slate-800 dark:text-slate-200">{category}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Next Steps for Developers
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>Define Drizzle schema in <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">backend/src/db/schema.ts</code></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>Add Express routes under <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/api/v1</code></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>Connect TanStack React Query hooks</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
