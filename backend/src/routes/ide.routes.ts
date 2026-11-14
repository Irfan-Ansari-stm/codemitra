import { Router } from 'express';
import { ideService } from '../services/ide.service';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { executionRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { runCodeSchema } from '../validators';
import { z } from 'zod';

export const ideRouter = Router();

// Validation schemas for IDE endpoints
const createProjectSchema = z.object({
  projectName: z.string().min(1).max(255),
  description: z.string().optional(),
  defaultLanguage: z.string().optional(),
  initialFiles: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        content: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .optional(),
});

const updateProjectSchema = z.object({
  projectName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  defaultLanguage: z.string().optional(),
  visibility: z.enum(['private', 'public', 'unlisted']).optional(),
});

const createFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  filePath: z.string().optional(),
  language: z.string().optional(),
  sourceCode: z.string().optional(),
});

const updateFileSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  filePath: z.string().optional(),
  language: z.string().optional(),
  sourceCode: z.string().optional(),
});

const updateTabsSchema = z.object({
  tabs: z.array(
    z.object({
      fileId: z.string().uuid(),
      tabOrder: z.number().int().min(0),
      isActive: z.boolean(),
    })
  ),
});

const updateSettingsSchema = z.object({
  editorTheme: z.string().optional(),
  fontSize: z.number().int().min(8).max(48).optional(),
  tabSize: z.number().int().min(1).max(8).optional(),
  wordWrap: z.boolean().optional(),
  minimapEnabled: z.boolean().optional(),
  autoSaveEnabled: z.boolean().optional(),
  defaultLanguage: z.string().optional(),
});

// ── 1. Code Execution ────────────────────────────────────────────────────────
// POST /api/v1/ide/execute (Runs code via Smart Router, saves snapshot)
ideRouter.post(
  '/execute',
  executionRateLimiter,
  optionalAuth,
  validate(runCodeSchema),
  async (req, res, next) => {
    try {
      const { language, sourceCode, stdin, engine, problemId } = req.body;
      const userId = req.user?.id || null;
      const projectId = req.body.projectId || null;

      const result = await ideService.executeCode(userId, {
        language,
        sourceCode,
        stdin: stdin || '',
        projectId,
        engine,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/ide/executions/:executionId (Execution status)
ideRouter.get('/executions/:executionId', optionalAuth, async (req, res, next) => {
  try {
    const result = await ideService.getExecution(req.params.executionId, req.user?.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ── 2. Languages ─────────────────────────────────────────────────────────────
// GET /api/v1/ide/languages (Supported languages)
ideRouter.get('/languages', (_req, res) => {
  const languages = ideService.getSupportedLanguages();
  res.json({
    success: true,
    data: languages,
  });
});

// ── 3. User Workspace ────────────────────────────────────────────────────────
// GET /api/v1/ide/workspace (Active project, open tabs, user preferences)
ideRouter.get('/workspace', requireAuth, async (req, res, next) => {
  try {
    const workspace = await ideService.getUserWorkspace(req.user!.id);
    res.json({
      success: true,
      data: workspace,
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. Projects Management ───────────────────────────────────────────────────
// GET /api/v1/ide/projects (List user projects)
ideRouter.get('/projects', requireAuth, async (req, res, next) => {
  try {
    const projects = await ideService.getProjects(req.user!.id);
    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ide/projects (Create project)
ideRouter.post('/projects', requireAuth, validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await ideService.createProject(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ide/projects/:projectId (Get single project with files)
ideRouter.get('/projects/:projectId', requireAuth, async (req, res, next) => {
  try {
    const project = await ideService.getProjectById(req.params.projectId, req.user!.id);
    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/ide/projects/:projectId (Update project)
ideRouter.put('/projects/:projectId', requireAuth, validate(updateProjectSchema), async (req, res, next) => {
  try {
    const project = await ideService.updateProject(req.params.projectId, req.user!.id, req.body);
    res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/ide/projects/:projectId (Delete project)
ideRouter.delete('/projects/:projectId', requireAuth, async (req, res, next) => {
  try {
    const result = await ideService.deleteProject(req.params.projectId, req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ── 5. Project Files ─────────────────────────────────────────────────────────
// POST /api/v1/ide/projects/:projectId/files (Create file in project)
ideRouter.post(
  '/projects/:projectId/files',
  requireAuth,
  validate(createFileSchema),
  async (req, res, next) => {
    try {
      const file = await ideService.createProjectFile(
        req.params.projectId,
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        data: file,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/ide/projects/:projectId/files/:fileId (Update file)
ideRouter.put(
  '/projects/:projectId/files/:fileId',
  requireAuth,
  validate(updateFileSchema),
  async (req, res, next) => {
    try {
      const file = await ideService.updateProjectFile(
        req.params.fileId,
        req.params.projectId,
        req.user!.id,
        req.body
      );
      res.json({
        success: true,
        data: file,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/ide/projects/:projectId/files/:fileId (Delete file)
ideRouter.delete(
  '/projects/:projectId/files/:fileId',
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await ideService.deleteProjectFile(
        req.params.fileId,
        req.params.projectId,
        req.user!.id
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/ide/projects/:projectId/tabs (Persist open tabs state)
ideRouter.put(
  '/projects/:projectId/tabs',
  requireAuth,
  validate(updateTabsSchema),
  async (req, res, next) => {
    try {
      const result = await ideService.updateOpenTabs(
        req.params.projectId,
        req.user!.id,
        req.body.tabs
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── 6. Execution History ─────────────────────────────────────────────────────
// GET /api/v1/ide/history (Paginated execution history)
ideRouter.get('/history', requireAuth, async (req, res, next) => {
  try {
    const history = await ideService.getHistory(req.user!.id, {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      language: req.query.language as string | undefined,
      projectId: req.query.projectId as string | undefined,
    });
    res.json({
      success: true,
      data: history.items,
      meta: {
        page: history.page,
        limit: history.limit,
        total: history.total,
        totalPages: history.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ide/history/:executionId (Single execution snapshot)
ideRouter.get('/history/:executionId', requireAuth, async (req, res, next) => {
  try {
    const snapshot = await ideService.getExecution(req.params.executionId, req.user!.id);
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/ide/history/:executionId (Delete execution record)
ideRouter.delete('/history/:executionId', requireAuth, async (req, res, next) => {
  try {
    const result = await ideService.deleteHistory(req.params.executionId, req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ── 7. User Settings ─────────────────────────────────────────────────────────
// GET /api/v1/ide/settings (Get user preferences)
ideRouter.get('/settings', requireAuth, async (req, res, next) => {
  try {
    const settings = await ideService.getSettings(req.user!.id);
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/ide/settings (Update user preferences)
ideRouter.put('/settings', requireAuth, validate(updateSettingsSchema), async (req, res, next) => {
  try {
    const settings = await ideService.updateSettings(req.user!.id, req.body);
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
});
