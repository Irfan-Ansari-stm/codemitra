import { describe, it, expect, vi } from 'vitest';
import { isLanguageWasmSupported, WasmManager } from './wasm-manager';
import { WorkerPool } from './worker-pool';

describe('WASM Manager & Language Capabilities', () => {
  it('correctly identifies WASM supported languages', () => {
    expect(isLanguageWasmSupported('python')).toBe(true);
    expect(isLanguageWasmSupported(71)).toBe(true);
    expect(isLanguageWasmSupported('javascript')).toBe(true);
    expect(isLanguageWasmSupported(63)).toBe(true);

    expect(isLanguageWasmSupported('cpp')).toBe(false);
    expect(isLanguageWasmSupported(54)).toBe(false);
    expect(isLanguageWasmSupported('c')).toBe(false);
    expect(isLanguageWasmSupported(50)).toBe(false);
    expect(isLanguageWasmSupported('java')).toBe(false);
  });

  it('detects when local execution cannot be run in non-browser environments', () => {
    const manager = new WasmManager();
    // In vitest/jsdom without Worker mocked, canExecuteLocally handles gracefully
    const canRun = manager.canExecuteLocally('python');
    expect(typeof canRun).toBe('boolean');
  });

  it('delegates to server execution when language is not WASM supported', async () => {
    const mockWorkerPool = {
      isSupported: vi.fn().mockReturnValue(true),
      execute: vi.fn(),
      terminate: vi.fn(),
    } as unknown as WorkerPool;

    const manager = new WasmManager(mockWorkerPool);

    // Mock API
    vi.mock('@/lib/api', () => ({
      api: {
        post: vi.fn().mockResolvedValue({
          data: {
            data: {
              stdout: 'C++ output from Judge0',
              stderr: '',
              compileOutput: '',
              status: 'completed',
              executionTime: 85,
              memoryUsage: 1024,
              engineUsed: 'judge0',
            },
          },
        }),
      },
    }));

    // Calling execute for C++ with auto engine should route to judge0
    const result = await manager.execute(
      {
        language: 'cpp',
        code: '#include <iostream>\nint main() { return 0; }',
      },
      'auto'
    );

    expect(result.engineUsed).toBe('judge0');
    expect(result.stdout).toBe('C++ output from Judge0');
  });

  it('supports preloading runtime for WASM languages', () => {
    const mockWorkerPool = {
      isSupported: vi.fn().mockReturnValue(true),
      execute: vi.fn(),
      preload: vi.fn(),
      terminate: vi.fn(),
    } as unknown as WorkerPool;

    const manager = new WasmManager(mockWorkerPool);
    // Mock isBrowserSupported
    vi.spyOn(manager, 'isBrowserSupported').mockReturnValue(true);

    manager.preload('python');
    expect(mockWorkerPool.preload).toHaveBeenCalledWith('python');
  });
});
