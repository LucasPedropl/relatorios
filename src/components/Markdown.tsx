import { createContext, useContext, type ComponentProps } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * react-markdown v10 não passa mais `inline` para <code>. O <pre> customizado
 * publica este contexto para o <code> saber se está num bloco ou no meio do texto.
 */
const InsidePreContext = createContext(false);

function Pre({ children }: ComponentProps<'pre'>) {
  return (
    <InsidePreContext.Provider value={true}>
      <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-line bg-paper p-3 font-mono text-sm leading-relaxed whitespace-pre text-ink">
        {children}
      </pre>
    </InsidePreContext.Provider>
  );
}

function Code({ children, className }: ComponentProps<'code'>) {
  const isBlock = useContext(InsidePreContext);
  if (isBlock) {
    return <code className={className}>{children}</code>;
  }
  return (
    <code className="rounded bg-paper px-1 py-0.5 font-mono text-[0.85em] break-all text-ink">
      {children}
    </code>
  );
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 font-display text-xl text-ink first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 font-display text-lg text-ink first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-base font-semibold text-ink first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed break-words">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="my-2 list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="break-words">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-ink underline underline-offset-2 break-all hover:opacity-70"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-ink/40 pl-3 text-muted italic">
      {children}
    </blockquote>
  ),
  pre: Pre,
  code: Code,
  table: ({ children }) => (
    <div className="table-scroll my-3 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-paper">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-line px-2 py-1.5 text-left font-semibold whitespace-nowrap text-ink">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-line px-2 py-1.5 align-top">{children}</td>,
  hr: () => <hr className="my-4 border-line" />,
};

interface MarkdownProps {
  content: string;
  /** Texto menor — usado dentro de comentários. */
  compact?: boolean;
  className?: string;
}

export function Markdown({ content, compact = false, className }: MarkdownProps) {
  if (!content.trim()) {
    return <p className={`text-sm text-muted italic ${className ?? ''}`}>Sem conteúdo.</p>;
  }

  return (
    <div
      className={`markdown min-w-0 max-w-full text-ink ${
        compact ? 'text-sm' : 'text-sm sm:text-[0.9375rem]'
      } ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
