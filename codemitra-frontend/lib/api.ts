import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import {
  ApiResponse,
  Problem,
  BlogPost,
  BlogListParams,
  BlogListResponse,
  BlogPostDetailResponse,
  BlogCategory,
  BlogTag,
  NewsletterSubscription,
  Course,
  CourseDetail,
  CourseListParams,
  CourseStats,
  CourseProgressSummary,
  ChapterProgress,
  EnrollmentRecord,
  EnrolledCourse,
} from '@/types';
import { useAuthStore } from '@/store/authStore';
import { camelCaseKeys } from '@/lib/case';

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

// PostgreSQL returns snake_case column names; frontend models use camelCase.
api.interceptors.response.use((response) => {
  response.data = camelCaseKeys(response.data);
  return response;
});

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;

    const requestUrl = String(original?.url || '');
    const isAuthRequest = /\/auth\/(login|refresh)$/.test(requestUrl);
    if (error.response?.status === 401 && !original?._retry && !isAuthRequest) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then(({ data }) => {
            const token = data.data.accessToken as string;
            setAccessToken(token);
            return token;
          })
          .catch((refreshError) => {
            setAccessToken(null);
            if (typeof window !== 'undefined') {
              useAuthStore.getState().clear();
              const path = window.location.pathname;
              const isPublicPage = path === '/' || path === '/problems' || path.startsWith('/blog') ||
                path === '/login' || path === '/register' || path === '/forgot-password';
              if (!isPublicPage) window.location.href = '/login';
            }
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        return Promise.reject(error);
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
  current: () =>
    api.get<ApiResponse<{ id: string; name: string; slug: string }>>('/tenants/me'),

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

  delete: (id: string) => api.delete(`/tenants/${id}`),
};

// ── USER API ──
export interface UserListApiResponse {
  success: boolean;
  data: Array<Record<string, unknown>>;
  total: number;
}

export const userApi = {
  list: (params?: any) =>
    api.get<UserListApiResponse>('/users', { params }),

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

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/users/${id}`),
};

// ── COURSE API ──
export interface CourseListApiResponse {
  success: boolean;
  data: Course[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const courseApi = {
  /**
   * Catalog listing. Pass `limit` for server-side pagination
   * (response includes `meta`); omit it to receive every course.
   */
  list: (params?: CourseListParams) =>
    api.get<CourseListApiResponse>('/courses', { params }),

  manage: (params?: CourseListParams) =>
    api.get<CourseListApiResponse>('/courses/manage', { params }),

  get: (id: string) => api.get<ApiResponse<CourseDetail>>(`/courses/${id}`),

  featured: (limit = 3) =>
    api.get<ApiResponse<Course[]>>('/courses/featured', {
      params: { limit },
    }),

  stats: () => api.get<ApiResponse<CourseStats>>('/courses/stats'),

  myCourses: () => api.get<ApiResponse<EnrolledCourse[]>>('/courses/my-courses'),

  getEnrollment: (courseId: string) =>
    api.get<ApiResponse<EnrollmentRecord | null>>(
      `/courses/${courseId}/enrollment`
    ),

  enroll: (courseId: string) =>
    api.post<ApiResponse<EnrollmentRecord>>(`/courses/${courseId}/enroll`),

  getProgress: (courseId: string) =>
    api.get<ApiResponse<CourseProgressSummary>>(
      `/courses/${courseId}/progress`
    ),

  updateChapterProgress: (courseId: string, chapterId: string, isCompleted: boolean) =>
    api.post<ApiResponse<ChapterProgress>>(`/courses/${courseId}/progress`, {
      chapterId,
      isCompleted,
    }),

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
export interface ProblemListParams {
  scope?: 'public' | 'institution' | 'all';
  difficulty?: string;
  tags?: string[];
  search?: string;
  status?: 'solved' | 'unsolved';
  bookmarked?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ProblemListApiResponse {
  success: true;
  data: Problem[];
  total: number;
}

export const problemApi = {
  // The backend expects `tags` as a comma-separated string and
  // validates it with z.string(); Axios would otherwise serialize
  // the array as repeated `tags[]=` keys, which the schema rejects.
  list: (params?: ProblemListParams) =>
    api.get<ProblemListApiResponse>('/problems', {
      params: params
        ? { ...params, tags: params.tags?.join(',') }
        : params,
    }),

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

  bookmarks: (params?: { page?: number; limit?: number }) =>
    api.get<ProblemListApiResponse>('/problems/bookmarks', { params }),

  checkBookmark: (problemId: string) =>
    api.get<ApiResponse<{ bookmarked: boolean }>>(`/problems/${problemId}/bookmark`),

  addBookmark: (problemId: string) =>
    api.put<ApiResponse<{ bookmarked: boolean }>>(`/problems/${problemId}/bookmark`),

  removeBookmark: (problemId: string) =>
    api.delete<ApiResponse<{ bookmarked: boolean }>>(`/problems/${problemId}/bookmark`),

  updateTestCase: (testCaseId: string, data: any) => api.patch(`/test-cases/${testCaseId}`, data),
  deleteTestCase: (testCaseId: string) => api.delete(`/test-cases/${testCaseId}`),
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

  delete: (id: string) => api.delete(`/quizzes/${id}`),
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
  list: (params?: BlogListParams) =>
    api.get<BlogListResponse>('/blog', { params }),

  getBySlug: (slug: string) =>
    api.get<BlogPostDetailResponse>(`/blog/slug/${slug}`),

  get: (id: string) =>
    api.get<ApiResponse<BlogPost>>(`/blog/${id}`),

  featured: () =>
    api.get<ApiResponse<BlogPost | null>>('/blog/featured'),

  related: (slug: string, limit = 3) =>
    api.get<ApiResponse<BlogPost[]>>(`/blog/related/${slug}`, {
      params: { limit },
    }),

  categories: () =>
    api.get<ApiResponse<BlogCategory[]>>('/blog/categories'),

  tags: () =>
    api.get<ApiResponse<BlogTag[]>>('/blog/tags'),

  bookmarks: (params?: { page?: number; limit?: number }) =>
    api.get<BlogListResponse>('/blog/bookmarks', { params }),

  checkBookmark: (postId: string) =>
    api.get<ApiResponse<{ bookmarked: boolean }>>(`/blog/${postId}/bookmark`),

  addBookmark: (postId: string) =>
    api.put<ApiResponse<{ bookmarked: boolean }>>(`/blog/${postId}/bookmark`),

  removeBookmark: (postId: string) =>
    api.delete<ApiResponse<{ bookmarked: boolean }>>(`/blog/${postId}/bookmark`),

  create: (data: any) =>
    api.post<ApiResponse<BlogPost>>('/blog', data),

  update: (id: string, data: any) =>
    api.patch<ApiResponse<BlogPost>>(`/blog/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/blog/${id}`),
};

// ── NEWSLETTER API ──
export const newsletterApi = {
  subscribe: (email: string, name?: string) =>
    api.post<ApiResponse<NewsletterSubscription>>('/newsletter/subscribe', {
      email,
      name,
    }),

  unsubscribe: (email: string) =>
    api.post<ApiResponse<NewsletterSubscription | { message: string }>>(
      '/newsletter/unsubscribe',
      { email }
    ),
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

export const announcementApi = {
  create: (data: { title: string; content: string; isPinned?: boolean }) =>
    api.post<ApiResponse<any>>('/announcements', data),
};

// Error handling utility
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'An error occurred';
  }
  return error?.message || 'An error occurred';
}
