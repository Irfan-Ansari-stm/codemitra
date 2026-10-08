import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '@/lib/api';

export function useProblems(params?: any) {
  return useQuery({
    queryKey: ['problems', params],
    queryFn: () => problemApi.list(params).then((r) => r.data.data),
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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
