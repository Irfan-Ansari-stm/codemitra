'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  FileCheck,
  FileText,
  Flame,
  GraduationCap,
  Moon,
  Pin,
  Search,
  Sparkles,
  Sun,
  Trophy,
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
import { analyticsApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useCurrentTenant } from '@/hooks/useTenant';
import { institutionHref } from '@/lib/workspace';

// ── Mini Sparkline and Bar Helper ──
function MiniSparkline({ color = 'blue' }: { color?: string }) {
  const bars = [30, 45, 40, 65, 55, 80, 95];
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

// ── Top Header Controls (Date, Search, Bell, Theme, Avatar) ──
function DashboardHeader({
  title,
  subtitle,
  searchPlaceholder = 'Search anything...',
  unreadCount = 3,
  notifications = [],
}: {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  unreadCount?: number;
  notifications?: { title: string; desc: string; time: string }[];
}) {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const isDark = theme === 'dark';

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const defaultNotifications = [
    { title: 'New Assignment Available', desc: 'Binary Trees Assignment due in 3 days', time: '1h ago' },
    { title: 'Course Enrolled', desc: 'Full Stack Development module updated', time: '4h ago' },
    { title: 'Submission Evaluated', desc: 'Two Sum accepted with 100% score', time: '1d ago' },
  ];

  const items = notifications.length ? notifications : defaultNotifications;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Date Dropdown */}
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
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-200/90 bg-white pl-8 pr-3 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-40 mt-1 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Notifications
                </h4>
                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  {unreadCount} New
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {items.map((n, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-slate-50 p-2 text-xs transition hover:bg-blue-50/50 dark:bg-slate-800/60"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{n.desc}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Profile Avatar Pill */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-700 dark:text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// 1. INSTITUTION ADMIN DASHBOARD (role === 'institution_admin')
// =============================================================================
function InstitutionAdminDashboard({ tenantId }: { tenantId: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const tenant = useCurrentTenant();
  const workspaceHref = (path: string) => institutionHref(path, tenant.data?.slug);

  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);
  const [topStudentsCollapsed, setTopStudentsCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openRightSection, setOpenRightSection] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['institution-dashboard', tenantId],
    queryFn: () => analyticsApi.institutionDashboard(tenantId).then((res) => res.data?.data ?? {}),
    staleTime: 30_000,
  });

  const data = dashboardQuery.data || {};
  const overview = data.overview || {};
  const isDark = theme === 'dark';

  const totalStudents = Number(overview.totalStudents || 0);
  const publishedCourses = Number(overview.publishedCourses || 0);
  const totalSubmissions = Number(overview.totalSubmissions || 0);
  const acceptedSubmissions = Number(overview.acceptedSubmissions || 0);
  const acceptanceRate =
    totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 78;
  const pendingGrading = Number(overview.pendingGrading || 0);

  // Default growth data if database has under 2 months of records
  const defaultGrowth = [
    { month: 'Jan 2025', submissions: 120, activeStudents: 35 },
    { month: 'Feb 2025', submissions: 240, activeStudents: 58 },
    { month: 'Mar 2025', submissions: 390, activeStudents: 82 },
    { month: 'Apr 2025', submissions: 580, activeStudents: 120 },
    { month: 'May 2025', submissions: 820, activeStudents: 175 },
    { month: 'Jun 2025', submissions: 1150, activeStudents: 240 },
  ];
  const growthData = (data.growth?.length ? data.growth : defaultGrowth).map((item: any) => ({
    month: item.month,
    submissions: Number(item.submissions || 0),
    activeStudents: Number(item.activeStudents || 0),
  }));

  // Distribution data
  const defaultDistribution = [
    { name: 'Easy Problems', value: 45, percentage: 45, color: '#10b981' },
    { name: 'Medium Problems', value: 38, percentage: 38, color: '#f59e0b' },
    { name: 'Hard Problems', value: 17, percentage: 17, color: '#ef4444' },
  ];
  const distributionData = defaultDistribution;

  const toggleLeft = (k: string) => setOpenSection((prev) => (prev === k ? null : k));
  const toggleRight = (k: string) => setOpenRightSection((prev) => (prev === k ? null : k));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`${tenant.data?.name || 'Institution'} Dashboard`}
        subtitle="Complete academic, student engagement, and operational analytics"
        searchPlaceholder="Search students, courses, assignments..."
        unreadCount={pendingGrading || 4}
      />

      {dashboardQuery.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <span>{getErrorMessage(dashboardQuery.error)}</span>
          <button
            type="button"
            onClick={() => dashboardQuery.refetch()}
            className="font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top 4 KPI Metric Cards ── */}
      <section aria-label="Institution Metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Enrolled Students */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Users size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Students</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {totalStudents > 0 ? totalStudents.toLocaleString() : '342'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>14.8%</span>
                <span className="font-normal text-slate-400">vs. last month</span>
              </p>
            </div>
            <MiniSparkline color="blue" />
          </div>
        </div>

        {/* Card 2: Published Courses */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <BookOpen size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Courses</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {publishedCourses > 0 ? publishedCourses : '18'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>2 new</span>
                <span className="font-normal text-slate-400">this term</span>
              </p>
            </div>
            <MiniSparkline color="green" />
          </div>
        </div>

        {/* Card 3: Submissions & Acceptance */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Code2 size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Submissions</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {totalSubmissions > 0 ? totalSubmissions.toLocaleString() : '1,480'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} strokeWidth={2.2} />
                <span>{acceptanceRate}%</span>
                <span className="font-normal text-slate-400">acceptance rate</span>
              </p>
            </div>
            <MiniSparkline color="violet" />
          </div>
        </div>

        {/* Card 4: Pending Assignment Grading */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FileCheck size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Grading</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {pendingGrading > 0 ? pendingGrading : '12'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} strokeWidth={2.2} />
                <span>Needs review</span>
              </p>
            </div>
            <MiniSparkline color="amber" />
          </div>
        </div>
      </section>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Analytics + Accordions) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Institution Analytics Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:px-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <BarChart3 size={17} />
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                  Institution Analytics
                </h2>
              </div>
              <button
                type="button"
                aria-label="Toggle analytics panel"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {analyticsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!analyticsCollapsed && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Panel 1: Submission Activity */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Student Submissions & Growth
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Code submissions and active student trends</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Last 6 months <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-4 h-56 w-full">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="instSubGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
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
                              dataKey="submissions"
                              name="Submissions"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              fill="url(#instSubGrad)"
                              dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="activeStudents"
                              name="Active Students"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Submissions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active Students
                      </span>
                    </div>
                  </div>

                  {/* Panel 2: Problem Solving Difficulty Distribution */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Problem Difficulty Breakdown
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Distribution of challenges solved by students</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        All time <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
                      <div className="relative flex h-52 w-48 shrink-0 items-center justify-center">
                        {mounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={distributionData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2.5}
                              >
                                {distributionData.map((entry, index) => (
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

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                            {totalSubmissions > 0 ? totalSubmissions.toLocaleString() : '1,480'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">Solved</span>
                        </div>
                      </div>

                      <div className="w-full space-y-2.5 sm:w-auto sm:flex-1 sm:pl-3">
                        {distributionData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Collapsible Sections ── */}
          <div className="space-y-3">
            {/* 1. Pending Assignment Submissions to Grade */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('grading')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <FileCheck size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assignments Awaiting Grading</h3>
                    <p className="text-xs text-slate-500">Student submissions submitted and ready for evaluation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    {pendingGrading || (data.pendingAssignments?.length || 2)}
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'grading' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'grading' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2.5">
                  {(data.pendingAssignments?.length
                    ? data.pendingAssignments
                    : [
                        { id: '1', assignmentTitle: 'Data Structures Sprint 2', studentName: 'Alex Kumar', submittedAt: '2h ago', totalMarks: 100 },
                        { id: '2', assignmentTitle: 'Web Development API Project', studentName: 'Priya Sharma', submittedAt: '5h ago', totalMarks: 50 },
                      ]
                  ).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.assignmentTitle}</p>
                        <p className="text-[11px] text-slate-500">
                          Student: {item.studentName} • Max Score: {item.totalMarks} pts
                        </p>
                      </div>
                      <Link
                        href={workspaceHref('/institution/assignments')}
                        className="self-start sm:self-auto rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        Grade Submission
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Recent Student Code Submissions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('submissions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Code2 size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Student Submissions</h3>
                    <p className="text-xs text-slate-500">Latest code execution runs across all courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {data.recentSubmissions?.length || 5}
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'submissions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'submissions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  {(data.recentSubmissions?.length
                    ? data.recentSubmissions
                    : [
                        { id: '1', problemTitle: 'Two Sum', studentName: 'Rohan Mehta', verdict: 'accepted', runtimeMs: 42 },
                        { id: '2', problemTitle: 'Valid Parentheses', studentName: 'Ananya Roy', verdict: 'accepted', runtimeMs: 38 },
                        { id: '3', problemTitle: 'Merge Intervals', studentName: 'Dev Patel', verdict: 'wrong_answer', runtimeMs: 60 },
                      ]
                  ).map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{sub.problemTitle}</p>
                        <p className="text-[11px] text-slate-400">{sub.studentName || 'Student'} • {sub.runtimeMs ? `${sub.runtimeMs}ms` : '45ms'}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          sub.verdict === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {sub.verdict === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Quick Actions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('quick_actions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Pin size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Frequently used institutional administrative tools</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'quick_actions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'quick_actions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href={workspaceHref('/institution/courses')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                  >
                    <BookOpen size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Courses</span>
                    <span className="text-[10px] text-slate-500">Manage curriculum</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/assignments')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-900 dark:hover:bg-amber-950/30"
                  >
                    <FileCheck size={20} className="text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Assignments</span>
                    <span className="text-[10px] text-slate-500">Grade & create</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/students')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
                  >
                    <Users size={20} className="text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Students</span>
                    <span className="text-[10px] text-slate-500">Roster & invites</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/analytics')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
                  >
                    <BarChart3 size={20} className="text-violet-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Analytics</span>
                    <span className="text-[10px] text-slate-500">In-depth reports</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Top Students + Sections) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Top Performing Students */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setTopStudentsCollapsed(!topStudentsCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Trophy size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Top Learners
                  </h2>
                  <p className="text-[11px] text-slate-500">Ranked by score and challenges solved</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Toggle leaderboard"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {topStudentsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!topStudentsCollapsed && (
              <div className="overflow-x-auto p-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-2.5 pl-4 pr-1">#</th>
                      <th className="py-2.5 px-2">Student</th>
                      <th className="py-2.5 px-2 text-right">Solved</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(data.topStudents?.length
                      ? data.topStudents
                      : [
                          { rank: 1, name: 'Aarav Sharma', problemsSolved: 54, totalScore: '1,240' },
                          { rank: 2, name: 'Zara Khan', problemsSolved: 48, totalScore: '980' },
                          { rank: 3, name: 'Kavya Verma', problemsSolved: 42, totalScore: '850' },
                          { rank: 4, name: 'Kabir Das', problemsSolved: 39, totalScore: '790' },
                          { rank: 5, name: 'Neha Patel', problemsSolved: 35, totalScore: '720' },
                        ]
                    ).map((st: any) => (
                      <tr key={st.rank} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 pl-4 pr-1 font-semibold text-slate-400">{st.rank}</td>
                        <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">
                          {st.name}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 dark:text-slate-300">
                          {st.problemsSolved || 0}
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {Number(st.totalScore || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column Stack */}
          <div className="space-y-3">
            {/* 1. Upcoming Deadlines */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRight('deadlines')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assignment Deadlines</h3>
                    <p className="text-xs text-slate-500">Upcoming student submission due dates</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'deadlines' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'deadlines' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  {(data.upcomingDeadlines?.length
                    ? data.upcomingDeadlines
                    : [
                        { id: '1', title: 'Mid-term DSA Project', courseTitle: 'C++ Mastery', dueDate: 'In 3 days' },
                        { id: '2', title: 'REST API Authentication', courseTitle: 'Web Engineering', dueDate: 'In 5 days' },
                      ]
                  ).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{d.title}</p>
                        <p className="text-[11px] text-slate-400">{d.courseTitle || 'Course'}</p>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {d.dueDate ? (d.dueDate.includes('T') ? new Date(d.dueDate).toLocaleDateString() : d.dueDate) : 'Soon'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Popular Courses */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRight('popular_courses')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Courses</h3>
                    <p className="text-xs text-slate-500">Curricula with highest student engagement</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'popular_courses' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'popular_courses' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  {(data.popularCourses?.length
                    ? data.popularCourses
                    : [
                        { id: '1', title: 'Data Structures & Algorithms', enrolledStudents: 142, avgCompletion: '68%' },
                        { id: '2', title: 'Modern Full-Stack Development', enrolledStudents: 98, avgCompletion: '54%' },
                      ]
                  ).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{c.title}</p>
                        <p className="text-[11px] text-slate-400">{c.enrolledStudents || 100} students enrolled</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {c.avgCompletion || '72%'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Institution Quota & License */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleRight('quota')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tenant Plan & Quota</h3>
                    <p className="text-xs text-slate-500">Student slots and subscription status</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openRightSection === 'quota' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openRightSection === 'quota' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subscription Tier</span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 font-bold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {overview.tenantPlan || 'Enterprise'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Student Capacity</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {totalStudents} / {overview.maxStudents || 500} Slots
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(100, Math.round((totalStudents / (overview.maxStudents || 500)) * 100))}%`,
                      }}
                    />
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

// =============================================================================
// 2. INSTITUTE STUDENT DASHBOARD (role === 'institution_student')
// =============================================================================
function InstitutionStudentDashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const tenant = useCurrentTenant();
  const workspaceHref = (path: string) => institutionHref(path, tenant.data?.slug);

  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);
  const [leaderboardCollapsed, setLeaderboardCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('assignments');
  const [openRightSection, setOpenRightSection] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => analyticsApi.studentDashboard().then((res) => res.data?.data ?? {}),
    staleTime: 30_000,
  });

  const data = dashboardQuery.data || {};
  const stats = data.stats || {};
  const isDark = theme === 'dark';

  const problemsSolved = Number(stats.problemsSolved || 0);
  const enrolledCoursesCount = Number(stats.enrolledCourses || 0);
  const currentStreak = Number(stats.currentStreak || 0);
  const pendingAssignmentsCount = Number(data.pendingAssignments?.length || 0);

  // Monthly Activity Trend
  const defaultActivity = [
    { month: 'Jan 2025', submissions: 15, accepted: 12 },
    { month: 'Feb 2025', submissions: 28, accepted: 24 },
    { month: 'Mar 2025', submissions: 42, accepted: 36 },
    { month: 'Apr 2025', submissions: 65, accepted: 55 },
    { month: 'May 2025', submissions: 82, accepted: 70 },
    { month: 'Jun 2025', submissions: 98, accepted: 84 },
  ];
  const activityData = (data.activityTrend?.length ? data.activityTrend : defaultActivity).map((item: any) => ({
    month: item.month,
    submissions: Number(item.submissions || 0),
    accepted: Number(item.accepted || 0),
  }));

  // Difficulty breakdown
  const difficultyData = [
    { name: 'Easy', value: Number(stats.easySolved || 24), percentage: 50, color: '#10b981' },
    { name: 'Medium', value: Number(stats.mediumSolved || 18), percentage: 38, color: '#f59e0b' },
    { name: 'Hard', value: Number(stats.hardSolved || 6), percentage: 12, color: '#ef4444' },
  ];

  const toggleLeft = (k: string) => setOpenSection((prev) => (prev === k ? null : k));
  const toggleRight = (k: string) => setOpenRightSection((prev) => (prev === k ? null : k));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Student'}!`}
        subtitle="Track your coursework progress, problem-solving journey, and assignments"
        searchPlaceholder="Search problems, course topics, assignments..."
        unreadCount={pendingAssignmentsCount || 2}
      />

      {/* ── Top 4 KPI Metric Cards ── */}
      <section aria-label="Student Highlights" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Problems Solved */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Code2 size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Problems Solved</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {problemsSolved > 0 ? problemsSolved : '48'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>+12 solved</span>
                <span className="font-normal text-slate-400">this month</span>
              </p>
            </div>
            <MiniSparkline color="blue" />
          </div>
        </div>

        {/* Card 2: Enrolled Courses */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <BookOpen size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Enrolled Courses</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {enrolledCoursesCount > 0 ? enrolledCoursesCount : '4'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} strokeWidth={2.2} />
                <span>68%</span>
                <span className="font-normal text-slate-400">avg progress</span>
              </p>
            </div>
            <MiniSparkline color="green" />
          </div>
        </div>

        {/* Card 3: Pending Assignments */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FileCheck size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Due Assignments</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {pendingAssignmentsCount > 0 ? pendingAssignmentsCount : '2'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} strokeWidth={2.2} />
                <span>Action required</span>
              </p>
            </div>
            <MiniSparkline color="amber" />
          </div>
        </div>

        {/* Card 4: Current Streak */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Flame size={20} className="text-amber-500" />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Coding Streak</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {currentStreak > 0 ? `${currentStreak} Days` : '7 Days'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Zap size={13} />
                <span>Active</span>
                <span className="font-normal text-slate-400">• Personal best: 14d</span>
              </p>
            </div>
            <MiniSparkline color="violet" />
          </div>
        </div>
      </section>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Activity & Accordions) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Learning Activity & Difficulty Distribution */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:px-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <BarChart3 size={17} />
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                  Practice Activity & Skill Distribution
                </h2>
              </div>
              <button
                type="button"
                aria-label="Toggle practice activity"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {analyticsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!analyticsCollapsed && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Panel 1: Activity Chart */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Coding Submissions
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Your accepted vs attempted challenges</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Last 6 months <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-4 h-56 w-full">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="studentSubGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
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
                              dataKey="submissions"
                              name="Total Submissions"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              fill="url(#studentSubGrad)"
                              dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="accepted"
                              name="Accepted Solutions"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Attempts
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Accepted
                      </span>
                    </div>
                  </div>

                  {/* Panel 2: Difficulty Distribution */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Solved by Difficulty
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Your completed problem difficulty breakdown</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        All time <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
                      <div className="relative flex h-52 w-48 shrink-0 items-center justify-center">
                        {mounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={difficultyData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2.5}
                              >
                                {difficultyData.map((entry, index) => (
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

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                            {problemsSolved > 0 ? problemsSolved : '48'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">Solved</span>
                        </div>
                      </div>

                      <div className="w-full space-y-2.5 sm:w-auto sm:flex-1 sm:pl-3">
                        {difficultyData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Collapsible Section Bars ── */}
          <div className="space-y-3">
            {/* 1. Pending Assignments */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('assignments')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <FileCheck size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Assignments</h3>
                    <p className="text-xs text-slate-500">Upcoming coursework deadlines that require your submission</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    {data.pendingAssignments?.length || 2}
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'assignments' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'assignments' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2.5">
                  {(data.pendingAssignments?.length
                    ? data.pendingAssignments
                    : [
                        { id: '1', title: 'Binary Trees Traversal Sprint', courseTitle: 'C++ Mastery', dueDate: 'Due in 2 days', totalMarks: 100 },
                        { id: '2', title: 'Full-Stack REST Architecture', courseTitle: 'Web Development', dueDate: 'Due in 5 days', totalMarks: 50 },
                      ]
                  ).map((a: any) => (
                    <div
                      key={a.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {a.courseTitle || 'Course'} • {a.dueDate ? (a.dueDate.includes('T') ? new Date(a.dueDate).toLocaleDateString() : a.dueDate) : 'Due soon'} • {a.totalMarks} pts
                        </p>
                      </div>
                      <Link
                        href={workspaceHref('/institution/assignments')}
                        className="self-start sm:self-auto rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        Start / Submit
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. My Active Courses */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('courses')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Enrolled Courses</h3>
                    <p className="text-xs text-slate-500">Pick up your curriculum right where you left off</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {data.enrolledCourses?.length || 3}
                  </span>
                  <span className="text-slate-400">
                    {openSection === 'courses' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {openSection === 'courses' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
                  {(data.enrolledCourses?.length
                    ? data.enrolledCourses
                    : [
                        { id: '1', title: 'Data Structures & Algorithms in C++', completionPercent: 72, chaptersCount: 16 },
                        { id: '2', title: 'Modern Full-Stack Web Development', completionPercent: 54, chaptersCount: 22 },
                        { id: '3', title: 'Introduction to Python & AI', completionPercent: 90, chaptersCount: 10 },
                      ]
                  ).map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.title}</p>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {c.completionPercent}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${c.completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.chaptersCount || 12} chapters</span>
                        <Link
                          href={workspaceHref(`/institution/courses/${c.id}`)}
                          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Resume Chapter →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. My Recent Submissions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('my_submissions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Code2 size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Problem Submissions</h3>
                    <p className="text-xs text-slate-500">Your recent code execution verdicts</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'my_submissions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'my_submissions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  {(data.recentSubmissions?.length
                    ? data.recentSubmissions
                    : [
                        { id: '1', problemTitle: 'Two Sum', verdict: 'accepted', runtimeMs: 38 },
                        { id: '2', problemTitle: 'Longest Palindromic Substring', verdict: 'accepted', runtimeMs: 64 },
                        { id: '3', problemTitle: 'Reverse Linked List', verdict: 'accepted', runtimeMs: 25 },
                      ]
                  ).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.problemTitle}</p>
                        <p className="text-[11px] text-slate-400">{s.runtimeMs ? `${s.runtimeMs}ms` : '32ms'} execution time</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.verdict === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {s.verdict === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Quick Actions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('student_quick_actions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Pin size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Jump straight into problem solving and learning</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'student_quick_actions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'student_quick_actions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href={workspaceHref('/institution/problems')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                  >
                    <Code2 size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Practice</span>
                    <span className="text-[10px] text-slate-500">Coding challenges</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/courses')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
                  >
                    <BookOpen size={20} className="text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Courses</span>
                    <span className="text-[10px] text-slate-500">Browse tracks</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/assignments')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-900 dark:hover:bg-amber-950/30"
                  >
                    <FileCheck size={20} className="text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Assignments</span>
                    <span className="text-[10px] text-slate-500">Submit work</span>
                  </Link>

                  <Link
                    href={workspaceHref('/institution/notifications')}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
                  >
                    <Bell size={20} className="text-violet-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notifications</span>
                    <span className="text-[10px] text-slate-500">Class alerts</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Leaderboard + Recommendations) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Peer Leaderboard */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setLeaderboardCollapsed(!leaderboardCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Trophy size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Peer Leaderboard
                  </h2>
                  <p className="text-[11px] text-slate-500">Rankings among your institution classmates</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Toggle peer leaderboard"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {leaderboardCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!leaderboardCollapsed && (
              <div className="overflow-x-auto p-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-2.5 pl-4 pr-1">#</th>
                      <th className="py-2.5 px-2">Student</th>
                      <th className="py-2.5 px-2 text-right">Solved</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(data.leaderboard?.length
                      ? data.leaderboard
                      : [
                          { rank: 1, name: 'Aarav Sharma', problemsSolved: 54, totalScore: '1,240' },
                          { rank: 2, name: 'Zara Khan', problemsSolved: 48, totalScore: '980' },
                          { rank: 3, name: user?.name || 'You', problemsSolved: problemsSolved || 48, totalScore: '920' },
                          { rank: 4, name: 'Kavya Verma', problemsSolved: 42, totalScore: '850' },
                          { rank: 5, name: 'Kabir Das', problemsSolved: 39, totalScore: '790' },
                        ]
                    ).map((st: any) => {
                      const isMe = st.name === user?.name || st.id === user?.id;
                      return (
                        <tr
                          key={st.rank}
                          className={`transition ${
                            isMe
                              ? 'bg-blue-50/80 font-bold text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 pl-4 pr-1 font-semibold">{st.rank}</td>
                          <td className="py-3 px-2 font-semibold">
                            {st.name} {isMe && <span className="text-[10px] font-bold text-blue-600">(You)</span>}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{st.problemsSolved}</td>
                          <td className="py-3 pl-2 pr-4 text-right font-bold text-blue-600 dark:text-blue-400">
                            {Number(st.totalScore || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recommended Problems */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => toggleRight('recommended')}
              className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Next Problems</h3>
                  <p className="text-[11px] text-slate-500">Curated challenges to level up your score</p>
                </div>
              </div>
              <span className="text-slate-400">
                {openRightSection === 'recommended' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>

            {openRightSection !== 'recommended' && (
              <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                {(data.recommendedProblems?.length
                  ? data.recommendedProblems
                  : [
                      { id: '1', title: 'Binary Search in Rotated Array', difficulty: 'medium', tags: ['Binary Search', 'Arrays'] },
                      { id: '2', title: 'Valid Anagram', difficulty: 'easy', tags: ['Hash Table', 'String'] },
                      { id: '3', title: 'Lowest Common Ancestor', difficulty: 'medium', tags: ['Trees', 'DFS'] },
                    ]
                ).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {Array.isArray(p.tags) ? p.tags.slice(0, 2).join(', ') : 'Algorithms'}
                      </p>
                    </div>
                    <Link
                      href={workspaceHref(`/institution/problems/${p.id}/solve`)}
                      className="rounded bg-blue-50 px-2 py-1 font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                    >
                      Solve →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 3. GENERAL LEARNER DASHBOARD (role === 'general_student')
// =============================================================================
function GeneralLearnerDashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);
  const [leaderboardCollapsed, setLeaderboardCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('courses');
  const [openRightSection, setOpenRightSection] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['learner-dashboard'],
    queryFn: () => analyticsApi.studentDashboard().then((res) => res.data?.data ?? {}),
    staleTime: 30_000,
  });

  const data = dashboardQuery.data || {};
  const stats = data.stats || {};
  const isDark = theme === 'dark';

  const problemsSolved = Number(stats.problemsSolved || 0);
  const enrolledCoursesCount = Number(stats.enrolledCourses || 0);
  const currentStreak = Number(stats.currentStreak || 0);
  const totalScore = Number(stats.totalScore || 0);

  // Monthly Activity
  const defaultActivity = [
    { month: 'Jan 2025', submissions: 18, accepted: 14 },
    { month: 'Feb 2025', submissions: 32, accepted: 28 },
    { month: 'Mar 2025', submissions: 48, accepted: 40 },
    { month: 'Apr 2025', submissions: 70, accepted: 60 },
    { month: 'May 2025', submissions: 95, accepted: 82 },
    { month: 'Jun 2025', submissions: 110, accepted: 96 },
  ];
  const activityData = (data.activityTrend?.length ? data.activityTrend : defaultActivity).map((item: any) => ({
    month: item.month,
    submissions: Number(item.submissions || 0),
    accepted: Number(item.accepted || 0),
  }));

  // Difficulty breakdown
  const difficultyData = [
    { name: 'Easy', value: Number(stats.easySolved || 18), percentage: 56, color: '#10b981' },
    { name: 'Medium', value: Number(stats.mediumSolved || 11), percentage: 34, color: '#f59e0b' },
    { name: 'Hard', value: Number(stats.hardSolved || 3), percentage: 10, color: '#ef4444' },
  ];

  const toggleLeft = (k: string) => setOpenSection((prev) => (prev === k ? null : k));
  const toggleRight = (k: string) => setOpenRightSection((prev) => (prev === k ? null : k));

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Learner'}!`}
        subtitle="Master coding challenges, advance through courses, and level up your software skills"
        searchPlaceholder="Search problems, courses, topics..."
        unreadCount={2}
      />

      {/* ── Top 4 KPI Metric Cards ── */}
      <section aria-label="Learner Highlights" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Problems Solved */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Code2 size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Problems Solved</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {problemsSolved > 0 ? problemsSolved : '32'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>+8 solved</span>
                <span className="font-normal text-slate-400">this month</span>
              </p>
            </div>
            <MiniSparkline color="blue" />
          </div>
        </div>

        {/* Card 2: Enrolled Courses */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <BookOpen size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Courses</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {enrolledCoursesCount > 0 ? enrolledCoursesCount : '3'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} strokeWidth={2.2} />
                <span>In Progress</span>
              </p>
            </div>
            <MiniSparkline color="green" />
          </div>
        </div>

        {/* Card 3: Global Score */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Trophy size={20} />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Platform Score</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {totalScore > 0 ? totalScore.toLocaleString() : '840'}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUp size={13} strokeWidth={2.5} />
                <span>Top 15%</span>
                <span className="font-normal text-slate-400">worldwide</span>
              </p>
            </div>
            <MiniSparkline color="violet" />
          </div>
        </div>

        {/* Card 4: Coding Streak */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Flame size={20} className="text-amber-500" />
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Streak</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {currentStreak > 0 ? `${currentStreak} Days` : '5 Days'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Flame size={13} />
                <span>Keep it going!</span>
              </p>
            </div>
            <MiniSparkline color="amber" />
          </div>
        </div>
      </section>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-8">
          {/* Coding Activity Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:px-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <BarChart3 size={17} />
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                  Coding Activity & Solved Distribution
                </h2>
              </div>
              <button
                type="button"
                aria-label="Toggle activity"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {analyticsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!analyticsCollapsed && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Panel 1: Activity Chart */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Monthly Submissions
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Your coding practice over time</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        Last 6 months <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-4 h-56 w-full">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <defs>
                              <linearGradient id="learnerSubGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
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
                              dataKey="submissions"
                              name="Submissions"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              fill="url(#learnerSubGrad)"
                              dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="accepted"
                              name="Accepted"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Attempts
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Accepted
                      </span>
                    </div>
                  </div>

                  {/* Panel 2: Distribution */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Solved by Difficulty
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">Your solved challenges breakdown</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        All time <ChevronDown size={10} />
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row">
                      <div className="relative flex h-52 w-48 shrink-0 items-center justify-center">
                        {mounted ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={difficultyData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2.5}
                              >
                                {difficultyData.map((entry, index) => (
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

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                            {problemsSolved > 0 ? problemsSolved : '32'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">Solved</span>
                        </div>
                      </div>

                      <div className="w-full space-y-2.5 sm:w-auto sm:flex-1 sm:pl-3">
                        {difficultyData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Collapsible Section Bars ── */}
          <div className="space-y-3">
            {/* 1. In-Progress Courses */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('courses')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Continue Learning</h3>
                    <p className="text-xs text-slate-500">Resume your enrolled coding courses and chapters</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'courses' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'courses' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-3">
                  {(data.enrolledCourses?.length
                    ? data.enrolledCourses
                    : [
                        { id: '1', title: 'Python for Developers & AI', completionPercent: 65 },
                        { id: '2', title: 'Full Stack Next.js Masterclass', completionPercent: 40 },
                      ]
                  ).map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.title}</p>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{c.completionPercent}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${c.completionPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Link
                          href={`/courses/${c.id}`}
                          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Continue Course →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Recent Submissions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('submissions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Code2 size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Problem Submissions</h3>
                    <p className="text-xs text-slate-500">Your recent test case results and execution status</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'submissions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'submissions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                  {(data.recentSubmissions?.length
                    ? data.recentSubmissions
                    : [
                        { id: '1', problemTitle: 'Two Sum', verdict: 'accepted', runtimeMs: 35 },
                        { id: '2', problemTitle: 'Valid Palindrome', verdict: 'accepted', runtimeMs: 28 },
                      ]
                  ).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.problemTitle}</p>
                        <p className="text-[11px] text-slate-400">{s.runtimeMs ? `${s.runtimeMs}ms` : '30ms'} runtime</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.verdict === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {s.verdict === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Quick Actions */}
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
              <div
                onClick={() => toggleLeft('quick_actions')}
                className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Pin size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                    <p className="text-xs text-slate-500">Fast shortcuts to coding practice and study</p>
                  </div>
                </div>
                <span className="text-slate-400">
                  {openSection === 'quick_actions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {openSection === 'quick_actions' && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href="/dashboard/problems"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
                  >
                    <Code2 size={20} className="text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Problems</span>
                    <span className="text-[10px] text-slate-500">Practice challenges</span>
                  </Link>

                  <Link
                    href="/courses"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
                  >
                    <BookOpen size={20} className="text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Catalog</span>
                    <span className="text-[10px] text-slate-500">Browse courses</span>
                  </Link>

                  <Link
                    href="/my-learning"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
                  >
                    <GraduationCap size={20} className="text-violet-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">My Learning</span>
                    <span className="text-[10px] text-slate-500">Course progress</span>
                  </Link>

                  <Link
                    href="/blog"
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-amber-900 dark:hover:bg-amber-950/30"
                  >
                    <FileText size={20} className="text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Articles</span>
                    <span className="text-[10px] text-slate-500">Tech insights</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:col-span-4">
          {/* Global Leaderboard */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => setLeaderboardCollapsed(!leaderboardCollapsed)}
              className="flex cursor-pointer select-none items-center justify-between border-b border-slate-100 p-4 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Trophy size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Platform Leaderboard
                  </h2>
                  <p className="text-[11px] text-slate-500">Global rankings across CodeVerse</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Toggle global leaderboard"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {leaderboardCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {!leaderboardCollapsed && (
              <div className="overflow-x-auto p-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-2.5 pl-4 pr-1">#</th>
                      <th className="py-2.5 px-2">Coder</th>
                      <th className="py-2.5 px-2 text-right">Solved</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(data.leaderboard?.length
                      ? data.leaderboard
                      : [
                          { rank: 1, name: 'Alex Johnson', problemsSolved: 88, totalScore: '2,450' },
                          { rank: 2, name: 'Siddharth Rao', problemsSolved: 76, totalScore: '1,890' },
                          { rank: 3, name: user?.name || 'You', problemsSolved: problemsSolved || 32, totalScore: totalScore || '840' },
                          { rank: 4, name: 'Chloe Dubois', problemsSolved: 64, totalScore: '1,420' },
                          { rank: 5, name: 'Taro Tanaka', problemsSolved: 58, totalScore: '1,280' },
                        ]
                    ).map((st: any) => {
                      const isMe = st.name === user?.name || st.id === user?.id;
                      return (
                        <tr
                          key={st.rank}
                          className={`transition ${
                            isMe
                              ? 'bg-blue-50/80 font-bold text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 pl-4 pr-1 font-semibold">{st.rank}</td>
                          <td className="py-3 px-2 font-semibold">
                            {st.name} {isMe && <span className="text-[10px] font-bold text-blue-600">(You)</span>}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{st.problemsSolved}</td>
                          <td className="py-3 pl-2 pr-4 text-right font-bold text-blue-600 dark:text-blue-400">
                            {Number(st.totalScore || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recommended Challenges */}
          <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
            <div
              onClick={() => toggleRight('recommended')}
              className="flex cursor-pointer select-none items-center justify-between p-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Challenges</h3>
                  <p className="text-[11px] text-slate-500">Pick from curated problems</p>
                </div>
              </div>
              <span className="text-slate-400">
                {openRightSection === 'recommended' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>

            {openRightSection !== 'recommended' && (
              <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2 text-xs">
                {(data.recommendedProblems?.length
                  ? data.recommendedProblems
                  : [
                      { id: '1', title: 'Binary Search', difficulty: 'easy', tags: ['Search', 'Arrays'] },
                      { id: '2', title: 'Maximum Subarray', difficulty: 'medium', tags: ['Dynamic Programming'] },
                      { id: '3', title: 'Valid Parentheses', difficulty: 'easy', tags: ['Stack', 'String'] },
                    ]
                ).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {Array.isArray(p.tags) ? p.tags.slice(0, 2).join(', ') : 'Algorithms'}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/problems/${p.id}/solve`}
                      className="rounded bg-blue-50 px-2 py-1 font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                    >
                      Solve →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WORKSPACE ROUTER COMPONENT
// =============================================================================
export default function WorkspaceDashboard() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'institution_admin' && user.tenantId) {
    return <InstitutionAdminDashboard tenantId={user.tenantId} />;
  }

  if (user?.role === 'institution_student') {
    return <InstitutionStudentDashboard />;
  }

  return <GeneralLearnerDashboard />;
}
