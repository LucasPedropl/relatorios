import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, SearchX } from 'lucide-react';
import {
  REPORT_STATUS_LABEL,
  SEVERITY_ORDER,
  type ReportComment,
  type ReportStatus,
  type ReportTask,
  type TaskStatus,
} from '@/lib/types';
import { useReportDetail } from '@/features/reports/hooks';
import { useAuthor } from '@/components/AuthorGate';
import {
  ErrorPanel,
  FilterChip,
  KindBadge,
  ReportStatusBadge,
  TimeAgo,
  formatAbsolute,
  toErrorMessage,
} from '@/components/Badges';
import { CommentThread } from '@/components/CommentThread';
import { Markdown } from '@/components/Markdown';
import { TaskCard } from '@/components/TaskCard';

type TaskFilter = TaskStatus | 'all';

const TASK_FILTERS: ReadonlyArray<{ value: TaskFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Abertas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Resolvidas' },
];

const SHOW_WONTFIX_STORAGE_KEY = 'uaipdv_reports_show_wontfix';

function getStoredShowWontfix(): boolean {
  try {
    const value = localStorage.getItem(SHOW_WONTFIX_STORAGE_KEY);
    if (value !== null) {
      return value === 'true';
    }
  } catch (err) {
    console.warn('Falha ao ler preferência de wontfix do localStorage:', err);
  }
  return false;
}

function setStoredShowWontfix(show: boolean): void {
  try {
    localStorage.setItem(SHOW_WONTFIX_STORAGE_KEY, String(show));
  } catch (err) {
    console.warn('Falha ao salvar preferência de wontfix no localStorage:', err);
  }
}

const REPORT_STATUSES: ReadonlyArray<ReportStatus> = ['open', 'in_review', 'resolved', 'archived'];

const EMPTY_COMMENTS: ReportComment[] = [];

function isReportStatus(value: string): value is ReportStatus {
  return REPORT_STATUSES.some((status) => status === value);
}

function compareTasks(a: ReportTask, b: ReportTask): number {
  const bySeverity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
  return bySeverity !== 0 ? bySeverity : a.position - b.position;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <SearchX className="mx-auto size-10 text-muted" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl text-ink">Relatório não encontrado</h1>
      <p className="mt-1 text-sm text-muted">
        O link pode estar errado ou o relatório foi removido.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-sheet-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a lista
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Carregando relatório…</span>
      <div aria-hidden="true" className="h-32 animate-pulse rounded-lg border border-line bg-sheet" />
      <div aria-hidden="true" className="h-48 animate-pulse rounded-lg border border-line bg-sheet" />
      <div aria-hidden="true" className="h-24 animate-pulse rounded-lg border border-line bg-sheet" />
    </div>
  );
}

export function ReportPage() {
  const { slug } = useParams<{ slug: string }>();
  const { author } = useAuthor();
  const { detail, isLoading, error, notFound, reload, setTaskStatus, setReportStatus, postComment } =
    useReportDetail(slug);

  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [showWontfix, setShowWontfix] = useState<boolean>(getStoredShowWontfix);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const toggleShowWontfix = () => {
    setShowWontfix((prev) => {
      const next = !prev;
      setStoredShowWontfix(next);
      return next;
    });
  };

  const tasks = detail?.tasks;
  const comments = detail?.comments;

  const sortedTasks = useMemo(() => (tasks ? [...tasks].sort(compareTasks) : []), [tasks]);

  const taskCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = { open: 0, in_progress: 0, done: 0, wontfix: 0 };
    for (const task of sortedTasks) counts[task.status] += 1;
    return counts;
  }, [sortedTasks]);

  const { reportComments, commentsByTask } = useMemo(() => {
    const byTask = new Map<string, ReportComment[]>();
    const reportLevel: ReportComment[] = [];
    for (const comment of comments ?? []) {
      if (comment.task_id === null) {
        reportLevel.push(comment);
        continue;
      }
      const bucket = byTask.get(comment.task_id);
      if (bucket) bucket.push(comment);
      else byTask.set(comment.task_id, [comment]);
    }
    return { reportComments: reportLevel, commentsByTask: byTask };
  }, [comments]);

  const visibleTasks = useMemo(() => {
    if (taskFilter !== 'all') {
      return sortedTasks.filter((task) => task.status === taskFilter);
    }
    if (!showWontfix) {
      return sortedTasks.filter((task) => task.status !== 'wontfix');
    }
    return sortedTasks;
  }, [sortedTasks, taskFilter, showWontfix]);

  const finishedCount = taskCounts.done + taskCounts.wontfix;

  const handleStatusChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (!detail || !isReportStatus(next) || next === detail.report.status) return;

    setIsSavingStatus(true);
    setStatusError(null);
    try {
      await setReportStatus(detail.report.id, next);
    } catch (err) {
      console.error('Falha ao atualizar status do relatório', err);
      setStatusError(toErrorMessage(err));
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (notFound) return <NotFound />;

  if (!detail) {
    if (isLoading) return <DetailSkeleton />;
    return (
      <ErrorPanel
        message={error ?? 'Não foi possível carregar o relatório.'}
        onRetry={() => void reload()}
      />
    );
  }

  const { report, project } = detail;

  return (
    <div className="space-y-6">
      <Link
        to={`/p/${project.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {project.name}
      </Link>

      {error && <ErrorPanel message={error} onRetry={() => void reload()} />}

      <header className="min-w-0 rounded-lg border border-line bg-sheet p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <KindBadge kind={report.kind} />
          <ReportStatusBadge status={report.status} />
          <span className="font-medium text-ink">{project.name}</span>
        </div>
        <h1 className="mt-2 font-display text-2xl leading-tight break-words text-ink sm:text-3xl">
          {report.title}
        </h1>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs text-muted">
            Criado em{' '}
            <time dateTime={report.created_at} className="text-ink">
              {formatAbsolute(report.created_at)}
            </time>{' '}
            por <span className="text-ink">{report.created_by}</span>
            {' · '}
            <TimeAgo iso={report.updated_at} prefix="atualizado " />
          </p>

          <label className="flex items-center gap-2 text-xs text-muted">
            <span className="shrink-0">Status do relatório</span>
            <select
              value={report.status}
              onChange={(event) => void handleStatusChange(event)}
              disabled={isSavingStatus}
              className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/40 disabled:opacity-60 sm:flex-none"
            >
              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {REPORT_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            {isSavingStatus && (
              <LoaderCircle className="size-4 animate-spin text-muted" aria-hidden="true" />
            )}
          </label>
        </div>

        {statusError && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-rose-800/40 bg-rose-800/8 px-2 py-1.5 text-xs break-words text-rose-900 dark:text-rose-300"
          >
            Não foi possível atualizar o status: {statusError}
          </p>
        )}
      </header>

      <section
        aria-labelledby="summary-heading"
        className="min-w-0 rounded-lg border border-line bg-sheet p-4 sm:p-5"
      >
        <h2
          id="summary-heading"
          className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase"
        >
          Resumo
        </h2>
        <Markdown content={report.summary_md} />
      </section>

      <section aria-labelledby="tasks-heading" className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="tasks-heading" className="font-display text-xl text-ink">
            Tarefas <span className="text-muted">({sortedTasks.length})</span>
          </h2>
          {sortedTasks.length > 0 && (
            <span className="text-xs text-muted">
              {finishedCount} de {sortedTasks.length} resolvidas
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar tarefas por status">
          {TASK_FILTERS.map((filter) => (
            <FilterChip
              key={filter.value}
              isActive={taskFilter === filter.value}
              count={filter.value === 'all' ? sortedTasks.length : taskCounts[filter.value]}
              onClick={() => setTaskFilter(filter.value)}
            >
              {filter.label}
            </FilterChip>
          ))}

          {taskCounts.wontfix > 0 ? (
            <FilterChip
              isActive={showWontfix}
              count={showWontfix ? taskCounts.wontfix : undefined}
              onClick={() => {
                if (taskFilter !== 'all') {
                  setTaskFilter('all');
                }
                toggleShowWontfix();
              }}
            >
              {showWontfix
                ? 'Não vamos corrigir'
                : `${taskCounts.wontfix} ${
                    taskCounts.wontfix === 1 ? 'não será corrigida' : 'não serão corrigidas'
                  } — mostrar`}
            </FilterChip>
          ) : (
            <FilterChip
              isActive={taskFilter === 'wontfix'}
              count={0}
              onClick={() => setTaskFilter('wontfix')}
            >
              Não vamos corrigir
            </FilterChip>
          )}
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
            <p className="text-sm text-muted">
              {sortedTasks.length === 0
                ? 'Este relatório não tem tarefas.'
                : !showWontfix && taskCounts.wontfix === sortedTasks.length
                  ? `Todas as ${sortedTasks.length} ${
                      sortedTasks.length === 1
                        ? 'tarefa deste relatório foi marcada'
                        : 'tarefas deste relatório foram marcadas'
                    } como "não vamos corrigir" e estão ocultas.`
                  : 'Nenhuma tarefa com esse status.'}
            </p>
            {!showWontfix && taskCounts.wontfix > 0 && taskFilter === 'all' && (
              <button
                type="button"
                onClick={toggleShowWontfix}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-sheet px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-sheet-hover focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                Mostrar {taskCounts.wontfix}{' '}
                {taskCounts.wontfix === 1 ? 'tarefa não corrigida' : 'tarefas não corrigidas'}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleTasks.map((task) => (
              <li key={task.id} className="min-w-0">
                <TaskCard
                  task={task}
                  comments={commentsByTask.get(task.id) ?? EMPTY_COMMENTS}
                  author={author}
                  onChangeStatus={setTaskStatus}
                  onComment={(bodyMd) => postComment({ taskId: task.id, author, bodyMd })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="discussion-heading"
        className="min-w-0 rounded-lg border border-line bg-sheet p-4 sm:p-5"
      >
        <h2 id="discussion-heading" className="mb-3 font-display text-xl text-ink">
          Discussão do relatório{' '}
          <span className="text-muted">({reportComments.length})</span>
        </h2>
        <CommentThread
          comments={reportComments}
          onSubmit={(bodyMd) => postComment({ taskId: null, author, bodyMd })}
        />
      </section>
    </div>
  );
}
