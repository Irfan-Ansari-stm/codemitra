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

// ── PLATFORM API (Super Admin, Institute Admin, Students) ──
export const instituteApplicationApi = {
  create: (data: { institutionName: string; contactEmail: string; contactPhone?: string; websiteUrl?: string; address?: string }) =>
    api.post<ApiResponse<any>>('/tenants/applications', data),
  submit: (data: any) =>
    api.post<ApiResponse<any>>('/institute-applications', data),
  list: (statusOrPage?: string | number, pageOrLimit: number = 20, maybeStatus?: 'pending' | 'approved' | 'rejected') => {
    if (typeof statusOrPage === 'string') {
      return api.get<ApiResponse<any>>('/super-admin/institute-applications', {
        params: { status: statusOrPage, page: pageOrLimit, limit: maybeStatus || 20 },
      });
    }
    return api.get<ApiResponse<any[]>>('/tenants/applications', {
      params: { page: statusOrPage || 1, limit: pageOrLimit, status: maybeStatus },
    });
  },
  review: (id: string, decision: 'approved' | 'rejected', reviewNote?: string) =>
    api.patch<ApiResponse<any>>(`/tenants/applications/${id}`, { decision, reviewNote }),
  approve: (id: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institute-applications/${id}/approve`, { reviewNote }),
  reject: (id: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institute-applications/${id}/reject`, { reviewNote }),
  requestInfo: (id: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institute-applications/${id}/request-info`, { reviewNote }),
};

export const instituteApi = {
  list: (page = 1, limit = 20, search?: string) =>
    api.get<ApiResponse<any>>('/super-admin/institutes', { params: { page, limit, search } }),
  get: (id: string) =>
    api.get<ApiResponse<any>>(`/super-admin/institutes/${id}`),
  update: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/super-admin/institutes/${id}`, data),
  suspend: (id: string, reason?: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institutes/${id}/suspend`, { reason }),
  reactivate: (id: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institutes/${id}/reactivate`),
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/super-admin/institutes/${id}`),
  inviteAdmin: (id: string, email: string) =>
    api.post<ApiResponse<any>>(`/super-admin/institutes/${id}/invite-admin`, { email }),
  // Institute-scoped
  getBranches: () => api.get<ApiResponse<any>>('/institution/branches'),
  createBranch: (data: any) => api.post<ApiResponse<any>>('/institution/branches', data),
  getDepartments: () => api.get<ApiResponse<any>>('/institution/departments'),
  createDepartment: (data: any) => api.post<ApiResponse<any>>('/institution/departments', data),
  getDocuments: () => api.get<ApiResponse<any>>('/institution/documents'),
  addDocument: (data: any) => api.post<ApiResponse<any>>('/institution/documents', data),
  getStaff: () => api.get<ApiResponse<any>>('/institution/staff'),
  assignStaff: (data: any) => api.post<ApiResponse<any>>('/institution/staff', data),
};

export const admissionApi = {
  apply: (instituteId: string, data: any) =>
    api.post<ApiResponse<any>>(`/institutions/${instituteId}/admissions`, data),
  list: (instituteId: string, status?: string, page = 1, limit = 20) =>
    api.get<ApiResponse<any>>(`/institutions/${instituteId}/admissions`, {
      params: { status, page, limit },
    }),
  approve: (instituteId: string, admissionId: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/institutions/${instituteId}/admissions/${admissionId}/approve`, { reviewNote }),
  reject: (instituteId: string, admissionId: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/institutions/${instituteId}/admissions/${admissionId}/reject`, { reviewNote }),
  requestInfo: (instituteId: string, admissionId: string, reviewNote?: string) =>
    api.post<ApiResponse<any>>(`/institutions/${instituteId}/admissions/${admissionId}/request-info`, { reviewNote }),
  myAdmissions: () => api.get<ApiResponse<any>>('/my/admissions'),
  withdraw: (id: string) => api.post<ApiResponse<any>>(`/my/admissions/${id}/withdraw`),
};

export const ticketApi = {
  list: (statusOrParams?: string | { status?: string; page?: number; limit?: number }, page = 1, limit = 20) => {
    if (typeof statusOrParams === 'object' && statusOrParams !== null) {
      return api.get<ApiResponse<any>>('/tickets', { params: statusOrParams });
    }
    return api.get<ApiResponse<any>>('/tickets', { params: { status: statusOrParams, page, limit } });
  },
  get: (id: string) => api.get<ApiResponse<any>>(`/tickets/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/tickets', data),
  update: (id: string, data: any) => api.patch<ApiResponse<any>>(`/tickets/${id}`, data),
  reply: (id: string, messageOrData: string | { message: string; isInternal?: boolean }, isInternal = false) => {
    if (typeof messageOrData === 'object' && messageOrData !== null) {
      return api.post<ApiResponse<any>>(`/tickets/${id}/reply`, messageOrData);
    }
    return api.post<ApiResponse<any>>(`/tickets/${id}/reply`, { message: messageOrData, isInternal });
  },
  delete: (id: string) => api.delete<ApiResponse<any>>(`/tickets/${id}`),
};

export const academicApi = {
  // Academic years
  getYears: () => api.get<ApiResponse<any>>('/academic/years'),
  createYear: (data: any) => api.post<ApiResponse<any>>('/academic/years', data),
  updateYear: (id: string, data: any) => api.patch<ApiResponse<any>>(`/academic/years/${id}`, data),
  deleteYear: (id: string) => api.delete<ApiResponse<any>>(`/academic/years/${id}`),
  // Semesters
  getSemesters: (academicYearId?: string) =>
    api.get<ApiResponse<any>>('/academic/semesters', { params: { academicYearId } }),
  createSemester: (data: any) => api.post<ApiResponse<any>>('/academic/semesters', data),
  updateSemester: (id: string, data: any) => api.patch<ApiResponse<any>>(`/academic/semesters/${id}`, data),
  deleteSemester: (id: string) => api.delete<ApiResponse<any>>(`/academic/semesters/${id}`),
  // Batches
  getBatches: () => api.get<ApiResponse<any>>('/academic/batches'),
  createBatch: (data: any) => api.post<ApiResponse<any>>('/academic/batches', data),
  updateBatch: (id: string, data: any) => api.patch<ApiResponse<any>>(`/academic/batches/${id}`, data),
  deleteBatch: (id: string) => api.delete<ApiResponse<any>>(`/academic/batches/${id}`),
  enrollStudent: (batchId: string, studentId: string) =>
    api.post<ApiResponse<any>>(`/academic/batches/${batchId}/enroll`, { studentId }),
  getBatchStudents: (batchId: string) => api.get<ApiResponse<any>>(`/academic/batches/${batchId}/students`),
  // Classes
  getClasses: (batchId?: string) => api.get<ApiResponse<any>>('/academic/classes', { params: { batchId } }),
  createClass: (data: any) => api.post<ApiResponse<any>>('/academic/classes', data),
  updateClass: (id: string, data: any) => api.patch<ApiResponse<any>>(`/academic/classes/${id}`, data),
  deleteClass: (id: string) => api.delete<ApiResponse<any>>(`/academic/classes/${id}`),
  // Attendance
  getAttendance: (params?: any) => api.get<ApiResponse<any>>('/academic/attendance', { params }),
  recordAttendance: (data: any) => api.post<ApiResponse<any>>('/academic/attendance', data),
  recordBulkAttendance: (data: any) => api.post<ApiResponse<any>>('/academic/attendance/bulk', data),
  getAttendanceSummary: (studentId: string) =>
    api.get<ApiResponse<any>>(`/academic/attendance/summary/${studentId}`),
  // Grades
  getGrades: (params?: any) => api.get<ApiResponse<any>>('/academic/grades', { params }),
  recordGrade: (data: any) => api.post<ApiResponse<any>>('/academic/grades', data),
  updateGrade: (id: string, data: any) => api.patch<ApiResponse<any>>(`/academic/grades/${id}`, data),
  deleteGrade: (id: string) => api.delete<ApiResponse<any>>(`/academic/grades/${id}`),
  getTranscript: (studentId: string) => api.get<ApiResponse<any>>(`/academic/grades/transcript/${studentId}`),
  // Timetable
  getTimetable: (classId?: string) => api.get<ApiResponse<any>>('/academic/timetable', { params: { classId } }),
  createTimetable: (data: any) => api.post<ApiResponse<any>>('/academic/timetable', data),
  deleteTimetable: (id: string) => api.delete<ApiResponse<any>>(`/academic/timetable/${id}`),
};

export const certificateApi = {
  list: (courseId?: string) =>
    api.get<ApiResponse<any>>('/certificates', { params: { courseId } }),
  get: (id: string) => api.get<ApiResponse<any>>(`/certificates/${id}`),
  issue: (data: any) => api.post<ApiResponse<any>>('/certificates', data),
  verify: (code: string) => api.get<ApiResponse<any>>(`/certificates/verify/${code}`),
  revoke: (id: string) => api.post<ApiResponse<any>>(`/certificates/${id}/revoke`),
  getCourseCompletion: (courseId: string, studentId: string) =>
    api.get<ApiResponse<any>>(`/certificates/completion/${courseId}/${studentId}`),
};

export const contentApi = {
  // Pages
  listPages: (status?: string, pageType?: string, page = 1, limit = 20) =>
    api.get<ApiResponse<any>>('/super-admin/content/pages', { params: { status, pageType, page, limit } }),
  createPage: (data: any) => api.post<ApiResponse<any>>('/super-admin/content/pages', data),
  updatePage: (id: string, data: any) => api.patch<ApiResponse<any>>(`/super-admin/content/pages/${id}`, data),
  deletePage: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/content/pages/${id}`),
  getPageBySlug: (slug: string) => api.get<ApiResponse<any>>(`/content/pages/${slug}`),
  // Banners
  listBanners: (page = 1, limit = 20) =>
    api.get<ApiResponse<any>>('/super-admin/content/banners', { params: { page, limit } }),
  createBanner: (data: any) => api.post<ApiResponse<any>>('/super-admin/content/banners', data),
  updateBanner: (id: string, data: any) => api.patch<ApiResponse<any>>(`/super-admin/content/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/content/banners/${id}`),
  getActiveBanners: () => api.get<ApiResponse<any>>('/content/banners'),
  // FAQs
  listFaqs: () => api.get<ApiResponse<any>>('/super-admin/content/faqs'),
  createFaq: (data: any) => api.post<ApiResponse<any>>('/super-admin/content/faqs', data),
  updateFaq: (id: string, data: any) => api.patch<ApiResponse<any>>(`/super-admin/content/faqs/${id}`, data),
  deleteFaq: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/content/faqs/${id}`),
  getPublicFaqs: () => api.get<ApiResponse<any>>('/content/faqs'),
  // Help center
  listHelpArticles: () => api.get<ApiResponse<any>>('/super-admin/help-center'),
  createHelpArticle: (data: any) => api.post<ApiResponse<any>>('/super-admin/help-center', data),
  updateHelpArticle: (id: string, data: any) => api.patch<ApiResponse<any>>(`/super-admin/help-center/${id}`, data),
  deleteHelpArticle: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/help-center/${id}`),
  getPublicHelpArticles: () => api.get<ApiResponse<any>>('/help-center'),
  getHelpArticleBySlug: (slug: string) => api.get<ApiResponse<any>>(`/help-center/${slug}`),
  // Media
  listMedia: (page = 1, limit = 20) =>
    api.get<ApiResponse<any>>('/super-admin/files', { params: { page, limit } }),
  uploadMedia: (data: any) => api.post<ApiResponse<any>>('/super-admin/files', data),
  deleteMedia: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/files/${id}`),
};

export const configurationApi = {
  getAll: () => api.get<ApiResponse<any>>('/super-admin/configuration'),
  getByKey: (key: string) => api.get<ApiResponse<any>>(`/super-admin/configuration/${key}`),
  update: (key: string, value: any) =>
    api.put<ApiResponse<any>>(`/super-admin/configuration/${key}`, { value }),
  updateBulk: (configs: any) => api.put<ApiResponse<any>>('/super-admin/configuration', configs),
  getHistory: (page = 1, limit = 50) =>
    api.get<ApiResponse<any>>('/super-admin/configuration/history', { params: { page, limit } }),
  getFeatureFlags: () => api.get<ApiResponse<any>>('/super-admin/feature-flags'),
  updateFeatureFlag: (key: string, data: any) =>
    api.patch<ApiResponse<any>>(`/super-admin/feature-flags/${key}`, data),
};

export const seoApi = {
  getSettings: () => api.get<ApiResponse<any>>('/super-admin/seo/settings'),
  updateSettings: (data: any) => api.put<ApiResponse<any>>('/super-admin/seo/settings', data),
  getEntityMetadata: (entityType: string, entityId: string) =>
    api.get<ApiResponse<any>>(`/super-admin/seo/metadata/${entityType}/${entityId}`),
  setEntityMetadata: (entityType: string, entityId: string, data: any) =>
    api.put<ApiResponse<any>>(`/super-admin/seo/metadata/${entityType}/${entityId}`, data),
  getRedirects: (page = 1, limit = 20) =>
    api.get<ApiResponse<any>>('/super-admin/seo/redirects', { params: { page, limit } }),
  createRedirect: (data: any) => api.post<ApiResponse<any>>('/super-admin/seo/redirects', data),
  deleteRedirect: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/seo/redirects/${id}`),
  generateSitemap: () => api.get<ApiResponse<any>>('/super-admin/seo/sitemap'),
};

export const logsApi = {
  getAuditLogs: (params?: any) => api.get<ApiResponse<any>>('/super-admin/logs/audit', { params }),
  getApplicationLogs: (params?: any) => api.get<ApiResponse<any>>('/super-admin/logs/application', { params }),
  getActivityEvents: (params?: any) => api.get<ApiResponse<any>>('/super-admin/logs/activity', { params }),
  getAuthLogs: (params?: any) => api.get<ApiResponse<any>>('/super-admin/logs/auth', { params }),
};

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

  updateTestCase: (testCaseId: string, data: any) => api.patch(`/problems/test-cases/${testCaseId}`, data),
  deleteTestCase: (testCaseId: string) => api.delete(`/problems/test-cases/${testCaseId}`),
  seed: () => api.post<ApiResponse<any>>('/problems/seed'),
  bulkImport: (problems: any[]) => api.post<ApiResponse<any>>('/problems/bulk-import', { problems }),
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

  problemSubmissions: (problemId: string, page = 1, limit = 50) =>
    api.get<ApiResponse<any[]>>(`/submissions/problem/${problemId}/all`, { params: { page, limit } }),

  all: (params?: any) =>
    api.get<ApiResponse<any[]>>('/submissions', { params }),
};

// ── EXECUTION API (WASM & Judge0 Router) ──
export const executionApi = {
  run: (data: {
    language: string | number;
    sourceCode: string;
    stdin?: string;
    engine?: 'auto' | 'wasm' | 'judge0';
    problemId?: string;
  }) => api.post<ApiResponse<any>>('/execution/run', data),

  getCapabilities: () =>
    api.get<ApiResponse<any>>('/execution/capabilities'),
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

  institutionDashboard: (tenantId?: string) =>
    api.get<ApiResponse<any>>('/analytics/institution/dashboard', { params: { tenantId } }),

  studentDashboard: () =>
    api.get<ApiResponse<any>>('/analytics/student/dashboard'),
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

// ── SUPER ADMIN EXTENDED APIS ──
export const superAdminStudentsApi = {
  list: (params?: { search?: string; tenantId?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<any>>('/super-admin/students', { params }),
  verify: (id: string, isVerified: boolean) =>
    api.post<ApiResponse<any>>(`/super-admin/students/${id}/verify`, { isVerified }),
  export: (tenantId?: string) =>
    api.get<ApiResponse<any[]>>('/super-admin/students/export', { params: { tenantId } }),
};

export const superAdminApprovalsApi = {
  get: () => api.get<ApiResponse<any>>('/super-admin/approvals'),
};

export const superAdminSecurityApi = {
  overview: () => api.get<ApiResponse<any>>('/super-admin/security/overview'),
  revokeSession: (id: string) => api.post<ApiResponse<any>>(`/super-admin/security/sessions/${id}/revoke`),
  unlockUser: (id: string) => api.post<ApiResponse<any>>(`/super-admin/security/users/${id}/unlock`),
};

export const superAdminBillingApi = {
  overview: () => api.get<ApiResponse<any>>('/super-admin/billing/overview'),
  updatePlan: (tenantId: string, data: { plan: string; maxStudents: number }) =>
    api.patch<ApiResponse<any>>(`/super-admin/billing/institutes/${tenantId}`, data),
};

export const superAdminIncidentsApi = {
  list: (params?: { status?: string; severity?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<any>>('/super-admin/incidents', { params }),
  create: (data: any) => api.post<ApiResponse<any>>('/super-admin/incidents', data),
  update: (id: string, data: any) => api.patch<ApiResponse<any>>(`/super-admin/incidents/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/incidents/${id}`),
};

export const superAdminIntegrationsApi = {
  overview: () => api.get<ApiResponse<any>>('/super-admin/integrations/overview'),
  createKey: (data: { name: string; scopes?: string[] }) =>
    api.post<ApiResponse<any>>('/super-admin/integrations/api-keys', data),
  revokeKey: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/integrations/api-keys/${id}`),
};

export const superAdminBackupApi = {
  status: () => api.get<ApiResponse<any>>('/super-admin/backup/status'),
  trigger: (notes?: string) => api.post<ApiResponse<any>>('/super-admin/backup/trigger', { notes }),
};

export const superAdminMonitoringApi = {
  health: () => api.get<ApiResponse<any>>('/super-admin/system/health'),
};

export const superAdminNotificationsApi = {
  broadcast: (data: { targetAudience: string; title: string; message: string; actionUrl?: string }) =>
    api.post<ApiResponse<any>>('/super-admin/notifications/broadcast', data),
};

export const superAdminFeedbackApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<any>>('/super-admin/feedback', { params }),
  delete: (id: string) => api.delete<ApiResponse<any>>(`/super-admin/feedback/${id}`),
};



// Error handling utility
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'An error occurred';
  }
  return error?.message || 'An error occurred';
}
