import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuthStore } from '@/store/authStore';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/problems',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useLogout: () => ({ mutate: logout, isPending: false }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useCurrentTenant: () => ({ data: { slug: 'stanford-eng' } }),
}));

vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button" aria-label="Theme toggle">Theme</button>,
}));

vi.mock('@/lib/api', () => ({
  notificationApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'notif-1', title: 'New Course Assignment', isRead: false, createdAt: new Date().toISOString() },
        ],
      },
    }),
    markRead: vi.fn().mockResolvedValue({ success: true }),
  },
  problemApi: {
    list: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
  courseApi: {
    list: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
  blogApi: {
    list: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setUser({
    id: 'user-emp-1',
    name: 'Sarah Connor',
    email: 'sarah@skynet.ai',
    role: 'super_admin',
    tenantId: null,
  });
});

describe('AppHeader Redesigned Enterprise Suite', () => {
  it('renders BrandLogo, DesktopNavigation, and User Profile menu for authenticated user', () => {
    render(<AppHeader />);

    // Brand logo
    expect(screen.getByRole('link', { name: 'CodeVerse home' })).toBeInTheDocument();

    // Direct nav links
    expect(screen.getByRole('link', { name: 'Problems' })).toHaveAttribute(
      'href',
      '/super-admin/problems'
    );
    expect(screen.getByRole('link', { name: 'Courses' })).toBeInTheDocument();

    // Account menu
    const accountBtn = screen.getByRole('button', { name: 'Account menu for Sarah Connor' });
    expect(accountBtn).toBeInTheDocument();

    // Open account dropdown
    fireEvent.click(accountBtn);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/super-admin/dashboard'
    );
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();

    // Trigger logout
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('renders unauthenticated Sign in and Create account CTA when user is null', () => {
    useAuthStore.getState().setUser(null);
    render(<AppHeader />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('opens and closes global command palette search when search button is clicked', () => {
    render(<AppHeader />);

    const searchBtn = screen.getByRole('button', { name: 'Global search (Ctrl+K)' });
    fireEvent.click(searchBtn);

    expect(screen.getByRole('dialog', { name: 'Quick search navigation' })).toBeInTheDocument();

    // Escape closes modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: 'Quick search navigation' })
    ).not.toBeInTheDocument();
  });
});
