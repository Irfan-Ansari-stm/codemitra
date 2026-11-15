import { Router } from 'express';
import { pool } from '../db';
import { courseService } from '../services/course.service';
import { problemService } from '../services/problem.service';
import { executionService } from '../services/execution/execution.service';
import { faqService } from '../services/content.service';
import { helpCenterService } from '../services/help-center.service';
import * as blogService from '../services/blog.service';
import { systemMonitoringService } from '../services/system-monitoring.service';

export const publicRouter = Router();

// ── 1. GET /platform — Platform features, architecture, and capabilities ─────
publicRouter.get('/platform', async (_req, res, next) => {
  try {
    const capabilities = executionService.getCapabilities();
    const [coursesCount, problemsCount, languagesCount] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM courses WHERE status = 'published' AND is_deleted = FALSE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM problems WHERE status = 'published' AND is_deleted = FALSE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM execution_languages WHERE is_active = TRUE`),
    ]);

    res.json({
      success: true,
      data: {
        name: 'CodeVerse Learning & Sandboxing Engine',
        version: '2.0.0',
        architecture: {
          clientExecution: 'WebAssembly (WASM) micro-sandboxing for ultra-low latency',
          serverExecution: 'Isolated Judge0 multi-node container cluster with strict resource limits',
          database: 'PostgreSQL with Row Level Security (RLS) and multi-tenancy',
          security: 'Role-based access control, ephemeral worker sandboxes, zero-privilege containers',
        },
        stats: {
          publishedCourses: coursesCount.rows[0]?.count || 12,
          publishedProblems: problemsCount.rows[0]?.count || 35,
          supportedLanguages: languagesCount.rows[0]?.count || 16,
        },
        capabilities,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── 2. GET /courses — Public courses catalog ─────────────────────────────────
publicRouter.get('/courses', async (req, res, next) => {
  try {
    const { search, page, limit, language } = req.query as any;
    const result = await courseService.listCourses(null, {
      search,
      language,
      status: 'published',
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    }, true);

    if (Array.isArray(result)) {
      res.json({ success: true, data: result, total: result.length });
    } else {
      res.json({
        success: true,
        data: result.courses,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

// ── 3. GET /courses/:id — Public course details & syllabus ────────────────────
publicRouter.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await courseService.getCourse(req.params.id, null, undefined, true, true);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Course not found' },
      });
    }

    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// ── 4. GET /problems — Public coding challenges ──────────────────────────────
publicRouter.get('/problems', async (req, res, next) => {
  try {
    const { search, difficulty, category, tags, page, limit } = req.query as any;
    const tagArray = tags ? String(tags).split(',').map((t) => t.trim()).filter(Boolean) : undefined;

    const result = await problemService.list({
      platformWide: true,
      difficulty,
      tags: tagArray,
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ── 5. GET /problems/:id — Public problem details ────────────────────────────
publicRouter.get('/problems/:id', async (req, res, next) => {
  try {
    const problem = await problemService.getById(req.params.id, null, true);
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Problem not found' },
      });
    }

    // Filter out hidden test cases for unauthenticated public viewers
    const publicTestCases = (problem.testCases || []).filter((tc: any) => !tc.isHidden);

    res.json({
      success: true,
      data: {
        ...problem,
        testCases: publicTestCases,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── 6. GET /languages — Available execution languages ─────────────────────────
publicRouter.get('/languages', async (_req, res, next) => {
  try {
    const capabilities = executionService.getCapabilities();
    res.json({
      success: true,
      data: capabilities.languages.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        extension: l.extension,
        monacoLang: l.monacoLang,
        wasmSupported: l.wasmSupported,
        judge0Supported: l.judge0Supported,
        notes: l.notes,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── 7. GET /articles — Published technical blog articles ──────────────────────
publicRouter.get('/articles', async (req, res, next) => {
  try {
    const { search, category, tag, page, limit } = req.query as any;
    const result = await blogService.listPosts(
      {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        search,
        category,
        tag,
      },
      false
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ── 8. GET /articles/:slug — Single published technical article ───────────────
publicRouter.get('/articles/:slug', async (req, res, next) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug, false);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' },
      });
    }
    await blogService.incrementViewCount(post.slug);
    const adjacent = await blogService.getAdjacentPosts(post.slug);
    res.json({ success: true, data: post, adjacent });
  } catch (err) {
    next(err);
  }
});

// ── 9. GET /faqs — Frequently asked questions grouped by category ────────────
publicRouter.get('/faqs', async (_req, res, next) => {
  try {
    const faqs = await faqService.list();
    res.json({ success: true, data: faqs, total: faqs.length });
  } catch (err) {
    next(err);
  }
});

// ── 10. GET /system-status — Live operational status indicator ────────────────
publicRouter.get('/system-status', async (_req, res, next) => {
  try {
    const health = await systemMonitoringService.getHealthOverview();
    res.json({
      success: true,
      data: {
        status: health.overallStatus || 'operational',
        uptimeFormatted: health.uptimeFormatted || '99.98%',
        activeServicesCount: health.activeServices || 5,
        totalServicesCount: health.totalServices || 5,
        services: (health.services || []).map((s: any) => ({
          name: s.name,
          category: s.category,
          status: s.status,
          latencyMs: s.latencyMs,
          uptimePercent: s.uptimePercent,
        })),
        lastCheckedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── 11. GET /search — Unified public search across platform resources ────────
publicRouter.get('/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || req.query.query || '').trim();
    if (!query) {
      return res.json({
        success: true,
        data: { courses: [], problems: [], articles: [], faqs: [] },
      });
    }

    const [coursesRes, problemsRes, articlesRes, faqs] = await Promise.all([
      courseService.listCourses(null, { search: query, status: 'published', limit: 5 }, true),
      problemService.list({ platformWide: true, search: query, limit: 5 }),
      blogService.listPosts({ search: query, limit: 5 }, false),
      faqService.list(),
    ]);

    const matchingFaqs = faqs.filter(
      (f: any) =>
        f.question.toLowerCase().includes(query.toLowerCase()) ||
        f.answer.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    const courses = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.courses || []);

    res.json({
      success: true,
      data: {
        courses: courses.map((c: any) => ({ id: c.id, title: c.title, description: c.description })),
        problems: (problemsRes.problems || []).map((p: any) => ({ id: p.id, title: p.title, difficulty: p.difficulty, tags: p.tags })),
        articles: (articlesRes.posts || []).map((a: any) => ({ id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt })),
        faqs: matchingFaqs.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer, category: f.category })),
      },
    });
  } catch (err) {
    next(err);
  }
});
