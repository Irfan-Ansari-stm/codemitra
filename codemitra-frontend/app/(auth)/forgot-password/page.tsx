'use client';

import Link from 'next/link';

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Self-service email recovery is not configured for this local project.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Ask your institution administrator to reset your account password. Administrators can use the user reset-password action.
        </p>
      </div>
      <Link className="text-primary hover:underline" href="/login">Return to sign in</Link>
    </div>
  );
}
