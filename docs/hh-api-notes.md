# hh.ru integration notes

Maintain this file **alongside** `src/services/hhClient.ts`. Update whenever OAuth scopes, endpoints, or apply flows change.

## OAuth

### Confidential client + PKCE (локальная разработка)

Если у приложения есть **client_secret**, его нельзя класть в `VITE_*`: переменные попадают в клиентский бандл.

Режим **`VITE_HH_TOKEN_PROXY=true`**: браузер шлёт обмен кода на **`/api/dev/hh/oauth/token`**; dev-сервер Vite читает **`HH_CLIENT_SECRET`** из `.env`, добавляет его к телу запроса и проксирует на **`https://hh.ru/oauth/token`**.

Для статического production-без backend либо отключите прямой секрет (публичный PKCE-клиент hh), либо поднимите свой endpoint обмена кода на сервере.

| Field | Value (as wired in code) |
|-------|---------------------------|
| Authorization URL | `https://hh.ru/oauth/authorize` |
| Token URL | `https://hh.ru/oauth/token` (или dev: см. выше) |
| Redirect URI(s) registered | Задаётся **`VITE_OAUTH_REDIRECT_URI`** (полный URL, как в кабинете hh), иначе `window.location.origin` + **`VITE_OAUTH_REDIRECT_PATH`** (по умолчанию `/oauth/callback`). Для фиксированного `http://localhost:3000/oauth/callback` задайте переменную явно. |
| Client ID | `import.meta.env.VITE_HH_CLIENT_ID` (public SPA client per hh developer cabinet) |
| PKCE | Required — `S256` challenge; verifier stored in `sessionStorage` until token exchange |

Scopes requested in `buildAuthorizeUrl()` (adjust to match your registered app):

- `openid profile email applicant_saved_searches applicant_negotiations`

Confirm exact scope strings against current [hh.ru Open API / OAuth documentation](https://github.com/hhru/api) or the official developer portal.

## Applicant APIs in use

Base REST host: **`https://api.hh.ru`**. Браузер не может вызывать его напрямую с локального SPA из‑за CORS — при **`npm run dev`** и **`VITE_HH_API_PROXY=true`** запросы идут на **`/api/dev/hh-api/…`**, Vite проксирует на `api.hh.ru` (см. `hhClient.ts`, `vite.config.ts`).

| Purpose | HTTP method | Path / operation | Notes |
|---------|-------------|------------------|-------|
| List saved vacancy searches (applicant) | GET | `/saved_searches/vacancies` | Тот же контракт, что в OpenAPI для сохранённых поисков: `{ items: [...] }`, поля `id`, `name` |
| Fetch vacancies per subscription | GET | `/vacancies?saved_search_id={id}&per_page=100` | Verify `saved_search_id` against current API docs |
| List resumes (pick primary for apply) | GET | `/resumes/mine` | First item `id` used as `resume_id` |
| Submit negotiation / apply | POST | `/negotiations` | JSON body: `vacancy_id`, `resume_id`, `message` — **confirm field names** with official docs |

## Official references

- OpenAPI / docs repository (community mirror): [github.com/hhru/api](https://github.com/hhru/api)
- Developer registration and OAuth settings: use the current hh.ru developer portal linked from official documentation.

## Gotchas

- Rate limits / quotas: honour hh.ru limits; default poll interval minimum is 3 minutes in app storage (`MIN_POLL_INTERVAL_MINUTES`).
- Negotiations payload may require additional fields (e.g. templates) depending on vacancy type — adjust `applyNegotiation` when documentation mandates it.
- Resume attachment rules when applying: enforced by hh.ru; failures surface via API errors mapped in `applyOutcome.ts`.
