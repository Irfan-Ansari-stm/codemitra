import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  bigserial,
  primaryKey,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =============================================================================
// ENUMS — must match your existing PostgreSQL enums exactly
// =============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'institution_admin',
  'institution_student',
  'general_student',
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'trial',
  'basic',
  'pro',
  'enterprise',
]);

export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'published',
  'archived',
]);

export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'easy',
  'medium',
  'hard',
]);

export const problemScopeEnum = pgEnum('problem_scope', [
  'institution',
  'public',
]);

export const submissionVerdictEnum = pgEnum('submission_verdict', [
  'pending',
  'accepted',
  'wrong_answer',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'runtime_error',
  'compile_error',
  'presentation_error',
  'internal_error',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'not_started',
  'in_progress',
  'submitted',
  'late_submitted',
  'graded',
]);

export const quizStatusEnum = pgEnum('quiz_status', [
  'not_started',
  'in_progress',
  'completed',
]);

export const blogStatusEnum = pgEnum('blog_status', [
  'draft',
  'published',
  'archived',
  'scheduled',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'assignment_due',
  'submission_result',
  'course_published',
  'announcement',
  'system',
]);

// =============================================================================
// TABLES
// =============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  contactEmail: text('contact_email'),
  contactPhone: varchar('contact_phone', { length: 30 }),
  address: text('address'),
  plan: subscriptionPlanEnum('plan').notNull().default('trial'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  maxStudents: integer('max_students').notNull().default(50),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull(),
  phone: varchar('phone', { length: 30 }),
  bio: text('bio'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerifyToken: text('email_verify_token'),
  emailVerifyExpires: timestamp('email_verify_expires', { withTimezone: true }),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  loginAttemptCount: integer('login_attempt_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  languageTags: text('language_tags').array().notNull().default(sql`'{}'::text[]`),
  status: contentStatusEnum('status').notNull().default('draft'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  status: contentStatusEnum('status').notNull().default('draft'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  orderIndex: integer('order_index').notNull().default(0),
  status: contentStatusEnum('status').notNull().default('draft'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  estimatedMinutes: integer('estimated_minutes').default(30),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 300 }).notNull(),
  statement: text('statement').notNull(),
  inputFormat: text('input_format'),
  outputFormat: text('output_format'),
  constraintsText: text('constraints_text'),
  sampleExplanation: text('sample_explanation'),
  difficulty: difficultyLevelEnum('difficulty').notNull().default('medium'),
  scope: problemScopeEnum('scope').notNull().default('institution'),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  timeLimitMs: integer('time_limit_ms').notNull().default(2000),
  memoryLimitMb: integer('memory_limit_mb').notNull().default(256),
  allowedLanguages: integer('allowed_languages')
    .array()
    .notNull()
    .default(sql`'{71,50,54,62,63,74,64,73,60,72,68,51,78,80}'::integer[]`),
  category: varchar('category', { length: 100 }).default('General'),
  status: varchar('status', { length: 50 }).notNull().default('published'),
  codeTemplates: jsonb('code_templates').default({}),
  referenceSolutions: jsonb('reference_solutions').default({}),
  isDeleted: boolean('is_deleted').notNull().default(false),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  acceptedSubmissions: integer('accepted_submissions').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testCases = pgTable('test_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id').notNull().references(() => problems.id, { onDelete: 'cascade' }),
  input: text('input').notNull().default(''),
  expectedOutput: text('expected_output').notNull(),
  isHidden: boolean('is_hidden').notNull().default(true),
  points: integer('points').notNull().default(1),
  orderIndex: integer('order_index').notNull().default(0),
  explanation: text('explanation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const programmingLanguages = pgTable('programming_languages', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  version: varchar('version', { length: 50 }),
  runtime: varchar('runtime', { length: 100 }),
  executionEngine: varchar('execution_engine', { length: 50 }).notNull().default('judge0'),
  fileExtension: varchar('file_extension', { length: 20 }).notNull(),
  monacoLang: varchar('monaco_lang', { length: 50 }).notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  browserSupported: boolean('browser_supported').notNull().default(false),
  defaultStarter: text('default_starter'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const problemLanguages = pgTable('problem_languages', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id').notNull().references(() => problems.id, { onDelete: 'cascade' }),
  languageId: integer('language_id').notNull(),
  starterCode: text('starter_code'),
  referenceSolution: text('reference_solution'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const problemBookmarks = pgTable(
  'problem_bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.problemId] }),
  })
);

export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  lateSubmissionAllowed: boolean('late_submission_allowed').notNull().default(false),
  latePenaltyPercent: numeric('late_penalty_percent', { precision: 5, scale: 2 }).default('0'),
  totalMarks: integer('total_marks').notNull().default(100),
  status: contentStatusEnum('status').notNull().default('draft'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  problemId: uuid('problem_id').notNull().references(() => problems.id, { onDelete: 'restrict' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),
  languageId: integer('language_id').notNull(),
  sourceCode: text('source_code').notNull(),
  verdict: submissionVerdictEnum('verdict').notNull().default('pending'),
  score: numeric('score', { precision: 5, scale: 2 }).default('0'),
  runtimeMs: integer('runtime_ms'),
  memoryKb: integer('memory_kb'),
  stderrOutput: text('stderr_output'),
  judge0Token: text('judge0_token'),
  executionEngine: varchar('execution_engine', { length: 50 }).default('judge0'),
  compileOutput: text('compile_output'),
  stdoutOutput: text('stdout_output'),
  passedTestCases: integer('passed_test_cases').default(0),
  totalTestCases: integer('total_test_cases').default(0),
  testCaseResults: jsonb('test_case_results').notNull().default([]),
  isContestSubmission: boolean('is_contest_submission').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assignmentProblems = pgTable('assignment_problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  problemId: uuid('problem_id').notNull().references(() => problems.id, { onDelete: 'restrict' }),
  marks: integer('marks').notNull().default(10),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  status: assignmentStatusEnum('status').notNull().default('not_started'),
  totalScore: numeric('total_score', { precision: 7, scale: 2 }).default('0'),
  gradedBy: uuid('graded_by').references(() => users.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  timeLimitMinutes: integer('time_limit_minutes').default(30),
  shuffleQuestions: boolean('shuffle_questions').notNull().default(true),
  shuffleOptions: boolean('shuffle_options').notNull().default(true),
  passingScore: numeric('passing_score', { precision: 5, scale: 2 }).default('60.00'),
  maxAttempts: integer('max_attempts').default(1),
  showAnswersAfter: boolean('show_answers_after').notNull().default(false),
  status: contentStatusEnum('status').notNull().default('draft'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  explanation: text('explanation'),
  options: jsonb('options').notNull(),
  correctOptions: text('correct_options').array().notNull(),
  points: integer('points').notNull().default(1),
  orderIndex: integer('order_index').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: quizStatusEnum('status').notNull().default('not_started'),
  answers: jsonb('answers').notNull().default({}),
  score: numeric('score', { precision: 7, scale: 2 }).default('0'),
  totalPoints: integer('total_points').default(0),
  passed: boolean('passed'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeTakenSeconds: integer('time_taken_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'restrict' }),
  isCompleted: boolean('is_completed').notNull().default(false),
  completionPercent: numeric('completion_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  problemsSolved: integer('problems_solved').notNull().default(0),
  problemsTotal: integer('problems_total').notNull().default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogCategories = pgTable('blog_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 550 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url'),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  status: blogStatusEnum('status').notNull().default('draft'),
  isFeatured: boolean('is_featured').notNull().default(false),
  readTimeMinutes: integer('read_time_minutes').default(5),
  viewCount: integer('view_count').notNull().default(0),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  seoTitle: varchar('seo_title', { length: 70 }),
  seoDescription: varchar('seo_description', { length: 160 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const blogBookmarks = pgTable(
  'blog_bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => blogPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  })
);

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: varchar('name', { length: 255 }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
});

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: uuid('request_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  totalProblemsSolved: integer('total_problems_solved').notNull().default(0),
  easySolved: integer('easy_solved').notNull().default(0),
  mediumSolved: integer('medium_solved').notNull().default(0),
  hardSolved: integer('hard_solved').notNull().default(0),
  totalSubmissions: integer('total_submissions').notNull().default(0),
  acceptedSubmissions: integer('accepted_submissions').notNull().default(0),
  currentStreakDays: integer('current_streak_days').notNull().default(0),
  maxStreakDays: integer('max_streak_days').notNull().default(0),
  lastSubmissionDate: date('last_submission_date'),
  totalScore: numeric('total_score', { precision: 10, scale: 2 }).notNull().default('0'),
  rankGlobal: integer('rank_global'),
  rankInstitution: integer('rank_institution'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  subject: varchar('subject', { length: 500 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull().default('General Query'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  department: varchar('department', { length: 100 }).default('Customer Support'),
  firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const supportTicketReplies = pgTable('support_ticket_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  messageType: varchar('message_type', { length: 50 }).notNull().default('USER_REPLY'),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supportAttachments = pgTable('support_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => supportTicketReplies.id, { onDelete: 'set null' }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  storageKey: text('storage_key'),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supportAssignmentHistory = pgTable('support_assignment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  previousAssignee: uuid('previous_assignee').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supportTicketActivity = pgTable('support_ticket_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  status: varchar('status', { length: 30 }).notNull().default('investigating'),
  affectedServices: text('affected_services').array().notNull().default(sql`'{}'::text[]`),
  summary: text('summary').notNull(),
  mitigationSteps: text('mitigation_steps'),
  timeline: jsonb('timeline').notNull().default([]),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  scopes: text('scopes').array().notNull().default(sql`'{"read"}'::text[]`),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const databaseBackups = pgTable('database_backups', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull().default(0),
  status: varchar('status', { length: 30 }).notNull().default('completed'),
  backupType: varchar('backup_type', { length: 30 }).notNull().default('manual'),
  initiatedBy: uuid('initiated_by').references(() => users.id, { onDelete: 'set null' }),
  checksum: varchar('checksum', { length: 128 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const platformConfigurations = pgTable('platform_configurations', {
  configKey: varchar('config_key', { length: 100 }).primaryKey(),
  configValue: jsonb('config_value').notNull(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  description: text('description'),
  isSensitive: boolean('is_sensitive').notNull().default(false),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const applicationLogs = pgTable('application_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  level: varchar('level', { length: 20 }).notNull().default('info'),
  source: varchar('source', { length: 100 }).notNull().default('api'),
  message: text('message').notNull(),
  context: jsonb('context').notNull().default({}),
  requestId: uuid('request_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  modules: many(modules),
  chapters: many(chapters),
  problems: many(problems),
  assignments: many(assignments),
  quizzes: many(quizzes),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  submissions: many(submissions),
  assignmentSubmissions: many(assignmentSubmissions),
  quizAttempts: many(quizAttempts),
  progress: many(userProgress),
  notifications: many(notifications),
  stats: many(userStats),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  tenant: one(tenants, { fields: [courses.tenantId], references: [tenants.id] }),
  creator: one(users, { fields: [courses.createdBy], references: [users.id] }),
  modules: many(modules),
  assignments: many(assignments),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  tenant: one(tenants, { fields: [modules.tenantId], references: [tenants.id] }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  module: one(modules, { fields: [chapters.moduleId], references: [modules.id] }),
  tenant: one(tenants, { fields: [chapters.tenantId], references: [tenants.id] }),
  problems: many(problems),
  quizzes: many(quizzes),
  assignments: many(assignments),
  progress: many(userProgress),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [problems.tenantId], references: [tenants.id] }),
  chapter: one(chapters, { fields: [problems.chapterId], references: [chapters.id] }),
  creator: one(users, { fields: [problems.createdBy], references: [users.id] }),
  testCases: many(testCases),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
  tenant: one(tenants, { fields: [submissions.tenantId], references: [tenants.id] }),
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [assignments.tenantId], references: [tenants.id] }),
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  chapter: one(chapters, { fields: [assignments.chapterId], references: [chapters.id] }),
  creator: one(users, { fields: [assignments.createdBy], references: [users.id] }),
  problems: many(assignmentProblems),
  submissions: many(assignmentSubmissions),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [quizzes.tenantId], references: [tenants.id] }),
  chapter: one(chapters, { fields: [quizzes.chapterId], references: [chapters.id] }),
  creator: one(users, { fields: [quizzes.createdBy], references: [users.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const instituteApplications = pgTable('institute_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationNumber: varchar('application_number', { length: 50 }),
  applicantUserId: uuid('applicant_user_id').references(() => users.id, { onDelete: 'set null' }),
  institutionName: varchar('institution_name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('India'),
  establishedYear: integer('established_year'),
  institutionType: varchar('institution_type', { length: 100 }).default('University'),
  websiteUrl: text('website_url'),
  address: text('address'),
  description: text('description'),
  documents: jsonb('documents').default(sql`'[]'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  reviewNote: text('review_note'),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const instituteApplicationsRelations = relations(instituteApplications, ({ one }) => ({
  applicant: one(users, { fields: [instituteApplications.applicantUserId], references: [users.id] }),
  reviewer: one(users, { fields: [instituteApplications.reviewedBy], references: [users.id] }),
  tenant: one(tenants, { fields: [instituteApplications.tenantId], references: [tenants.id] }),
}));

export const admissions = pgTable('admissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationNumber: varchar('application_number', { length: 50 }).unique(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'set null' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  batchId: uuid('batch_id'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  program: varchar('program', { length: 255 }).notNull(),
  academicDetails: jsonb('academic_details').default(sql`'{}'::jsonb`),
  documents: jsonb('documents').default(sql`'[]'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const admissionsRelations = relations(admissions, ({ one }) => ({
  student: one(users, { fields: [admissions.studentId], references: [users.id] }),
  tenant: one(tenants, { fields: [admissions.tenantId], references: [tenants.id] }),
  course: one(courses, { fields: [admissions.courseId], references: [courses.id] }),
  reviewer: one(users, { fields: [admissions.reviewedBy], references: [users.id] }),
}));

export const courseSubmissions = pgTable('course_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionNumber: varchar('submission_number', { length: 50 }).unique(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  instructorId: uuid('instructor_id').references(() => users.id, { onDelete: 'set null' }),
  submissionVersion: varchar('submission_version', { length: 50 }).notNull().default('1.0.0'),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  level: varchar('level', { length: 50 }).default('Beginner'),
  description: text('description'),
  syllabusSummary: text('syllabus_summary'),
  documents: jsonb('documents').default(sql`'[]'::jsonb`),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  reviewComments: text('review_comments'),
  adminNotes: text('admin_notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const courseSubmissionsRelations = relations(courseSubmissions, ({ one }) => ({
  course: one(courses, { fields: [courseSubmissions.courseId], references: [courses.id] }),
  tenant: one(tenants, { fields: [courseSubmissions.tenantId], references: [tenants.id] }),
  instructor: one(users, { fields: [courseSubmissions.instructorId], references: [users.id] }),
  reviewer: one(users, { fields: [courseSubmissions.reviewedBy], references: [users.id] }),
}));

export const approvalHistory = pgTable('approval_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  previousStatus: varchar('previous_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  reason: text('reason'),
  adminNotes: text('admin_notes'),
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const approvalHistoryRelations = relations(approvalHistory, ({ one }) => ({
  performer: one(users, { fields: [approvalHistory.performedBy], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  assignedByUser: one(users, { fields: [userRoles.assignedBy], references: [users.id] }),
}));

export type InstituteApplication = typeof instituteApplications.$inferSelect;
export type NewInstituteApplication = typeof instituteApplications.$inferInsert;
export type Admission = typeof admissions.$inferSelect;
export type NewAdmission = typeof admissions.$inferInsert;
export type CourseSubmission = typeof courseSubmissions.$inferSelect;
export type NewCourseSubmission = typeof courseSubmissions.$inferInsert;
export type ApprovalHistoryRecord = typeof approvalHistory.$inferSelect;
export type NewApprovalHistoryRecord = typeof approvalHistory.$inferInsert;

// =============================================================================
// INFERRED TYPESCRIPT TYPES
// =============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogBookmark = typeof blogBookmarks.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type SupportAttachment = typeof supportAttachments.$inferSelect;
export type SupportAssignmentHistory = typeof supportAssignmentHistory.$inferSelect;
export type SupportTicketActivity = typeof supportTicketActivity.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type DatabaseBackup = typeof databaseBackups.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type PlatformConfiguration = typeof platformConfigurations.$inferSelect;
export type ApplicationLog = typeof applicationLogs.$inferSelect;

// =============================================================================
// IDE ENTITIES
// =============================================================================

export const ideProjects = pgTable('ide_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  description: text('description'),
  defaultLanguage: varchar('default_language', { length: 64 }).notNull().default('python'),
  visibility: varchar('visibility', { length: 32 }).notNull().default('private'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ideFiles = pgTable('ide_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => ideProjects.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 512 }).notNull().default('/'),
  language: varchar('language', { length: 64 }).notNull().default('python'),
  sourceCode: text('source_code').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ideOpenTabs = pgTable('ide_open_tabs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => ideProjects.id, { onDelete: 'cascade' }),
  fileId: uuid('file_id').notNull().references(() => ideFiles.id, { onDelete: 'cascade' }),
  tabOrder: integer('tab_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(false),
});

export const ideExecutions = pgTable('ide_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  projectId: uuid('project_id').references(() => ideProjects.id, { onDelete: 'set null' }),
  language: varchar('language', { length: 64 }).notNull(),
  sourceCodeSnapshot: text('source_code_snapshot').notNull(),
  stdin: text('stdin').default(''),
  executionEngine: varchar('execution_engine', { length: 32 }).notNull().default('auto'),
  executionStatus: varchar('execution_status', { length: 64 }).notNull().default('completed'),
  stdout: text('stdout').default(''),
  stderr: text('stderr').default(''),
  compileOutput: text('compile_output').default(''),
  exitCode: integer('exit_code').default(0),
  executionTime: doublePrecision('execution_time').default(0),
  memoryUsed: integer('memory_used'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const ideSettings = pgTable('ide_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  editorTheme: varchar('editor_theme', { length: 32 }).notNull().default('vs-dark'),
  fontSize: integer('font_size').notNull().default(14),
  tabSize: integer('tab_size').notNull().default(2),
  wordWrap: boolean('word_wrap').notNull().default(true),
  minimapEnabled: boolean('minimap_enabled').notNull().default(false),
  autoSaveEnabled: boolean('auto_save_enabled').notNull().default(true),
  defaultLanguage: varchar('default_language', { length: 64 }).notNull().default('python'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ideProjectsRelations = relations(ideProjects, ({ one, many }) => ({
  user: one(users, { fields: [ideProjects.userId], references: [users.id] }),
  files: many(ideFiles),
  executions: many(ideExecutions),
}));

export const ideFilesRelations = relations(ideFiles, ({ one }) => ({
  project: one(ideProjects, { fields: [ideFiles.projectId], references: [ideProjects.id] }),
}));

export type IdeProject = typeof ideProjects.$inferSelect;
export type NewIdeProject = typeof ideProjects.$inferInsert;
export type IdeFileEntity = typeof ideFiles.$inferSelect;
export type NewIdeFileEntity = typeof ideFiles.$inferInsert;
export type IdeExecution = typeof ideExecutions.$inferSelect;
export type NewIdeExecution = typeof ideExecutions.$inferInsert;
export type IdeSetting = typeof ideSettings.$inferSelect;
export type NewIdeSetting = typeof ideSettings.$inferInsert;
export type IdeOpenTab = typeof ideOpenTabs.$inferSelect;

// =============================================================================
// CONTENT & MARKETING TABLES
// =============================================================================

export const contentPages = pgTable('content_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  pageType: varchar('page_type', { length: 50 }).notNull().default('page'),
  category: varchar('category', { length: 100 }),
  featuredImage: text('featured_image'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  isFeatured: boolean('is_featured').notNull().default(false),
  seoTitle: varchar('seo_title', { length: 150 }),
  seoDescription: varchar('seo_description', { length: 255 }),
  keywords: text('keywords').array().default(sql`'{}'::text[]`),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contentBanners = pgTable('content_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 255 }),
  description: text('description'),
  content: text('content'),
  desktopImage: text('desktop_image'),
  mobileImage: text('mobile_image'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  ctaText: varchar('cta_text', { length: 100 }),
  ctaUrl: text('cta_url'),
  targetAudience: varchar('target_audience', { length: 100 }).notNull().default('all'),
  position: varchar('position', { length: 50 }).notNull().default('top'),
  priority: integer('priority').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contentFaqs = pgTable('content_faqs', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }).notNull().default('General'),
  displayOrder: integer('display_order').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  status: varchar('status', { length: 50 }).notNull().default('published'),
  visibility: varchar('visibility', { length: 50 }).notNull().default('public'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const seoSettings = pgTable('seo_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteTitle: varchar('site_title', { length: 255 }).notNull().default('CodeVerse'),
  siteDescription: text('site_description'),
  defaultKeywords: text('default_keywords').array().default(sql`'{}'::text[]`),
  canonicalBaseUrl: text('canonical_base_url').default('https://codeverse.dev'),
  defaultOgImage: text('default_og_image'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  twitterHandle: varchar('twitter_handle', { length: 100 }),
  twitterCardType: varchar('twitter_card_type', { length: 50 }).default('summary_large_image'),
  defaultLanguage: varchar('default_language', { length: 20 }).default('en'),
  indexingPreference: varchar('indexing_preference', { length: 50 }).default('all'),
  robotsTxt: text('robots_txt').default('User-agent: *\nAllow: /'),
  sitemapEnabled: boolean('sitemap_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const seoRedirects = pgTable('seo_redirects', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourcePath: varchar('source_path', { length: 500 }).notNull().unique(),
  targetPath: varchar('target_path', { length: 500 }).notNull(),
  statusCode: integer('status_code').notNull().default(301),
  isActive: boolean('is_active').notNull().default(true),
  hitCount: integer('hit_count').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const helpCategories = pgTable('help_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }).default('BookOpen'),
  displayOrder: integer('display_order').notNull().default(0),
  parentId: uuid('parent_id'),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const helpArticles = pgTable('help_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => helpCategories.id, { onDelete: 'set null' }),
  category: varchar('category', { length: 150 }),
  subcategory: varchar('subcategory', { length: 150 }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  shortDescription: text('short_description'),
  content: text('content').notNull(),
  featuredImage: text('featured_image'),
  status: varchar('status', { length: 50 }).notNull().default('published'),
  isPublished: boolean('is_published').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  seoTitle: varchar('seo_title', { length: 150 }),
  seoDescription: varchar('seo_description', { length: 255 }),
  keywords: text('keywords').array().default(sql`'{}'::text[]`),
  helpfulCount: integer('helpful_count').notNull().default(0),
  notHelpfulCount: integer('not_helpful_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityCategories = pgTable('community_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }).default('MessageSquare'),
  displayOrder: integer('display_order').notNull().default(0),
  color: varchar('color', { length: 50 }).default('#3B82F6'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityThreads = pgTable('community_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => communityCategories.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 300 }).notNull(),
  slug: varchar('slug', { length: 350 }).notNull().unique(),
  content: text('content').notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  moderationStatus: varchar('moderation_status', { length: 50 }).notNull().default('approved'),
  isPinned: boolean('is_pinned').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isResolved: boolean('is_resolved').notNull().default(false),
  upvotes: integer('upvotes').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityReplies = pgTable('community_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => communityThreads.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentReplyId: uuid('parent_reply_id'),
  content: text('content').notNull(),
  isBestAnswer: boolean('is_best_answer').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  isHidden: boolean('is_hidden').notNull().default(false),
  upvotes: integer('upvotes').notNull().default(0),
  moderationStatus: varchar('moderation_status', { length: 50 }).notNull().default('approved'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communityReports = pgTable('community_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'set null' }),
  reportType: varchar('report_type', { length: 50 }).notNull(),
  targetThreadId: uuid('target_thread_id').references(() => communityThreads.id, { onDelete: 'cascade' }),
  targetReplyId: uuid('target_reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  reason: varchar('reason', { length: 100 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  moderatorId: uuid('moderator_id').references(() => users.id, { onDelete: 'set null' }),
  moderationAction: varchar('moderation_action', { length: 50 }),
  resolutionNote: text('resolution_note'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM MONITORING, SECURITY & INTEGRATIONS TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const serviceRegistry = pgTable('service_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  serviceType: varchar('service_type', { length: 50 }).notNull().default('internal'),
  endpointUrl: text('endpoint_url'),
  status: varchar('status', { length: 30 }).notNull().default('operational'),
  probeLatencyMs: integer('probe_latency_ms').notNull().default(0),
  uptimeTarget: numeric('uptime_target', { precision: 5, scale: 2 }).notNull().default('99.95'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const serviceHealthHistory = pgTable('service_health_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => serviceRegistry.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull(),
  latencyMs: integer('latency_ms').notNull().default(0),
  responseCode: integer('response_code'),
  errorMessage: text('error_message'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
});

export const systemMetrics = pgTable('system_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  cpuUsagePercent: numeric('cpu_usage_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  memoryRssMb: integer('memory_rss_mb').notNull().default(0),
  memoryHeapUsedMb: integer('memory_heap_used_mb').notNull().default(0),
  memoryHeapTotalMb: integer('memory_heap_total_mb').notNull().default(0),
  databaseLatencyMs: integer('database_latency_ms').notNull().default(0),
  databaseConnectionsActive: integer('database_connections_active').notNull().default(0),
  databaseConnectionsIdle: integer('database_connections_idle').notNull().default(0),
  apiLatencyMs: integer('api_latency_ms').notNull().default(0),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

export const executionLanguages = pgTable('execution_languages', {
  id: integer('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  extension: varchar('extension', { length: 20 }).notNull(),
  monacoLang: varchar('monaco_lang', { length: 50 }).notNull(),
  version: varchar('version', { length: 50 }).notNull().default('Latest'),
  runtime: varchar('runtime', { length: 50 }).notNull().default('Native'),
  engine: varchar('engine', { length: 30 }).notNull().default('hybrid'),
  wasmSupported: boolean('wasm_supported').notNull().default(true),
  judge0Supported: boolean('judge0_supported').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const executionNodes = pgTable('execution_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  nodeType: varchar('node_type', { length: 50 }).notNull().default('judge0'),
  hostUrl: text('host_url').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('healthy'),
  currentQueue: integer('current_queue').notNull().default(0),
  maxConcurrency: integer('max_concurrency').notNull().default(50),
  latencyMs: integer('latency_ms').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isDevelopmentFixture: boolean('is_development_fixture').notNull().default(false),
  lastHealthCheckAt: timestamp('last_health_check_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const executionLimits = pgTable('execution_limits', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  maxExecutionTimeMs: integer('max_execution_time_ms').notNull().default(3000),
  maxMemoryMb: integer('max_memory_mb').notNull().default(256),
  maxOutputSizeBytes: integer('max_output_size_bytes').notNull().default(131072),
  maxConcurrentRuns: integer('max_concurrent_runs').notNull().default(10),
  rateLimitPerMinute: integer('rate_limit_per_minute').notNull().default(60),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const executionMetrics = pgTable('execution_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date', { mode: 'string' }).notNull().unique(),
  totalRuns: integer('total_runs').notNull().default(0),
  successfulRuns: integer('successful_runs').notNull().default(0),
  failedRuns: integer('failed_runs').notNull().default(0),
  timeoutRuns: integer('timeout_runs').notNull().default(0),
  wasmRuns: integer('wasm_runs').notNull().default(0),
  judge0Runs: integer('judge0_runs').notNull().default(0),
  avgLatencyMs: numeric('avg_latency_ms', { precision: 8, scale: 2 }).notNull().default('0'),
  avgMemoryMb: numeric('avg_memory_mb', { precision: 8, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceInfo: varchar('device_info', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  isRevoked: boolean('is_revoked').notNull().default(false),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accountLockouts = pgTable('account_lockouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  lockReason: text('lock_reason').notNull().default('Excessive failed login attempts'),
  failedAttempts: integer('failed_attempts').notNull().default(5),
  lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }).notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
  unlockedBy: uuid('unlocked_by').references(() => users.id, { onDelete: 'set null' }),
  unlockReason: text('unlock_reason'),
  status: varchar('status', { length: 30 }).notNull().default('locked'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  isSuccess: boolean('is_success').notNull().default(false),
  failureReason: text('failure_reason'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
});

export const securityControls = pgTable('security_controls', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('authentication'),
  description: text('description').notNull(),
  value: jsonb('value').notNull().default({}),
  isEnabled: boolean('is_enabled').notNull().default(true),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const complianceChecks = pgTable('compliance_checks', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  standard: varchar('standard', { length: 50 }).notNull().default('SOC2 / ISO27001'),
  description: text('description').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('compliant'),
  lastAssessedAt: timestamp('last_assessed_at', { withTimezone: true }).notNull().defaultNow(),
  assessedBy: varchar('assessed_by', { length: 100 }).default('Automated Policy Auditor'),
});

export const authenticationHistory = pgTable('authentication_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: varchar('user_name', { length: 255 }),
  userEmail: varchar('user_email', { length: 255 }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('success'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const integrations = pgTable('integrations', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  integrationType: varchar('integration_type', { length: 50 }).notNull(),
  description: text('description'),
  endpointUrl: text('endpoint_url'),
  connectionStatus: varchar('connection_status', { length: 30 }).notNull().default('ready'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastHealthCheckAt: timestamp('last_health_check_at', { withTimezone: true }).notNull().defaultNow(),
  lastError: text('last_error'),
  configuration: jsonb('configuration').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  targetUrl: text('target_url').notNull(),
  subscribedEvents: text('subscribed_events').array().notNull().default(sql`'{}'::text[]`),
  signingSecretHash: text('signing_secret_hash').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  retryCount: integer('retry_count').notNull().default(3),
  timeoutSeconds: integer('timeout_seconds').notNull().default(10),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').notNull().references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: varchar('status', { length: 30 }).notNull().default('success'),
  statusCode: integer('status_code'),
  responseBody: text('response_body'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

