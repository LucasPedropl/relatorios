import { useCallback, useEffect, useState } from 'react';
import type {
  ReportComment,
  ReportListItem,
  ReportProject,
  ReportStatus,
  TaskStatus,
} from '@/lib/types';
import {
  addComment,
  fetchProjects,
  fetchReportBySlug,
  fetchReports,
  updateReportStatus,
  updateTaskStatus,
  type ReportDetail,
} from './services';
import { getStoredShowArchived, setStoredShowArchived } from './archivedVisibility';

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useProjects() {
  const [projects, setProjects] = useState<ReportProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((err: unknown) => {
        console.error('Falha ao carregar projetos', err);
        if (active) setError(toMessage(err));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { projects, isLoading, error };
}

export function useShowArchivedPreference() {
  const [showArchived, setShowArchived] = useState(getStoredShowArchived);

  const toggleShowArchived = useCallback(() => {
    setShowArchived((previous) => {
      const next = !previous;
      setStoredShowArchived(next);
      return next;
    });
  }, []);

  return { showArchived, toggleShowArchived };
}

export function useReports(projectSlug?: string) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return fetchReports(projectSlug)
      .then(setReports)
      .catch((err: unknown) => {
        console.error('Falha ao carregar relatórios', err);
        setError(toMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [projectSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { reports, isLoading, error, reload };
}

export function useReportDetail(slug: string | undefined) {
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(() => {
    if (!slug) return Promise.resolve();
    setIsLoading(true);
    setError(null);
    return fetchReportBySlug(slug)
      .then((data) => {
        setDetail(data);
        setNotFound(data === null);
      })
      .catch((err: unknown) => {
        console.error('Falha ao carregar relatório', err);
        setError(toMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus, author: string) => {
      const updated = await updateTaskStatus(taskId, status, author);
      setDetail((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((task) => (task.id === taskId ? updated : task)),
            }
          : current,
      );
    },
    [],
  );

  const setReportStatus = useCallback(async (reportId: string, status: ReportStatus) => {
    const updated = await updateReportStatus(reportId, status);
    setDetail((current) => (current ? { ...current, report: updated } : current));
  }, []);

  const postComment = useCallback(
    async (input: { taskId?: string | null; author: string; bodyMd: string }) => {
      if (!detail) return;
      const created: ReportComment = await addComment({
        reportId: detail.report.id,
        taskId: input.taskId ?? null,
        author: input.author,
        bodyMd: input.bodyMd,
      });
      setDetail((current) =>
        current ? { ...current, comments: [...current.comments, created] } : current,
      );
    },
    [detail],
  );

  return {
    detail,
    isLoading,
    error,
    notFound,
    reload,
    setTaskStatus,
    setReportStatus,
    postComment,
  };
}
