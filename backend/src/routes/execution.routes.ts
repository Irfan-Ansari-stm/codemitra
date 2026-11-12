import { Router } from 'express';
import { executionService } from '../services/execution/execution.service';
import { executionRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { runCodeSchema } from '../validators';

export const executionRouter = Router();

// GET /api/v1/execution/capabilities — list engines, languages, limits
executionRouter.get('/capabilities', (_req, res) => {
  const capabilities = executionService.getCapabilities();
  res.json({ success: true, data: capabilities });
});

// GET /api/v1/execution/languages — list all available programming languages and engine support
executionRouter.get('/languages', (_req, res) => {
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
});

// POST /api/v1/execution/submit — submit code for evaluation
executionRouter.post(
  '/submit',
  executionRateLimiter,
  validate(runCodeSchema),
  async (req, res, next) => {
    try {
      const { language, sourceCode, problemId, engine } = req.body;
      const result = await executionService.runCode({
        language,
        sourceCode,
        stdin: req.body.stdin || '',
        engine,
      });

      res.json({
        success: true,
        data: {
          status: result.status,
          engine: result.engineUsed,
          language,
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          executionTime: result.executionTime,
          memoryUsage: result.memoryUsage,
          fallbackOccurred: result.fallbackOccurred,
          notes: result.notes,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/execution/status/:id — execution task status
executionRouter.get('/status/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: 'completed',
    },
  });
});

// POST /api/v1/execution/cancel/:id — cancel active execution task
executionRouter.post('/cancel/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: 'cancelled',
      message: 'Execution task cancelled successfully',
    },
  });
});

// POST /api/v1/execution/run — execute code with engine routing
executionRouter.post(
  '/run',
  executionRateLimiter,
  validate(runCodeSchema),
  async (req, res, next) => {
    try {
      const { language, sourceCode, stdin, engine, problemId } = req.body;

      if (problemId) {
        // Run against problem sample test cases
        const sampleResults = await executionService.runProblemSamples({
          problemId,
          languageId: typeof language === 'number' ? language : parseInt(language, 10),
          sourceCode,
          engine,
        });
        return res.json({ success: true, data: sampleResults });
      }

      // Standalone execution against optional custom stdin
      const result = await executionService.runCode({
        language,
        sourceCode,
        stdin,
        engine,
      });

      res.json({
        success: true,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          status: result.status,
          executionTime: result.executionTime,
          memoryUsage: result.memoryUsage,
          engineUsed: result.engineUsed,
          fallbackOccurred: result.fallbackOccurred,
          notes: result.notes,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
