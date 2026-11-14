'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { batchApi, tenantApi, getErrorMessage } from '@/lib/api';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBatch?: any;
}

export function CreateBatchModal({ isOpen, onClose, editingBatch }: CreateBatchModalProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    tenantId: editingBatch?.tenantId || editingBatch?.tenant_id || '',
    name: editingBatch?.name || '',
    code: editingBatch?.code || '',
    department: editingBatch?.department || 'Computer Science & Engineering',
    batchType: editingBatch?.batchType || editingBatch?.batch_type || 'undergraduate',
    status: editingBatch?.status || 'active',
    admissionYear: editingBatch?.admissionYear || editingBatch?.admission_year || currentYear - 1,
    graduationYear: editingBatch?.graduationYear || editingBatch?.graduation_year || currentYear + 3,
    startDate: editingBatch?.startDate || editingBatch?.start_date?.slice(0, 10) || `${currentYear - 1}-08-01`,
    endDate: editingBatch?.endDate || editingBatch?.end_date?.slice(0, 10) || `${currentYear + 3}-06-30`,
    currentTerm: editingBatch?.currentTerm || editingBatch?.current_term || 'Semester 6',
    maxCapacity: editingBatch?.maxCapacity || editingBatch?.max_capacity || 60,
    description: editingBatch?.description || '',
    createDefaultSection: true,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => tenantApi.list(1, 100).then((res) => res.data.data),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!form.tenantId) throw new Error('Please select an institution');
      if (!form.name.trim()) throw new Error('Batch name is required');
      if (new Date(form.endDate) <= new Date(form.startDate)) {
        throw new Error('End date must be after start date');
      }

      if (editingBatch) {
        return batchApi.update(editingBatch.id, form);
      } else {
        return batchApi.create(form);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin-batches'] });
      void queryClient.invalidateQueries({ queryKey: ['super-admin-batches-analytics'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingBatch ? 'Edit Academic Batch' : 'Create New Batch & Cohort'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Configure graduation tracking, semester allocations, and student capacity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-4 text-xs"
        >
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Institution Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institution (Tenant) <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.tenantId}
              disabled={Boolean(editingBatch)}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              required
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Enrolled Institution</option>
              {tenantsQuery.data?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Name and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CSE Class of 2026 Cohort"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Code (Unique ID)
              </label>
              <input
                type="text"
                placeholder="e.g. CSE-2022-26 (Leave empty to auto-generate)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Department and Current Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical & Mechatronics">Mechanical & Mechatronics</option>
                <option value="General Engineering & Applied Sciences">General Engineering & Applied Sciences</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Term / Semester
              </label>
              <input
                type="text"
                value={form.currentTerm}
                onChange={(e) => setForm({ ...form, currentTerm: e.target.value })}
                placeholder="e.g. Semester 6 or Term 2"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Admission & Graduation Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Year
              </label>
              <input
                type="number"
                min={2018}
                max={2035}
                value={form.admissionYear}
                onChange={(e) => setForm({ ...form, admissionYear: parseInt(e.target.value) || currentYear })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                min={2020}
                max={2040}
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: parseInt(e.target.value) || currentYear + 4 })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Student Capacity
              </label>
              <input
                type="number"
                min={1}
                max={2000}
                value={form.maxCapacity}
                onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 60 })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Start and End Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Start Date
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Graduation / End Date
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="active">Active (Currently in session)</option>
                <option value="upcoming">Upcoming (Admissions open)</option>
                <option value="completed">Completed (Graduated)</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Program Type
              </label>
              <select
                value={form.batchType}
                onChange={(e) => setForm({ ...form, batchType: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="undergraduate">Undergraduate (4-year / 3-year)</option>
                <option value="postgraduate">Postgraduate (Master&apos;s)</option>
                <option value="bootcamp">Accelerated Coding Bootcamp</option>
                <option value="diploma">Technical Diploma</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Curriculum Focus
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Focus on algorithms, distributed cloud systems, and core computer science milestones."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : editingBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
