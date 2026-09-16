import type { ReportListItem, ReportProject } from '@/lib/types';

export interface ProjectCardModel {
  project: ReportProject;
  reportCount: number;
  openTaskCount: number;
  lastUpdatedAt: string | null;
}

export function buildProjectCardModels(
  projects: ReportProject[],
  reports: ReportListItem[],
): ProjectCardModel[] {
  const models = projects.map((project) => {
    const owned = reports.filter((report) => report.project.slug === project.slug);
    let lastUpdatedAt: string | null = null;
    let openTaskCount = 0;

    for (const report of owned) {
      openTaskCount += report.taskCounts.open + report.taskCounts.in_progress;
      if (!lastUpdatedAt || Date.parse(report.updated_at) > Date.parse(lastUpdatedAt)) {
        lastUpdatedAt = report.updated_at;
      }
    }

    return {
      project,
      reportCount: owned.length,
      openTaskCount,
      lastUpdatedAt,
    };
  });

  return models.sort((left, right) => {
    const rightTime = right.lastUpdatedAt ? Date.parse(right.lastUpdatedAt) : 0;
    const leftTime = left.lastUpdatedAt ? Date.parse(left.lastUpdatedAt) : 0;
    if (rightTime !== leftTime) return rightTime - leftTime;
    return left.project.name.localeCompare(right.project.name, 'pt-BR');
  });
}
