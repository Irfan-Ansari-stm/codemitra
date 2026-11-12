import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import type {
  CourseListParams,
  CourseListResponse,
  CourseProgressSummary,
  ChapterProgress,
  EnrolledCourse,
} from '@/types';

/**
 * Builds a stable query parameter object with a fixed key order so
 * TanStack Query produces stable cache keys for identical filter states.
 * Neutral values are dropped so the cache key only reflects active filters.
 */
export function buildCourseParams(
  input: CourseListParams
): CourseListParams {
  const params: CourseListParams = {};
  if (input.search) params.search = input.search;
  if (input.language) params.language = input.language;
  if (input.status) params.status = input.status;
  if (input.sort) params.sort = input.sort;
  if (input.order) params.order = input.order;
  params.page = input.page || 1;
  if (input.limit) params.limit = input.limit;
  return params;
}

/**
 * Paginated course catalog. When `limit` is set the API returns a
 * `meta` block; otherwise it returns the full list (total = length).
 */
export function useCourseCatalog(params: CourseListParams, enabled = true) {
  return useQuery<CourseListResponse>({
    queryKey: ['courses', 'catalog', params],
    queryFn: () =>
      courseApi.list(params).then((response) => {
        const { data, meta } = response.data;
        return {
          courses: data ?? [],
          total: meta ? meta.total : (data ?? []).length,
          page: meta ? meta.page : 1,
          limit: meta ? meta.limit : (data ?? []).length,
          totalPages: meta ? meta.totalPages : 1,
        };
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
      enabled,
  });
}

export function useCourseDetail(courseId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.get(courseId!).then((r) => r.data.data),
    enabled: !!courseId && enabled,
  });
}

export function useFeaturedCourses(limit = 3, enabled = true) {
  return useQuery({
    queryKey: ['courses', 'featured', limit],
    queryFn: () =>
      courseApi.featured(limit).then((r) => r.data.data ?? []),
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

export function useCourseStats(enabled = true) {
  return useQuery({
    queryKey: ['courses', 'stats'],
    queryFn: () => courseApi.stats().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ['courses', 'my-courses'],
    queryFn: () =>
      courseApi.myCourses().then((r) => (r.data.data ?? []) as EnrolledCourse[]),
    staleTime: 30_000,
  });
}

export function useEnrollment(courseId: string | null) {
  return useQuery({
    queryKey: ['course', courseId, 'enrollment'],
    queryFn: () =>
      courseApi.getEnrollment(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useEnroll(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => courseApi.enroll(courseId),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ['course', courseId, 'enrollment'],
        response.data
      );
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCourseProgress(courseId: string | null) {
  return useQuery<CourseProgressSummary>({
    queryKey: ['course', courseId, 'progress'],
    queryFn: () =>
      courseApi.getProgress(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useUpdateChapterProgress(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      isCompleted,
    }: {
      chapterId: string;
      isCompleted: boolean;
    }) =>
      courseApi.updateChapterProgress(courseId, chapterId, isCompleted),
    onSuccess: (response: { data: { data: ChapterProgress } }) => {
      const { chapterId, isCompleted } = response.data.data;
      // Update the cached course detail so curriculum checkboxes
      // reflect the new completion state immediately.
      queryClient.setQueriesData(
        { queryKey: ['course', courseId] },
        (old: any) => {
          if (!old?.data?.modules) return old;
          return {
            ...old,
            data: {
              ...old.data,
              modules: old.data.modules.map((module: any) => ({
                ...module,
                chapters: (module.chapters ?? []).map((chapter: any) =>
                  chapter.id === chapterId
                    ? { ...chapter, isCompleted }
                    : chapter
                ),
              })),
            },
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['course', courseId, 'progress'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'my-courses'] });
    },
  });
}

export function useCourses(params?: any) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.list(params).then((r) => r.data.data),
  });
}

export function useCourse(courseId: string | null) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.get(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourse(courseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.update(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseApi.delete(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Modules
export function useModules(courseId: string | null) {
  return useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => courseApi.getModules(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });
}

export function useCreateModule(courseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.createModule(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', courseId] });
    },
  });
}

export function useUpdateModule(moduleId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.updateModule(moduleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}

export function useReorderModules(courseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (order: any[]) => courseApi.reorderModules(courseId, order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', courseId] });
    },
  });
}

export function useDeleteModule(courseId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => courseApi.deleteModule(moduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', courseId] });
    },
  });
}

// Chapters
export function useChapters(moduleId: string | null) {
  return useQuery({
    queryKey: ['chapters', moduleId],
    queryFn: () => courseApi.getChapters(moduleId!).then((r) => r.data.data),
    enabled: !!moduleId,
  });
}

export function useChapter(chapterId: string | null) {
  return useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => courseApi.getChapter(chapterId!).then((r) => r.data.data),
    enabled: !!chapterId,
  });
}

export function useCreateChapter(moduleId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.createChapter(moduleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapters', moduleId] });
    },
  });
}

export function useUpdateChapter(chapterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => courseApi.updateChapter(chapterId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chapter', chapterId] });
      qc.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
}

export function useDeleteChapter(moduleId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (chapterId: string) => courseApi.deleteChapter(chapterId),
    onSuccess: () => {
      if (moduleId) {
        qc.invalidateQueries({ queryKey: ['chapters', moduleId] });
      }
    },
  });
}
