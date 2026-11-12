'use client';

import React from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

export default function CustomInputPanel() {
  const { customInput, setCustomInput, isCustomInputOpen, setIsCustomInputOpen } = useEditorStore();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} className="text-gray-500" />
          Custom Standard Input (stdin)
          {customInput.trim().length > 0 && (
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          )}
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          {isCustomInputOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isCustomInputOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Provide custom input to pass to your program during execution.</span>
            {customInput.length > 0 && (
              <button
                type="button"
                onClick={() => setCustomInput('')}
                className="flex items-center gap-1 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type custom standard input lines here..."
            rows={4}
            className="w-full font-mono text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
