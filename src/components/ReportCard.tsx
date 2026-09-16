import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { TASK_STATUS_ORDER, type ReportListItem, type TaskStatus } from '@/lib/types';
import { KindBadge, ReportStatusBadge, TASK_STATUS_DOT_CLASS, TimeAgo } from '@/components/Badges';

const TASK_COUNTER_LABEL: Record<TaskStatus, string> = {
  open: 'abertas',
  in_progress: 'em andamento',
  done: 'resolvidas',
  wontfix: 'não vamos corrigir',
};

export function ReportCard({ report }: { report: ReportListItem }) {
  const total = report.totalTasks;
  const finished = report.taskCounts.done + report.taskCounts.wontfix;
  const donePercent = total > 0 ? (report.taskCounts.done / total) * 100 : 0;
  const wontfixPercent = total > 0 ? (report.taskCounts.wontfix / total) * 100 : 0;

  return (
    <Link
      to={`/r/${report.slug}`}
      className="group block h-full min-w-0 rounded-lg border border-line bg-sheet p-4 transition outline-none hover:bg-sheet-hover focus-visible:ring-2 focus-visible:ring-ink/40"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <KindBadge kind={report.kind} />
        <ReportStatusBadge status={report.status} />
        <TimeAgo iso={report.updated_at} prefix="atualizado " className="ml-auto whitespace-nowrap" />
      </div>

      <h2 className="mt-2 font-display text-lg leading-snug break-words text-ink">
        {report.title}
      </h2>

      {total > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span>
              {finished} de {total} resolvidas
            </span>
            <span className="tabular-nums text-muted">
              {Math.round((finished / total) * 100)}%
            </span>
          </div>
          <div
            className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={finished}
            aria-label="Tarefas finalizadas"
          >
            <div className="bg-ink" style={{ width: `${donePercent}%` }} />
            <div className="bg-muted" style={{ width: `${wontfixPercent}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">Sem tarefas</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {TASK_STATUS_ORDER.map((status) => (
          <span key={status} className="inline-flex items-center gap-1">
            <span
              className={`size-1.5 rounded-full ${TASK_STATUS_DOT_CLASS[status]}`}
              aria-hidden="true"
            />
            <span className="tabular-nums text-ink">{report.taskCounts[status]}</span>
            {TASK_COUNTER_LABEL[status]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 sm:ml-auto" title="Comentários">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          <span className="tabular-nums text-ink">{report.commentCount}</span>
        </span>
      </div>
    </Link>
  );
}
