import type { ReactNode } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import {
  REPORT_KIND_LABEL,
  REPORT_STATUS_LABEL,
  SEVERITY_LABEL,
  TASK_STATUS_LABEL,
  type ReportKind,
  type ReportStatus,
  type Severity,
  type TaskStatus,
} from '@/lib/types';

/**
 * Átomos de UI compartilhados: badges de domínio, chip de filtro, tempo relativo
 * e painel de erro. Vivem juntos para não espalhar helpers de 10 linhas por página.
 */

const BADGE_BASE =
  'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap';

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: 'border-rose-800/40 bg-rose-800/8 text-rose-900 dark:text-rose-300',
  high: 'border-orange-800/40 bg-orange-800/8 text-orange-900 dark:text-orange-300',
  medium: 'border-neutral-500/50 bg-neutral-500/10 text-ink',
  low: 'border-line bg-sheet text-muted',
  info: 'border-line bg-sheet text-muted',
};

/** Cor de "bolinha" por status de tarefa — reutilizada nos contadores da lista. */
export const TASK_STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  open: 'bg-ink/40',
  in_progress: 'bg-ink',
  done: 'bg-ink',
  wontfix: 'bg-muted',
};

const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  open: 'border-line bg-sheet text-ink',
  in_progress: 'border-ink/40 bg-ink/8 text-ink',
  done: 'border-ink bg-ink text-paper',
  wontfix: 'border-line bg-sheet text-muted',
};

const REPORT_STATUS_CLASS: Record<ReportStatus, string> = {
  open: 'border-ink/40 bg-ink/8 text-ink',
  in_review: 'border-line bg-sheet text-ink',
  resolved: 'border-ink bg-ink text-paper',
  archived: 'border-line bg-sheet text-muted',
};

const KIND_CLASS: Record<ReportKind, string> = {
  audit: 'border-line bg-sheet text-ink',
  bug: 'border-rose-800/40 bg-rose-800/8 text-rose-900 dark:text-rose-300',
  feature: 'border-ink/40 bg-ink/8 text-ink',
  note: 'border-line bg-sheet text-muted',
};

interface BadgeProps {
  className: string;
  title: string;
  children: ReactNode;
}

function Badge({ className, title, children }: BadgeProps) {
  return (
    <span className={`${BADGE_BASE} ${className}`} title={title}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge className={`uppercase tracking-wide ${SEVERITY_CLASS[severity]}`} title="Severidade">
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={TASK_STATUS_CLASS[status]} title="Status da tarefa">
      <span className={`size-1.5 rounded-full ${TASK_STATUS_DOT_CLASS[status]}`} aria-hidden="true" />
      {TASK_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge className={REPORT_STATUS_CLASS[status]} title="Status do relatório">
      {REPORT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: ReportKind }) {
  return (
    <Badge className={`uppercase tracking-wide ${KIND_CLASS[kind]}`} title="Tipo de relatório">
      {REPORT_KIND_LABEL[kind]}
    </Badge>
  );
}

interface FilterChipProps {
  isActive: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}

export function FilterChip({ isActive, onClick, count, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
        isActive
          ? 'border-ink bg-ink text-paper'
          : 'border-line bg-sheet text-muted hover:bg-sheet-hover hover:text-ink'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 text-[10px] tabular-nums ${
            isActive ? 'bg-paper/15 text-paper' : 'bg-line text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

function plural(amount: number, singular: string, pluralForm: string): string {
  return amount === 1 ? singular : pluralForm;
}

/** "há 3 dias", "há 2 h", "agora mesmo" — sem lib de data. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return 'data inválida';

  const elapsed = now - timestamp;
  if (elapsed < MINUTE_MS) return 'agora mesmo';
  if (elapsed < HOUR_MS) return `há ${Math.floor(elapsed / MINUTE_MS)} min`;
  if (elapsed < DAY_MS) return `há ${Math.floor(elapsed / HOUR_MS)} h`;
  if (elapsed < MONTH_MS) {
    const days = Math.floor(elapsed / DAY_MS);
    return `há ${days} ${plural(days, 'dia', 'dias')}`;
  }
  if (elapsed < YEAR_MS) {
    const months = Math.floor(elapsed / MONTH_MS);
    return `há ${months} ${plural(months, 'mês', 'meses')}`;
  }
  const years = Math.floor(elapsed / YEAR_MS);
  return `há ${years} ${plural(years, 'ano', 'anos')}`;
}

/** "11/09/2026 14:32" no fuso do navegador. */
export function formatAbsolute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'data inválida';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimeAgoProps {
  iso: string;
  prefix?: string;
  className?: string;
}

export function TimeAgo({ iso, prefix, className }: TimeAgoProps) {
  return (
    <time dateTime={iso} title={formatAbsolute(iso)} className={className}>
      {prefix}
      {formatRelativeTime(iso)}
    </time>
  );
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorPanel({ message, onRetry, className }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col gap-2 rounded-lg border border-rose-800/40 bg-rose-800/8 px-3 py-2.5 text-sm text-rose-900 dark:text-rose-300 sm:flex-row sm:items-center ${className ?? ''}`}
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 self-start rounded-md border border-rose-800/40 px-2 py-1 text-xs font-medium hover:bg-rose-800/10 sm:self-auto"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
