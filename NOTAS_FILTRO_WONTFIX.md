# Notas de Implementação — Filtro Wontfix

## Mudanças Arquivo por Arquivo

### `src/pages/ReportPage.tsx`
- Implementado estado local `showWontfix` inicializado a partir da preferência salva em `localStorage`.
- Atualizado o cálculo memoizado `visibleTasks`: no modo "Todas" (`taskFilter === 'all'`), por padrão (quando `showWontfix` é `false`), as tarefas com status `wontfix` são omitidas da listagem.
- Adicionado chip de controle dinâmico utilizando a componente acessível `<FilterChip>` (`<button>` nativo com `aria-pressed` e foco visível). Quando há tarefas recusadas ocultas, o chip exibe explicitamente a contagem e a ação (`X não serão corrigidas — mostrar` / `1 não será corrigida — mostrar`).
- Adicionado estado vazio explicativo na listagem quando todas as tarefas do relatório possuem status `wontfix` e estão ocultas, disponibilizando um botão de desocultamento direto.

## Onde foi guardada a preferência do filtro

- **Storage**: `localStorage` do navegador.
- **Chave**: `uaipdv_reports_show_wontfix` (`"true"` | `"false"`).
- **Tratamento de exceções**: A leitura (`getStoredShowWontfix`) e a escrita (`setStoredShowWontfix`) estão 100% envolvidas em blocos `try/catch` com fallback para `false`, garantindo que a aplicação funcione normalmente caso o storage esteja inacessível (ex: navegação privativa, bloqueios de segurança).

## O que decidiu não fazer e por quê

- `src/features/reports/projectStats.ts`: **Não alterado**. A função `buildProjectCardModels` já calcula `openTaskCount` somando apenas `open + in_progress`. O status `wontfix` não infla o número de pendências dos projetos.
- `src/pages/HomePage.tsx` e `src/pages/ProjectPage.tsx`: **Não alterados**. Ambas as páginas já usam contadores honestos que não tratam tarefas `wontfix` como abertas.
- `src/components/ReportCard.tsx`: **Não alterado**. O progresso e barras de status já somam `wontfix` como finalizadas (`finished = done + wontfix`) e exibem explicitamente a contagem individual de `wontfix`.
- `src/components/Badges.tsx`: **Não alterado**. A componente `FilterChip` já foi desenvolvida adequadamente com elemento `<button>`, `type="button"`, `aria-pressed`, estilos Tailwind compatíveis com tema claro/escuro e acessibilidade de teclado.
