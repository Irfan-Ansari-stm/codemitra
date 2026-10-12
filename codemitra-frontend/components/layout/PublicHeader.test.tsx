import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { useAuthStore } from '@/store/authStore';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/problems',
}));

vi.mock('@/hooks/useAuth', () => ({
  useLogout: () => ({ mutate: logout, isPending: false }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useCurrentTenant: () => ({ data: { slug: 'demo-college' } }),
}));

vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setUser({
    id: 'user-1',
    name: 'Jamie Learner',
    email: 'jamie@example.com',
    role: 'institution_student',
    tenantId: 'tenant-1',
  });
});

describe('PublicHeader', () => {
  it('shows Dashboard and Logout in the authenticated profile menu', () => {
    render(<PublicHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Jamie Learner' }));

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/demo-college/dashboard'
    );
    expect(screen.getByRole('link', { name: 'Problems' })).toHaveAttribute(
      'href',
      '/demo-college/problems'
    );
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'href',
      '/demo-college/courses'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('routes general students to the learner dashboard and problem library', () => {
    useAuthStore.getState().setUser({
      id: 'general-1',
      name: 'Jamie Learner',
      email: 'jamie@example.com',
      role: 'general_student',
      tenantId: null,
    });

    render(<PublicHeader />);

    expect(screen.getByRole('link', { name: 'Problems' })).toHaveAttribute(
      'href',
      '/dashboard/problems'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Jamie Learner' }));
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });
});
