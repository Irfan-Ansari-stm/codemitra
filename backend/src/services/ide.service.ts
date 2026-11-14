import { pool } from '../db';
import { executionRouterService, ExecutionEngine } from './execution/execution-router.service';
import { resolveLanguage, EXECUTION_LIMITS, SUPPORTED_LANGUAGES } from './execution/execution-limits';
import { AppError } from '../middleware/errorHandler';

export interface IdeExecuteParams {
  language: string | number;
  sourceCode: string;
  stdin?: string;
  projectId?: string;
  engine?: ExecutionEngine;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

const STARTER_MAP: Record<string, { filename: string; starter: string }> = {
  python: { filename: 'main.py', starter: 'print("Hello CodeVerse!")\n' },
  javascript: { filename: 'index.js', starter: 'console.log("Hello CodeVerse!");\n' },
  typescript: { filename: 'index.ts', starter: 'const greeting: string = "Hello CodeVerse!";\nconsole.log(greeting);\n' },
  c: { filename: 'main.c', starter: '#include <stdio.h>\n\nint main() {\n    printf("Hello CodeVerse!\\n");\n    return 0;\n}\n' },
  cpp: { filename: 'main.cpp', starter: '#include <iostream>\n\nint main() {\n    std::cout << "Hello CodeVerse!" << std::endl;\n    return 0;\n}\n' },
  java: { filename: 'Main.java', starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeVerse!");\n    }\n}\n' },
  csharp: { filename: 'Program.cs', starter: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello CodeVerse!");\n    }\n}\n' },
  php: { filename: 'index.php', starter: '<?php\necho "Hello CodeVerse!\\n";\n' },
  ruby: { filename: 'main.rb', starter: 'puts "Hello CodeVerse!"\n' },
  go: { filename: 'main.go', starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello CodeVerse!")\n}\n' },
  rust: { filename: 'main.rs', starter: 'fn main() {\n    println!("Hello CodeVerse!");\n}\n' },
  kotlin: { filename: 'Main.kt', starter: 'fun main() {\n    println("Hello CodeVerse!")\n}\n' },
  swift: { filename: 'main.swift', starter: 'print("Hello CodeVerse!")\n' },
  html: { filename: 'index.html', starter: '<!DOCTYPE html>\n<html>\n<head><title>CodeVerse</title></head>\n<body>\n  <h1>Hello CodeVerse!</h1>\n</body>\n</html>\n' },
  sql: { filename: 'query.sql', starter: '-- CodeVerse SQL Query\nSELECT 1;\n' },
};

export const ideService = {
  /**
   * Execute source code via Smart Router, track performance, and persist execution snapshot
   */
  async executeCode(userId: string | null, params: IdeExecuteParams) {
    const lang = resolveLanguage(params.language);
    if (!lang) {
      throw new AppError(400, 'INVALID_LANGUAGE', `Language '${params.language}' is not supported`);
    }

    if (!params.sourceCode || typeof params.sourceCode !== 'string') {
      throw new AppError(400, 'SOURCE_CODE_REQUIRED', 'Source code cannot be empty');
    }

    // Execute via Smart Router (handles WASM sandboxed / Judge0 / graceful fallbacks)
    const result = await executionRouterService.execute({
      language: lang.id,
      sourceCode: params.sourceCode,
      stdin: params.stdin || '',
      engine: params.engine || 'auto',
      timeLimitMs: params.timeLimitMs || 5000,
      memoryLimitMb: params.memoryLimitMb || 128,
    });

    const exitCode = result.status === 'completed' ? 0 : 1;

    // Persist snapshot to database
    let executionId: string | null = null;
    try {
      const insertRes = await pool.query(
        `INSERT INTO ide_executions (
          user_id, project_id, language, source_code_snapshot, stdin,
          execution_engine, execution_status, stdout, stderr, compile_output,
          exit_code, execution_time, memory_used, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING id`,
        [
          userId || null,
          params.projectId || null,
          lang.slug,
          params.sourceCode,
          params.stdin || '',
          result.engineUsed,
          result.status,
          result.stdout,
          result.stderr,
          result.compileOutput,
          exitCode,
          result.executionTime,
          result.memoryUsage,
        ]
      );
      executionId = insertRes.rows[0]?.id || null;
    } catch (err: any) {
      console.warn('Failed to persist execution snapshot:', err.message);
    }

    return {
      executionId: executionId || 'temp-' + Date.now(),
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      exitCode,
      executionTime: result.executionTime,
      memoryUsage: result.memoryUsage,
      engineUsed: result.engineUsed,
      fallbackOccurred: result.fallbackOccurred || false,
      notes: result.notes,
    };
  },

  /**
   * Get single execution status by ID
   */
  async getExecution(executionId: string, userId?: string) {
    const res = await pool.query(
      `SELECT * FROM ide_executions WHERE id = $1 ${userId ? 'AND user_id = $2' : ''}`,
      userId ? [executionId, userId] : [executionId]
    );
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Execution record not found');
    }
    const row = res.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      language: row.language,
      sourceCode: row.source_code_snapshot,
      stdin: row.stdin,
      executionEngine: row.execution_engine,
      status: row.execution_status,
      stdout: row.stdout,
      stderr: row.stderr,
      compileOutput: row.compile_output,
      exitCode: row.exit_code,
      executionTime: row.execution_time,
      memoryUsed: row.memory_used,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  },

  /**
   * Return list of supported languages with starter templates and runtimes
   */
  getSupportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES).map((lang) => {
      const meta = STARTER_MAP[lang.slug] || {
        filename: `main.${lang.extension}`,
        starter: `// ${lang.name} starter template\n`,
      };
      return {
        id: lang.id,
        name: lang.name,
        slug: lang.slug,
        extension: lang.extension,
        monacoLang: lang.monacoLang,
        defaultFilename: meta.filename,
        wasmSupported: lang.wasmSupported,
        judge0Supported: lang.judge0Supported,
        starterCode: meta.starter,
        notes: lang.notes,
      };
    });
  },

  /**
   * Get user's complete workspace (active project, files, tabs, and settings)
   */
  async getUserWorkspace(userId: string) {
    // 1. Get or create settings
    const settings = await this.getSettings(userId);

    // 2. Find last active or updated project
    const projectsRes = await pool.query(
      `SELECT * FROM ide_projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

    let activeProject = projectsRes.rows[0];

    // If user has no project, create a starter "Default Workspace"
    if (!activeProject) {
      activeProject = await this.createProject(userId, {
        projectName: 'Default Workspace',
        description: 'Personal CodeVerse online development workspace',
        defaultLanguage: settings.defaultLanguage || 'python',
      });
    }

    const projectDetails = await this.getProjectById(activeProject.id, userId);

    return {
      settings,
      project: projectDetails,
    };
  },

  /**
   * List all projects for a user
   */
  async getProjects(userId: string) {
    const res = await pool.query(
      `SELECT p.*, COUNT(f.id)::int as file_count
       FROM ide_projects p
       LEFT JOIN ide_files f ON f.project_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      projectName: r.project_name,
      description: r.description,
      defaultLanguage: r.default_language,
      visibility: r.visibility,
      fileCount: r.file_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  /**
   * Get project by ID along with its files and open tabs
   */
  async getProjectById(projectId: string, userId: string) {
    const projRes = await pool.query(
      `SELECT * FROM ide_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (projRes.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }
    const project = projRes.rows[0];

    const filesRes = await pool.query(
      `SELECT * FROM ide_files WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId]
    );

    const tabsRes = await pool.query(
      `SELECT * FROM ide_open_tabs WHERE project_id = $1 AND user_id = $2 ORDER BY tab_order ASC`,
      [projectId, userId]
    );

    return {
      id: project.id,
      userId: project.user_id,
      projectName: project.project_name,
      description: project.description,
      defaultLanguage: project.default_language,
      visibility: project.visibility,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      files: filesRes.rows.map((f) => ({
        id: f.id,
        projectId: f.project_id,
        name: f.file_name,
        path: f.file_path,
        language: f.language,
        content: f.source_code,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
      openTabs: tabsRes.rows.map((t) => ({
        id: t.id,
        fileId: t.file_id,
        tabOrder: t.tab_order,
        isActive: t.is_active,
      })),
    };
  },

  /**
   * Create a new project with starter file
   */
  async createProject(
    userId: string,
    data: {
      projectName: string;
      description?: string;
      defaultLanguage?: string;
      initialFiles?: Array<{ name: string; content?: string; language?: string }>;
    }
  ) {
    const langSlug = data.defaultLanguage || 'python';
    const langInfo = resolveLanguage(langSlug) || SUPPORTED_LANGUAGES[71]; // python default

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const projRes = await client.query(
        `INSERT INTO ide_projects (user_id, project_name, description, default_language)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, data.projectName.trim(), data.description || '', langInfo.slug]
      );
      const project = projRes.rows[0];

      const meta = STARTER_MAP[langInfo.slug] || {
        filename: `main.${langInfo.extension}`,
        starter: `// ${langInfo.name} starter template\n`,
      };

      // Initial files
      const filesToCreate =
        data.initialFiles && data.initialFiles.length > 0
          ? data.initialFiles
          : [
              {
                name: meta.filename,
                content: meta.starter,
                language: langInfo.slug,
              },
            ];

      const createdFiles: any[] = [];
      for (let i = 0; i < filesToCreate.length; i++) {
        const f = filesToCreate[i];
        const fRes = await client.query(
          `INSERT INTO ide_files (project_id, file_name, file_path, language, source_code)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [project.id, f.name, '/', f.language || langInfo.slug, f.content || '']
        );
        createdFiles.push(fRes.rows[0]);

        // Add open tab
        await client.query(
          `INSERT INTO ide_open_tabs (user_id, project_id, file_id, tab_order, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, project.id, fRes.rows[0].id, i, i === 0]
        );
      }

      await client.query('COMMIT');

      return {
        id: project.id,
        userId: project.user_id,
        projectName: project.project_name,
        description: project.description,
        defaultLanguage: project.default_language,
        visibility: project.visibility,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        files: createdFiles.map((f) => ({
          id: f.id,
          projectId: f.project_id,
          name: f.file_name,
          path: f.file_path,
          language: f.language,
          content: f.source_code,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        })),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Update project details
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: {
      projectName?: string;
      description?: string;
      defaultLanguage?: string;
      visibility?: string;
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.projectName !== undefined) {
      values.push(data.projectName.trim());
      fields.push(`project_name = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      fields.push(`description = $${values.length}`);
    }
    if (data.defaultLanguage !== undefined) {
      values.push(data.defaultLanguage);
      fields.push(`default_language = $${values.length}`);
    }
    if (data.visibility !== undefined) {
      values.push(data.visibility);
      fields.push(`visibility = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.getProjectById(projectId, userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(projectId);
    values.push(userId);

    const query = `
      UPDATE ide_projects
      SET ${fields.join(', ')}
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING *
    `;

    const res = await pool.query(query, values);
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }
    return this.getProjectById(projectId, userId);
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string) {
    const res = await pool.query(
      `DELETE FROM ide_projects WHERE id = $1 AND user_id = $2 RETURNING id`,
      [projectId, userId]
    );
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }
    return { success: true, message: 'Project deleted successfully' };
  },

  /**
   * Create a new file in a project
   */
  async createProjectFile(
    projectId: string,
    userId: string,
    data: {
      fileName: string;
      filePath?: string;
      language?: string;
      sourceCode?: string;
    }
  ) {
    // Verify ownership
    const proj = await pool.query(
      `SELECT * FROM ide_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (proj.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }

    const langInfo = resolveLanguage(data.language || proj.rows[0].default_language);
    const langSlug = langInfo?.slug || 'plaintext';

    const insertRes = await pool.query(
      `INSERT INTO ide_files (project_id, file_name, file_path, language, source_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        projectId,
        data.fileName.trim(),
        data.filePath || '/',
        langSlug,
        data.sourceCode || langInfo?.starterCode || '',
      ]
    );

    const file = insertRes.rows[0];

    // Update project updated_at
    await pool.query(`UPDATE ide_projects SET updated_at = NOW() WHERE id = $1`, [projectId]);

    return {
      id: file.id,
      projectId: file.project_id,
      name: file.file_name,
      path: file.file_path,
      language: file.language,
      content: file.source_code,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    };
  },

  /**
   * Update file content or filename
   */
  async updateProjectFile(
    fileId: string,
    projectId: string,
    userId: string,
    data: {
      fileName?: string;
      filePath?: string;
      language?: string;
      sourceCode?: string;
    }
  ) {
    // Verify user owns project
    const proj = await pool.query(
      `SELECT * FROM ide_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (proj.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (data.fileName !== undefined) {
      values.push(data.fileName.trim());
      fields.push(`file_name = $${values.length}`);
    }
    if (data.filePath !== undefined) {
      values.push(data.filePath);
      fields.push(`file_path = $${values.length}`);
    }
    if (data.language !== undefined) {
      values.push(data.language);
      fields.push(`language = $${values.length}`);
    }
    if (data.sourceCode !== undefined) {
      values.push(data.sourceCode);
      fields.push(`source_code = $${values.length}`);
    }

    if (fields.length === 0) {
      const existing = await pool.query(`SELECT * FROM ide_files WHERE id = $1`, [fileId]);
      return existing.rows[0];
    }

    fields.push(`updated_at = NOW()`);
    values.push(fileId);
    values.push(projectId);

    const query = `
      UPDATE ide_files
      SET ${fields.join(', ')}
      WHERE id = $${values.length - 1} AND project_id = $${values.length}
      RETURNING *
    `;

    const res = await pool.query(query, values);
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'File not found');
    }

    // Touch project updated_at
    await pool.query(`UPDATE ide_projects SET updated_at = NOW() WHERE id = $1`, [projectId]);

    const file = res.rows[0];
    return {
      id: file.id,
      projectId: file.project_id,
      name: file.file_name,
      path: file.file_path,
      language: file.language,
      content: file.source_code,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    };
  },

  /**
   * Delete a file from a project
   */
  async deleteProjectFile(fileId: string, projectId: string, userId: string) {
    // Verify user owns project
    const proj = await pool.query(
      `SELECT * FROM ide_projects WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    if (proj.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Project not found');
    }

    // Check count of files (prevent deleting last file)
    const countRes = await pool.query(
      `SELECT count(*)::int as count FROM ide_files WHERE project_id = $1`,
      [projectId]
    );
    if (countRes.rows[0].count <= 1) {
      throw new AppError(400, 'CANNOT_DELETE_LAST_FILE', 'Projects must have at least one file');
    }

    const res = await pool.query(
      `DELETE FROM ide_files WHERE id = $1 AND project_id = $2 RETURNING id`,
      [fileId, projectId]
    );
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'File not found');
    }

    // Touch project updated_at
    await pool.query(`UPDATE ide_projects SET updated_at = NOW() WHERE id = $1`, [projectId]);

    return { success: true, message: 'File deleted successfully' };
  },

  /**
   * Update open tabs order & active tab
   */
  async updateOpenTabs(
    projectId: string,
    userId: string,
    tabs: Array<{ fileId: string; tabOrder: number; isActive: boolean }>
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM ide_open_tabs WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      for (const t of tabs) {
        await client.query(
          `INSERT INTO ide_open_tabs (user_id, project_id, file_id, tab_order, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, projectId, t.fileId, t.tabOrder, t.isActive]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get paginated execution history
   */
  async getHistory(
    userId: string,
    params: { page?: number; limit?: number; language?: string; projectId?: string }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['e.user_id = $1'];
    const queryParams: any[] = [userId];

    if (params.language && params.language !== 'all') {
      queryParams.push(params.language);
      conditions.push(`e.language = $${queryParams.length}`);
    }

    if (params.projectId) {
      queryParams.push(params.projectId);
      conditions.push(`e.project_id = $${queryParams.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(
      `SELECT count(*)::int as total FROM ide_executions e WHERE ${whereClause}`,
      queryParams
    );
    const total = countRes.rows[0]?.total || 0;

    queryParams.push(limit);
    queryParams.push(offset);

    const listRes = await pool.query(
      `SELECT e.id, e.user_id, e.project_id, e.language, e.execution_engine,
              e.execution_status, e.exit_code, e.execution_time, e.memory_used,
              e.created_at, e.completed_at,
              LEFT(e.source_code_snapshot, 1000) as source_preview,
              e.stdout, e.stderr, e.compile_output,
              p.project_name
       FROM ide_executions e
       LEFT JOIN ide_projects p ON p.id = e.project_id
       WHERE ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return {
      items: listRes.rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name || 'Quick Sandbox',
        language: r.language,
        executionEngine: r.execution_engine,
        status: r.execution_status,
        exitCode: r.exit_code,
        executionTime: r.execution_time,
        memoryUsed: r.memory_used,
        sourceCode: r.source_preview,
        stdout: r.stdout,
        stderr: r.stderr,
        compileOutput: r.compile_output,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Delete an execution history record
   */
  async deleteHistory(executionId: string, userId: string) {
    const res = await pool.query(
      `DELETE FROM ide_executions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [executionId, userId]
    );
    if (res.rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Execution history record not found');
    }
    return { success: true, message: 'Execution record deleted successfully' };
  },

  /**
   * Get user IDE settings or defaults
   */
  async getSettings(userId: string) {
    const res = await pool.query(
      `SELECT * FROM ide_settings WHERE user_id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      // Insert default settings
      const insert = await pool.query(
        `INSERT INTO ide_settings (user_id, editor_theme, font_size, tab_size, word_wrap, minimap_enabled, auto_save_enabled, default_language)
         VALUES ($1, 'vs-dark', 14, 2, true, false, true, 'python')
         RETURNING *`,
        [userId]
      );
      const s = insert.rows[0];
      return {
        editorTheme: s.editor_theme,
        fontSize: s.font_size,
        tabSize: s.tab_size,
        wordWrap: s.word_wrap,
        minimapEnabled: s.minimap_enabled,
        autoSaveEnabled: s.auto_save_enabled,
        defaultLanguage: s.default_language,
      };
    }
    const s = res.rows[0];
    return {
      editorTheme: s.editor_theme,
      fontSize: s.font_size,
      tabSize: s.tab_size,
      wordWrap: s.word_wrap,
      minimapEnabled: s.minimap_enabled,
      autoSaveEnabled: s.auto_save_enabled,
      defaultLanguage: s.default_language,
    };
  },

  /**
   * Update user IDE preferences
   */
  async updateSettings(
    userId: string,
    data: {
      editorTheme?: string;
      fontSize?: number;
      tabSize?: number;
      wordWrap?: boolean;
      minimapEnabled?: boolean;
      autoSaveEnabled?: boolean;
      defaultLanguage?: string;
    }
  ) {
    const existing = await this.getSettings(userId);
    const updated = {
      ...existing,
      ...data,
    };

    const res = await pool.query(
      `INSERT INTO ide_settings (
        user_id, editor_theme, font_size, tab_size, word_wrap,
        minimap_enabled, auto_save_enabled, default_language, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        editor_theme = EXCLUDED.editor_theme,
        font_size = EXCLUDED.font_size,
        tab_size = EXCLUDED.tab_size,
        word_wrap = EXCLUDED.word_wrap,
        minimap_enabled = EXCLUDED.minimap_enabled,
        auto_save_enabled = EXCLUDED.auto_save_enabled,
        default_language = EXCLUDED.default_language,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        updated.editorTheme,
        updated.fontSize,
        updated.tabSize,
        updated.wordWrap,
        updated.minimapEnabled,
        updated.autoSaveEnabled,
        updated.defaultLanguage,
      ]
    );

    const s = res.rows[0];
    return {
      editorTheme: s.editor_theme,
      fontSize: s.font_size,
      tabSize: s.tab_size,
      wordWrap: s.word_wrap,
      minimapEnabled: s.minimap_enabled,
      autoSaveEnabled: s.auto_save_enabled,
      defaultLanguage: s.default_language,
    };
  },
};
