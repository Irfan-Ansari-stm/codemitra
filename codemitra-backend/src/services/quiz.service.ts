import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export const quizService = {
  async list(tenantId: string) {
    const result = await pool.query(
      `SELECT q.id, q.title, q.description, q.status, q.time_limit_minutes,
              q.passing_score, q.max_attempts, q.created_at,
              COUNT(DISTINCT qq.id) AS question_count
       FROM quizzes q
       LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
       WHERE q.tenant_id = $1 AND NOT q.is_deleted
       GROUP BY q.id ORDER BY q.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  },

  async getById(id: string, tenantId: string) {
    const result = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND tenant_id = $2 AND NOT is_deleted LIMIT 1',
      [id, tenantId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Quiz not found');

    const questions = await pool.query(
      `SELECT id, question_text, options, correct_options, points, order_index, image_url
       FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index`,
      [id]
    );
    return { ...result.rows[0], questions: questions.rows };
  },

  async create(data: {
    tenantId: string;
    createdBy: string;
    title: string;
    description?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showAnswersAfter?: boolean;
    chapterId?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO quizzes
         (tenant_id, created_by, title, description, time_limit_minutes,
          passing_score, max_attempts, shuffle_questions, shuffle_options,
          show_answers_after, chapter_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        data.tenantId, data.createdBy, data.title, data.description || null,
        data.timeLimitMinutes ?? 30, data.passingScore ?? 60,
        data.maxAttempts ?? 1, data.shuffleQuestions !== false,
        data.shuffleOptions !== false, data.showAnswersAfter ?? false,
        data.chapterId || null,
      ]
    );
    return result.rows[0];
  },

  async addQuestion(data: {
    quizId: string;
    questionText: string;
    options: { id: string; text: string }[];
    correctOptions: string[];
    points?: number;
    orderIndex?: number;
    explanation?: string;
    imageUrl?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO quiz_questions
         (quiz_id, question_text, options, correct_options, points, order_index, explanation, image_url)
       VALUES ($1,$2,$3::JSONB,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.quizId, data.questionText, JSON.stringify(data.options),
        `{${data.correctOptions.join(',')}}`, data.points ?? 1,
        data.orderIndex ?? 0, data.explanation || null, data.imageUrl || null,
      ]
    );
    return result.rows[0];
  },

  async startAttempt(quizId: string, studentId: string, tenantId: string) {
    // Check max_attempts
    const quiz = await pool.query(
      'SELECT max_attempts FROM quizzes WHERE id = $1 LIMIT 1',
      [quizId]
    );
    if (!quiz.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Quiz not found');

    const prevAttempts = await pool.query(
      `SELECT COUNT(*) FROM quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2 AND status = 'completed'`,
      [quizId, studentId]
    );
    const attemptCount = parseInt(prevAttempts.rows[0].count);
    if (attemptCount >= quiz.rows[0].max_attempts) {
      throw new AppError(400, 'MAX_ATTEMPTS', 'Maximum attempts reached for this quiz');
    }

    const result = await pool.query(
      `INSERT INTO quiz_attempts
         (quiz_id, student_id, tenant_id, attempt_number, status, started_at)
       VALUES ($1, $2, $3, $4, 'in_progress', NOW()) RETURNING *`,
      [quizId, studentId, tenantId, attemptCount + 1]
    );
    return result.rows[0];
  },

  async submitAttempt(
    attemptId: string,
    studentId: string,
    answers: Record<string, string[]>
  ) {
    const attempt = await pool.query(
      'SELECT * FROM quiz_attempts WHERE id = $1 AND student_id = $2 LIMIT 1',
      [attemptId, studentId]
    );
    if (!attempt.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Attempt not found');
    if (attempt.rows[0].status !== 'in_progress') {
      throw new AppError(400, 'ALREADY_SUBMITTED', 'Quiz already submitted');
    }

    // Grade
    const questions = await pool.query(
      'SELECT id, correct_options, points FROM quiz_questions WHERE quiz_id = $1',
      [attempt.rows[0].quiz_id]
    );
    let earned = 0;
    let total = 0;
    for (const q of questions.rows) {
      total += q.points;
      const given = answers[q.id] || [];
      const correct = q.correct_options;
      const isCorrect =
        given.length === correct.length &&
        given.every((a: string) => correct.includes(a));
      if (isCorrect) earned += q.points;
    }

    const score = total > 0 ? Math.round((earned / total) * 10000) / 100 : 0;
    const quiz = await pool.query(
      'SELECT passing_score FROM quizzes WHERE id = $1 LIMIT 1',
      [attempt.rows[0].quiz_id]
    );
    const passed = score >= parseFloat(quiz.rows[0]?.passing_score || '60');

    const started = new Date(attempt.rows[0].started_at);
    const timeTaken = Math.round((Date.now() - started.getTime()) / 1000);

    const result = await pool.query(
      `UPDATE quiz_attempts
       SET status = 'completed', answers = $1::JSONB, score = $2, total_points = $3,
           passed = $4, completed_at = NOW(), time_taken_seconds = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [JSON.stringify(answers), score, total, passed, timeTaken, attemptId]
    );
    return result.rows[0];
  },
};
