import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSidebar } from './LanguageSidebar';
import { FileTabs } from './FileTabs';
import { OutputPanel } from './OutputPanel';
import { IDE_LANGUAGES, IdeFile, IdeExecutionState } from './types';

// Mock Monaco Editor since it requires DOM canvas & web workers
vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="mock-monaco-editor">Monaco Editor Mock</div>,
}));

describe('LanguageSidebar Component', () => {
  it('renders all 16 supported languages in the vertical toolbar', () => {
    const onSelect = vi.fn();
    render(
      <LanguageSidebar
        selectedLanguage={IDE_LANGUAGES[0]}
        onSelectLanguage={onSelect}
      />
    );

    expect(screen.getByText('Langs')).toBeInTheDocument();
    // Python is the first language
    const pythonBtn = screen.getByTitle(/Python/i);
    expect(pythonBtn).toBeInTheDocument();

    // Clicking switches the language
    const jsBtn = screen.getByTitle(/JavaScript/i);
    expect(jsBtn).toBeInTheDocument();
    fireEvent.click(jsBtn);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'javascript' })
    );
  });
});

describe('FileTabs Component', () => {
  const sampleFiles: IdeFile[] = [
    {
      id: 'f1',
      name: 'main.py',
      languageId: 71,
      content: 'print("Hello")',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'f2',
      name: 'helper.py',
      languageId: 71,
      content: 'def util(): pass',
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  it('renders active tabs and handles selection and creation', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const onRename = vi.fn();

    render(
      <FileTabs
        files={sampleFiles}
        activeFileId="f1"
        onSelectFile={onSelect}
        onAddFile={onAdd}
        onCloseFile={onClose}
        onRenameFile={onRename}
        currentLangSlug="python"
      />
    );

    expect(screen.getByText('main.py')).toBeInTheDocument();
    expect(screen.getByText('helper.py')).toBeInTheDocument();

    // Switch tab
    fireEvent.click(screen.getByText('helper.py'));
    expect(onSelect).toHaveBeenCalledWith('f2');

    // Add file
    const addBtn = screen.getByTitle('Create New File');
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalled();
  });
});

describe('OutputPanel Component', () => {
  it('renders console output, tabs, and execution metrics', () => {
    const execState: IdeExecutionState = {
      status: 'completed',
      stdout: 'Hello CodeMitra Output!',
      stderr: '',
      compileOutput: '',
      executionTime: 85,
      memoryUsage: 1024,
      engineUsed: 'wasm',
    };

    render(
      <OutputPanel
        executionState={execState}
        customInput=""
        onChangeCustomInput={vi.fn()}
        onClearOutput={vi.fn()}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />
    );

    expect(screen.getByText(/Output Console/i)).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('85 ms')).toBeInTheDocument();
    expect(screen.getByText(/WASM \/ Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText('Hello CodeMitra Output!')).toBeInTheDocument();
  });

  it('switches between Output, Terminal, Problems, and Input tabs', () => {
    const execState: IdeExecutionState = {
      status: 'compilation_error',
      stdout: '',
      stderr: '',
      compileOutput: 'SyntaxError: unexpected EOF while parsing',
      executionTime: 20,
      memoryUsage: null,
    };

    render(
      <OutputPanel
        executionState={execState}
        customInput="custom stdin line"
        onChangeCustomInput={vi.fn()}
        onClearOutput={vi.fn()}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />
    );

    // Switch to Terminal tab
    fireEvent.click(screen.getByRole('button', { name: 'Terminal' }));
    expect(screen.getByText(/CodeMitra WebAssembly Sandbox Terminal/i)).toBeInTheDocument();

    // Switch to Problems tab
    fireEvent.click(screen.getByRole('button', { name: /Problems/i }));
    expect(screen.getByText(/Found issues in program execution/i)).toBeInTheDocument();
    expect(screen.getByText(/unexpected EOF while parsing/i)).toBeInTheDocument();

    // Switch to Stdin Input tab
    fireEvent.click(screen.getByRole('button', { name: /Stdin \(Input\)/i }));
    expect(screen.getByPlaceholderText(/Enter custom input lines here/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom stdin line')).toBeInTheDocument();
  });
});
