import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { problemApi, type ProblemListParams } from '@/lib/api';
import type { ProblemListResponse, ProblemStatusFilter } from '@/types';

/**
 * Builds a stable query parameter object with a fixed key order so
 * TanStack Query produces stable cache keys for identical filter states.
 * UI-level filters may carry the neutral 'all' value, which is dropped here.
 */
export function buildProblemParams(
  input: Omit<ProblemListParams, 'status'> & { status?: ProblemStatusFilter }
): ProblemListParams {
  const params: ProblemListParams = {};
  if (input.scope) params.scope = input.scope;
  if (input.difficulty && input.difficulty !== 'all') params.difficulty = input.difficulty;
  if (input.tags && input.tags.length) params.tags = input.tags;
  if (input.search) params.search = input.search;
  if (input.status && input.status !== 'all') params.status = input.status;
  if (input.bookmarked) params.bookmarked = true;
  if (input.sort) params.sort = input.sort;
  if (input.order) params.order = input.order;
  params.page = input.page || 1;
  params.limit = input.limit || 20;
  return params;
}

export function useProblems(params: ProblemListParams) {
  return useQuery<ProblemListResponse>({
    queryKey: ['problems', params],
    queryFn: () =>
      problemApi.list(params).then((response) => ({
        problems: response.data.data,
        total: response.data.total,
      })),
    // Keep the previous page's data while fetching the next page/ filter change.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProblemBookmarks(params: { page?: number; limit?: number } = {}) {
  return useQuery<ProblemListResponse>({
    queryKey: ['problem-bookmarks', params],
    queryFn: () =>
      problemApi.bookmarks(params).then((response) => ({
        problems: response.data.data,
        total: response.data.total,
      })),
    staleTime: 30_000,
  });
}

export function useBookmarkProblem(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmark: boolean) =>
      bookmark
        ? problemApi.addBookmark(problemId)
        : problemApi.removeBookmark(problemId),
    onMutate: async (bookmark) => {
      // Cancel in-flight list requests before applying the optimistic update.
      await queryClient.cancelQueries({ queryKey: ['problems'] });
      const previousQueries = queryClient.getQueriesData<ProblemListResponse>({
        queryKey: ['problems'],
      });
      queryClient.setQueriesData<ProblemListResponse>(
        { queryKey: ['problems'] },
        (old) => {
          if (!old || !('problems' in old)) return old;
          return {
            ...old,
            problems: old.problems.map((problem) =>
              problem.id === problemId ? { ...problem, bookmarked: bookmark } : problem
            ),
          };
        }
      );
      return previousQueries;
    },
    onError: (_error, _variables, snapshots) => {
      // Roll back every affected list cache entry on failure.
      snapshots?.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['problem-bookmarks'] });
    },
  });
}

export function useProblem(problemId: string | null) {
  return useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => problemApi.get(problemId!).then((r) => r.data.data),
    enabled: !!problemId,
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => problemApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useUpdateProblem(problemId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => problemApi.update(problemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problem', problemId] });
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => problemApi.delete(problemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}

export function useTestCases(problemId: string | null) {
  return useQuery({
    queryKey: ['testCases', problemId],
    queryFn: () => problemApi.getTestCases(problemId!).then((r) => r.data.data),
    enabled: !!problemId,
  });
}

export function useAddTestCase(problemId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => problemApi.addTestCase(problemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testCases', problemId] });
    },
  });
}

export function useProblemStats(problemId: string | null) {
  return useQuery({
    queryKey: ['problemStats', problemId],
    queryFn: () => problemApi.getStats(problemId!).then((r) => r.data.data),
    enabled: !!problemId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProblems() {
  return useQuery({
    queryKey: ['problems', 'featured'],
    queryFn: () =>
      problemApi.list({ difficulty: 'easy', limit: 10 }).then((r) => r.data.data),
  });
}

export function useUserEasyProblems() {
  return useQuery({
    queryKey: ['problems', 'easy'],
    queryFn: () =>
      problemApi.list({ difficulty: 'easy', limit: 50 }).then((r) => r.data.data),
  });
}

export function useUserMediumProblems() {
  return useQuery({
    queryKey: ['problems', 'medium'],
    queryFn: () =>
      problemApi.list({ difficulty: 'medium', limit: 50 }).then((r) => r.data.data),
  });
}

export function useUserHardProblems() {
  return useQuery({
    queryKey: ['problems', 'hard'],
    queryFn: () =>
      problemApi.list({ difficulty: 'hard', limit: 50 }).then((r) => r.data.data),
  });
}
