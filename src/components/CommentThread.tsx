import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, LoaderCircle, Send } from 'lucide-react';
import type { ReportComment } from '@/lib/types';
import { TimeAgo, toErrorMessage } from '@/components/Badges';
import { Markdown } from '@/components/Markdown';

interface CommentThreadProps {
  comments: ReportComment[];
  onSubmit: (bodyMd: string) => Promise<void>;
  /** Thread dentro de uma tarefa — texto e espaçamentos menores. */
  compact?: boolean;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function CommentItem({ comment, compact }: { comment: ReportComment; compact: boolean }) {
  const isAi = comment.author_kind === 'ai';

  return (
    <li className="flex gap-3">
      <div
        aria-hidden="true"
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isAi ? 'border border-ink bg-ink text-paper' : 'border border-line bg-sheet text-ink'
        }`}
      >
        {isAi ? <Bot className="size-4" /> : initialOf(comment.author)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-ink">{comment.author}</span>
          {isAi && (
            <span
              title="Comentário gerado por agente de IA"
              className="rounded border border-ink px-1 py-px text-[10px] font-semibold tracking-wide text-ink uppercase"
            >
              IA
            </span>
          )}
          <TimeAgo iso={comment.created_at} className="text-muted" />
        </div>
        <Markdown content={comment.body_md} compact={compact} className="mt-1" />
      </div>
    </li>
  );
}

export function CommentThread({ comments, onSubmit, compact = false }: CommentThreadProps) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaId = useId();

  const submit = async () => {
    const body = draft.trim();
    if (!body || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await onSubmit(body);
      setDraft('');
    } catch (err) {
      console.error('Falha ao publicar comentário', err);
      setError(toErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  };

  const canSend = !isSending && draft.trim().length > 0;

  return (
    <div className="min-w-0">
      {comments.length === 0 ? (
        <p className="text-sm text-muted">Nenhum comentário ainda.</p>
      ) : (
        <ul className={compact ? 'space-y-3' : 'space-y-4'}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} compact={compact} />
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor={textareaId} className="sr-only">
          Novo comentário
        </label>
        <textarea
          id={textareaId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          rows={compact ? 2 : 3}
          placeholder="Escreva um comentário… (Markdown suportado)"
          className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-ink/40 disabled:opacity-60"
        />
        {error && (
          <p
            role="alert"
            className="mt-2 rounded-md border border-rose-800/40 bg-rose-800/8 px-2 py-1.5 text-xs break-words text-rose-900 dark:text-rose-300"
          >
            Não foi possível publicar o comentário: {error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted">Ctrl+Enter para enviar</span>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
            Comentar
          </button>
        </div>
      </form>
    </div>
  );
}
