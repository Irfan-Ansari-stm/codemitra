import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LANGUAGE_STARTERS } from '@/types';

interface EditorState {
  languageId: number;
  code: Record<string, string>;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  wordWrap: boolean;
  autoSave: boolean;

  setLanguage: (id: number) => void;
  setCode: (problemId: string, langId: number, code: string) => void;
  getCode: (problemId: string, langId: number) => string;
  clearCode: (problemId: string, langId: number) => void;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setAutoSave: (autoSave: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      languageId: 71, // Python 3 default
      code: {},
      theme: 'vs-dark',
      fontSize: 14,
      wordWrap: true,
      autoSave: true,

      setLanguage: (id) => set({ languageId: id }),

      setCode: (problemId, langId, code) =>
        set((state) => ({
          code: { ...state.code, [`${problemId}_${langId}`]: code },
        })),

      getCode: (problemId, langId) => {
        const key = `${problemId}_${langId}`;
        const storedCode = get().code[key];
        return storedCode ?? (LANGUAGE_STARTERS[langId] || '');
      },

      clearCode: (problemId, langId) =>
        set((state) => {
          const key = `${problemId}_${langId}`;
          const { [key]: _, ...restCode } = state.code;
          return { code: restCode };
        }),

      setTheme: (theme) => set({ theme }),

      setFontSize: (size) => {
        if (size >= 8 && size <= 24) set({ fontSize: size });
      },

      setWordWrap: (wrap) => set({ wordWrap: wrap }),

      setAutoSave: (autoSave) => set({ autoSave }),
    }),
    {
      name: 'codeverse-editor',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap,
        autoSave: state.autoSave,
        code: state.code,
      }),
    }
  )
);
