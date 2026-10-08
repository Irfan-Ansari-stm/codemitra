import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

export function useAnalyticsOverview(tenantId?: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', tenantId],
    queryFn: () => analyticsApi.overview(tenantId).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHeatmap(days = 90) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', days],
    queryFn: () => analyticsApi.heatmap(days).then((r) => r.data.data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: () => analyticsApi.leaderboard().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCourseCompletion(courseId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'courseCompletion', courseId],
    queryFn: () => analyticsApi.courseCompletion(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStudentProgress(studentId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'studentProgress', studentId],
    queryFn: () => analyticsApi.studentProgress(studentId!).then((r) => r.data.data),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProblemStats(problemId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'problemStats', problemId],
    queryFn: () => analyticsApi.problemStats(problemId!).then((r) => r.data.data),
    enabled: !!problemId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useLanguageStats(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'languages', days],
    queryFn: () => analyticsApi.languages(days).then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useDifficultyDistribution() {
  return useQuery({
    queryKey: ['analytics', 'difficultyDistribution'],
    queryFn: () => analyticsApi.difficultyDistribution().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlatformOverview() {
  return useQuery({
    queryKey: ['analytics', 'platformOverview'],
    queryFn: () => analyticsApi.platformOverview().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });
}
