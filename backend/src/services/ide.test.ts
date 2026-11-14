import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db';
import { ideService } from './ide.service';

after(async () => {
  await pool.end();
});

test('Online IDE Full-Stack Service Suite', async (t) => {
  // Find a test user (super_admin or student)
  const userRes = await pool.query('SELECT id FROM users WHERE NOT is_deleted LIMIT 1');
  assert.ok(userRes.rows[0], 'A test user should exist');
  const testUserId = userRes.rows[0].id;

  let createdProjectId: string;
  let createdFileId: string;
  let recordedExecutionId: string;

  await t.test('1. getSupportedLanguages returns comprehensive language catalog', () => {
    const languages = ideService.getSupportedLanguages();
    assert.ok(Array.isArray(languages));
    assert.ok(languages.length >= 13);
    const python = languages.find((l) => l.slug === 'python');
    assert.ok(python, 'Python must be present in supported languages');
    assert.equal(python.extension, 'py');
    assert.ok(python.starterCode.length > 0);
  });

  await t.test('2. executeCode runs Python code in sandbox and records snapshot', async () => {
    const res = await ideService.executeCode(testUserId, {
      language: 'python',
      sourceCode: "print('Hello from CodeVerse Real Sandbox!')",
      engine: 'auto',
    });

    assert.equal(res.status, 'completed');
    assert.ok(res.stdout.includes('Hello from CodeVerse Real Sandbox!'));
    assert.ok(res.executionTime >= 0);
    assert.ok(res.executionId);
    recordedExecutionId = res.executionId;
  });

  await t.test('3. executeCode handles stdin multiline streaming', async () => {
    const res = await ideService.executeCode(testUserId, {
      language: 'python',
      sourceCode: `import sys\nlines = sys.stdin.read().splitlines()\nprint(f"Received {len(lines)} lines: {', '.join(lines)}")`,
      stdin: 'Alpha\nBeta\nGamma',
    });

    assert.equal(res.status, 'completed');
    assert.ok(res.stdout.includes('Received 3 lines: Alpha, Beta, Gamma'));
  });

  await t.test('4. executeCode catches syntax compilation error', async () => {
    const res = await ideService.executeCode(testUserId, {
      language: 'python',
      sourceCode: 'def broken_func(\n  print("Missing parenthesis and syntax error")',
    });

    assert.ok(
      res.status === 'compilation_error' ||
      res.status === 'failed' ||
      res.stderr.length > 0 ||
      res.compileOutput.length > 0
    );
  });

  await t.test('5. createProject creates a project with starter files and open tabs', async () => {
    const project = await ideService.createProject(testUserId, {
      projectName: 'Test Algorithmic Workspace',
      description: 'Automated test suite workspace',
      defaultLanguage: 'python',
    });

    assert.ok(project.id);
    assert.equal(project.projectName, 'Test Algorithmic Workspace');
    assert.ok(project.files.length >= 1);
    createdProjectId = project.id;
  });

  await t.test('6. getProjectById retrieves project files and tabs', async () => {
    const project = await ideService.getProjectById(createdProjectId, testUserId);
    assert.equal(project.id, createdProjectId);
    assert.ok(project.files.length >= 1);
    assert.ok(project.openTabs.length >= 1);
    assert.ok(project.openTabs[0].isActive);
  });

  await t.test('7. createProjectFile adds a new file to the project', async () => {
    const file = await ideService.createProjectFile(createdProjectId, testUserId, {
      fileName: 'utils.py',
      sourceCode: 'def add(a, b): return a + b\n',
      language: 'python',
    });

    assert.ok(file.id);
    assert.equal(file.name, 'utils.py');
    assert.ok(file.content.includes('def add'));
    createdFileId = file.id;
  });

  await t.test('8. updateProjectFile updates content and persists modifications', async () => {
    const updated = await ideService.updateProjectFile(
      createdFileId,
      createdProjectId,
      testUserId,
      {
        sourceCode: 'def add(a, b): return a + b + 10\n',
      }
    );

    assert.equal(updated.id, createdFileId);
    assert.ok(updated.content.includes('+ 10'));
  });

  await t.test('9. updateOpenTabs saves tab order and active tab selection', async () => {
    const res = await ideService.updateOpenTabs(createdProjectId, testUserId, [
      { fileId: createdFileId, tabOrder: 0, isActive: true },
    ]);
    assert.equal(res.success, true);
  });

  await t.test('10. getSettings and updateSettings persists user preferences', async () => {
    const initial = await ideService.getSettings(testUserId);
    assert.ok(initial.fontSize);

    const updated = await ideService.updateSettings(testUserId, {
      fontSize: 16,
      wordWrap: false,
      editorTheme: 'vs-dark',
    });

    assert.equal(updated.fontSize, 16);
    assert.equal(updated.wordWrap, false);
    assert.equal(updated.editorTheme, 'vs-dark');
  });

  await t.test('11. getHistory retrieves user execution records', async () => {
    const history = await ideService.getHistory(testUserId, { page: 1, limit: 10 });
    assert.ok(Array.isArray(history.items));
    assert.ok(history.total >= 1);
    const item = history.items[0];
    assert.ok(item.language);
    assert.ok(item.sourceCode);
  });

  await t.test('12. deleteProjectFile and deleteProject cleanly tears down test data', async () => {
    // Delete file
    const delFile = await ideService.deleteProjectFile(createdFileId, createdProjectId, testUserId);
    assert.equal(delFile.success, true);

    // Delete project
    const delProj = await ideService.deleteProject(createdProjectId, testUserId);
    assert.equal(delProj.success, true);
  });
});
