'use client';

import { Problem, DIFFICULTY_CONFIG } from '@/types';
import Link from 'next/link';
import { Code, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProblemCardProps {
  problem: Problem;
  solved?: boolean;
  attempted?: boolean;
  href?: string;
}

export default function ProblemCard({
  problem,
  solved,
  attempted,
  href,
}: ProblemCardProps) {
  const diffConfig = DIFFICULTY_CONFIG[problem.difficulty];
  const content = (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {problem.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {problem.statement}
          </p>
        </div>
        {solved && (
          <div className="flex-shrink-0">
            <CheckCircle size={24} className="text-green-600" />
          </div>
        )}
        {attempted && !solved && (
          <div className="flex-shrink-0">
            <Clock size={24} className="text-yellow-600" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Difficulty Badge */}
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${diffConfig.bg} ${diffConfig.color}`}
        >
          {problem.difficulty}
        </span>

        {/* Acceptance Rate */}
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {problem.totalSubmissions ? Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100) : 0}% accepted
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Code size={16} />
          {problem.totalSubmissions} submissions
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface ProblemListProps {
  problems: Problem[];
  isLoading?: boolean;
  href?: (id: string) => string;
  solved?: Record<string, boolean>;
  attempted?: Record<string, boolean>;
}

export function ProblemList({
  problems,
  isLoading,
  href,
  solved,
  attempted,
}: ProblemListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-800 rounded-lg h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          No problems available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          problem={problem}
          solved={solved?.[problem.id]}
          attempted={attempted?.[problem.id]}
          href={href ? href(problem.id) : undefined}
        />
      ))}
    </div>
  );
}
