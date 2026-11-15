'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Settings,
  Cpu,
  Type,
  Sun,
  Moon,
  Sparkles,
  Folder,
  History,
  Check,
  Save,
  FileCode,
  Sliders,
} from 'lucide-react';
import {
  IDE_LANGUAGES,
  IdeLanguage,
  IdeFile,
  IdeExecutionState,
} from './types';
import { LanguageSidebar } from './LanguageSidebar';
import { FileTabs } from './FileTabs';
import { OutputPanel } from './OutputPanel';
import { ProjectsModal } from './ProjectsModal';
import { ExecutionHistoryDrawer } from './ExecutionHistoryDrawer';
import { wasmManager } from '@/services/wasm-executor/wasm-manager';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { ideApi } from '@/lib/api';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-500 font-mono text-sm">
        Loading editor...
      </div>
    ),
  }
);

const LOCAL_STORAGE_KEY = 'codemitra_ide_files_v1';
const LOCAL_STORAGE_LANG = 'codemitra_ide_lang_v1';

export function OnlineIde({ className }: { className?: string } = {}) {
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);

  const [selectedLanguage, setSelectedLanguage] = useState<IdeLanguage>(IDE_LANGUAGES[0]);
  const [files, setFiles] = useState<IdeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [engine, setEngine] = useState<'auto' | 'wasm' | 'judge0'>('auto');

  // Workspace & Project State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string>(user ? 'Workspace' : 'Guest Playground');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Theme synchronization with app light/dark mode
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [themeOverride, setThemeOverride] = useState<'vs-dark' | 'light' | null>(null);
  const currentTheme = themeOverride ?? (isDark ? 'vs-dark' : 'light');

  const handleToggleTheme = () => {
    toggleTheme();
    setThemeOverride(null);
  };

  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme('light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '2563eb', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#2563eb',
        'editor.lineHighlightBackground': '#f8fafc',
        'editor.selectionBackground': '#bfdbfe80',
        'editorCursor.foreground': '#2563eb',
      },
    });

    monaco.editor.defineTheme('vs-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
      ],
      colors: {
        'editor.background': '#020817',
        'editor.foreground': '#f8fafc',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editor.lineHighlightBackground': '#0f172a80',
        'editor.selectionBackground': '#1e3a8a60',
        'editorCursor.foreground': '#38bdf8',
      },
    });
  };

  // Editor settings
  const [fontSize, setFontSize] = useState<number>(14);
  const [tabSize, setTabSize] = useState<number>(2);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [minimapEnabled, setMinimapEnabled] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

  // Execution state
  const [executionState, setExecutionState] = useState<IdeExecutionState>({
    status: 'idle',
    stdout: '',
    stderr: '',
    compileOutput: '',
    executionTime: 0,
    memoryUsage: null,
  });

  const ideContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load Guest Workspace from LocalStorage / Fallback Defaults ─────────
  const loadGuestWorkspace = useCallback(() => {
    setActiveProjectId(null);
    setActiveProjectName('Guest Playground');

    try {
      const savedLangId = localStorage.getItem(LOCAL_STORAGE_LANG);
      const initialLang =
        IDE_LANGUAGES.find((l) => l.id === Number(savedLangId)) || IDE_LANGUAGES[0];
      setSelectedLanguage(initialLang);

      const savedFilesJson = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedFilesJson) {
        const parsed = JSON.parse(savedFilesJson) as IdeFile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFiles(parsed);
          setActiveFileId(parsed[0].id);
          return;
        }
      }

      const initialFile: IdeFile = {
        id: 'file-1',
        name: initialLang.defaultFilename,
        languageId: initialLang.id,
        content: initialLang.starterCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setFiles([initialFile]);
      setActiveFileId(initialFile.id);
    } catch {
      const initialLang = IDE_LANGUAGES[0];
      const initialFile: IdeFile = {
        id: 'file-1',
        name: initialLang.defaultFilename,
        languageId: initialLang.id,
        content: initialLang.starterCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setFiles([initialFile]);
      setActiveFileId(initialFile.id);
    }
  }, []);

  // ── Load Workspace & Projects from Backend / LocalStorage ──────────────
  const loadWorkspace = useCallback(async () => {
    // If not authenticated, do not query the server workspace API.
    if (!user) {
      loadGuestWorkspace();
      return;
    }

    try {
      // 1. Try server workspace for logged-in user
      const res = await ideApi.getWorkspace();
      const workspace = res.data.data;
      if (workspace && workspace.project) {
        const proj = workspace.project;
        setActiveProjectId(proj.id);
        setActiveProjectName(proj.projectName || 'My Project');

        if (Array.isArray(proj.files) && proj.files.length > 0) {
          const loadedFiles: IdeFile[] = proj.files.map((f: any) => ({
            id: f.id,
            name: f.name || f.fileName,
            languageId:
              IDE_LANGUAGES.find((l) => l.slug === f.language)?.id || IDE_LANGUAGES[0].id,
            content: f.content || f.sourceCode || '',
            createdAt: new Date(f.createdAt || Date.now()).getTime(),
            updatedAt: new Date(f.updatedAt || Date.now()).getTime(),
          }));
          setFiles(loadedFiles);

          // Find active tab or first file
          const activeTab = proj.openTabs?.find((t: any) => t.isActive);
          if (activeTab && loadedFiles.some((f) => f.id === activeTab.fileId)) {
            setActiveFileId(activeTab.fileId);
          } else {
            setActiveFileId(loadedFiles[0].id);
          }

          // Match language
          const primaryLang =
            IDE_LANGUAGES.find((l) => l.slug === proj.defaultLanguage) ||
            IDE_LANGUAGES.find((l) => l.id === loadedFiles[0].languageId) ||
            IDE_LANGUAGES[0];
          setSelectedLanguage(primaryLang);
        }

        // Apply server settings
        if (workspace.settings) {
          if (workspace.settings.fontSize) setFontSize(workspace.settings.fontSize);
          if (workspace.settings.tabSize) setTabSize(workspace.settings.tabSize);
          if (workspace.settings.wordWrap !== undefined)
            setWordWrap(workspace.settings.wordWrap ? 'on' : 'off');
          if (workspace.settings.minimapEnabled !== undefined)
            setMinimapEnabled(workspace.settings.minimapEnabled);
        }
        return;
      }
    } catch {
      // Fallback to local storage for guest or offline mode
    }

    loadGuestWorkspace();
  }, [user, loadGuestWorkspace]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Load specific project on selection
  const handleSelectProject = async (projectId: string) => {
    if (!user) return;
    try {
      const res = await ideApi.getProject(projectId);
      const proj = res.data.data;
      if (!proj) return;

      setActiveProjectId(proj.id);
      setActiveProjectName(proj.projectName);

      if (Array.isArray(proj.files) && proj.files.length > 0) {
        const loadedFiles: IdeFile[] = proj.files.map((f: any) => ({
          id: f.id,
          name: f.name || f.fileName,
          languageId:
            IDE_LANGUAGES.find((l) => l.slug === f.language)?.id || IDE_LANGUAGES[0].id,
          content: f.content || f.sourceCode || '',
          createdAt: new Date(f.createdAt || Date.now()).getTime(),
          updatedAt: new Date(f.updatedAt || Date.now()).getTime(),
        }));
        setFiles(loadedFiles);

        const activeTab = proj.openTabs?.find((t: any) => t.isActive);
        if (activeTab && loadedFiles.some((f) => f.id === activeTab.fileId)) {
          setActiveFileId(activeTab.fileId);
        } else {
          setActiveFileId(loadedFiles[0].id);
        }

        const primaryLang =
          IDE_LANGUAGES.find((l) => l.slug === proj.defaultLanguage) ||
          IDE_LANGUAGES.find((l) => l.id === loadedFiles[0].languageId) ||
          IDE_LANGUAGES[0];
        setSelectedLanguage(primaryLang);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  // Preload WASM when language changes
  useEffect(() => {
    if (typeof window !== 'undefined' && wasmManager.canExecuteLocally(selectedLanguage.id)) {
      wasmManager.preload(selectedLanguage.id);
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_LANG, String(selectedLanguage.id));
    } catch {}
  }, [selectedLanguage]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // ── Debounced Server / Local Storage Save ──────────────────────────────────
  const persistChanges = useCallback(
    (currentFiles: IdeFile[], fileToSave?: IdeFile) => {
      // 1. LocalStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentFiles));
      } catch {}

      // 2. Server save if active project exists
      if (user && activeProjectId && fileToSave && !fileToSave.id.startsWith('file-')) {
        setSaveStatus('saving');
        ideApi
          .updateFile(activeProjectId, fileToSave.id, {
            fileName: fileToSave.name,
            sourceCode: fileToSave.content,
          })
          .then(() => {
            setSaveStatus('saved');
          })
          .catch(() => {
            setSaveStatus('saved');
          });
      } else {
        setSaveStatus('saved');
      }
    },
    [user, activeProjectId]
  );

  // Editor content update with debounce
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;

    setSaveStatus('unsaved');
    const updatedFile: IdeFile = { ...activeFile, content: value, updatedAt: Date.now() };
    const nextFiles = files.map((f) => (f.id === activeFile.id ? updatedFile : f));
    setFiles(nextFiles);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistChanges(nextFiles, updatedFile);
    }, 1000);
  };

  // Language Switch
  const handleSelectLanguage = (newLang: IdeLanguage) => {
    setSelectedLanguage(newLang);

    if (activeFile) {
      const existingFile = files.find((f) => f.languageId === newLang.id);
      if (existingFile) {
        setActiveFileId(existingFile.id);
      } else {
        const newFile: IdeFile = {
          id: `file-${Date.now()}`,
          name: newLang.defaultFilename,
          languageId: newLang.id,
          content: newLang.starterCode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        setActiveFileId(newFile.id);

        if (user && activeProjectId) {
          ideApi
            .createFile(activeProjectId, {
              fileName: newFile.name,
              language: newLang.slug,
              sourceCode: newFile.content,
            })
            .then((res) => {
              if (res.data.data?.id) {
                const serverId = res.data.data.id;
                setFiles((prev) =>
                  prev.map((f) => (f.id === newFile.id ? { ...f, id: serverId } : f))
                );
                setActiveFileId(serverId);
              }
            })
            .catch(() => {});
        }
      }
    }
  };

  // Add new file
  const handleAddFile = () => {
    const ext = selectedLanguage.extension;
    const count = files.filter((f) => f.languageId === selectedLanguage.id).length + 1;
    const base = selectedLanguage.defaultFilename.split('.')[0];
    const newName = count === 1 ? selectedLanguage.defaultFilename : `${base}_${count}.${ext}`;

    const newFile: IdeFile = {
      id: `file-${Date.now()}`,
      name: newName,
      languageId: selectedLanguage.id,
      content: selectedLanguage.starterCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);

    if (user && activeProjectId) {
      ideApi
        .createFile(activeProjectId, {
          fileName: newName,
          language: selectedLanguage.slug,
          sourceCode: newFile.content,
        })
        .then((res) => {
          if (res.data.data?.id) {
            const serverId = res.data.data.id;
            setFiles((prev) =>
              prev.map((f) => (f.id === newFile.id ? { ...f, id: serverId } : f))
            );
            setActiveFileId(serverId);
          }
        })
        .catch(() => {});
    }
  };

  // Close / Delete file
  const handleCloseFile = (fileId: string) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }

    if (user && activeProjectId && !fileId.startsWith('file-')) {
      ideApi.deleteFile(activeProjectId, fileId).catch(() => {});
    }
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName, updatedAt: Date.now() } : f))
    );

    if (user && activeProjectId && !fileId.startsWith('file-')) {
      ideApi.updateFile(activeProjectId, fileId, { fileName: newName }).catch(() => {});
    }
  };

  // Clear current code / Reset code
  const handleClearCode = () => {
    if (confirm('Reset code to starter template in current file?')) {
      handleEditorChange(selectedLanguage.starterCode);
    }
  };

  // Download active file
  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export full project
  const handleExportProject = () => {
    const projectExport = {
      project: activeProjectName,
      exportedAt: new Date().toISOString(),
      files: files.map((f) => ({
        name: f.name,
        language: IDE_LANGUAGES.find((l) => l.id === f.languageId)?.slug,
        content: f.content,
      })),
    };
    const blob = new Blob([JSON.stringify(projectExport, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProjectName.toLowerCase().replace(/\s+/g, '-')}-project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore snapshot from execution history
  const handleRestoreFromHistory = (code: string, langSlug: string) => {
    const matchedLang = IDE_LANGUAGES.find((l) => l.slug === langSlug) || selectedLanguage;
    setSelectedLanguage(matchedLang);
    handleEditorChange(code);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!ideContainerRef.current) return;
    if (!document.fullscreenElement) {
      ideContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Execute Code (Backend Smart Router with Local WASM Fallback)
  const handleRunCode = async () => {
    if (!activeFile || executionState.status === 'running') return;

    setExecutionState({
      status: 'running',
      stdout: '',
      stderr: '',
      compileOutput: '',
      executionTime: 0,
      memoryUsage: null,
      engineUsed: undefined,
    });

    try {
      // 1. Run through server Smart Router
      const response = await ideApi.execute({
        language: selectedLanguage.id,
        sourceCode: activeFile.content,
        stdin: customInput,
        engine,
        projectId: activeProjectId || undefined,
      });

      const result = response.data.data;
      if (result) {
        setExecutionState({
          status: result.status,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compileOutput: result.compileOutput || '',
          executionTime: result.executionTime || 0,
          memoryUsage: result.memoryUsage || null,
          engineUsed: result.engineUsed,
          notes: result.notes,
        });
        return;
      }
    } catch {
      // 2. Client-side isolated fallback
      try {
        const clientResult = await wasmManager.execute(
          {
            language: selectedLanguage.id,
            code: activeFile.content,
            stdin: customInput,
            timeLimitMs: 5000,
          },
          engine
        );

        setExecutionState({
          status: clientResult.status,
          stdout: clientResult.stdout,
          stderr: clientResult.stderr,
          compileOutput: clientResult.compileOutput,
          executionTime: clientResult.executionTime,
          memoryUsage: clientResult.memoryUsage,
          engineUsed: clientResult.engineUsed,
          notes: clientResult.notes,
        });
      } catch (err: any) {
        setExecutionState({
          status: 'failed',
          stdout: '',
          stderr: err.message || 'Execution error occurred.',
          compileOutput: '',
          executionTime: 0,
          memoryUsage: null,
        });
      }
    }
  };

  // Stop / Cancel Execution
  const handleStopExecution = () => {
    wasmManager.terminate();
    setExecutionState((prev) => ({
      ...prev,
      status: 'timed_out',
      stderr: 'Execution stopped by user.',
    }));
  };

  return (
    <div
      ref={ideContainerRef}
      className={`flex flex-col h-full min-h-[580px] w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl dark:shadow-2xl transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      } ${className || ''}`}
    >
      {/* ── Top IDE Action Bar ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs transition-colors">
        {/* Left: Language Info & Run Controls */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          {executionState.status === 'running' ? (
            <button
              type="button"
              onClick={handleStopExecution}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
            >
              <Square size={13} fill="currentColor" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRunCode}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all"
            >
              <Play size={13} fill="currentColor" />
              <span>Run</span>
            </button>
          )}

          {/* Engine Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <Cpu size={12} className="text-blue-500 dark:text-blue-400" />
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium text-xs outline-none cursor-pointer"
            >
              <option value="auto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Auto (Smart Router)</option>
              <option value="wasm" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">WebAssembly & Sandbox ⚡</option>
              <option value="judge0" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Judge0 Container ☁️</option>
            </select>
          </div>

          {/* Current Language Pill */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
            <Sparkles size={11} />
            {selectedLanguage.name}
          </span>

          {/* Project Switcher Pill */}
          <button
            type="button"
            onClick={() => setIsProjectsOpen(true)}
            title="Switch Workspace Project"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 font-medium transition-colors shadow-sm"
          >
            <Folder size={12} className="text-blue-500" />
            <span className="truncate max-w-[120px]">{activeProjectName}</span>
          </button>

          {/* Save Status */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-blue-500 animate-pulse">
                <Save size={11} /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Check size={11} className="text-emerald-500" /> Saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                • Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Right: Tools & Configuration */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Execution History */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            title="Execution History & Snapshots"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            <History size={14} />
          </button>

          {/* Reset Code */}
          <button
            type="button"
            onClick={handleClearCode}
            title="Reset code to starter template"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          {/* Download File */}
          <button
            type="button"
            onClick={handleDownloadFile}
            title="Download current file"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Download size={14} />
          </button>

          {/* Export Project */}
          <button
            type="button"
            onClick={handleExportProject}
            title="Export full workspace project (JSON)"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors hidden sm:block"
          >
            <FileCode size={14} />
          </button>

          {/* Quick Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            title={currentTheme === 'vs-dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            {currentTheme === 'vs-dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-slate-600" />}
          </button>

          {/* Settings Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Editor Settings"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
            >
              <Settings size={14} />
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-8 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders size={13} className="text-blue-500" /> Editor Preferences
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded px-2 py-1 text-slate-800 dark:text-white outline-none"
                  >
                    <option value={12}>12 px</option>
                    <option value={14}>14 px (Default)</option>
                    <option value={16}>16 px</option>
                    <option value={18}>18 px</option>
                    <option value={20}>20 px</option>
                  </select>
                </div>

                {/* Tab Size */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Tab Size</label>
                  <select
                    value={tabSize}
                    onChange={(e) => setTabSize(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded px-2 py-1 text-slate-800 dark:text-white outline-none"
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Theme</label>
                  <button
                    type="button"
                    onClick={handleToggleTheme}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-white transition-colors"
                  >
                    <span>{currentTheme === 'vs-dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    {currentTheme === 'vs-dark' ? <Moon size={13} className="text-blue-400" /> : <Sun size={13} className="text-amber-500" />}
                  </button>
                </div>

                {/* Word Wrap */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Word Wrap</label>
                  <button
                    type="button"
                    onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-white transition-colors"
                  >
                    <span>{wordWrap === 'on' ? 'Enabled' : 'Disabled'}</span>
                    <Type size={12} className="text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {/* Minimap */}
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Code Minimap</label>
                  <button
                    type="button"
                    onClick={() => setMinimapEnabled(!minimapEnabled)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-white transition-colors"
                  >
                    <span>{minimapEnabled ? 'Visible' : 'Hidden'}</span>
                    <Check size={12} className={minimapEnabled ? 'text-emerald-500' : 'opacity-0'} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body (3-Column Layout) ───────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Area A: Vertical Language Sidebar */}
        <LanguageSidebar
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleSelectLanguage}
        />

        {/* Area B: Center Code Editor with File Tabs */}
        <div
          className={`flex flex-col flex-1 h-full overflow-hidden transition-all duration-150 ${
            isOutputExpanded ? 'hidden sm:flex sm:w-1/3' : 'w-full'
          }`}
        >
          {/* Multiple File Tabs */}
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onAddFile={handleAddFile}
            onCloseFile={handleCloseFile}
            onRenameFile={handleRenameFile}
            currentLangSlug={selectedLanguage.slug}
          />

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full h-full relative">
            <MonacoEditor
              height="100%"
              theme={currentTheme}
              beforeMount={handleEditorBeforeMount}
              language={selectedLanguage.monacoLang}
              value={activeFile?.content || ''}
              onChange={handleEditorChange}
              options={{
                fontSize,
                tabSize,
                wordWrap,
                minimap: { enabled: minimapEnabled },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                renderWhitespace: 'selection',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>

        {/* Area C: Right Output Panel */}
        <div
          className={`h-full transition-all duration-150 ${
            isOutputExpanded
              ? 'w-full sm:w-2/3'
              : 'w-full sm:w-[420px] lg:w-[480px]'
          }`}
        >
          <OutputPanel
            executionState={executionState}
            customInput={customInput}
            onChangeCustomInput={setCustomInput}
            activeLanguage={selectedLanguage}
            activeCode={activeFile?.content || ''}
            onClearOutput={() =>
              setExecutionState({
                status: 'idle',
                stdout: '',
                stderr: '',
                compileOutput: '',
                executionTime: 0,
                memoryUsage: null,
              })
            }
            isExpanded={isOutputExpanded}
            onToggleExpand={() => setIsOutputExpanded(!isOutputExpanded)}
          />
        </div>
      </div>

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        activeProjectId={activeProjectId || undefined}
        onSelectProject={handleSelectProject}
      />

      {/* Execution History Drawer */}
      <ExecutionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestoreCode={handleRestoreFromHistory}
      />
    </div>
  );
}
export default OnlineIde;
