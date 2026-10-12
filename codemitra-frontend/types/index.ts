// User & Auth
export type UserRole =
  | 'super_admin'
  | 'institution_admin'
  | 'institution_student'
  | 'general_student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

// Tenant / Institution
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  plan: 'trial' | 'basic' | 'pro' | 'enterprise';
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Course Structure
export type ContentStatus = 'draft' | 'published' | 'archived';

export type CourseSort = 'newest' | 'oldest' | 'title' | 'popular';

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
}

export interface Course {
  id: string;
  tenantId?: string | null;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  languageTags: string[];
  sortOrder?: number;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  createdByAvatarUrl?: string | null;
  moduleCount?: number;
  chapterCount?: number;
  totalMinutes?: number;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  progress?: CourseProgressSummary | null;
}

export interface CourseChapter {
  id: string;
  moduleId: string;
  title: string;
  content?: string;
  orderIndex: number;
  status: ContentStatus;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  chapterCount?: number;
  chapters?: CourseChapter[];
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
  lessonCount: number;
  totalMinutes: number;
  enrollmentCount: number;
  isEnrolled: boolean;
  progress: CourseProgressSummary | null;
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  language?: string;
  status?: ContentStatus;
  sort?: CourseSort;
  order?: 'asc' | 'desc';
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  totalModules: number;
  totalLessons: number;
}

export interface EnrollmentRecord {
  id: string;
  courseId: string;
  studentId: string;
  tenantId: string;
  enrolledAt: string;
  enrolledBy?: string | null;
  isActive: boolean;
}

export interface EnrolledCourse extends Course {
  enrolledAt: string;
  chapterCount: number;
  completedLessons: number;
}

export interface ChapterProgress {
  id: string;
  userId: string;
  chapterId: string;
  tenantId: string;
  isCompleted: boolean;
  completionPercent: number;
  problemsSolved: number;
  problemsTotal: number;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  moduleId: string;
  title: string;
  content?: string;
  orderIndex: number;
  status: ContentStatus;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

// Problems
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ProblemScope = 'institution' | 'public';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  statement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraintsText?: string;
  sampleExplanation?: string;
  difficulty: Difficulty;
  scope: ProblemScope;
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  allowedLanguages: number[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated by GET /problems when an authenticated user is present
  acceptanceRate?: number | null;
  solved?: boolean;
  bookmarked?: boolean;
  createdByName?: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
}

export type ProblemSortField =
  | 'created_at'
  | 'title'
  | 'difficulty'
  | 'acceptance_rate'
  | 'total_submissions';

export type ProblemSortOrder = 'asc' | 'desc';

export type ProblemStatusFilter = 'all' | 'solved' | 'unsolved';

export type ProblemDifficultyFilter = 'all' | Difficulty;

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points?: number;
  explanation?: string;
}

// Submissions
export type SubmissionVerdict =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'runtime_error'
  | 'compile_error'
  | 'presentation_error'
  | 'internal_error';

export interface TestCaseResult {
  caseIndex: number;
  passed: boolean;
  verdict: string;
  runtimeMs?: number;
  memoryKb?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  points?: number;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  languageId: number;
  verdict: SubmissionVerdict;
  score: number;
  runtimeMs?: number;
  memoryKb?: number;
  stderrOutput?: string;
  compilationOutput?: string;
  runtimeOutput?: string;
  testCaseResults: TestCaseResult[];
  createdAt: string;
  updatedAt: string;
}

// Assignments
export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'late_submitted' | 'graded';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  totalMarks: number;
  status: ContentStatus;
  lateSubmissionAllowed: boolean;
  latePenaltyPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: AssignmentStatus;
  totalScore?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Quizzes
export type QuizStatus = 'not_started' | 'in_progress' | 'completed';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  passingScore: number;
  maxAttempts: number;
  showAnswersAfter: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  explanation?: string;
  options: Array<{ id: string; text: string }>;
  correctOptions: string[];
  points: number;
  imageUrl?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  status: QuizStatus;
  answers: Record<string, string[]>;
  score: number;
  passed?: boolean;
  timeTakenSeconds?: number;
  completedAt?: string;
  createdAt: string;
}

// Analytics
export interface AnalyticsOverview {
  totalStudents: number;
  active7d: number;
  activeToday: number;
  courses: number;
  problems: number;
  submissions7d: number;
  accepted7d: number;
  activeAssignments: number;
}

export interface HeatmapData {
  date: string;
  total: number;
  accepted: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  totalProblemsSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalScore: number;
  currentStreakDays: number;
  rank: number;
}

// Notifications
export type NotificationType =
  | 'assignment_due'
  | 'submission_result'
  | 'course_published'
  | 'announcement'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Blog
export type BlogStatus = 'draft' | 'published' | 'archived';
export type BlogSort = 'newest' | 'oldest' | 'updated' | 'popular' | 'title';

export interface BlogAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
}

export interface BlogTag {
  tag: string;
  count: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: BlogStatus;
  isFeatured: boolean;
  viewCount: number;
  readTimeMinutes?: number | null;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  authorBio?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  createdAt: string;
  updatedAt: string;
  bookmarked?: boolean;
}

export interface AdjacentPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  sort?: BlogSort;
  featured?: boolean;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogPostDetailResponse {
  success: boolean;
  data: BlogPost;
  adjacent?: {
    previous: AdjacentPost | null;
    next: AdjacentPost | null;
  };
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  name?: string | null;
  subscribedAt: string;
  unsubscribedAt?: string | null;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Judge0 Languages
export const LANGUAGES: Record<number, { name: string; monacoLang: string; extension: string }> = {
  71: { name: 'Python 3', monacoLang: 'python', extension: 'py' },
  50: { name: 'C', monacoLang: 'c', extension: 'c' },
  54: { name: 'C++', monacoLang: 'cpp', extension: 'cpp' },
  62: { name: 'Java', monacoLang: 'java', extension: 'java' },
  63: { name: 'JavaScript', monacoLang: 'javascript', extension: 'js' },
};

export const LANGUAGE_STARTERS: Record<number, string> = {
  71: `import sys
input = sys.stdin.readline

def solve():
    n = int(input())
    print(n)

solve()
`,
  50: `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d\\n", n);
    return 0;
}
`,
  54: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    cin >> n;
    cout << n << "\\n";
    return 0;
}
`,
  62: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(n);
    }
}
`,
  63: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let input = '';
rl.on('line', line => {
    input = line;
    rl.close();
});
rl.on('close', () => {
    console.log(input);
});
`,
};

export const VERDICT_CONFIG: Record<
  SubmissionVerdict,
  { label: string; color: string; bg: string; icon: string }
> = {
  accepted: {
    label: 'Accepted',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: '✓',
  },
  wrong_answer: {
    label: 'Wrong Answer',
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: '✗',
  },
  time_limit_exceeded: {
    label: 'Time Limit Exceeded',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: '⏱',
  },
  memory_limit_exceeded: {
    label: 'Memory Limit Exceeded',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: '💾',
  },
  runtime_error: {
    label: 'Runtime Error',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    icon: '⚠',
  },
  compile_error: {
    label: 'Compile Error',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    icon: '🔧',
  },
  presentation_error: {
    label: 'Presentation Error',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    icon: '📄',
  },
  internal_error: {
    label: 'Internal Error',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    icon: '🔴',
  },
  pending: {
    label: 'Pending',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: '⏳',
  },
};

// Difficulty display config
export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy: {
    label: 'Easy',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  hard: {
    label: 'Hard',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
};
