import { supabase } from '@/lib/supabase';
import type {
  Report,
  ReportComment,
  ReportListItem,
  ReportProject,
  ReportStatus,
  ReportTask,
  TaskStatus,
} from '@/lib/types';

const EMPTY_TASK_COUNTS: Record<TaskStatus, number> = {
  open: 0,
  in_progress: 0,
  done: 0,
  wontfix: 0,
};

export async function fetchProjects(): Promise<ReportProject[]> {
  const { data, error } = await supabase
    .from('report_projects')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

type ReportRowWithAggregates = Report & {
  project: Pick<ReportProject, 'slug' | 'name'> | null;
  report_tasks: { status: TaskStatus }[] | null;
  report_comments: { id: string }[] | null;
};

export async function fetchReports(projectSlug?: string): Promise<ReportListItem[]> {
  let query = supabase
    .from('reports')
    .select(
      '*, project:report_projects!inner(slug,name), report_tasks(status), report_comments(id)',
    )
    .order('updated_at', { ascending: false });

  if (projectSlug) {
    query = query.eq('report_projects.slug', projectSlug);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data as ReportRowWithAggregates[] | null ?? []).map((row) => {
    const taskCounts = { ...EMPTY_TASK_COUNTS };
    for (const task of row.report_tasks ?? []) {
      taskCounts[task.status] += 1;
    }

    const { report_tasks: _tasks, report_comments: _comments, ...report } = row;

    return {
      ...(report as Report),
      project: row.project ?? { slug: '—', name: 'Sem projeto' },
      taskCounts,
      totalTasks: (row.report_tasks ?? []).length,
      commentCount: (row.report_comments ?? []).length,
    };
  });
}

export interface ReportDetail {
  report: Report;
  project: ReportProject;
  tasks: ReportTask[];
  comments: ReportComment[];
}

export async function fetchReportBySlug(slug: string): Promise<ReportDetail | null> {
  const { data: report, error } = await supabase
    .from('reports')
    .select('*, project:report_projects(*)')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!report) return null;

  const { project, ...reportRow } = report as Report & { project: ReportProject };

  const [tasksResult, commentsResult] = await Promise.all([
    supabase
      .from('report_tasks')
      .select('*')
      .eq('report_id', reportRow.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', reportRow.id)
      .order('created_at', { ascending: true }),
  ]);

  if (tasksResult.error) throw new Error(tasksResult.error.message);
  if (commentsResult.error) throw new Error(commentsResult.error.message);

  return {
    report: reportRow as Report,
    project,
    tasks: (tasksResult.data ?? []) as ReportTask[],
    comments: (commentsResult.data ?? []) as ReportComment[],
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  author: string,
): Promise<ReportTask> {
  const { data, error } = await supabase
    .from('report_tasks')
    .update({ status, updated_by: author })
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ReportTask;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Report;
}

export async function addComment(input: {
  reportId: string;
  taskId?: string | null;
  author: string;
  bodyMd: string;
}): Promise<ReportComment> {
  const { data, error } = await supabase
    .from('report_comments')
    .insert({
      report_id: input.reportId,
      task_id: input.taskId ?? null,
      author: input.author,
      author_kind: 'human',
      body_md: input.bodyMd,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ReportComment;
}
