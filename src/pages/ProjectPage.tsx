import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';
import { useProjects, useReports, useShowArchivedPreference } from '@/features/reports/hooks';
import {
  countArchivedReports,
  selectReportsForListing,
} from '@/features/reports/archivedVisibility';
import { ErrorPanel, FilterChip } from '@/components/Badges';
import { ReportCard } from '@/components/ReportCard';

function ListSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-3 md:grid-cols-2">
      <span className="sr-only">Carregando relatórios…</span>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-36 animate-pulse rounded-lg border border-line bg-sheet"
        />
      ))}
    </div>
  );
}

export function ProjectPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { reports, isLoading, error, reload } = useReports(projectSlug);
  const { showArchived, toggleShowArchived } = useShowArchivedPreference();

  const project = projects.find((item) => item.slug === projectSlug);
  const archivedCount = countArchivedReports(reports);
  const visibleReports = useMemo(
    () => selectReportsForListing(reports, showArchived),
    [reports, showArchived],
  );
  const sortedReports = useMemo(
    () =>
      [...visibleReports].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)),
    [visibleReports],
  );

  const showSkeleton = isLoading && reports.length === 0;
  const unknownProject = !projectsLoading && !project && !projectsError;

  return (
    <div className="space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Projetos
      </Link>

      <div>
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Relatórios</p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">
          {project?.name ?? (unknownProject ? 'Projeto não encontrado' : '…')}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {project?.description ??
            'Marque tarefas como resolvidas e comente direto por aqui.'}
        </p>
        {archivedCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar relatórios arquivados">
            <FilterChip
              isActive={showArchived}
              count={showArchived ? archivedCount : undefined}
              onClick={toggleShowArchived}
            >
              {showArchived
                ? 'Arquivados'
                : `${archivedCount} ${
                    archivedCount === 1 ? 'arquivado' : 'arquivados'
                  } — mostrar`}
            </FilterChip>
          </div>
        )}
      </div>

      {projectsError && (
        <ErrorPanel message={`Não foi possível carregar os projetos: ${projectsError}`} />
      )}
      {error && <ErrorPanel message={error} onRetry={() => void reload()} />}

      {unknownProject ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl text-ink">Esse projeto não existe</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Volte à lista e escolha um dos projetos publicados.
          </p>
        </div>
      ) : showSkeleton ? (
        <ListSkeleton />
      ) : sortedReports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl text-ink">
            {archivedCount > 0 && !showArchived
              ? `Relatórios arquivados em ${project?.name ?? 'este projeto'}`
              : `Nenhum relatório em ${project?.name ?? 'este projeto'}`}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            {archivedCount > 0 && !showArchived
              ? archivedCount === 1
                ? 'O relatório deste projeto está arquivado e oculto.'
                : `Todos os ${archivedCount} relatórios deste projeto estão arquivados e ocultos.`
              : 'Os relatórios aparecem quando um agente audita a API deste produto.'}
          </p>
          {archivedCount > 0 && !showArchived && (
            <button
              type="button"
              onClick={toggleShowArchived}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-sheet px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-sheet-hover focus-visible:ring-2 focus-visible:ring-ink/40"
            >
              Mostrar {archivedCount} {archivedCount === 1 ? 'arquivado' : 'arquivados'}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted">
            {sortedReports.length} {sortedReports.length === 1 ? 'relatório' : 'relatórios'}
          </p>
          <ul className={`grid gap-3 md:grid-cols-2 ${isLoading ? 'opacity-60 transition' : ''}`}>
            {sortedReports.map((report) => (
              <li key={report.id} className="min-w-0">
                <ReportCard report={report} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
