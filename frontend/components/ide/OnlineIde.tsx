'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { wasmManager } from '@/services/wasm-executor/wasm-manager';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-sm">
        Loading editor...
      </div>
    ),
  }
);

const LOCAL_STORAGE_KEY = 'codemitra_ide_files_v1';
const LOCAL_STORAGE_LANG = 'codemitra_ide_lang_v1';

export function OnlineIde() {
  const [selectedLanguage, setSelectedLanguage] = useState<IdeLanguage>(IDE_LANGUAGES[0]);
  const [files, setFiles] = useState<IdeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [engine, setEngine] = useState<'auto' | 'wasm' | 'judge0'>('auto');

  // Editor settings
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
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

  // Initialize or restore files from localStorage
  useEffect(() => {
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

      // Default initial file
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
      // Fallback in case of localStorage restrictions
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

  // Save files to localStorage on change
  useEffect(() => {
    if (files.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
      } catch {}
    }
  }, [files]);

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

  // Language Switch
  const handleSelectLanguage = (newLang: IdeLanguage) => {
    setSelectedLanguage(newLang);

    // If active file is still on previous language, update or create tab for new language
    if (activeFile) {
      // Check if we already have a file for this language
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
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
    }
  };

  // Editor content update
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, content: value, updatedAt: Date.now() } : f
      )
    );
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
  };

  // Close / Delete file
  const handleCloseFile = (fileId: string) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName, updatedAt: Date.now() } : f))
    );
  };

  // Clear current code
  const handleClearCode = () => {
    if (confirm('Clear code in current file?')) {
      handleEditorChange('');
    }
  };

  // Download / Export code file
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

  // Execute Code
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
      const result = await wasmManager.execute(
        {
          language: selectedLanguage.id,
          code: activeFile.content,
          stdin: customInput,
          timeLimitMs: 5000,
        },
        engine
      );

      setExecutionState({
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
        engineUsed: result.engineUsed,
        notes: result.notes,
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
      className={`flex flex-col h-[calc(100vh-4rem)] min-h-[580px] w-full bg-slate-950 text-white rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
    >
      {/* ── Top IDE Action Bar ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
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
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
            <Cpu size={12} className="text-blue-400" />
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as any)}
              className="bg-transparent text-slate-300 font-medium text-xs outline-none cursor-pointer"
            >
              <option value="auto" className="bg-slate-900 text-white">Auto (Smart Router)</option>
              <option value="wasm" className="bg-slate-900 text-white">WebAssembly & Sandbox ⚡</option>
              <option value="judge0" className="bg-slate-900 text-white">Judge0 Container ☁️</option>
            </select>
          </div>

          {/* Current Language Pill */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            <Sparkles size={11} />
            {selectedLanguage.name}
          </span>
        </div>

        {/* Right: Tools & Configuration */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Clear Code */}
          <button
            type="button"
            onClick={handleClearCode}
            title="Reset code"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          {/* Download File */}
          <button
            type="button"
            onClick={handleDownloadFile}
            title="Download file"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Download size={14} />
          </button>

          {/* Settings Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Editor Settings"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <Settings size={14} />
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-8 w-52 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Editor Settings</span>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-white outline-none"
                  >
                    <option value={12}>12 px</option>
                    <option value={14}>14 px (Default)</option>
                    <option value={16}>16 px</option>
                    <option value={18}>18 px</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Theme</label>
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                    className="w-full flex items-center justify-between px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <span>{theme === 'vs-dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    {theme === 'vs-dark' ? <Moon size={12} /> : <Sun size={12} />}
                  </button>
                </div>

                {/* Word Wrap */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Word Wrap</label>
                  <button
                    type="button"
                    onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                    className="w-full flex items-center justify-between px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <span>{wordWrap === 'on' ? 'Enabled' : 'Disabled'}</span>
                    <Type size={12} />
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
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
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
              theme={theme}
              language={selectedLanguage.monacoLang}
              value={activeFile?.content || ''}
              onChange={handleEditorChange}
              options={{
                fontSize,
                wordWrap,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                tabSize: 2,
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
    </div>
  );
}
export default OnlineIde;

