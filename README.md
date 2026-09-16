# Relatórios UaiPDV

Hub de relatórios de erro para o time de backend. As IAs publicam o relatório
(pelas tools do agent-os); o backend abre um link, lê, marca as tasks como
resolvidas e comenta. Sem login.

Substitui o fluxo de escrever `docs/relatorio-api-*.md` na mão e mandar o
arquivo por fora.

## Rodar

```bash
npm run dev --workspace apps/relatorios   # http://localhost:5200
```

Precisa de `.env` (copie de `.env.example`) com o **mesmo** projeto Supabase do
agent-os — é onde as tabelas `report_*` vivem (migration
`c:\codigo\pessoal\MCPs\migrations\015_report_hub.sql`).

## Publicado em

https://relatorios-uaipdv.vercel.app — é esse o link que vai para o time de
backend. `REPORTS_WEB_URL` já aponta para lá no `env` do agent-os dos três
`mcp.json` (Claude conta 1 e 2, Cursor), então as tools devolvem a URL pública.

### Como republicar depois de mexer no código

O deploy é do `dist` já buildado (o app é workspace do monorepo; deixar a Vercel
instalar as dependências quebraria). `public/vercel.json` carrega o rewrite de
SPA e o `noindex`, e o Vite o copia para `dist` a cada build.

```bash
npm run build --workspace apps/relatorios
cd apps/relatorios/dist
npx vercel deploy --prod --yes --token=<VERCEL_TOKEN>
```

O token está no `env` do agent-os em `~/.cursor/mcp.json`. O projeto na Vercel é
`lucaspedropls-projects/relatorios-uaipdv`. Use sempre o domínio curto
(`relatorios-uaipdv.vercel.app`): a URL longa do deployment cai na Deployment
Protection e pede login.

## Fluxo

```
IA (Claude/Cursor/Antigravity)          Backend (navegador)
  publish_report  ─────────────────────►  lê o relatório, marca task como
  report_feedback ◄─────────────────────  resolvida, comenta
  respond_report  ─────────────────────►  vê a resposta da IA no thread
```

| Tool              | Para quê                                                     |
| ----------------- | ------------------------------------------------------------ |
| `publish_report`  | publica relatório + tasks (upsert por slug), devolve o link  |
| `list_reports`    | placar: quantas tasks abertas/resolvidas por relatório       |
| `get_report`      | relatório completo com tasks e comentários                   |
| `report_feedback` | o que o backend comentou/mudou desde X — o gatilho da resposta |
| `respond_report`  | a IA comenta e/ou muda o status de uma task                  |

O link enviado ao backend é `<host>/r/<slug>`. Em produção, defina
`REPORTS_WEB_URL` no `env` do agent-os em cada `mcp.json` para que as tools
devolvam a URL pública em vez de `localhost:5200`.

## Segurança — leia antes de expor isso na internet

Este app usa a **anon key do projeto Supabase do agent-os**, e as políticas RLS
de lá são `USING (true) WITH CHECK (true)`. Quem tiver o link tem, na prática,
leitura e escrita em **todas** as tabelas do agent-os (memórias, decisões,
skills, jobs de delegação) — não só nas de relatório.

Decisão consciente do Pedro em 11/09/2026 para destravar o protótipo. Antes de
mandar o link para fora do time, uma das duas:

1. mover as tabelas `report_*` para um projeto Supabase separado (troca só as
   env vars do app e das tools); ou
2. criar um role dedicado com `GRANT` apenas nas tabelas `report_*` e servir o
   front com um JWT assinado para esse role.

Pendência relacionada: o alias `sentry` em `mcp_hub_connections` guarda o token
em texto puro no `config_json` (os outros aliases usam `${VAR}`) — ele vaza
junto com a anon key.
