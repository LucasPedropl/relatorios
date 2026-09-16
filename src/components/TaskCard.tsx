import { useId, useState } from 'react';
import { ChevronDown, LoaderCircle, MessageSquare } from 'lucide-react';
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
  type ReportComment,
  type ReportTask,
  type Severity,
  type TaskStatus,
} from '@/lib/types';
import { SeverityBadge, TaskStatusBadge, TimeAgo, toErrorMessage } from '@/components/Badges';
import { CommentThread } from '@/components/CommentThread';
import { Markdown } from '@/components/Markdown';

interface TaskCardProps {
  task: ReportTask;
  /** Comentários já filtrados para esta tarefa. */
  comments: ReportComment[];
  author: string;
  onChangeStatus: (taskId: string, status: TaskStatus, author: string) => Promise<void>;
  onComment: (bodyMd: string) => Promise<void>;
}

const FINISHED_STATUSES: ReadonlySet<TaskStatus> = new Set<TaskStatus>(['done', 'wontfix']);

const SEVERITY_ACCENT_CLASS: Record<Severity, string> = {
  critical: 'border-l-rose-800',
  high: 'border-l-orange-800',
  medium: 'border-l-ink/50',
  low: 'border-l-muted',
  info: 'border-l-line',
};

const STATUS_BUTTON_ACTIVE_CLASS: Record<TaskStatus, string> = {
  open: 'border-ink bg-ink/10 text-ink',
  in_progress: 'border-ink bg-ink/15 text-ink',
  done: 'border-ink bg-ink text-paper',
  wontfix: 'border-line bg-sheet text-muted',
};

const STATUS_BUTTON_IDLE_CLASS =
  'border-line bg-paper text-muted hover:bg-sheet-hover hover:text-ink';

export function TaskCard({ task, comments, author, onChangeStatus, onComment }: TaskCardProps) {
  const isFinished = FINISHED_STATUSES.has(task.status);
  const [isExpanded, setIsExpanded] = useState(!isFinished);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const bodyId = useId();
  const titleId = useId();

  const changeStatus = async (status: TaskStatus) => {
    if (status === task.status || pendingStatus !== null) return;

    setPendingStatus(status);
    setStatusError(null);
    try {
      await onChangeStatus(task.id, status, author);
    } catch (err) {
      console.error(`Falha ao atualizar status da tarefa ${task.id}`, err);
      setStatusError(toErrorMessage(err));
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <article
      aria-labelledby={titleId}
      className={`min-w-0 rounded-lg border border-l-2 border-line bg-sheet ${
        isFinished ? 'border-l-line opacity-80' : SEVERITY_ACCENT_CLASS[task.severity]
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        className="flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/40 sm:px-4"
      >
        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 text-muted transition-transform ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />
        {/* Só phrasing content aqui dentro: <button> não aceita div/h3. */}
        <span className="block min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={task.severity} />
            {task.code ? (
              <span className="font-mono text-xs text-muted">{task.code}</span>
            ) : null}
            <span className="ml-auto flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <span
                className="inline-flex items-center gap-1 text-xs tabular-nums text-muted"
                title="Comentários nesta tarefa"
              >
                <MessageSquare className="size-3.5" aria-hidden="true" />
                {comments.length}
              </span>
            </span>
          </span>
          <span
            id={titleId}
            className={`mt-1.5 block text-sm font-semibold break-words sm:text-[0.9375rem] ${
              isFinished ? 'text-muted' : 'text-ink'
            }`}
          >
            {task.title}
          </span>
        </span>
      </button>

      {isExpanded && (
        <div id={bodyId} className="min-w-0 border-t border-line px-3 pt-3 pb-4 sm:px-4">
          {task.area || task.location ? (
            <dl className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
              {task.area ? (
                <div className="flex min-w-0 gap-1.5">
                  <dt className="shrink-0 text-muted">área</dt>
                  <dd className="break-all text-ink">{task.area}</dd>
                </div>
              ) : null}
              {task.location ? (
                <div className="flex min-w-0 gap-1.5">
                  <dt className="shrink-0 text-muted">local</dt>
                  <dd className="break-all text-ink">{task.location}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <Markdown content={task.body_md} />

          <div className="mt-4 rounded-lg border border-line bg-paper p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted">Status</span>
              {TASK_STATUS_ORDER.map((status) => {
                const isActive = status === task.status;
                const isPending = pendingStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={pendingStatus !== null}
                    aria-pressed={isActive}
                    onClick={() => void changeStatus(status)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive ? STATUS_BUTTON_ACTIVE_CLASS[status] : STATUS_BUTTON_IDLE_CLASS
                    }`}
                  >
                    {isPending && (
                      <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                    )}
                    {TASK_STATUS_LABEL[status]}
                  </button>
                );
              })}
            </div>
            {task.updated_by ? (
              <p className="mt-2 text-[11px] text-muted">
                marcado por <span className="text-ink">{task.updated_by}</span>
                {' · '}
                <TimeAgo iso={task.updated_at} />
              </p>
            ) : null}
            {statusError && (
              <p
                role="alert"
                className="mt-2 rounded-md border border-rose-800/40 bg-rose-800/8 px-2 py-1.5 text-xs break-words text-rose-900 dark:text-rose-300"
              >
                Não foi possível atualizar o status: {statusError}
              </p>
            )}
          </div>

          <section className="mt-4" aria-label="Comentários da tarefa">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Comentários ({comments.length})
            </h4>
            <CommentThread comments={comments} onSubmit={onComment} compact />
          </section>
        </div>
      )}
    </article>
  );
}
