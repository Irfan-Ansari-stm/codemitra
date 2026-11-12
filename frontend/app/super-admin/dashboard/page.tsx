'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  CreditCard,
  FileCheck,
  FileText,
  Headset,
  Moon,
  Pin,
  Search,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { useTheme } from '@/components/theme/ThemeProvider';

// ── Chart Data & Color Config ──
const growthData = [
  { month: 'Jan 2025', users: 1100, institutes: 180 },
  { month: 'Feb 2025', users: 1450, institutes: 220 },
  { month: 'Mar 2025', users: 1820, institutes: 260 },
  { month: 'Apr 2025', users: 2240, institutes: 310 },
  { month: 'May 2025', users: 2610, institutes: 355 },
  { month: 'Jun 2025', users: 2950, institutes: 395 },
];

const userDistributionData = [
  { name: 'Institute Students', value: 7448, percentage: 58, color: '#2563eb' },
  { name: 'General Users', value: 4109, percentage: 32, color: '#10b981' },
  { name: 'Institute Admins', value: 1027, percentage: 8, color: '#f59e0b' },
  { name: 'Super Admins', value: 256, percentage: 2, color: '#8b5cf6' },
];

const topInstitutes = [
  { rank: 1, name: 'Bright Minds Academy', students: '1,240', growth: '+12%', color: 'emerald' },
  { rank: 2, name: 'NextGen Learning', students: '980', growth: '+8%', color: 'purple' },
  { rank: 3, name: 'Future Skills Hub', students: '856', growth: '+6%', color: 'blue' },
  { rank: 4, name: 'Tech Horizons Institute', students: '720', growth: '+14%', color: 'emerald' },
  { rank: 5, name: 'Knowledge Tree Academy', students: '640', growth: '+10%', color: 'purple' },
];

// ── Mini Sparkline and Bar Components ──
function MiniSparkline({ color = 'blue' }: { color?: string }) {
  const bars = [35, 45, 40, 60, 55, 75, 95];
  return (
    <div className="flex items-end gap-1 h-9">
      {bars.map((height, i) => (
        <span
          key={i}
          style={{ height: `${height}%` }}
          className={`w-1 rounded-sm ${
            color === 'blue'
              ? 'bg-blue-400/80 dark:bg-blue-500/70'
              : color === 'green'
              ? 'bg-emerald-400/80 dark:bg-emerald-500/70'
              : color === 'amber'
              ? 'bg-amber-400/80 dark:bg-amber-500/70'
              : 'bg-violet-400/80 dark:bg-violet-500/70'
          }`}
        />
      ))}
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Accordion toggle states
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);
  const [topInstitutesCollapsed, setTopInstitutesCollapsed] = useState(false);

  // Left column collapsible sections
  const [openSection, setOpenSection] = useState<string | null>(null);
  // Right column collapsible sections
  const [openRightSection, setOpenRightSection] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overview = useQuery({
    queryKey: ['platform-overview'],
    queryFn: () => analyticsApi.platformOverview().then((res) => res.data?.data ?? {}),
    staleTime: 60_000,
  });

  const liveData = overview.data;
  const isDark = theme === 'dark';
  const effectiveGrowthData = liveData?.growthData?.length ? liveData.growthData : growthData;
  const effectiveUserDistribution = liveData?.userDistribution?.length ? liveData.userDistribution : userDistributionData;
  const effectiveTopInstitutes = liveData?.topInstitutes?.length ? liveData.topInstitutes : topInstitutes;

  const toggleLeftSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const toggleRightSection = (key: string) => {
    setOpenRightSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header matching the uploaded image ── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
            Super Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Complete platform overview, management, and operational insights
          </p>
        </div>

        {/* Right side controls: Date dropdown, Search, Notification bell, Theme toggle, Avatar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Calendar size={14} className="text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {showDateMenu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                {['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 6 months', 'Last 12 months', 'All time'].map(
                  (range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => {
                        setDateRange(range);
                        setShowDateMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-medium transition ${
                        dateRange === range
                          ? 'bg-blue-50 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {range}
                      {dateRange === range && <Check size={13} />}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="h-9 w-full rounded-lg border border-slate-200/90 bg-white pl-8 pr-3 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Notification Bell with Badge (5) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                5
              </span>
            </button>

            {/* Notification Popover Drawer */}
            {showNotifications && (
              <div className="absolute right-0 top-full z-40 mt-1 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Platform Notifications
                  </h4>
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    5 New
                  </span>
                </div>
                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  <div className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">New Institute Application</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Bright Minds Academy applied for Enterprise plan.
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">12 minutes ago</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Quota Upgrade Request</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">NextGen Learning requested 1,500 student slots.</p>
                    <p className="mt-1 text-[10px] text-slate-400">1 hour ago</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Sandbox Resource Warning</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Worker node 3 memory utilization touched 82%.</p>
                    <p className="mt-1 text-[10px] text-slate-400">2 hours ago</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">SSL Certificate Notice</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Wildcard SSL auto-renewal is scheduled in 28 days.</p>
                    <p className="mt-1 text-[10px] text-slate-400">5 hours ago</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Database Backup Completed</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Daily snapshot stored to secure cold storage.</p>
                    <p className="mt-1 text-[10px] text-slate-400">8 hours ago</p>
                  </div>
                </div>
                <Link
                  href="/super-admin/institutions/applications"
                  onClick={() => setShowNotifications(false)}
                  className="mt-2 block text-center text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  View All Approvals →
                </Link>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile Badge CS */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-white">
            CS
          </div>
        </div>
      </header>

      {/* ── Top 4 KPI Metric Cards ── */}
      <section aria-label="Platform Highlights" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Registered Users */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users size={20} />
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Users</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {liveData?.totalUsers?.toLocaleString() || '12,840'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>12.8%</span>
                <span className="font-normal text-slate-400">vs. previous 30 days</span>
              </p>
            </div>
            <MiniSparkline color="blue" />
          </div>
        </div>

        {/* Card 2: Active Institutes */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Building2 size={20} />
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Institutes</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {liveData?.totalTenants?.toLocaleString() || '186'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>8.2%</span>
                <span className="font-normal text-slate-400">vs. previous 30 days</span>
              </p>
            </div>
            <MiniSparkline color="green" />
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <FileCheck size={20} />
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Approvals</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {(liveData?.pendingApprovals ?? (liveData?.pendingTenants ?? 0)).toLocaleString()}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} strokeWidth={2.2} />
                <span>Needs review</span>
              </p>
            </div>
            <MiniSparkline color="amber" />
          </div>
        </div>

        {/* Card 4: Published Courses */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                <BookOpen size={20} />
              </span>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Courses</p>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {(liveData?.publishedCourses ?? liveData?.totalCourses ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>6.4%</span>
                <span className="font-normal text-slate-400">vs. previous 30 days</span>
              </p>
            </div>
            <MiniSparkline color="violet" />
          </div>
        </div>
      </section>

      {/* ── Two Column Layout (Left: Platform Analytics + Stacked Accordions, Right: Top Institutes + Stacked Accordions) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── LEFT COLUMN (Platform Analytics + Sections) ── */}
        <div className="space-y-4 lg:col-span-8">
          {/* Platform Analytics Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div
              onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:px-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <BarChart3 size={17} />
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                  Platform Analytics
                </h2>
              </div>
              <button
                type="button"
                aria-label={analyticsCollapsed ? 'Expand analytics' : 'Collapse analytics'}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {analyticsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {/* Inner Analytics Content */}
            {!analyticsCollapsed && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Panel 1: Platform Growth */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">Platform Growth</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          User registrations and institute growth over time
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Last 6 months <ChevronDown size={10} />
                      </span>
                    </div>

                    {/* Chart Container */}
                    <div className="mt-4 h-56 w-full">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={effectiveGrowthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={[0, 3000]}
                              ticks={[0, 500, 1000, 1500, 2000, 2500, 3000]}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '8px',
                                fontSize: '11px',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="users"
                              name="User Registrations"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              fill="url(#userGrad)"
                              dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                              activeDot={{ r: 5 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="institutes"
                              name="New Institutes"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading chart…</div>
                      )}
                    </div>

                    {/* Chart Legend */}
                    <div className="mt-2 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        User Registrations
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        New Institutes
                      </span>
                    </div>
                  </div>

                  {/* Panel 2: User Distribution */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">User Distribution</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Across all user types on the platform</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        All time <ChevronDown size={10} />
                      </span>
                    </div>

                    {/* Donut Chart + Breakdown */}
                    <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
                      {/* Donut with Center Text */}
                      <div className="relative flex h-52 w-48 shrink-0 items-center justify-center">
                        {mounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={effectiveUserDistribution}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2.5}
                              >
                                {effectiveUserDistribution.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                  borderColor: isDark ? '#334155' : '#e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : null}

                        {/* Centered Total */}
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                            {(liveData?.totalUsers ?? 12840).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">Total Users</span>
                        </div>
                      </div>

                      {/* Legend & Percentages List */}
                      <div className="w-full space-y-2.5 sm:w-auto sm:flex-1 sm:pl-3">
                        {effectiveUserDistribution.map((item: any) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                            </span>
                            <div className="flex items-center gap-3 text-right">
                              <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                              <span className="w-10 text-[11px] text-slate-400">{item.value.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Left Column Stack of Collapsible Accordion Cards ── */}
          <div className="space-y-3">
            {/* 1. Pending Approvals */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeftSection('pending_approvals')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <FileCheck size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
                    <p className="text-xs text-slate-500">Institutes, courses, content and user requests awaiting review</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    24
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'pending_approvals' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'pending_approvals' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
                  <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Bright Minds Academy</span>
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Institution Application
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">Contact: admin@brightminds.edu • 1,200 students expected</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/super-admin/institutions/applications"
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        Review
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Full-Stack Cloud Architecture</span>
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                          Course Review
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">Submitted by Tech Horizons Institute • 12 modules</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/super-admin/courses"
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>

                  <div className="pt-1 text-center">
                    <Link
                      href="/super-admin/institutions/applications"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View all 24 pending applications & submissions <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Recent Activity */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeftSection('recent_activity')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Zap size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                    <p className="text-xs text-slate-500">Latest administrative actions across the platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    12
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'recent_activity' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'recent_activity' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Institution Bright Minds Academy submitted onboarding application
                        </p>
                        <p className="text-[11px] text-slate-400">14 minutes ago by System</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Course &apos;Advanced Algorithms&apos; approved for public catalog
                        </p>
                        <p className="text-[11px] text-slate-400">1 hour ago by CS Super Admin</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Multi-tenant DNS verification completed for techhorizons.edu
                        </p>
                        <p className="text-[11px] text-slate-400">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Platform Health */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeftSection('platform_health')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Health</h3>
                    <p className="text-xs text-slate-500">System services, infrastructure and performance status</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    4
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'platform_health' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'platform_health' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">API Gateway</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">99.99% uptime • 22ms avg latency</p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL Database</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">16 / 100 pool connections • 0 locks</p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Execution Sandbox</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">4 runner workers active • 0 queue</p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Redis Cache & Sessions</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">98.6% hit rate • 42MB memory</p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Security Alerts */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeftSection('security_alerts')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security Alerts</h3>
                    <p className="text-xs text-slate-500">Recent security events and potential risks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    3
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'security_alerts' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'security_alerts' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  <div className="rounded-lg bg-rose-50/60 p-3 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                    <p className="font-semibold">Rate limit triggered on /auth/login</p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      IP 198.51.100.4 exceeded threshold with 25 attempts in 60s. Auto-mitigated.
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50/60 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <p className="font-semibold">SSL Wildcard Auto-Renewal</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">Certificate expires in 28 days. Certbot scheduled.</p>
                  </div>
                  <div className="rounded-lg bg-blue-50/60 p-3 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                    <p className="font-semibold">New Super Admin Login from Windows / Chrome</p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">Verified through multi-factor authentication.</p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Quick Actions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeftSection('quick_actions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Pin size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Frequently used administrative actions</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'quick_actions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'quick_actions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Link
                    href="/super-admin/institutions"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                  >
                    <Building2 size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Institutions</span>
                    <span className="text-[10px] text-slate-500">Add or manage</span>
                  </Link>

                  <Link
                    href="/super-admin/institutions/applications"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-900 dark:hover:bg-amber-950/30"
                  >
                    <FileCheck size={20} className="text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Approvals</span>
                    <span className="text-[10px] text-slate-500">Review 24 pending</span>
                  </Link>

                  <Link
                    href="/super-admin/problems"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
                  >
                    <Code2 size={20} className="text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Problems</span>
                    <span className="text-[10px] text-slate-500">Create & manage</span>
                  </Link>

                  <Link
                    href="/super-admin/courses"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
                  >
                    <BookOpen size={20} className="text-violet-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Courses</span>
                    <span className="text-[10px] text-slate-500">Curriculum catalog</span>
                  </Link>

                  <Link
                    href="/super-admin/seo"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                  >
                    <FileText size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Content & SEO</span>
                    <span className="text-[10px] text-slate-500">Metadata & pages</span>
                  </Link>

                  <Link
                    href="/super-admin/analytics"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                  >
                    <BarChart3 size={20} className="text-slate-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Full Analytics</span>
                    <span className="text-[10px] text-slate-500">In-depth reports</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Top Performing Institutes + Sections) ── */}
        <div className="space-y-4 lg:col-span-4">
          {/* Top Performing Institutes Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div
              onClick={() => setTopInstitutesCollapsed(!topInstitutesCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <FileText size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Top Performing Institutes
                  </h2>
                  <p className="text-[11px] text-slate-500">By student enrollments</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={topInstitutesCollapsed ? 'Expand top institutes' : 'Collapse top institutes'}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {topInstitutesCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {/* Table */}
            {!topInstitutesCollapsed && (
              <div className="overflow-x-auto p-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-2.5 pl-4 pr-1">#</th>
                      <th className="py-2.5 px-2">Institute</th>
                      <th className="py-2.5 px-2 text-right">Students</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {effectiveTopInstitutes.map((inst: any) => (
                      <tr key={inst.rank || inst.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 pl-4 pr-1 font-semibold text-slate-400">{inst.rank}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                                inst.color === 'emerald'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                  : inst.color === 'purple'
                                  ? 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                              }`}
                            >
                              <Building2 size={13} />
                            </span>
                            <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                              {inst.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 dark:text-slate-300">
                          {inst.students}
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right">
                          <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                            <ArrowUp size={12} strokeWidth={2.5} />
                            {inst.growth.replace('+', '')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right Column Stack of Collapsible Accordion Cards ── */}
          <div className="space-y-3">
            {/* 1. Popular Courses */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRightSection('popular_courses')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Popular Courses</h3>
                    <p className="text-xs text-slate-500">By total enrollments</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'popular_courses' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'popular_courses' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Python for AI & Data Science</p>
                      <p className="text-[11px] text-slate-400">3,420 students • 4.9 rating</p>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Popular
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Full-Stack Web Dev with Next.js</p>
                      <p className="text-[11px] text-slate-400">2,890 students • 4.8 rating</p>
                    </div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Data Structures & Algorithms</p>
                      <p className="text-[11px] text-slate-400">2,150 students • 4.9 rating</p>
                    </div>
                    <span className="rounded bg-violet-100 px-2 py-0.5 font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      Top Rated
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Latest Registrations */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRightSection('latest_registrations')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <UserPlus size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Latest Registrations</h3>
                    <p className="text-xs text-slate-500">Recently joined users and institutes</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'latest_registrations' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'latest_registrations' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Apex Institute of Technology</p>
                      <p className="text-[11px] text-slate-400">Institution • Pro tier</p>
                    </div>
                    <span className="text-[10px] text-slate-400">18m ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Sarah Jenkins</p>
                      <p className="text-[11px] text-slate-400">General Student • Free plan</p>
                    </div>
                    <span className="text-[10px] text-slate-400">32m ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Oakwood Academy</p>
                      <p className="text-[11px] text-slate-400">Institution • Trial tier</p>
                    </div>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. System Errors */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRightSection('system_errors')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Errors</h3>
                    <p className="text-xs text-slate-500">Recent errors and warnings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    5
                  </span>
                  <span className="text-slate-400">
                    {openRightSection === 'system_errors' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openRightSection === 'system_errors' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  <div className="rounded-lg bg-rose-50/60 p-2.5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    <p className="font-semibold">Sandbox Execution Timeout</p>
                    <p className="text-[11px]">Rust runner timed out on test case 14 (3 occurrences).</p>
                  </div>
                  <div className="rounded-lg bg-amber-50/60 p-2.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <p className="font-semibold">Outbound Webhook Retry</p>
                    <p className="text-[11px]">Grade sync webhook delayed for NextGen Learning (2 retries).</p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Support Tickets */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRightSection('support_tickets')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Headset size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Tickets</h3>
                    <p className="text-xs text-slate-500">Open support requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    8
                  </span>
                  <span className="text-slate-400">
                    {openRightSection === 'support_tickets' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openRightSection === 'support_tickets' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">#1042: SAML SSO setup assistance</p>
                      <p className="text-[11px] text-slate-400">Bright Minds Academy • High Priority</p>
                    </div>
                    <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Open
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">#1041: Invoice GST detail modification</p>
                      <p className="text-[11px] text-slate-400">Future Skills Hub • Medium Priority</p>
                    </div>
                    <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Pending
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">#1040: Custom domain SSL query</p>
                      <p className="text-[11px] text-slate-400">NextGen Learning • Normal Priority</p>
                    </div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Assigned
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Revenue & Subscriptions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRightSection('revenue_subscriptions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue & Subscriptions</h3>
                    <p className="text-xs text-slate-500">Platform revenue and subscription overview</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'revenue_subscriptions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'revenue_subscriptions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Monthly Recurring (MRR)</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">$48,250</p>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">↑ 14.2% MoM</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/40">
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Annual Run Rate (ARR)</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">$579,000</p>
                      <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">↑ 18.5% YoY</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Active Tenant Subscriptions</span>
                    <span className="font-bold text-slate-900 dark:text-white">186 Institutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Platform Retention Rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">99.2%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
