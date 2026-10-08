'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  BookOpen,
  Code,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Home,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useLogout } from '@/hooks/useAuth';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, isAdmin, isSuperAdmin, clear } = useAuthStore();
  const { logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      clear();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  const navItems = [];

  // Common items for all authenticated users
  navItems.push({
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  });

  if (user.role === 'student') {
    navItems.push(
      { label: 'Browse Problems', href: '/problems', icon: Code },
      { label: 'My Submissions', href: '/submissions', icon: Zap },
      { label: 'Learn Courses', href: '/courses', icon: BookOpen },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 }
    );
  }

  if (isAdmin()) {
    navItems.push(
      { label: 'Courses', href: '/courses', icon: BookOpen },
      { label: 'Problems', href: '/problems', icon: Code },
      { label: 'Assignments', href: '/assignments', icon: Zap },
      { label: 'Students', href: '/students', icon: Users },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/settings', icon: Settings }
    );
  }

  if (isSuperAdmin()) {
    navItems.push(
      { label: 'Institutions', href: '/super-admin/institutions', icon: Home },
      { label: 'Users', href: '/super-admin/users', icon: Users },
      { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
      { label: 'Problems', href: '/super-admin/problems', icon: Code }
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
            <Code className="text-primary" size={24} />
            CodeVerse
          </Link>

          {/* Navigation */}
          <nav className="space-y-2 mb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
