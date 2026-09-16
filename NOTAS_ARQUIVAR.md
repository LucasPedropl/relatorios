# Notas de Implementação — Arquivar relatórios

## Decisão de filtro: em memória, não na query

`fetchReports` continua sem `neq('status', 'archived')`.

Motivo: o chip precisa da contagem de arquivados mesmo quando eles estão ocultos. Filtrar na query exigiria uma segunda consulta só para o contador (ou um `count` paralelo) e um refetch ao ligar o chip. O padrão `wontfix` já busca tudo e filtra na UI. O hub é pequeno; o custo de trazer arquivados é irrelevante comparado a duas soluções diferentes para o mesmo problema.

`countArchivedReports` conta no array completo. `selectReportsForListing` omite `archived` quando a preferência está desligada. As páginas só montam; a regra vive em `features/reports/archivedVisibility.ts`.

## Mudanças arquivo por arquivo

### `src/features/reports/archivedVisibility.ts` (novo)
- Preferência `localStorage` `uaipdv_reports_show_archived` (`"true"` | `"false"`), leitura/escrita com `try/catch` e fallback `false` — o mesmo contrato do wontfix.
- `countArchivedReports`, `selectReportsForListing`, `shouldSuggestArchive` (todas as tasks em `done` ou `wontfix`, pelo menos uma task, relatório ainda não arquivado).

### `src/features/reports/hooks.ts`
- `useShowArchivedPreference` — estado + persistência. Home e projeto compartilham a mesma chave; não duplicar o helper em cada página.

### `src/features/reports/projectStats.ts`
- `openTaskCount` ignora relatórios `archived`. Um projeto cujos relatórios estão todos arquivados (ou cujas tasks abertas só existem em arquivados) mostra **0 tarefas abertas**, não pendências que ninguém vai olhar.
- `reportCount` / `lastUpdatedAt` seguem o array recebido. A home passa só os visíveis, então por padrão arquivados não inflacionam “N relatórios”.

### `src/pages/HomePage.tsx`
- Chip `FilterChip` com o rótulo `N arquivado(s) — mostrar` / `Arquivados`, só quando `archivedCount > 0`.
- Cards de projeto usam a lista já filtrada.

### `src/pages/ProjectPage.tsx`
- Mesmo chip, mesma chave, mesma cópia.
- Listagem padrão sem arquivados.
- Estado vazio específico quando o projeto só tem arquivados ocultos, com botão “Mostrar N arquivado(s)” — espelho do empty state do wontfix.

### `src/pages/ReportPage.tsx`
- Botão `<button>` **Arquivar** ao lado do `<select>`. Se já está arquivado, vira **Desarquivar** e grava `open`.
- Reusa `setReportStatus`, `isSavingStatus` e `statusError`. Sem modal.
- Linha discreta: “Todas as tarefas foram fechadas; dá para arquivar.” Relatório sem tasks não sugere.

### `src/components/ReportCard.tsx`
- **Não alterado.** Só entra na lista quando o chip está ligado; o badge `Arquivado` já existia.

### `src/features/reports/services.ts`
- **Não alterado.** Sem filtro na query, de propósito.

## O que ficou de fora

- Não lembra o status anterior ao arquivar: desarquivar sempre volta para `open`. Guardar o status prévio pediria coluna nova ou heurística; o briefing pediu `open`.
- Não esconde o card de projeto na home quando todos os relatórios estão arquivados. Ele aparece com 0 relatórios / 0 tarefas abertas, para ainda dar para entrar no projeto e desarquivar.
- Sem confirmação, sem banner, sem dependência nova.
