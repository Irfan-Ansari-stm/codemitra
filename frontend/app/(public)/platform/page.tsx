import React from 'react';
import Link from 'next/link';
import {
  Cpu,
  Terminal,
  ShieldCheck,
  Zap,
  Code2,
  CheckCircle2,
  ArrowRight,
  Database,
} from 'lucide-react';

export const metadata = {
  title: 'Platform Architecture & Execution Engine — CodeVerse',
  description:
    'Explore the high-performance online execution engine, 16+ supported programming languages, multi-tenant sandbox, and enterprise coding infrastructure powering CodeVerse.',
};

const languages = [
  { id: 'python', name: 'Python', version: '3.11.2', category: 'Interpreted', compiler: 'CPython', status: 'Active' },
  { id: 'cpp', name: 'C++', version: 'GCC 13.2 (C++20)', category: 'Compiled', compiler: 'g++', status: 'Active' },
  { id: 'c', name: 'C', version: 'GCC 13.2 (C17)', category: 'Compiled', compiler: 'gcc', status: 'Active' },
  { id: 'java', name: 'Java', version: 'OpenJDK 21 LTS', category: 'Compiled / JVM', compiler: 'javac / java', status: 'Active' },
  { id: 'javascript', name: 'JavaScript', version: 'Node.js 20 LTS', category: 'JIT / Runtime', compiler: 'Node.js V8', status: 'Active' },
  { id: 'typescript', name: 'TypeScript', version: '5.4.5', category: 'Transpiled / Runtime', compiler: 'tsc / Node.js', status: 'Active' },
  { id: 'rust', name: 'Rust', version: '1.77.1 edition 2021', category: 'Compiled', compiler: 'rustc', status: 'Active' },
  { id: 'go', name: 'Go', version: '1.22.2', category: 'Compiled', compiler: 'go run / build', status: 'Active' },
  { id: 'csharp', name: 'C#', version: '.NET 8.0 LTS', category: 'Compiled / CLR', compiler: 'dotnet', status: 'Active' },
  { id: 'php', name: 'PHP', version: '8.3.4', category: 'Interpreted', compiler: 'Zend Engine', status: 'Active' },
  { id: 'ruby', name: 'Ruby', version: '3.3.0', category: 'Interpreted', compiler: 'YARV', status: 'Active' },
  { id: 'swift', name: 'Swift', version: '5.10', category: 'Compiled', compiler: 'swiftc', status: 'Active' },
  { id: 'kotlin', name: 'Kotlin', version: '1.9.23', category: 'Compiled / JVM', compiler: 'kotlinc', status: 'Active' },
  { id: 'scala', name: 'Scala', version: '3.3.3', category: 'Compiled / JVM', compiler: 'scalac', status: 'Active' },
  { id: 'r', name: 'R', version: '4.3.3', category: 'Interpreted', compiler: 'Rscript', status: 'Active' },
  { id: 'sql', name: 'SQL', version: 'PostgreSQL 16 Engine', category: 'Query Engine', compiler: 'PostgreSQL', status: 'Active' },
];

const enginePillars = [
  {
    icon: Zap,
    title: 'Dual Execution Engine',
    description:
      'Ultra-fast in-browser WebAssembly (WASM) for instant client-side execution coupled with a secure distributed Judge0 cluster for authoritative multi-test evaluation.',
  },
  {
    icon: ShieldCheck,
    title: 'Sandboxed MicroVM Isolation',
    description:
      'Every submission runs inside an ephemeral, resource-capped container with strict cgroups v2 limits, seccomp syscall filtering, and zero network egress.',
  },
  {
    icon: Database,
    title: 'PostgreSQL Row-Level Security',
    description:
      'Enterprise multi-tenant architecture ensuring complete data boundary isolation between university campuses, corporate cohorts, and global learners.',
  },
  {
    icon: Terminal,
    title: 'Rich Input/Output & Edge Checks',
    description:
      'Full support for standard input streams (stdin), multiline test cases, custom timeouts, memory overflow detection, and granular runtime diagnostics.',
  },
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d18] dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 dark:border-white/10 dark:bg-[#0c1322]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
              <Cpu className="h-3.5 w-3.5" />
              <span>Next-Gen Online Compiler Infrastructure</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white">
              Built for speed, sandboxing, and scale.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              CodeVerse powers real-time programming education with a high-throughput execution
              pipeline supporting 16+ languages, automated test evaluations, and strict security isolation.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/platform/ide"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-500"
              >
                <Terminal className="h-4 w-4" />
                <span>Launch Playground IDE</span>
              </Link>
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <Code2 className="h-4 w-4" />
                <span>Explore Coding Problems</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engine Architecture Pillars */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Platform Architecture
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              How the CodeVerse Execution Pipeline Works
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              From the moment code is typed to the final automated verdict, every submission passes
              through a multi-stage security and benchmarking engine.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {enginePillars.map((pillar, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#0e1728]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Languages Matrix */}
      <section className="border-t border-slate-200/80 bg-white py-16 dark:border-white/10 dark:bg-[#0c1322] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Compiler Catalog
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                16 Supported Languages & Runtimes
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                All runtimes are kept up to date with modern standards and pre-configured toolchains.
              </p>
            </div>
            <Link
              href="/platform/ide"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              <span>Test in Playground</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0e1728]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-4">Language</th>
                    <th scope="col" className="px-6 py-4">Version & Toolchain</th>
                    <th scope="col" className="px-6 py-4">Paradigm</th>
                    <th scope="col" className="px-6 py-4">Compiler / Engine</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {languages.map((lang) => (
                    <tr key={lang.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {lang.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">{lang.version}</td>
                      <td className="px-6 py-3.5 text-xs">{lang.category}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {lang.compiler}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {lang.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Sandbox Details */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Zero Trust Architecture
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Battle-Tested Sandboxing
              </h2>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Untrusted code is executed inside ephemeral isolation sandboxes that reset between every test run.
                Memory leaks, fork bombs, and unauthorized file access are blocked at the Linux kernel level.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Seccomp Syscall Filtering
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Disallows harmful system calls such as network sockets, process spawning, and host mount alterations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Strict Memory & CPU Quotas
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cgroups v2 enforce sub-second CPU limits and strict memory ceilings (up to 512MB per execution).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Multi-Tenant Isolation
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      PostgreSQL row-level security and tenant-scoped keys guarantee student progress and institute data remain strictly segregated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#0d1117] p-6 text-xs font-mono text-emerald-400 shadow-xl dark:border-white/10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <span>judge0-sandbox.env</span>
              </div>
              <div className="mt-4 space-y-1.5 text-[11px] leading-relaxed">
                <p className="text-slate-500"># Security constraints policy</p>
                <p className="text-blue-400">CPU_TIME_LIMIT=<span className="text-amber-300">2.000s</span></p>
                <p className="text-blue-400">MAX_WALL_TIME=<span className="text-amber-300">5.000s</span></p>
                <p className="text-blue-400">MEMORY_LIMIT_KB=<span className="text-amber-300">262144</span></p>
                <p className="text-blue-400">NETWORK_ACCESS=<span className="text-rose-400">DISABLED</span></p>
                <p className="text-blue-400">SECCOMP_PROFILE=<span className="text-emerald-300">strict-syscalls.json</span></p>
                <p className="text-blue-400">PID_LIMIT=<span className="text-amber-300">32</span></p>
                <p className="text-blue-400">FILE_SIZE_LIMIT_KB=<span className="text-amber-300">1024</span></p>
                <p className="text-slate-500 mt-3"># Automated verdict stream</p>
                <p className="text-emerald-400">Verdict: ACCEPTED [0.042s, 14.2 MB]</p>
                <p className="text-emerald-400">Test Cases: 15 / 15 Passed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-200 bg-slate-100/70 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Start Coding in Your Browser Today
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            No installation or setup required. Try our online playground IDE or explore institutional partnerships for your campus.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/platform/ide"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-500"
            >
              <Terminal className="h-4 w-4" />
              <span>Launch Playground IDE</span>
            </Link>
            <Link
              href="/apply-institution"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <span>Partner With Us</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
