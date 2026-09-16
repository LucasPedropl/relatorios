/**
 * Identidade sem login: o visitante digita o nome uma vez e ele fica no localStorage.
 * Serve só para assinar comentários e mudanças de status — não é autenticação.
 */
const STORAGE_KEY = 'relatorios:author';

export function getAuthor(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function setAuthor(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name.trim());
  } catch (error) {
    console.warn('Não foi possível guardar o nome no localStorage', error);
  }
}
