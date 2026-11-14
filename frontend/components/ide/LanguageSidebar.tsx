'use client';

import React from 'react';
import { IDE_LANGUAGES, IdeLanguage } from './types';
import { getLanguageIcon } from './LanguageIcons';

interface LanguageSidebarProps {
  selectedLanguage: IdeLanguage;
  onSelectLanguage: (lang: IdeLanguage) => void;
  isCollapsed?: boolean;
}

export function LanguageSidebar({
  selectedLanguage,
  onSelectLanguage,
  isCollapsed = false,
}: LanguageSidebarProps) {
  if (isCollapsed) return null;

  return (
    <aside
      aria-label="Language Selector Toolbar"
      className="w-14 sm:w-16 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2 select-none overflow-y-auto overflow-x-hidden scrollbar-none z-10 transition-colors"
    >
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1 text-center">
        Langs
      </div>

      <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
        {IDE_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage.id === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => onSelectLanguage(lang)}
              title={`${lang.name} (${lang.engine === 'wasm' ? 'WebAssembly ⚡' : 'Native Sandbox 🚀'})`}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
                isSelected
                  ? 'bg-blue-500/15 dark:bg-blue-600/20 text-blue-600 dark:text-white border border-blue-400/50 dark:border-blue-500/60 shadow-sm dark:shadow-lg dark:shadow-blue-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              {/* Active left indicator pill */}
              {isSelected && (
                <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full" />
              )}

              {/* Icon */}
              <div className="flex items-center justify-center transition-transform group-hover:scale-110">
                {getLanguageIcon(lang.slug, 22)}
              </div>

              {/* Hover Tooltip */}
              <div className="pointer-events-none absolute left-14 ml-2 hidden sm:group-hover:flex flex-col items-start rounded-lg bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-white shadow-xl border border-slate-200 dark:border-slate-800 whitespace-nowrap z-50">
                <span className="font-semibold text-slate-900 dark:text-slate-200">{lang.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {lang.engine === 'wasm' ? (
                    <span className="text-emerald-600 dark:text-emerald-400">● WebAssembly ⚡</span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">● Native Sandbox 🚀</span>
                  )}
                  {lang.isVerified && <span className="text-slate-400 dark:text-slate-500">• Verified</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
