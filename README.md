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

Rode **da raiz do app** (`apps/relatorios`), não de dentro do `dist`:

```bash
cd apps/relatorios
npx vercel deploy --prod --yes --token=<VERCEL_TOKEN>
```

A Vercel builda sozinha a partir do `vercel.json` da raiz do app, que define
`outputDirectory: dist`, o rewrite de SPA e o `noindex`.

> **Duas armadilhas, as duas já custaram um deploy quebrado em 16/09/2026.**
>
> 1. **O CLI resolve a raiz do projeto subindo até achar o `package.json`.**
>    Rodar de dentro do `dist` não faz o `dist` virar a raiz: ele sobe para
>    `apps/relatorios` mesmo assim. Se não houver `.vercel/project.json` **ali**,
>    o CLI **cria um projeto novo** com o nome da pasta, o deploy responde
>    "ready" e `relatorios-uaipdv.vercel.app` continua na versão velha. O
>    vínculo correto é:
>
>    ```json
>    { "projectId": "prj_vLjq5hg1F0ZbGN5qyobgpdZxsxFJ",
>      "orgId": "team_9CDrQAAzMTuoV8tBmldkHamc",
>      "projectName": "relatorios-uaipdv" }
>    ```
>
> 2. **O `vercel.json` precisa estar na raiz do deploy.** O que existe em
>    `public/vercel.json` é copiado para o `dist` como arquivo estático e a
>    Vercel **não** o lê como configuração. Sem o `vercel.json` da raiz do app,
>    o rewrite de SPA não vale e todo link `/r/<slug>` — exatamente o que se
>    manda para o time de backend — responde **404**, enquanto a home responde
>    200 normalmente.
>
> **Sempre valide pelo link profundo, nunca pela home:**
>
> ```bash
> curl -sI https://relatorios-uaipdv.vercel.app/r/<algum-slug-existente> \
>   | grep -iE 'HTTP|x-robots-tag'
> ```
>
> Espere `200` e o header `X-Robots-Tag` — a ausência dele denuncia que o
> `vercel.json` não foi aplicado.

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
