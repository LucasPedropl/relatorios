import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ClipboardList, UserRound } from 'lucide-react';
import { AuthorGate, useAuthor } from '@/components/AuthorGate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HomePage } from '@/pages/HomePage';
import { ProjectPage } from '@/pages/ProjectPage';
import { ReportPage } from '@/pages/ReportPage';

function Layout({ children }: { children: ReactNode }) {
  const { author, changeAuthor } = useAuthor();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-semibold text-ink outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line">
              <ClipboardList className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate font-display text-lg tracking-tight">Relatórios UaiPDV</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <ThemeToggle />
            <UserRound className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="max-w-32 truncate text-ink sm:max-w-48" title={author}>
              {author}
            </span>
            <button
              type="button"
              onClick={changeAuthor}
              aria-label="Trocar nome"
              className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-muted transition hover:bg-sheet-hover hover:text-ink"
            >
              Trocar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthorGate>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:projectSlug" element={<ProjectPage />} />
          <Route path="/r/:slug" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthorGate>
  );
}
