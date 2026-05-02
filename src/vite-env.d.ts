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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
