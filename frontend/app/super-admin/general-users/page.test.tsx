import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GeneralUsersPage from '@/app/super-admin/general-users/page';
import { userApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  userApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  getErrorMessage: (error: Error) => error.message,
}));

const mockedUserApi = vi.mocked(userApi);

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <GeneralUsersPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserApi.list.mockResolvedValue({
    data: { success: true, data: [{ id: 'general-1', name: 'General Learner', email: 'learner@example.com', role: 'general_student', is_active: true, created_at: '2026-10-01T00:00:00Z' }], total: 1 },
  } as any);
  mockedUserApi.get.mockResolvedValue({ data: { success: true, data: { name: 'General Learner', role: 'general_student' } } } as any);
  mockedUserApi.create.mockResolvedValue({ data: { success: true, data: {} } } as any);
  mockedUserApi.update.mockResolvedValue({ data: { success: true, data: {} } } as any);
  mockedUserApi.delete.mockResolvedValue({ data: { success: true, data: {} } } as any);
});

describe('Super-admin general users', () => {
  it('shows only general student records', async () => {
    renderPage();
    expect(await screen.findByText('General Learner')).toBeInTheDocument();
    expect(screen.getByText('Standalone general-student accounts; these users are not attached to an institution.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to institution users' })).toHaveAttribute('href', '/super-admin/users');
    expect(mockedUserApi.list).toHaveBeenCalledWith(expect.objectContaining({ role: 'general_student' }));
  });

  it('creates a general student with no institution assignment', async () => {
    renderPage();
    await screen.findByText('General Learner');
    await userEvent.click(screen.getByRole('button', { name: 'Add general student' }));
    await userEvent.type(screen.getByLabelText('Full name'), 'New Learner');
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Initial password'), 'SecurePass123');
    await userEvent.click(screen.getByRole('button', { name: 'Create general student' }));

    await waitFor(() => expect(mockedUserApi.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Learner',
      role: 'general_student',
      tenantId: null,
    })));
  });

  it('can edit and delete a general student account', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    renderPage();
    await screen.findByText('General Learner');
    await userEvent.click(screen.getByRole('button', { name: 'Edit General Learner' }));
    await userEvent.clear(screen.getByLabelText('Full name'));
    await userEvent.type(screen.getByLabelText('Full name'), 'Updated Learner');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(mockedUserApi.update).toHaveBeenCalledWith('general-1', { name: 'Updated Learner', isActive: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Delete General Learner' }));
    await waitFor(() => expect(mockedUserApi.delete).toHaveBeenCalledWith('general-1'));
    vi.unstubAllGlobals();
  });
});
