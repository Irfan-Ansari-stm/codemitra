'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Folder,
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Code,
  Sparkles,
} from 'lucide-react';
import { ideApi, getErrorMessage } from '@/lib/api';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

export function ProjectsModal({
  isOpen,
  onClose,
  activeProjectId,
  onSelectProject,
}: ProjectsModalProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newProject, setNewProject] = useState({
    projectName: '',
    description: '',
    defaultLanguage: 'python',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['ide', 'projects'],
    queryFn: async () => {
      try {
        const res = await ideApi.getProjects();
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newProject) => ideApi.createProject(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ide', 'projects'] });
      setIsCreating(false);
      setNewProject({ projectName: '', description: '', defaultLanguage: 'python' });
      setErrorMsg(null);
      if (res.data.data?.id) {
        onSelectProject(res.data.data.id);
        onClose();
      }
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, projectName }: { id: string; projectName: string }) =>
      ideApi.updateProject(id, { projectName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ide', 'projects'] });
      setEditingId(null);
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ideApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ide', 'projects'] });
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Folder size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Workspace Projects</h2>
              <p className="text-xs text-slate-500">Manage and switch between your persistent coding projects</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Create Button or Form */}
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-blue-400/60 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all shadow-sm"
            >
              <FolderPlus size={16} />
              <span>Create New Project</span>
            </button>
          ) : (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/15 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-blue-500" /> New Project Setup
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., Dynamic Programming Lab, Graph Algorithms..."
                  value={newProject.projectName}
                  onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Primary Language</label>
                  <select
                    value={newProject.defaultLanguage}
                    onChange={(e) => setNewProject({ ...newProject, defaultLanguage: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="php">PHP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Short description..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (newProject.projectName.trim()) {
                    createMutation.mutate(newProject);
                  }
                }}
                disabled={!newProject.projectName.trim() || createMutation.isPending}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-md shadow-blue-600/20"
              >
                {createMutation.isPending ? 'Creating Project...' : 'Save & Open Project'}
              </button>
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Existing Projects ({projects.length})
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No custom projects found. Your workspace is currently using the active local session.
              </div>
            ) : (
              projects.map((proj: any) => {
                const isActive = proj.id === activeProjectId;
                const isEditing = editingId === proj.id;

                return (
                  <div
                    key={proj.id}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-400/60 dark:border-blue-500/50 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-500 shrink-0">
                        <Code size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              autoFocus
                              className="px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded outline-none text-slate-900 dark:text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editName.trim()) {
                                  renameMutation.mutate({ id: proj.id, projectName: editName.trim() });
                                }
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editName.trim()) {
                                  renameMutation.mutate({ id: proj.id, projectName: editName.trim() });
                                }
                              }}
                              className="text-emerald-600 dark:text-emerald-400 p-1"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {proj.projectName}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Active
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span className="uppercase text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {proj.defaultLanguage}
                          </span>
                          <span>•</span>
                          <span>{proj.fileCount || 1} file(s)</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(proj.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-3">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
                        >
                          Open
                        </button>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(proj.id);
                            setEditName(proj.projectName);
                          }}
                          title="Rename Project"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete project "${proj.projectName}"? All associated files will be removed.`)) {
                              deleteMutation.mutate(proj.id);
                            }
                          }}
                          title="Delete Project"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>All files and tabs are automatically saved to your account.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
