import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProblemsPage from '@/components/problems/ProblemsPage';
import { problemApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Problem } from '@/types';

vi.mock('@/lib/api', () => ({
  problemApi: { list: vi.fn() },
  tenantApi: { current: vi.fn().mockResolvedValue({ data: { data: { slug: 'demo-college' } } }) },
  getErrorMessage: (error: any) =>
    error?.response?.data?.error?.message ?? error?.message ?? 'An error occurred',
}));

const mockedList = vi.mocked(problemApi.list);

const FIXTURE_PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    scope: 'public',
    tags: ['arrays', 'hashing'],
    timeLimitMs: 1000,
    memoryLimitMb: 64,
    allowedLanguages: [71],
    totalSubmissions: 120,
    acceptedSubmissions: 60,
    acceptanceRate: 50,
    solved: true,
    bookmarked: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    title: 'Graph Connectivity',
    slug: 'graph-connectivity',
    difficulty: 'hard',
    scope: 'public',
    tags: ['graphs'],
    timeLimitMs: 2000,
    memoryLimitMb: 128,
    allowedLanguages: [54],
    totalSubmissions: 40,
    acceptedSubmissions: 4,
    acceptanceRate: 10,
    solved: false,
    bookmarked: true,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProblemsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clear();
});

describe('ProblemsPage', () => {
  it('renders the problem list from the API', async () => {
    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 2 } } as any);

    renderPage();

    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Graph Connectivity')).toBeInTheDocument();
    expect(screen.getAllByText('arrays').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Solved').length).toBeGreaterThan(0);
    expect(screen.getByText('50% acceptance')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument();
  });

  it('links general students to problem solving inside the learner dashboard', async () => {
    useAuthStore.getState().setUser({
      id: 'general-1',
      name: 'General Student',
      email: 'general@example.com',
      role: 'general_student',
      tenantId: null,
    });
    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 2 } } as any);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ProblemsPage embedded />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Two Sum' })).toHaveAttribute(
      'href',
      '/dashboard/problems/p1/solve'
    );
    expect(document.querySelector('main')).not.toBeInTheDocument();
  });

  it('links institution students to problem solving inside the institution workspace', async () => {
    useAuthStore.getState().setUser({
      id: 'institution-1',
      name: 'Institution Student',
      email: 'student@example.com',
      role: 'institution_student',
      tenantId: 'tenant-1',
    });
    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 2 } } as any);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ProblemsPage embedded />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Two Sum' })).toHaveAttribute(
      'href',
      '/demo-college/problems/p1/solve'
    );
  });

  it('renders pagination when results span multiple pages', async () => {
    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 45 } } as any);

    renderPage();

    expect(await screen.findByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('toggles the difficulty filter', async () => {
    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 2 } } as any);

    renderPage();
    await screen.findByText('Two Sum');

    const easyFilter = screen.getByRole('button', { name: 'Easy' });
    expect(easyFilter).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(easyFilter);
    expect(easyFilter).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the empty state when no problems match', async () => {
    mockedList.mockResolvedValue({ data: { success: true, data: [], total: 0 } } as any);

    renderPage();

    expect(await screen.findByText('No matching problems')).toBeInTheDocument();
  });

  it('shows an error state with a retry action', async () => {
    mockedList.mockRejectedValue(new Error('Network Error'));

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Problems couldn’t be loaded');
    expect(screen.getByText('Network Error')).toBeInTheDocument();

    mockedList.mockResolvedValue({ data: { success: true, data: FIXTURE_PROBLEMS, total: 2 } } as any);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });
  });
});
