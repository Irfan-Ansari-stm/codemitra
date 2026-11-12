import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutputConsole from './OutputConsole';

describe('OutputConsole Component', () => {
  it('renders idle status by default', () => {
    render(<OutputConsole status="idle" />);
    expect(screen.getByText('Execution Console')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(screen.getByText(/Click “Run Code” to execute your solution/i)).toBeInTheDocument();
  });

  it('renders compiling status badge', () => {
    render(<OutputConsole status="compiling" />);
    expect(screen.getByText('Compiling')).toBeInTheDocument();
  });

  it('renders running status badge', () => {
    render(<OutputConsole status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders completed status, stdout, and execution metrics', () => {
    render(
      <OutputConsole
        status="completed"
        stdout="Hello CodeMitra WASM!"
        executionTime={45}
        memoryUsage={512}
        engineUsed="wasm"
      />
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Hello CodeMitra WASM!')).toBeInTheDocument();
    expect(screen.getByText('45 ms')).toBeInTheDocument();
    expect(screen.getByText('512 KB')).toBeInTheDocument();
    expect(screen.getByText(/WASM \(Browser Engine\)/i)).toBeInTheDocument();
  });

  it('renders compilation error and compileOutput', () => {
    render(
      <OutputConsole
        status="compilation_error"
        compileOutput="SyntaxError: Unexpected token ';' on line 1"
        engineUsed="wasm"
      />
    );

    expect(screen.getByText('Compilation Error')).toBeInTheDocument();
    expect(screen.getByText(/Unexpected token/i)).toBeInTheDocument();
  });

  it('renders timed out status with warning badge', () => {
    render(
      <OutputConsole
        status="timed_out"
        stderr="Execution timed out after 5000 ms"
        engineUsed="judge0"
      />
    );

    expect(screen.getByText('Timed Out')).toBeInTheDocument();
    expect(screen.getByText(/Execution timed out after 5000 ms/i)).toBeInTheDocument();
    expect(screen.getByText(/Judge0 \(Server Cloud\)/i)).toBeInTheDocument();
  });

  it('renders fallback notice when fallback occurs', () => {
    render(
      <OutputConsole
        status="completed"
        stdout="Success after fallback"
        engineUsed="judge0"
        fallbackOccurred={true}
        notes="WASM unavailable in current browser; executed via Judge0."
      />
    );

    expect(screen.getByText(/WASM unavailable in current browser/i)).toBeInTheDocument();
  });
});
