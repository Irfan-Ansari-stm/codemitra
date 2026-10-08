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

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
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
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
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
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
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
    .default(sql`'{71,50,54,62,63}'::integer[]`),
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
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
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

// =============================================================================
// INFERRED TYPESCRIPT TYPES
// =============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
