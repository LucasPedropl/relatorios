import type { ReportListItem, ReportStatus, ReportTask, TaskStatus } from '@/lib/types';

const SHOW_ARCHIVED_STORAGE_KEY = 'uaipdv_reports_show_archived';

const CLOSED_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set(['done', 'wontfix']);

export function getStoredShowArchived(): boolean {
  try {
    const value = localStorage.getItem(SHOW_ARCHIVED_STORAGE_KEY);
    if (value !== null) {
      return value === 'true';
    }
  } catch (err) {
    console.warn('Falha ao ler preferência de arquivados do localStorage:', err);
  }
  return false;
}

export function setStoredShowArchived(show: boolean): void {
  try {
    localStorage.setItem(SHOW_ARCHIVED_STORAGE_KEY, String(show));
  } catch (err) {
    console.warn('Falha ao salvar preferência de arquivados no localStorage:', err);
  }
}

export function countArchivedReports(reports: ReadonlyArray<ReportListItem>): number {
  let count = 0;
  for (const report of reports) {
    if (report.status === 'archived') count += 1;
  }
  return count;
}

export function selectReportsForListing(
  reports: ReadonlyArray<ReportListItem>,
  showArchived: boolean,
): ReportListItem[] {
  if (showArchived) return [...reports];
  return reports.filter((report) => report.status !== 'archived');
}

export function shouldSuggestArchive(
  reportStatus: ReportStatus,
  tasks: ReadonlyArray<Pick<ReportTask, 'status'>>,
): boolean {
  if (reportStatus === 'archived') return false;
  if (tasks.length === 0) return false;
  return tasks.every((task) => CLOSED_TASK_STATUSES.has(task.status));
}
