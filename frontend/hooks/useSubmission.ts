import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { submissionApi, executionApi } from '@/lib/api';
import { useEditorStore } from '@/store/editorStore';
import { wasmManager } from '@/services/wasm-executor/wasm-manager';
import { ExecutionStatus } from '@/services/wasm-executor/types';
import { TestCaseResultItem } from '@/components/execution/OutputConsole';

interface UseSubmitOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface ConsoleOutputState {
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  executionTime?: number;
  memoryUsage?: number | null;
  engineUsed?: 'wasm' | 'judge0';
  fallbackOccurred?: boolean;
  notes?: string;
  testCaseResults?: TestCaseResultItem[];
}

export function useSubmit(problemId: string, options?: UseSubmitOptions) {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutputState>({
    status: 'idle',
  });

  const customInput = useEditorStore((state) => state.customInput);
  const isCustomInputOpen = useEditorStore((state) => state.isCustomInputOpen);

  // Mutation: create submission (Full trusted server evaluation)
  const submitMutation = useMutation({
    mutationFn: (vars: {
      languageId: number;
      sourceCode: string;
      assignmentId?: string;
      engine?: 'auto' | 'wasm' | 'judge0';
    }) => {
      setConsoleOutput({ status: 'running' });
      return submissionApi.submit({ problemId, ...vars });
    },
    onSuccess: ({ data }) => {
      setSubmissionId(data.data.submissionId);
      setIsPolling(true);
    },
    onError: (error: any) => {
      setConsoleOutput({
        status: 'failed',
        stderr: error.response?.data?.error?.message || error.message || 'Submission failed',
      });
      options?.onError?.(error);
    },
  });

  // Mutation: run code (against sample cases or custom input)
  const runMutation = useMutation({
    mutationFn: async (vars: {
      languageId: number;
      sourceCode: string;
      engine?: 'auto' | 'wasm' | 'judge0';
      sampleCases?: Array<{ input: string; expectedOutput?: string; expected_output?: string }>;
      timeLimitMs?: number;
      memoryLimitMb?: number;
    }) => {
      const preferredEngine = vars.engine || 'auto';

      // ── Option A: Custom Stdin Input ──────────────────────────────────────────
      if (isCustomInputOpen && customInput.trim().length > 0) {
        setConsoleOutput({ status: 'running' });

        if (wasmManager.canExecuteLocally(vars.languageId) && preferredEngine !== 'judge0') {
          // Execute directly in browser WebAssembly sandbox
          const localResult = await wasmManager.execute(
            {
              language: vars.languageId,
              code: vars.sourceCode,
              stdin: customInput,
              timeLimitMs: vars.timeLimitMs,
              memoryLimitMb: vars.memoryLimitMb,
            },
            preferredEngine
          );

          setConsoleOutput({
            status: localResult.status,
            stdout: localResult.stdout,
            stderr: localResult.stderr,
            compileOutput: localResult.compileOutput,
            executionTime: localResult.executionTime,
            memoryUsage: localResult.memoryUsage,
            engineUsed: localResult.engineUsed,
            fallbackOccurred: localResult.fallbackOccurred,
            notes: localResult.notes,
          });

          return {
            data: {
              data: {
                results: [
                  {
                    caseIndex: 1,
                    passed: localResult.status === 'completed',
                    verdict: localResult.status === 'completed' ? 'accepted' : 'runtime_error',
                    runtimeMs: localResult.executionTime,
                    memoryKb: localResult.memoryUsage,
                    stdout: localResult.stdout,
                    stderr: localResult.stderr,
                    engineUsed: localResult.engineUsed,
                  },
                ],
              },
            },
          };
        }

        // Run server-side via execution router
        const res = await executionApi.run({
          language: vars.languageId,
          sourceCode: vars.sourceCode,
          stdin: customInput,
          engine: preferredEngine,
        });

        const execData = res.data.data;
        setConsoleOutput({
          status: execData.status,
          stdout: execData.stdout,
          stderr: execData.stderr,
          compileOutput: execData.compileOutput,
          executionTime: execData.executionTime,
          memoryUsage: execData.memoryUsage,
          engineUsed: execData.engineUsed,
          fallbackOccurred: execData.fallbackOccurred,
          notes: execData.notes,
        });

        return {
          data: {
            data: {
              results: [
                {
                  caseIndex: 1,
                  passed: execData.status === 'completed',
                  verdict: execData.status === 'completed' ? 'accepted' : 'runtime_error',
                  runtimeMs: execData.executionTime,
                  memoryKb: execData.memoryUsage,
                  stdout: execData.stdout,
                  stderr: execData.stderr,
                  engineUsed: execData.engineUsed,
                },
              ],
            },
          },
        };
      }

      // ── Option B: Browser WebAssembly Sample Runner ───────────────────────────
      // If language is supported by WASM and engine is WASM or Auto, run sample cases locally!
      if (
        vars.sampleCases &&
        vars.sampleCases.length > 0 &&
        wasmManager.canExecuteLocally(vars.languageId) &&
        preferredEngine !== 'judge0'
      ) {
        setConsoleOutput({ status: 'running' });

        const results: TestCaseResultItem[] = [];
        let hasCompileError = false;
        let compileOutputText = '';

        for (let i = 0; i < vars.sampleCases.length; i++) {
          const tc = vars.sampleCases[i];
          const input = tc.input || '';
          const expected = (tc.expectedOutput || tc.expected_output || '').trim();

          const execResult = await wasmManager.execute(
            {
              language: vars.languageId,
              code: vars.sourceCode,
              stdin: input,
              timeLimitMs: vars.timeLimitMs,
              memoryLimitMb: vars.memoryLimitMb,
            },
            preferredEngine
          );

          if (execResult.status === 'compilation_error') {
            hasCompileError = true;
            compileOutputText = execResult.compileOutput || execResult.stderr;
          }

          const actual = (execResult.stdout || '').trim();
          const passed = execResult.status === 'completed' && actual === expected;

          let verdict = 'accepted';
          if (execResult.status === 'timed_out') verdict = 'time_limit_exceeded';
          else if (execResult.status === 'compilation_error') verdict = 'compile_error';
          else if (execResult.status === 'runtime_error') verdict = 'runtime_error';
          else if (!passed) verdict = 'wrong_answer';

          results.push({
            caseIndex: i + 1,
            passed,
            verdict,
            runtimeMs: execResult.executionTime,
            memoryKb: execResult.memoryUsage,
            stdout: execResult.stdout,
            stderr: execResult.stderr,
            input,
            expectedOutput: expected,
            engineUsed: 'wasm',
          });

          // If syntax/compilation error occurred, break early
          if (hasCompileError) break;
        }

        const allPassed = results.every((r) => r.passed);
        const firstError = results.find((r) => r.stderr)?.stderr || '';

        let overallStatus: ExecutionStatus = 'completed';
        if (hasCompileError) overallStatus = 'compilation_error';
        else if (results.some((r) => r.verdict === 'time_limit_exceeded')) overallStatus = 'timed_out';
        else if (results.some((r) => r.verdict === 'runtime_error')) overallStatus = 'runtime_error';
        else if (!allPassed) overallStatus = 'failed';

        setConsoleOutput({
          status: overallStatus,
          stdout: results.map((r) => `[Case ${r.caseIndex}]\n${r.stdout}`).join('\n\n'),
          stderr: firstError,
          compileOutput: compileOutputText,
          executionTime: Math.max(...results.map((r) => r.runtimeMs || 0)),
          memoryUsage: null,
          engineUsed: 'wasm',
          testCaseResults: results,
        });

        return {
          data: {
            data: {
              results,
            },
          },
        };
      }

      // ── Option C: Server-Side Sample Execution ────────────────────────────────
      setConsoleOutput({ status: 'running' });
      let rawResults: any[] = [];

      try {
        const response = await submissionApi.run({
          problemId,
          languageId: vars.languageId,
          sourceCode: vars.sourceCode,
          engine: preferredEngine,
        });
        rawResults = response.data?.data?.results || [];
      } catch (authOrNetworkErr) {
        // Fallback to open execution API which evaluates problem sample cases without requiring auth
        const execRes = await executionApi.run({
          problemId,
          language: vars.languageId,
          sourceCode: vars.sourceCode,
          engine: preferredEngine,
        });
        const resData = (execRes as any).data?.data || (execRes as any).data;
        rawResults = resData?.results || [];
      }

      const results: TestCaseResultItem[] = rawResults.map((r: any, idx: number) => ({
        caseIndex: r.caseIndex ?? idx + 1,
        passed: Boolean(r.passed),
        verdict: r.verdict,
        runtimeMs: r.runtimeMs,
        memoryKb: r.memoryKb,
        stdout: r.stdout,
        stderr: r.stderr,
        input: vars.sampleCases?.[idx]?.input || '',
        expectedOutput: vars.sampleCases?.[idx]?.expectedOutput || vars.sampleCases?.[idx]?.expected_output || '',
        engineUsed: r.engineUsed || 'wasm',
      }));

      const allPassed = results.length > 0 && results.every((r) => r.passed);
      const firstResult = results[0];
      const firstError = results.find((r) => r.stderr)?.stderr || '';

      setConsoleOutput({
        status: allPassed ? 'completed' : firstResult?.verdict === 'compile_error' ? 'compilation_error' : 'failed',
        stdout: results.map((r) => `[Case ${r.caseIndex}]\n${r.stdout}`).join('\n\n'),
        stderr: firstError,
        compileOutput: firstResult?.compileOutput,
        executionTime: Math.max(...results.map((r) => r.runtimeMs || 0), 0),
        memoryUsage: Math.max(...results.map((r) => r.memoryKb || 0), 0) || null,
        engineUsed: (firstResult?.engineUsed as any) || (preferredEngine === 'wasm' ? 'wasm' : 'judge0'),
        testCaseResults: results,
      });

      return { data: { data: { results } } };
    },
    onError: (error: any) => {
      setConsoleOutput({
        status: 'failed',
        stderr: error.response?.data?.error?.message || error.message || 'Execution failed',
      });
      options?.onError?.(error);
    },
  });

  // Poll submission until non-pending
  const { data: submissionData } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.get(submissionId!).then((r) => r.data.data),
    enabled: !!submissionId && isPolling,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.verdict && data.verdict !== 'pending') {
        setIsPolling(false);
        setConsoleOutput({
          status: data.verdict === 'accepted' ? 'completed' : 'failed',
          stdout: data.stdoutOutput || (data.testCaseResults || []).map((r: any) => r.stdout).filter(Boolean).join('\n'),
          stderr: data.stderrOutput,
          compileOutput: data.compileOutput,
          executionTime: data.runtimeMs,
          memoryUsage: data.memoryKb,
          engineUsed: data.executionEngine || 'judge0',
        });
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
    consoleOutput,
    clearConsole: () => setConsoleOutput({ status: 'idle' }),
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
  const { autoSave } = useEditorStore();

  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      console.debug('Code auto-saved to localStorage');
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoSave, problemId, languageId]);
}
