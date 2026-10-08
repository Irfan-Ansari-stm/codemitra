'use client';

import { Loader } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export default function Loading({ message = 'Loading...', fullPage }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-12 h-12">
        <Loader className="w-full h-full animate-spin text-primary" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}
