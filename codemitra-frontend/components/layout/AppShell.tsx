'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '@/store/authStore';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { user } = useAuthStore();

  if (!user) {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <TopBar />
      <main className="flex-1 lg:ml-64 mt-16 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
