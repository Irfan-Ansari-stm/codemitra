import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionProblemActions } from '@/components/problems/InstitutionProblemActions';
import { problemApi } from '@/lib/api';
import type { Problem } from '@/types';

vi.mock('@/lib/api', () => ({
  getErrorMessage: (error: Error) => error.message,
  problemApi: {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const sampleProblem: Problem = {
  id: 'problem-1',
  tenantId: 'tenant-1',
  title: 'Array sum',
  slug: 'array-sum',
  statement: 'Calculate and return the sum of two integers.',
  difficulty: 'easy',
  scope: 'institution',
  tags: ['arrays'],
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  allowedLanguages: [71],
  totalSubmissions: 0,
  acceptedSubmissions: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderActions(problem?: Problem) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <InstitutionProblemActions problem={problem} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(problemApi.create).mockResolvedValue({} as never);
  vi.mocked(problemApi.get).mockResolvedValue({
    data: { data: sampleProblem },
  } as never);
  vi.mocked(problemApi.update).mockResolvedValue({} as never);
  vi.mocked(problemApi.delete).mockResolvedValue({} as never);
});

describe('InstitutionProblemActions', () => {
  it('creates an institution-scoped problem', async () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: 'Add problem' }));

    fireEvent.change(screen.getByLabelText('Problem title'), { target: { value: 'Two number sum' } });
    fireEvent.change(screen.getByLabelText('Problem statement'), { target: { value: 'Read two integers and print their sum.' } });
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'arrays, math' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create problem' }));

    await waitFor(() => expect(problemApi.create).toHaveBeenCalledWith({
      title: 'Two number sum',
      statement: 'Read two integers and print their sum.',
      difficulty: 'easy',
      scope: 'institution',
      tags: ['arrays', 'math'],
    }));
  });

  it('loads and updates the selected institution problem', async () => {
    renderActions(sampleProblem);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Array sum' }));

    fireEvent.change(await screen.findByLabelText('Problem title'), { target: { value: 'Updated array sum' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(problemApi.update).toHaveBeenCalledWith('problem-1', {
      title: 'Updated array sum',
      statement: sampleProblem.statement,
      difficulty: 'easy',
      scope: 'institution',
      tags: ['arrays'],
    }));
  });

  it('deletes the selected problem after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderActions(sampleProblem);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Array sum' }));

    await waitFor(() => expect(problemApi.delete).toHaveBeenCalledWith('problem-1'));
  });
});
