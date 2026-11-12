'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ElementContent, Element } from 'hast';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import cpp from 'react-syntax-highlighter/dist/cjs/languages/prism/cpp';
import java from 'react-syntax-highlighter/dist/cjs/languages/prism/java';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('c', cpp);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('markdown', markdown);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractText(nodes: ElementContent[]): string {
  return nodes
    .map((node) => {
      if (typeof node === 'string') return node;
      if (node.type === 'element' && node.children) {
        return extractText(node.children);
      }
      return '';
    })
    .join('');
}

interface HeadingProps {
  level: 2 | 3 | 4;
  children?: React.ReactNode;
  node?: Element;
}

function MarkdownHeading({ level, children, node }: HeadingProps) {
  const text = node ? extractText(node.children) : '';
  const id = text ? slugify(text) : undefined;
  const Tag = `h${level}` as const;
  return (
    <Tag
      id={id}
      className={cn(
        'scroll-mt-24 font-bold tracking-tight text-slate-950 dark:text-white',
        level === 2 && 'mt-10 mb-4 text-2xl border-b border-slate-200 pb-2 dark:border-white/[0.08]',
        level === 3 && 'mt-8 mb-3 text-xl',
        level === 4 && 'mt-6 mb-2 text-lg'
      )}
    >
      {children}
    </Tag>
  );
}

function CodeBlock({
  language,
  value,
  theme,
}: {
  language: string;
  value: string;
  theme: 'light' | 'dark';
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-white/[0.06] dark:bg-ink-900">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {language || 'code'}
        </span>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={theme === 'dark' ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: 'transparent',
          fontSize: '0.85rem',
        }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

interface BlogMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders untrusted article content safely. Raw HTML in the
 * markdown source is escaped (never injected) because no
 * rehype-raw plugin is used.
 */
export function BlogMarkdown({ content, className }: BlogMarkdownProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        'prose prose-slate max-w-none dark:prose-invert',
        'prose-headings:font-bold prose-headings:tracking-tight',
        'prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-brand-400',
        'prose-blockquote:not-italic',
        'prose-img:rounded-lg',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: (props) => <MarkdownHeading level={2} node={props.node}>{props.children}</MarkdownHeading>,
          h3: (props) => <MarkdownHeading level={3} node={props.node}>{props.children}</MarkdownHeading>,
          h4: (props) => <MarkdownHeading level={4} node={props.node}>{props.children}</MarkdownHeading>,
          p: (props) => (
            <p
              className="my-5 leading-[1.8] text-slate-700 dark:text-slate-300"
              {...props}
            />
          ),
          a: (props) => (
            <a
              {...props}
              target={props.href?.startsWith('http') ? '_blank' : undefined}
              rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="font-medium underline decoration-brand-500/40 underline-offset-2 transition-colors hover:decoration-brand-500"
            />
          ),
          img: (props) => (
            <img
              {...props}
              loading="lazy"
              alt={props.alt || ''}
              className="my-6 rounded-lg border border-slate-200 dark:border-white/[0.08]"
            />
          ),
          blockquote: (props) => (
            <blockquote
              {...props}
              className="my-6 border-l-4 border-brand-500/50 bg-brand-500/[0.04] px-5 py-4 text-slate-600 dark:border-brand-500/30 dark:bg-brand-500/[0.06] dark:text-slate-300"
            />
          ),
          code: (props) => {
            const { children, className: codeClassName, node } = props;
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeText =
              typeof children === 'string'
                ? children
                : node
                  ? extractText(node.children)
                  : '';
            const isInline = !match;
            if (isInline) {
              return (
                <code
                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-700 dark:bg-white/10 dark:text-brand-300"
                  {...props}
                />
              );
            }
            return (
              <CodeBlock
                language={match[1]}
                value={codeText.replace(/\n$/, '')}
                theme={theme}
              />
            );
          },
          pre: (props) => <div className="my-6">{props.children}</div>,
          table: (props) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-white/[0.08]">
              <table
                {...props}
                className="w-full border-collapse text-sm"
              />
            </div>
          ),
          th: (props) => (
            <th
              {...props}
              className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-900 dark:border-white/[0.08] dark:bg-ink-900 dark:text-white"
            />
          ),
          td: (props) => (
            <td
              {...props}
              className="border-b border-slate-100 px-4 py-2.5 text-slate-700 dark:border-white/[0.06] dark:text-slate-300"
            />
          ),
          ul: (props) => (
            <ul
              {...props}
              className="my-5 list-disc space-y-2 pl-6 text-slate-700 marker:text-brand-500 dark:text-slate-300"
            />
          ),
          ol: (props) => (
            <ol
              {...props}
              className="my-5 list-decimal space-y-2 pl-6 text-slate-700 marker:text-brand-500 dark:text-slate-300"
            />
          ),
          hr: (props) => (
            <hr
              {...props}
              className="my-10 border-slate-200 dark:border-white/[0.08]"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
