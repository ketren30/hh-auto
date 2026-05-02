/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HH_CLIENT_ID?: string;
  /** Полный redirect_uri как в кабинете hh (например http://localhost:3000/oauth/callback) */
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_OAUTH_REDIRECT_PATH?: string;
  /** true | 1 — обмен кода через dev-прокси Vite; HH_CLIENT_SECRET только на сервере */
  readonly VITE_HH_TOKEN_PROXY?: string;
  /** true | 1 — REST api.hh.ru через `/api/dev/hh-api` в dev (обход CORS) */
  readonly VITE_HH_API_PROXY?: string;
  /** Контакт разработчика для заголовка HH-User-Agent: `hh-auto/1.0 (email)` */
  readonly VITE_HH_CONTACT_EMAIL?: string;
  /** Полная строка HH-User-Agent; если задана — имеет приоритет над VITE_HH_CONTACT_EMAIL */
  readonly VITE_HH_USER_AGENT?: string;
  /** Полная строка OAuth scope как в кабинете dev.hh.ru (иначе дефолтные scopes из кода) */
  readonly VITE_HH_OAUTH_SCOPE?: string;
  /** Для пользовательского OAuth: `applicant` | `employer`; по умолчанию applicant + force_role */
  readonly VITE_HH_OAUTH_ROLE?: string;
  /** true | 1 — добавить skip_choose_account к /oauth/authorize */
  readonly VITE_HH_OAUTH_SKIP_CHOOSE_ACCOUNT?: string;
  /** Публичная ссылка на резюме (`…/resume/{id}`) — если GET /resumes/mine недоступен, id берётся отсюда для отклика */
  readonly VITE_HH_RESUME_URL?: string;
  /** Явный resume_id (hex из URL) — приоритетнее ссылки; надёжный обход, если парсинг URL не сработал */
  readonly VITE_HH_RESUME_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
