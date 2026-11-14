'use client';

import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Copy,
  Trash2,
  Check,
  Maximize2,
  Minimize2,
  AlertCircle,
  Clock,
  Cpu,
  Globe,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { IdeExecutionState, IdeOutputTab } from './types';

interface OutputPanelProps {
  executionState: IdeExecutionState;
  customInput: string;
  onChangeCustomInput: (val: string) => void;
  onClearOutput: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeLanguage?: { id: number; slug: string; name: string };
  activeCode?: string;
}

export function OutputPanel({
  executionState,
  customInput,
  onChangeCustomInput,
  onClearOutput,
  isExpanded,
  onToggleExpand,
  activeLanguage,
  activeCode,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<IdeOutputTab>('output');
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'browser' | 'console'>('browser');
  const [iframeKey, setIframeKey] = useState(0);

  const handleCopy = () => {
    const textToCopy = [
      executionState.stdout,
      executionState.stderr,
      executionState.compileOutput,
    ]
      .filter(Boolean)
      .join('\n');

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (executionState.status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            Running...
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Success
          </span>
        );
      case 'compilation_error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertCircle size={12} />
            Compile Error
          </span>
        );
      case 'runtime_error':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle size={12} />
            Runtime Error
          </span>
        );
      case 'timed_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
            <Clock size={12} />
            Time Limit Exceeded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Idle
          </span>
        );
    }
  };

  const hasOutput =
    Boolean(executionState.stdout) ||
    Boolean(executionState.stderr) ||
    Boolean(executionState.compileOutput);

  const isHtml =
    activeLanguage?.slug === 'html' ||
    activeLanguage?.id === 81 ||
    executionState.stdout.includes('[HTML5 Live DOM Render]') ||
    Boolean(activeCode && /<(!doctype|html|head|body|h[1-6]|p|div|style|script)/i.test(activeCode));

  const htmlSource = activeCode || executionState.stdout;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800 select-none overflow-hidden transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 transition-colors">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Output Console
          </span>
          <div className="ml-2">{getStatusBadge()}</div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          {executionState.executionTime > 0 && (
            <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <Clock size={11} className="text-slate-500 dark:text-slate-400" />
              {executionState.executionTime} ms
            </span>
          )}

          {executionState.engineUsed && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
              <Cpu size={11} />
              {executionState.engineUsed === 'wasm' ? 'WASM / Sandbox' : 'Judge0'}
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasOutput}
            title="Copy Output"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
          </button>

          <button
            type="button"
            onClick={onClearOutput}
            disabled={!hasOutput}
            title="Clear Console"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore Layout' : 'Maximize Output Panel'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded transition-colors hidden sm:block"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="flex items-center gap-1 px-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-xs transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'output'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Output
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminal')}
          className={`px-3 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'terminal'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Terminal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('problems')}
          className={`px-3 py-1.5 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'problems'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Problems</span>
          {(Boolean(executionState.compileOutput) || Boolean(executionState.stderr)) && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('input')}
          className={`px-3 py-1.5 font-medium border-b-2 flex items-center gap-1 transition-colors ${
            activeTab === 'input'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Stdin (Input)</span>
          {customInput.trim().length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-3 overflow-auto font-mono text-xs select-text scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 bg-white dark:bg-slate-950 transition-colors">
        {/* Tab A: Output */}
        {activeTab === 'output' && (
          <div className="space-y-2">
            {executionState.status === 'running' && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400/90 py-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
                <span>Executing code in isolated environment...</span>
              </div>
            )}

            {executionState.compileOutput && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3 text-amber-900 dark:text-amber-200">
                <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Compilation Output:
                </div>
                <pre className="!bg-transparent !p-0 font-mono text-xs text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed select-text">
                  {executionState.compileOutput}
                </pre>
              </div>
            )}

            {isHtml && (hasOutput || executionState.status === 'completed') ? (
              <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden shadow-lg dark:shadow-2xl">
                {/* Browser Chrome Bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700/80 text-xs select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>

                  {/* Browser Address Bar */}
                  <div className="flex-1 max-w-sm mx-3 px-3 py-1 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5 shadow-inner">
                    <Globe size={12} className="text-blue-500 dark:text-blue-400 shrink-0" />
                    <span className="truncate font-mono">http://localhost:3000/preview/index.html</span>
                  </div>

                  {/* Chrome Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* View Switcher: Browser vs DOM Logs */}
                    <div className="flex bg-slate-200/80 dark:bg-slate-900 rounded p-0.5 border border-slate-300 dark:border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('browser')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          previewMode === 'browser'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Browser
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('console')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          previewMode === 'console'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        DOM Logs
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIframeKey((k) => k + 1)}
                      title="Reload Page"
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <RotateCw size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([htmlSource], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      }}
                      title="Open in Full Browser Tab"
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* Browser Viewport */}
                {previewMode === 'browser' ? (
                  <div className="w-full bg-white relative rounded-b-lg overflow-hidden">
                    <iframe
                      key={iframeKey}
                      srcDoc={htmlSource}
                      title="HTML5 Live Browser Preview"
                      sandbox="allow-scripts allow-modals"
                      className="w-full min-h-[380px] border-0 bg-white block"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 dark:bg-[#070b14] overflow-auto font-mono text-xs">
                    <pre className="!bg-transparent !p-0 font-mono text-xs text-emerald-400 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed select-text">
                      {executionState.stdout}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              executionState.stdout && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-900 dark:bg-[#070b14] p-3.5 shadow-inner">
                  <pre className="!bg-transparent !p-0 font-mono text-xs text-emerald-400 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed select-text">
                    {executionState.stdout}
                  </pre>
                </div>
              )
            )}

            {executionState.stderr && !executionState.compileOutput && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg p-3 text-rose-900 dark:text-rose-200 mt-2">
                <div className="font-semibold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Runtime Error:
                </div>
                <pre className="!bg-transparent !p-0 font-mono text-xs text-rose-900 dark:text-rose-100 whitespace-pre-wrap leading-relaxed select-text">
                  {executionState.stderr}
                </pre>
              </div>
            )}

            {!hasOutput && executionState.status !== 'running' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 dark:text-slate-600">
                <TerminalIcon size={32} className="mb-2 opacity-50 text-slate-400 dark:text-slate-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Ready to execute</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs">
                  Click the green <strong className="text-emerald-600 dark:text-emerald-400">Run</strong> button to execute your program using the WebAssembly engine.
                </p>
              </div>
            )}

            {executionState.notes && (
              <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 dark:border-slate-900 mt-3">
                ℹ {executionState.notes}
              </p>
            )}
          </div>
        )}

        {/* Tab B: Terminal */}
        {activeTab === 'terminal' && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-900 dark:bg-[#070b14] p-3.5 font-mono text-xs text-emerald-400 space-y-1">
            <p className="text-slate-400 dark:text-slate-500">CodeMitra WebAssembly Sandbox Terminal [v2.0]</p>
            <p className="text-slate-400 dark:text-slate-500">Type code in editor and click Run to simulate process.</p>
            <p className="pt-2 text-slate-300">
              <span className="text-emerald-400 font-bold">$ </span>
              codemitra-run --engine={executionState.engineUsed || 'wasm'}
            </p>
            {executionState.stdout && (
              <pre className="!bg-transparent !p-0 text-slate-100 whitespace-pre-wrap pl-3 border-l-2 border-emerald-500/50 my-1 font-mono text-xs">
                {executionState.stdout}
              </pre>
            )}
            {executionState.stderr && (
              <pre className="!bg-transparent !p-0 text-rose-300 whitespace-pre-wrap pl-3 border-l-2 border-rose-500/50 my-1 font-mono text-xs">
                {executionState.stderr}
              </pre>
            )}
            <p className="text-slate-400 dark:text-slate-500 pt-2 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">$ </span>
              <span className="w-2 h-4 bg-emerald-400 inline-block animate-pulse" />
            </p>
          </div>
        )}

        {/* Tab C: Problems */}
        {activeTab === 'problems' && (
          <div className="space-y-2">
            {executionState.compileOutput || executionState.stderr ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs border-b border-rose-200 dark:border-rose-900/50 pb-2">
                  <AlertCircle size={14} />
                  <span>Found issues in program execution</span>
                </div>
                <div className="bg-rose-50 dark:bg-[#070b14] p-3 rounded-lg border border-rose-200 dark:border-slate-800 text-xs">
                  <p className="font-medium text-rose-700 dark:text-rose-400 mb-1">Compiler / Runtime Diagnosis:</p>
                  <pre className="!bg-transparent !p-0 text-rose-900 dark:text-rose-200 whitespace-pre-wrap font-mono text-xs">
                    {executionState.compileOutput || executionState.stderr}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Check size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No problems detected</p>
                <p className="text-xs text-slate-500 mt-1">Syntax and compilation checked cleanly.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab D: Stdin Input */}
        {activeTab === 'input' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Standard Input (stdin):
              </label>
              {customInput && (
                <button
                  type="button"
                  onClick={() => onChangeCustomInput('')}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Clear input
                </button>
              )}
            </div>
            <textarea
              value={customInput}
              onChange={(e) => onChangeCustomInput(e.target.value)}
              placeholder="Enter custom input lines here for programs using input(), cin, Scanner, or sys.stdin..."
              className="flex-1 w-full min-h-[160px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 font-mono text-xs outline-none focus:border-blue-500 resize-none transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Lines entered here will be streamed into your program&apos;s standard input upon clicking Run.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
