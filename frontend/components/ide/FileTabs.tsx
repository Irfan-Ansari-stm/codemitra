'use client';

import React, { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { IdeFile } from './types';
import { getLanguageIcon } from './LanguageIcons';

interface FileTabsProps {
  files: IdeFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: () => void;
  onCloseFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  currentLangSlug: string;
}

export function FileTabs({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onCloseFile,
  onRenameFile,
  currentLangSlug,
}: FileTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartRename = (e: React.MouseEvent, file: IdeFile) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditName(file.name);
  };

  const handleSaveRename = (fileId: string) => {
    if (editName.trim()) {
      onRenameFile(fileId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center bg-slate-900 border-b border-slate-800 px-2 overflow-x-auto select-none scrollbar-none h-10">
      <div className="flex items-center gap-1">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-md cursor-pointer border-t-2 transition-all ${
                isActive
                  ? 'bg-slate-950 text-white border-blue-500 font-medium shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              {/* Language Icon */}
              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                {getLanguageIcon(currentLangSlug, 14)}
              </div>

              {/* Filename or Rename Input */}
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(file.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleSaveRename(file.id)}
                    className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-xs outline-none border border-blue-500 w-24"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(file.id)}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={(e) => handleStartRename(e, file)}
                  className="truncate max-w-[120px]"
                  title={file.name}
                >
                  {file.name}
                </span>
              )}

              {/* Actions: Rename & Close */}
              {!isEditing && (
                <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(e, file)}
                    title="Rename file"
                    className="text-slate-500 hover:text-slate-300 rounded p-0.5"
                  >
                    <Edit2 size={10} />
                  </button>
                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseFile(file.id);
                      }}
                      title="Close file"
                      className="text-slate-500 hover:text-rose-400 rounded p-0.5"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add File Button */}
        <button
          type="button"
          onClick={onAddFile}
          title="Create New File"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
