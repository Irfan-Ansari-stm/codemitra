'use client';

import dynamic from 'next/dynamic';
import { useEditorStore } from '@/store/editorStore';
import { LANGUAGES } from '@/types';
import { ChevronDown } from 'lucide-react';
import { Suspense } from 'react';

// Dynamic import to prevent SSR issues with Monaco
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface CodeEditorProps {
  problemId: string;
  onSubmit?: (code: string, languageId: number) => void;
  onRun?: (code: string, languageId: number) => void;
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
    setLanguage,
    setCode,
    setTheme,
    setFontSize,
    setWordWrap,
    getCode,
  } = useEditorStore();

  const languages = Object.entries(LANGUAGES).map(([id, language]) => ({
    id: Number(id),
    ...language,
  }));
  const currentLanguage = LANGUAGES[languageId];

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(problemId, languageId, value);
    }
  };

  const handleLanguageChange = (newLanguageId: number) => {
    setLanguage(newLanguageId);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Language:
          </label>
          <div className="relative">
            <select
              value={languageId}
              onChange={(e) => handleLanguageChange(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Size:
          </label>
          <input
            type="range"
            min="12"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-500 w-8">{fontSize}px</span>
        </div>

        {/* Word Wrap */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={wordWrap}
            onChange={(e) => setWordWrap(e.target.checked)}
            className="rounded"
          />
          Word Wrap
        </label>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          {theme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Submit Button */}
        {onRun && (
          <button
            type="button"
            onClick={() => onRun(getCode(problemId, languageId), languageId)}
            disabled={isSubmitting}
            className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Run samples
          </button>
        )}
        {onSubmit && (
          <button
            onClick={() => {
              const currentCode = getCode(problemId, languageId);
              onSubmit(currentCode, languageId);
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Code'}
          </button>
        )}
      </div>

      {/* Editor */}
      <Suspense fallback={<EditorSkeleton />}>
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            theme={theme}
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
