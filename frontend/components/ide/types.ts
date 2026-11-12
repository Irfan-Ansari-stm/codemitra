export interface IdeLanguage {
  id: number;
  slug: string;
  name: string;
  monacoLang: string;
  extension: string;
  engine: 'wasm' | 'hybrid' | 'judge0';
  isVerified: boolean;
  defaultFilename: string;
  starterCode: string;
}

export interface IdeFile {
  id: string;
  name: string;
  languageId: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type IdeOutputTab = 'output' | 'terminal' | 'problems' | 'input';

export interface IdeExecutionState {
  status: 'idle' | 'running' | 'compiling' | 'completed' | 'failed' | 'timed_out' | 'compilation_error' | 'runtime_error';
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTime: number;
  memoryUsage: number | null;
  engineUsed?: 'wasm' | 'judge0';
  notes?: string;
}

export const IDE_LANGUAGES: IdeLanguage[] = [
  {
    id: 71,
    slug: 'python',
    name: 'Python',
    monacoLang: 'python',
    extension: 'py',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'main.py',
    starterCode: `print("Hello CodeMitra!")\n`,
  },
  {
    id: 63,
    slug: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    extension: 'js',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'index.js',
    starterCode: `console.log("Hello CodeMitra!");\n`,
  },
  {
    id: 74,
    slug: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: 'ts',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'index.ts',
    starterCode: `const greeting: string = "Hello CodeMitra!";\nconsole.log(greeting);\n`,
  },
  {
    id: 50,
    slug: 'c',
    name: 'C',
    monacoLang: 'c',
    extension: 'c',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.c',
    starterCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello CodeMitra!\\n");\n    return 0;\n}\n`,
  },
  {
    id: 54,
    slug: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    extension: 'cpp',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.cpp',
    starterCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello CodeMitra!" << std::endl;\n    return 0;\n}\n`,
  },
  {
    id: 62,
    slug: 'java',
    name: 'Java',
    monacoLang: 'java',
    extension: 'java',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'Main.java',
    starterCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeMitra!");\n    }\n}\n`,
  },
  {
    id: 73,
    slug: 'rust',
    name: 'Rust',
    monacoLang: 'rust',
    extension: 'rs',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.rs',
    starterCode: `fn main() {\n    println!("Hello CodeMitra!");\n}\n`,
  },
  {
    id: 64,
    slug: 'lua',
    name: 'Lua',
    monacoLang: 'lua',
    extension: 'lua',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'main.lua',
    starterCode: `print("Hello CodeMitra!")\n`,
  },
  {
    id: 60,
    slug: 'go',
    name: 'Go',
    monacoLang: 'go',
    extension: 'go',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.go',
    starterCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello CodeMitra!")\n}\n`,
  },
  {
    id: 72,
    slug: 'ruby',
    name: 'Ruby',
    monacoLang: 'ruby',
    extension: 'rb',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.rb',
    starterCode: `puts "Hello CodeMitra!"\n`,
  },
  {
    id: 68,
    slug: 'php',
    name: 'PHP',
    monacoLang: 'php',
    extension: 'php',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'index.php',
    starterCode: `<?php\necho "Hello CodeMitra!\\n";\n`,
  },
  {
    id: 51,
    slug: 'csharp',
    name: 'C#',
    monacoLang: 'csharp',
    extension: 'cs',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'Program.cs',
    starterCode: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello CodeMitra!");\n    }\n}\n`,
  },
  {
    id: 78,
    slug: 'kotlin',
    name: 'Kotlin',
    monacoLang: 'kotlin',
    extension: 'kt',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'Main.kt',
    starterCode: `fun main() {\n    println("Hello CodeMitra!")\n}\n`,
  },
  {
    id: 80,
    slug: 'r',
    name: 'R',
    monacoLang: 'r',
    extension: 'r',
    engine: 'hybrid',
    isVerified: true,
    defaultFilename: 'main.R',
    starterCode: `cat("Hello CodeMitra!\\n")\n`,
  },
  {
    id: 82,
    slug: 'sql',
    name: 'SQL',
    monacoLang: 'sql',
    extension: 'sql',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'query.sql',
    starterCode: `-- SQL Query Playground\nSELECT 'Hello CodeMitra!' AS greeting;\n`,
  },
  {
    id: 81,
    slug: 'html',
    name: 'HTML',
    monacoLang: 'html',
    extension: 'html',
    engine: 'wasm',
    isVerified: true,
    defaultFilename: 'index.html',
    starterCode: `<!DOCTYPE html>\n<html>\n<head>\n  <title>CodeMitra Preview</title>\n</head>\n<body>\n  <h1>Hello CodeMitra!</h1>\n</body>\n</html>\n`,
  },
];

