import { Link } from 'react-router-dom';
import { FolderOpen, Inbox } from 'lucide-react';
import { useProjects, useReports } from '@/features/reports/hooks';
import { buildProjectCardModels } from '@/features/reports/projectStats';
import { ErrorPanel, TimeAgo } from '@/components/Badges';

function ProjectGridSkeleton() {
  return (
    <div role="status" aria-live="polite" className="grid gap-3 sm:grid-cols-2">
      <span className="sr-only">Carregando projetos…</span>
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

export function HomePage() {
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { reports, isLoading: reportsLoading, error, reload } = useReports();

  const showSkeleton = projectsLoading || reportsLoading;
  const cards = buildProjectCardModels(projects, reports);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Arquivo</p>
        <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">Projetos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Escolha um projeto para ver os relatórios. Auditorias e bugs publicados pelos agentes
          ficam separados por produto.
        </p>
      </div>

      {projectsError && (
        <ErrorPanel message={`Não foi possível carregar os projetos: ${projectsError}`} />
      )}
      {error && <ErrorPanel message={error} onRetry={() => void reload()} />}

      {showSkeleton ? (
        <ProjectGridSkeleton />
      ) : cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl text-ink">Nenhum projeto ainda</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Os projetos aparecem quando um agente publica o primeiro relatório.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <li key={card.project.id} className="min-w-0">
              <Link
                to={`/p/${card.project.slug}`}
                className="group relative flex h-full min-w-0 flex-col rounded-lg border border-line bg-sheet p-5 pl-6 transition outline-none hover:bg-sheet-hover focus-visible:ring-2 focus-visible:ring-ink/40"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-4 left-0 w-0.5 bg-ink/20 transition-colors group-hover:bg-ink"
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md border border-line text-ink">
                    <FolderOpen className="size-4" aria-hidden="true" />
                  </span>
                  <span className="tabular-nums text-xs text-muted">
                    {card.openTaskCount} {card.openTaskCount === 1 ? 'tarefa aberta' : 'tarefas abertas'}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl leading-tight text-ink">
                  {card.project.name}
                </h2>
                {card.project.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{card.project.description}</p>
                ) : null}
                <p className="mt-auto pt-4 text-xs text-muted">
                  {card.reportCount} {card.reportCount === 1 ? 'relatório' : 'relatórios'}
                  {card.lastUpdatedAt ? (
                    <>
                      {' · '}
                      <TimeAgo iso={card.lastUpdatedAt} prefix="atualizado " />
                    </>
                  ) : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
