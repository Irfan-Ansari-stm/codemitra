import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        accessToken = null;
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── AUTH API ──
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken?: string; user: any }>>(
      '/auth/login',
      { email, password }
    ),

  register: (email: string, password: string, name: string) =>
    api.post<ApiResponse<any>>('/auth/register', { email, password, name }),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {}),

  logout: () => api.post('/auth/logout', {}),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  getProfile: () =>
    api.get<ApiResponse<any>>('/users/me'),

  updateProfile: (data: any) =>
    api.patch<ApiResponse<any>>('/users/me', data),
};

// ── TENANT API ──
export const tenantApi = {
  list: (page = 1, limit = 20) =>
    api.get<ApiResponse<any[]>>(`/tenants?page=${page}&limit=${limit}`),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/tenants/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/tenants', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/tenants/${id}`, data),

  quota: (id: string) =>
    api.get(`/tenants/${id}/quota`),
};

// ── USER API ──
export const userApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/users', { params }),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/users/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/users', data),

  bulkImport: (formData: FormData) =>
    api.post<ApiResponse<any>>('/users/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/users/${id}`, data),

  resetPassword: (id: string, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }),
};

// ── COURSE API ──
export const courseApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/courses', { params }),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/courses/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/courses', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/courses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/courses/${id}`),

  // Modules
  getModules: (courseId: string) =>
    api.get<ApiResponse<any[]>>(`/courses/${courseId}/modules`),

  createModule: (courseId: string, data: any) =>
    api.post<ApiResponse<any>>(`/courses/${courseId}/modules`, data),

  updateModule: (moduleId: string, data: any) =>
    api.patch<ApiResponse<any>>(`/modules/${moduleId}`, data),

  reorderModules: (courseId: string, order: any[]) =>
    api.patch(`/modules/reorder`, { courseId, order }),

  deleteModule: (moduleId: string) =>
    api.delete(`/modules/${moduleId}`),

  // Chapters
  getChapters: (moduleId: string) =>
    api.get<ApiResponse<any[]>>(`/modules/${moduleId}/chapters`),

  getChapter: (chapterId: string) =>
    api.get<ApiResponse<any>>(`/chapters/${chapterId}`),

  createChapter: (moduleId: string, data: any) =>
    api.post<ApiResponse<any>>(`/modules/${moduleId}/chapters`, data),

  updateChapter: (chapterId: string, data: any) =>
    api.patch<ApiResponse<any>>(`/chapters/${chapterId}`, data),

  deleteChapter: (chapterId: string) =>
    api.delete(`/chapters/${chapterId}`),
};

// ── PROBLEM API ──
export const problemApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/problems', { params }),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/problems/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/problems', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/problems/${id}`, data),

  delete: (id: string) =>
    api.delete(`/problems/${id}`),

  getTestCases: (problemId: string) =>
    api.get<ApiResponse<any[]>>(`/problems/${problemId}/test-cases`),

  addTestCase: (problemId: string, data: any) =>
    api.post<ApiResponse<any>>(`/problems/${problemId}/test-cases`, data),

  getStats: (problemId: string) =>
    api.get(`/problems/${problemId}/stats`),
};

// ── SUBMISSION API ──
export const submissionApi = {
  submit: (data: any) =>
    api.post<ApiResponse<any>>('/submissions', data),

  run: (data: any) =>
    api.post<ApiResponse<any>>('/submissions/run', data),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/submissions/${id}`),

  history: (problemId: string) =>
    api.get<ApiResponse<any[]>>(`/submissions/problem/${problemId}`),

  all: (params?: any) =>
    api.get<ApiResponse<any[]>>('/submissions', { params }),
};

// ── ASSIGNMENT API ──
export const assignmentApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/assignments', { params }),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/assignments/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/assignments', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/assignments/${id}`, data),

  delete: (id: string) =>
    api.delete(`/assignments/${id}`),

  submit: (id: string) =>
    api.post(`/assignments/${id}/submit`, {}),

  submissions: (id: string) =>
    api.get<ApiResponse<any[]>>(`/assignments/${id}/submissions`),

  gradeSubmission: (submissionId: string, data: any) =>
    api.patch(`/assignment-submissions/${submissionId}/grade`, data),
};

// ── QUIZ API ──
export const quizApi = {
  list: () =>
    api.get<ApiResponse<any[]>>('/quizzes'),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/quizzes/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/quizzes', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/quizzes/${id}`, data),

  startAttempt: (quizId: string) =>
    api.post(`/quizzes/${quizId}/attempt`, {}),

  submitAnswers: (attemptId: string, data: any) =>
    api.post(`/quiz-attempts/${attemptId}/submit`, data),
};

// ── ANALYTICS API ──
export const analyticsApi = {
  overview: (tenantId?: string) =>
    api.get<ApiResponse<any>>('/analytics/overview', { params: { tenantId } }),

  heatmap: (days = 90) =>
    api.get<ApiResponse<any[]>>('/analytics/heatmap', { params: { days } }),

  leaderboard: () =>
    api.get<ApiResponse<any[]>>('/analytics/leaderboard'),

  courseCompletion: (courseId: string) =>
    api.get<ApiResponse<any>>(`/analytics/courses/${courseId}/completion`),

  studentProgress: (studentId: string) =>
    api.get<ApiResponse<any>>(`/analytics/students/${studentId}/progress`),

  problemStats: (problemId: string) =>
    api.get<ApiResponse<any>>(`/analytics/problems/${problemId}/stats`),

  languages: (days = 30) =>
    api.get<ApiResponse<any>>('/analytics/languages', { params: { days } }),

  difficultyDistribution: () =>
    api.get<ApiResponse<any>>('/analytics/difficulty-distribution'),

  platformOverview: () =>
    api.get<ApiResponse<any>>('/analytics/platform/overview'),
};

// ── BLOG API ──
export const blogApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/blog', { params }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<any>>(`/blog/slug/${slug}`),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/blog/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/blog', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/blog/${id}`, data),

  delete: (id: string) =>
    api.delete(`/blog/${id}`),

  categories: () =>
    api.get<ApiResponse<any[]>>('/blog/categories'),
};

// ── NOTIFICATION API ──
export const notificationApi = {
  list: (params?: any) =>
    api.get<ApiResponse<any[]>>('/notifications', { params }),

  markRead: (ids?: string[]) =>
    api.patch('/notifications/mark-read', ids ? { ids } : {}),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};

// Error handling utility
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'An error occurred';
  }
  return error?.message || 'An error occurred';
}
