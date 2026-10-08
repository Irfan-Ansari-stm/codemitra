'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, BookOpen, Code, Users, TrendingUp, Clock } from 'lucide-react';
import { StatsCardsGrid } from '@/components/analytics/StatsCards';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const statsCards = [
    {
      icon: <BookOpen size={24} />,
      title: 'Active Courses',
      value: '5',
      subtitle: '2 this semester',
      trend: { value: 20, isPositive: true },
    },
    {
      icon: <Code size={24} />,
      title: 'Problems Solved',
      value: '28',
      subtitle: 'Acceptance rate: 92%',
      trend: { value: 15, isPositive: true },
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Rank',
      value: '#42',
      subtitle: 'Top 5%',
      trend: { value: 5, isPositive: true },
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Streak',
      value: '12',
      subtitle: 'days coding',
      trend: { value: 8, isPositive: true },
    },
  ];

  const recentSubmissions = [
    {
      id: '1',
      problemTitle: 'Two Sum',
      verdict: 'Accepted',
      time: '2 hours ago',
      language: 'Python',
    },
    {
      id: '2',
      problemTitle: 'Merge Sorted Arrays',
      verdict: 'Accepted',
      time: '5 hours ago',
      language: 'JavaScript',
    },
    {
      id: '3',
      problemTitle: 'Binary Search Tree',
      verdict: 'Wrong Answer',
      time: '1 day ago',
      language: 'Java',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's your learning progress overview
        </p>
      </div>

      {/* Stats Grid */}
      <StatsCardsGrid cards={statsCards} />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/problems"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-primary"
            >
              <Code size={20} />
              <span>Solve New Problem</span>
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-primary"
            >
              <BookOpen size={20} />
              <span>Browse Courses</span>
            </Link>
            <Link
              href="/analytics"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 hover:text-primary"
            >
              <BarChart3 size={20} />
              <span>View Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Submissions
          </h2>
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {submission.problemTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {submission.language}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {submission.time}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    submission.verdict === 'Accepted'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {submission.verdict}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/submissions"
            className="text-primary text-sm font-medium mt-4 inline-block hover:underline"
          >
            View all submissions →
          </Link>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 rounded-lg border border-primary/20 dark:border-primary/10 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          💡 Recommended For You
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Based on your learning progress, we recommend focusing on:
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary rounded-full" />
            Dynamic Programming - Advanced Level
          </li>
          <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary rounded-full" />
            Graph Algorithms - Intermediate Level
          </li>
          <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="w-2 h-2 bg-primary rounded-full" />
            System Design - Beginner Level
          </li>
        </ul>
      </div>
    </div>
  );
}
