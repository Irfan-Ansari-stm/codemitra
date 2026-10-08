import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionApi } from '@/lib/api';
import { useEditorStore } from '@/store/editorStore';

interface UseSubmitOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useSubmit(problemId: string, options?: UseSubmitOptions) {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const qc = useQueryClient();

  // Mutation: create submission
  const submitMutation = useMutation({
    mutationFn: (vars: { languageId: number; sourceCode: string; assignmentId?: string }) =>
      submissionApi.submit({ problemId, ...vars }),
    onSuccess: ({ data }) => {
      setSubmissionId(data.data.submissionId);
      setIsPolling(true);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  // Mutation: run only (sample cases)
  const runMutation = useMutation({
    mutationFn: (vars: { languageId: number; sourceCode: string }) =>
      submissionApi.run({ problemId, ...vars }),
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  // Poll submission until non-pending
  const { data: submissionData, isLoading: isLoadingSubmission } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.get(submissionId!).then((r) => r.data.data),
    enabled: !!submissionId && isPolling,
    refetchInterval: (data) => {
      if (data?.verdict && data.verdict !== 'pending') {
        setIsPolling(false);
        options?.onSuccess?.();
        return false; // Stop polling
      }
      return 2000; // Poll every 2 seconds
    },
  });

  return {
    submit: submitMutation.mutate,
    run: runMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isRunning: runMutation.isPending,
    isPolling,
    submission: submissionData ?? null,
    runResults: runMutation.data?.data.data.results ?? null,
    submitError: submitMutation.error,
    runError: runMutation.error,
  };
}

export function useSubmissionHistory(problemId: string) {
  return useQuery({
    queryKey: ['submissions', 'history', problemId],
    queryFn: () => submissionApi.history(problemId).then((r) => r.data.data),
    staleTime: 1000 * 30,
  });
}

export function useAllSubmissions() {
  return useQuery({
    queryKey: ['submissions', 'all'],
    queryFn: () => submissionApi.all().then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
}

export function useSubmissionDetail(submissionId: string | null) {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.get(submissionId!).then((r) => r.data.data),
    enabled: !!submissionId,
  });
}

export function useAutoSaveCode(problemId: string, languageId: number) {
  const { code, autoSave } = useEditorStore();
  const currentCode = useEditorStore((state) => state.getCode(problemId, languageId));

  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      // Auto-save to localStorage is already handled by Zustand's persist
      console.debug('Code auto-saved to localStorage');
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentCode, autoSave]);
}
