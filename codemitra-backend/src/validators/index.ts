import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and digit'
    ),
  name: z.string().min(2).max(255).trim(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

// ── Tenant ────────────────────────────────────────────────────────────────────
export const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  plan: z.enum(['trial', 'basic', 'pro', 'enterprise']).optional(),
  maxStudents: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  websiteUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
});

// ── User ─────────────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(255),
  role: z.enum(['institution_admin', 'institution_student']),
  metadata: z.record(z.any()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(30).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// ── Course ────────────────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  languageTags: z.array(z.string()).optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const createChapterSchema = z.object({
  title: z.string().min(2).max(255),
  content: z.string().optional(),
  orderIndex: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
});

// ── Problem ───────────────────────────────────────────────────────────────────
export const createProblemSchema = z.object({
  title: z.string().min(2).max(255),
  statement: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  scope: z.enum(['institution', 'public']),
  inputFormat: z.string().optional(),
  outputFormat: z.string().optional(),
  constraintsText: z.string().optional(),
  sampleExplanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  timeLimitMs: z.number().int().min(100).max(30000).optional(),
  memoryLimitMb: z.number().int().min(16).max(1024).optional(),
  allowedLanguages: z.array(z.number().int()).optional(),
  chapterId: z.string().uuid().optional(),
});

export const createTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string().min(1),
  isHidden: z.boolean().optional(),
  points: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
});

// ── Submission ────────────────────────────────────────────────────────────────
export const submitCodeSchema = z.object({
  problemId: z.string().uuid(),
  languageId: z.number().int().positive(),
  sourceCode: z.string().min(1).max(65536),
  assignmentId: z.string().uuid().optional(),
});

// ── Assignment ────────────────────────────────────────────────────────────────
export const createAssignmentSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  lateSubmissionAllowed: z.boolean().optional(),
  latePenaltyPercent: z.number().min(0).max(100).optional(),
  totalMarks: z.number().int().positive().optional(),
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
});

export const addProblemToAssignmentSchema = z.object({
  problemId: z.string().uuid(),
  marks: z.number().int().positive().default(10),
  orderIndex: z.number().int().min(0).default(0),
});

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const createQuizSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().optional(),
  timeLimitMinutes: z.number().int().positive().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showAnswersAfter: z.boolean().optional(),
  chapterId: z.string().uuid().optional(),
});

export const addQuizQuestionSchema = z.object({
  questionText: z.string().min(1),
  options: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .min(2)
    .max(6),
  correctOptions: z.array(z.string()).min(1),
  points: z.number().int().positive().optional(),
  orderIndex: z.number().int().min(0).optional(),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const submitQuizSchema = z.object({
  answers: z.record(z.array(z.string())),
});

// ── Blog ──────────────────────────────────────────────────────────────────────
export const createBlogPostSchema = z.object({
  title: z.string().min(2).max(500),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().uuid().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  isFeatured: z.boolean().optional(),
});

// ── Pagination ────────────────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
