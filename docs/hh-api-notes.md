# hh.ru integration notes

Maintain this file **alongside** `src/services/hhClient.ts`. Update whenever OAuth scopes, endpoints, or apply flows change.

**Product direction (spec 2026-05-01 revision)**: baseline monitoring uses **`GET /vacancies`** with query params composed from **in-app search profiles**; **`saved_searches`** / subscriptions API may remain unavailable or optional — see `specs/001-hh-vacancy-monitor/spec.md` and Phase 7 tasks.

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

Поток входа рассчитан на **токен соискателя**. В URL авторизации по умолчанию добавляются **`role=applicant`** и **`force_role=true`**: если на hh.ru вы залогинены как работодатель, сайт предложит авторизацию в роли соискателя (см. [запрос авторизации под нужной ролью](https://api.hh.ru/openapi/redoc#section/Avtorizaciya/Zapros-avtorizacii-pod-drugim-polzovatelem)). При необходимости переопределите **`VITE_HH_OAUTH_ROLE`** или задайте **`VITE_HH_OAUTH_SKIP_CHOOSE_ACCOUNT=true`**.

Точные названия scope сверяйте с [документацией OAuth hh](https://github.com/hhru/api) и настройками приложения в [dev.hh.ru](https://dev.hh.ru).

## Applicant APIs in use

Base REST host: **`https://api.hh.ru`**. Браузер не может вызывать его напрямую с локального SPA из‑за CORS — при **`npm run dev`** и **`VITE_HH_API_PROXY=true`** запросы идут на **`/api/dev/hh-api/…`**, Vite проксирует на `api.hh.ru` (см. `hhClient.ts`, `vite.config.ts`).

При **`VITE_HH_API_PROXY=true`** запрос к **`api.hh.ru`** идёт с dev-сервера Node: прокси подставляет **`User-Agent`** и **`HH-User-Agent`** из **`.env`** (приоритет) или из заголовка браузера. В колонке «Заголовки запроса» в DevTools для **`https://localhost:3000/api/dev/hh-api/…`** поле **`User-Agent`** всегда будет браузерным — так устроен `fetch` в странице; реальную строку, ушедшую на hh, смотрите в **ответе** прокси: заголовок **`X-Hh-Dev-Upstream-User-Agent`** (только dev).

Запросы должны передавать **`HH-User-Agent`** в виде **`ИмяПриложения/версия (email@разработчика)`** (или полную строку через **`VITE_HH_USER_AGENT`**). Задайте **`VITE_HH_CONTACT_EMAIL`** — клиент соберёт заголовок автоматически. К query добавляется **`host`** (по умолчанию **`hh.ru`**, см. **`VITE_HH_SITE_HOST`**).

Ответ **`403` `forbidden`** при корректном UA часто означает: токен не **соискателя** (проверка **`GET /me`**, в интерфейсе — предупреждение под шапкой), не те **OAuth scope** в кабинете [**dev.hh.ru**](https://dev.hh.ru) (задайте **`VITE_HH_OAUTH_SCOPE`** как в кабинете и войдите заново), либо метод для вашего приложения/аккаунта ограничен правилами hh.

| Purpose | HTTP method | Path / operation | Notes |
|---------|-------------|------------------|-------|
| List saved vacancy searches (applicant) | GET | `/saved_searches/vacancies` | Тот же контракт, что в OpenAPI для сохранённых поисков: `{ items: [...] }`, поля `id`, `name` |
| Fetch vacancies per subscription | GET | `/vacancies?saved_search_id={id}&per_page=100` | Verify `saved_search_id` against current API docs |
| List resumes (pick primary for apply) | GET | `/resumes/mine` | `listMyResumes()` → экран «Резюме»; для отклика — первое в списке |
| Resume id без платного API | env | **`VITE_HH_RESUME_URL`** / **`VITE_HH_RESUME_ID`** | Ссылка `…/resume/{id}` или явный hex-id; **`getPrimaryResumeId`** не дергает `/resumes/mine`. В `vite.config` заданы **`root`** и **`envDir`** по каталогу проекта, чтобы `.env` читался не только из текущего cwd |
| Submit negotiation / apply | POST | `/negotiations` | JSON body: `vacancy_id`, `resume_id`, `message` — **confirm field names** with official docs |

## Official references

- OpenAPI / docs repository (community mirror): [github.com/hhru/api](https://github.com/hhru/api)
- Developer registration and OAuth settings: use the current hh.ru developer portal linked from official documentation.

## Gotchas

- Rate limits / quotas: honour hh.ru limits; default poll interval minimum is 3 minutes in app storage (`MIN_POLL_INTERVAL_MINUTES`).
- Negotiations payload may require additional fields (e.g. templates) depending on vacancy type — adjust `applyNegotiation` when documentation mandates it.
- Resume attachment rules when applying: enforced by hh.ru; failures surface via API errors mapped in `applyOutcome.ts`.
