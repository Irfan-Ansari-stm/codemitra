'use client';

import { LeaderboardEntry } from '@/types';
import { Medal, Trophy } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

export default function Leaderboard({ entries, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
        <Trophy size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No leaderboard data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Points
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Submissions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            let medalColor = '';
            let medal = null;

            if (rank === 1) {
              medalColor = 'text-yellow-500';
              medal = '🥇';
            } else if (rank === 2) {
              medalColor = 'text-gray-400';
              medal = '🥈';
            } else if (rank === 3) {
              medalColor = 'text-orange-600';
              medal = '🥉';
            }

            return (
              <tr
                key={entry.userId}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {medal && <span>{medal}</span>}
                    <span className="font-bold text-gray-900 dark:text-white">
                      #{rank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entry.userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.userEmail}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-lg text-primary">
                    {entry.points}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {entry.submissionCount}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
