import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StudentsPage from '@/app/institution/students/page';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/lib/api', () => ({
  userApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  getErrorMessage: (error: Error) => error.message,
}));

const mockedUserApi = vi.mocked(userApi);
const student = {
  id: 'student-1',
  name: 'Jordan Student',
  email: 'jordan@example.com',
  role: 'institution_student',
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  phone: '555-0100',
  bio: 'Learning programming',
};

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <StudentsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setUser({
    id: 'admin-1',
    name: 'Institution Admin',
    email: 'admin@example.com',
    role: 'institution_admin',
    tenantId: 'tenant-1',
  });
  mockedUserApi.list.mockResolvedValue({
    data: { success: true, data: [student], total: 1 },
  } as any);
  mockedUserApi.get.mockResolvedValue({ data: { success: true, data: student } } as any);
  mockedUserApi.create.mockResolvedValue({ data: { success: true, data: student } } as any);
  mockedUserApi.update.mockResolvedValue({ data: { success: true, data: student } } as any);
  mockedUserApi.delete.mockResolvedValue({ data: { success: true, data: { message: 'User deleted' } } } as any);
});

describe('Institution students', () => {
  it('shows the institution roster and lets an admin read a student record', async () => {
    renderPage();

    expect(await screen.findByText('Jordan Student')).toBeInTheDocument();
    expect(screen.getByText('jordan@example.com')).toBeInTheDocument();
    expect(mockedUserApi.list).toHaveBeenCalledWith(expect.objectContaining({
      role: 'institution_student',
      limit: 20,
    }));

    await userEvent.click(screen.getByRole('button', { name: 'View Jordan Student' }));
    expect(await screen.findByText('Learning programming')).toBeInTheDocument();
  });

  it('does not allow institution admins to create student accounts', async () => {
    renderPage();
    await screen.findByText('Jordan Student');
    expect(screen.queryByRole('button', { name: 'Add student' })).not.toBeInTheDocument();
    expect(screen.getByText(/New institution accounts are provisioned by a super admin/)).toBeInTheDocument();
    expect(mockedUserApi.create).not.toHaveBeenCalled();
  });

  it('updates a student and can soft-delete a student account', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    renderPage();
    await screen.findByText('Jordan Student');

    await userEvent.click(screen.getByRole('button', { name: 'Edit Jordan Student' }));
    const nameInput = screen.getByLabelText('Full name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jordan Updated');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(mockedUserApi.update).toHaveBeenCalledWith('student-1', expect.objectContaining({
      name: 'Jordan Updated',
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Delete Jordan Student' }));
    await waitFor(() => expect(mockedUserApi.delete).toHaveBeenCalledWith('student-1'));
    vi.unstubAllGlobals();
  });
});
