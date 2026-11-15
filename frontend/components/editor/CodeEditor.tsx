'use client';

import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editorStore';
import { LANGUAGES } from '@/types';
import { ChevronDown, Play, RotateCcw, Send, Terminal } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { isLanguageWasmSupported, wasmManager } from '@/services/wasm-executor/wasm-manager';
import { useTheme } from '@/components/theme/ThemeProvider';

// Dynamic import to prevent SSR issues with Monaco
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface CodeEditorProps {
  problemId: string;
  onSubmit?: (code: string, languageId: number, engine?: 'auto' | 'wasm' | 'judge0') => void;
  onRun?: (code: string, languageId: number, engine?: 'auto' | 'wasm' | 'judge0') => void;
  isSubmitting?: boolean;
}

function EditorSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  );
}

export default function CodeEditor({
  problemId,
  onSubmit,
  onRun,
  isSubmitting,
}: CodeEditorProps) {
  const {
    languageId,
    theme,
    fontSize,
    wordWrap,
    executionEngine,
    isCustomInputOpen,
    setLanguage,
    setCode,
    setTheme,
    setFontSize,
    setExecutionEngine,
    setIsCustomInputOpen,
    getCode,
    clearCode,
  } = useEditorStore();

  const { theme: appTheme, toggleTheme } = useTheme();
  const isDark = appTheme === 'dark';
  const activeTheme = isDark ? (theme === 'light' ? 'light' : 'vs-dark') : (theme === 'vs-dark' ? 'vs-dark' : 'light');

  const handleToggleTheme = () => {
    const nextTheme = activeTheme === 'vs-dark' ? 'light' : 'vs-dark';
    setTheme(nextTheme);
    toggleTheme();
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

  const languages = Object.entries(LANGUAGES).map(([id, language]) => ({
    id: Number(id),
    ...language,
  }));
  const currentLanguage = LANGUAGES[languageId];

  // Preload WASM runtime (e.g. Pyodide / Lua) in the background so it is ready when user runs code
  useEffect(() => {
    if (typeof window !== 'undefined' && isLanguageWasmSupported(languageId)) {
      wasmManager.preload(languageId);
    }
  }, [languageId]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(problemId, languageId, value);
    }
  };

  const handleLanguageChange = (newLanguageId: number) => {
    setLanguage(newLanguageId);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Lang:
            </label>
            <div className="relative">
              <select
                value={languageId}
                onChange={(e) => handleLanguageChange(Number(e.target.value))}
                className="appearance-none pl-2.5 pr-7 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Execution Engine Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Engine:
            </label>
            <div className="relative">
              <select
                value={executionEngine}
                onChange={(e) => setExecutionEngine(e.target.value as any)}
                className="appearance-none pl-2.5 pr-7 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="auto">Auto (Smart Router) 🚀</option>
                <option value="wasm">WebAssembly & Sandbox ⚡</option>
                <option value="judge0">Judge0 Container ☁️</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Custom Stdin Toggle */}
          <button
            type="button"
            onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isCustomInputOpen
                ? 'border-primary/60 bg-primary/10 text-primary dark:text-primary-foreground'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Toggle Custom Input (stdin)"
          >
            <Terminal size={13} />
            Stdin
          </button>
        </div>

        {/* Editor Settings & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Size */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <input
              type="range"
              min="12"
              max="22"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 accent-primary"
            />
            <span className="w-7 font-mono">{fontSize}px</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            title="Toggle Editor Theme"
          >
            {activeTheme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          {/* Reset Code to Starter Template */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset code to starter template? Your current changes for this language will be reset.')) {
                clearCode(problemId, languageId);
              }
            }}
            className="p-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            title="Reset to Starter Template"
          >
            <RotateCcw size={13} />
          </button>

          {/* Run Samples / Run Code Button */}
          {onRun && (
            <button
              type="button"
              onClick={() => onRun(getCode(problemId, languageId), languageId, executionEngine)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors shadow-sm text-gray-800 dark:text-gray-100"
            >
              <Play size={13} className="text-emerald-500 fill-emerald-500" />
              Run Code
            </button>
          )}

          {/* Submit Button */}
          {onSubmit && (
            <button
              type="button"
              onClick={() => {
                const currentCode = getCode(problemId, languageId);
                onSubmit(currentCode, languageId, executionEngine);
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-xs font-semibold shadow-sm"
            >
              <Send size={13} />
              {isSubmitting ? 'Evaluating...' : 'Submit'}
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <Suspense fallback={<EditorSkeleton />}>
        <div className="flex-1 overflow-hidden min-h-[300px]">
          <MonacoEditor
            theme={activeTheme}
            beforeMount={handleEditorBeforeMount}
            defaultLanguage="python"
            language={currentLanguage?.monacoLang || 'python'}
            value={getCode(problemId, languageId)}
            onChange={handleEditorChange}
            options={{
              fontSize,
              wordWrap: wordWrap ? 'on' : 'off',
              automaticLayout: true,
              tabSize: 2,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </Suspense>
    </div>
  );
}
