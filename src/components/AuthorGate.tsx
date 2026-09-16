import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { UserRound } from 'lucide-react';
import { getAuthor, setAuthor as persistAuthor } from '@/lib/identity';

interface AuthorContextValue {
  author: string;
  changeAuthor: () => void;
}

const AuthorContext = createContext<AuthorContextValue | null>(null);

export function useAuthor(): AuthorContextValue {
  const value = useContext(AuthorContext);
  if (!value) {
    throw new Error('useAuthor() precisa estar dentro de <AuthorGate />.');
  }
  return value;
}

interface AuthorModalProps {
  initialName: string;
  canDismiss: boolean;
  onSubmit: (name: string) => void;
  onDismiss: () => void;
}

function AuthorModal({ initialName, canDismiss, onSubmit, onDismiss }: AuthorModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    if (!canDismiss) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canDismiss, onDismiss]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Informe seu nome para continuar.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-line bg-sheet p-6 shadow-lg"
      >
        <div className="flex size-10 items-center justify-center rounded-full border border-line text-ink">
          <UserRound className="size-5" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="mt-4 font-display text-2xl text-ink">
          Como você se chama?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Seu nome assina os comentários e as mudanças de status. Sem senha, sem cadastro.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
          <label htmlFor={inputId} className="sr-only">
            Nome
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Ex.: Maria Souza"
            autoFocus
            autoComplete="name"
            maxLength={80}
            aria-invalid={error !== null}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-ink/40"
          />
          {error && (
            <p role="alert" className="text-xs text-rose-900 dark:text-rose-300">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {canDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-sheet-hover hover:text-ink"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-paper transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:outline-none"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Porteiro de identidade: só renderiza os filhos depois que existe um nome.
 * Não é autenticação — é assinatura para comentários e mudanças de status.
 */
export function AuthorGate({ children }: { children: ReactNode }) {
  const [author, setAuthorState] = useState<string | null>(() => getAuthor());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(author === null);

  const changeAuthor = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleSubmit = useCallback((name: string) => {
    persistAuthor(name);
    setAuthorState(name);
    setIsModalOpen(false);
  }, []);

  const contextValue = useMemo<AuthorContextValue | null>(
    () => (author === null ? null : { author, changeAuthor }),
    [author, changeAuthor],
  );

  return (
    <>
      {contextValue ? (
        <AuthorContext.Provider value={contextValue}>{children}</AuthorContext.Provider>
      ) : null}
      {isModalOpen && (
        <AuthorModal
          initialName={author ?? ''}
          canDismiss={author !== null}
          onSubmit={handleSubmit}
          onDismiss={closeModal}
        />
      )}
    </>
  );
}
