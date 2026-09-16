/** Espelha migrations/015_report_hub.sql do monorepo agent-os (c:\codigo\pessoal\MCPs). */

export type ReportKind = 'audit' | 'bug' | 'feature' | 'note';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'archived';
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'wontfix';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AuthorKind = 'human' | 'ai';

export interface ReportProject {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  kind: ReportKind;
  summary_md: string;
  status: ReportStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportTask {
  id: string;
  report_id: string;
  code: string | null;
  title: string;
  severity: Severity;
  area: string | null;
  location: string | null;
  body_md: string;
  status: TaskStatus;
  position: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportComment {
  id: string;
  report_id: string;
  task_id: string | null;
  author: string;
  author_kind: AuthorKind;
  body_md: string;
  created_at: string;
}

/** Relatório com o que a lista precisa mostrar sem abrir. */
export interface ReportListItem extends Report {
  project: Pick<ReportProject, 'slug' | 'name'>;
  taskCounts: Record<TaskStatus, number>;
  totalTasks: number;
  commentCount: number;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
  info: 'Info',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  done: 'Resolvido',
  wontfix: 'Não vamos corrigir',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Aberto',
  in_review: 'Em revisão',
  resolved: 'Resolvido',
  archived: 'Arquivado',
};

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  audit: 'Auditoria',
  bug: 'Bug',
  feature: 'Melhoria',
  note: 'Nota',
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
export const TASK_STATUS_ORDER: TaskStatus[] = ['open', 'in_progress', 'done', 'wontfix'];
