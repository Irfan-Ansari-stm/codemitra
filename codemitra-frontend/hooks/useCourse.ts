import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';

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
