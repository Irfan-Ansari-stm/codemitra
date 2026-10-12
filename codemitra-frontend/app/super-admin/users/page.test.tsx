import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuperAdminUsersPage from '@/app/super-admin/users/page';
import { tenantApi, userApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  tenantApi: { list: vi.fn() },
  userApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  getErrorMessage: (error: Error) => error.message,
}));

const mockedUserApi = vi.mocked(userApi);
const mockedTenantApi = vi.mocked(tenantApi);

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SuperAdminUsersPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserApi.list.mockResolvedValue({ data: { success: true, data: [], total: 0 } } as any);
  mockedTenantApi.list.mockResolvedValue({
    data: { success: true, data: [{ id: 'tenant-1', name: 'North College', slug: 'north-college' }], total: 1 },
  } as any);
  mockedUserApi.create.mockResolvedValue({ data: { success: true, data: {} } } as any);
});

describe('Super-admin users', () => {
  it('shows only institution admins and institution students in institution users', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Institution users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View general users' })).toHaveAttribute('href', '/super-admin/general-users');
    expect(screen.getByRole('heading', { name: 'Institution admins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Institution students' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'General students' })).not.toBeInTheDocument();
    expect(mockedUserApi.list).not.toHaveBeenCalledWith(expect.objectContaining({ role: 'general_student' }));
    expect(mockedUserApi.list).toHaveBeenCalledWith(expect.objectContaining({ role: 'institution_admin' }));
    expect(mockedUserApi.list).toHaveBeenCalledWith(expect.objectContaining({ role: 'institution_student' }));
  });

  it('creates an institution admin with an institution assignment', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Institution admins' });
    await userEvent.click(screen.getByRole('button', { name: 'Add institution admin' }));
    await userEvent.type(screen.getByLabelText('Full name'), 'College Admin');
    await userEvent.type(screen.getByLabelText('Email'), 'admin@north.example');
    await userEvent.type(screen.getByLabelText('Initial password'), 'SecurePass123');
    fireEvent.change(screen.getByLabelText('Institution'), { target: { value: 'tenant-1' } });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(mockedUserApi.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'College Admin',
      email: 'admin@north.example',
      role: 'institution_admin',
      tenantId: 'tenant-1',
    })));
  });

  it('creates an institution student with a selected institution', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Institution students' });
    await userEvent.click(screen.getByRole('button', { name: 'Add institution student' }));
    await userEvent.type(screen.getByLabelText('Full name'), 'Campus Learner');
    await userEvent.type(screen.getByLabelText('Email'), 'campus@example.com');
    await userEvent.type(screen.getByLabelText('Initial password'), 'SecurePass123');
    fireEvent.change(screen.getByLabelText('Institution'), { target: { value: 'tenant-1' } });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(mockedUserApi.create).toHaveBeenCalledWith(expect.objectContaining({
      role: 'institution_student',
      tenantId: 'tenant-1',
    })));
  });
});
