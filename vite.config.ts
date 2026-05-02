import path from 'node:path';
import { fileURLToPath } from 'node:url';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/** Каталог приложения (рядом с этим конфигом) — чтобы `.env` подхватывался даже если `npm run dev` запущен из родительской папки. */
const appRoot = path.dirname(fileURLToPath(import.meta.url));

/** Если redirect в кабинете hh задан как https://localhost:3000 — dev-сервер должен слушать HTTPS. */
function devHttpsFromOAuthRedirect(env: Record<string, string>): boolean {
  const u = env.VITE_OAUTH_REDIRECT_URI?.trim() ?? '';
  return u.startsWith('https://localhost') || u.startsWith('https://127.0.0.1');
}

function body(req: { on: (ev: string, fn: (...args: unknown[]) => void) => void }): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: unknown) => {
      data += chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk);
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function stripEnvQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Совпадает с логикой клиента (hhClient): полная строка или почта для сборки. */
function resolveHhUserAgentFromEnv(env: Record<string, string>): string | undefined {
  const raw = (env.VITE_HH_USER_AGENT ?? env['VITE_HH_USER-AGENT'])?.trim();
  if (raw) return stripEnvQuotes(raw);
  const mail = env.VITE_HH_CONTACT_EMAIL?.trim();
  if (mail) return `hh-auto/1.0 (${stripEnvQuotes(mail)})`;
  return undefined;
}

/** Прокси на api.hh.ru — REST без CORS из браузера при локальной разработке. */
function attachHhApiProxy(
  middlewares: {
    use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void;
  },
  env: Record<string, string>,
) {
  middlewares.use(async (req, res, next) => {
    const request = req as {
      url?: string;
      method?: string;
      headers: Record<string, string | string[] | undefined>;
      on: (ev: string, fn: (...args: unknown[]) => void) => void;
    };
    const response = res as {
      statusCode: number;
      setHeader: (name: string, value: string) => void;
      end: (chunk?: string) => void;
    };

    const rawUrl = request.url ?? '';
    const pathname = rawUrl.split('?')[0] ?? '';
    const prefix = '/api/dev/hh-api';
    if (!pathname.startsWith(prefix)) {
      next();
      return;
    }

    const rest = pathname.slice(prefix.length);
    const q = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : '';
    const pathOnApi = rest.length > 0 ? rest : '/';
      const target = `https://api.hh.ru${pathOnApi}${q}`;

    try {
      let payload: string | undefined;
      const method = request.method ?? 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        payload = await body(request);
      }

      const headers: Record<string, string> = {};
      const h = request.headers;
      const auth = h.authorization;
      if (auth) headers.Authorization = Array.isArray(auth) ? auth[0] : auth;

      const hhUaRaw = h['hh-user-agent'];
      const hhUaFromBrowser = hhUaRaw
        ? (Array.isArray(hhUaRaw) ? hhUaRaw[0] : hhUaRaw).trim()
        : '';
      // Как в Postman: надёжнее брать строку из .env (сервер), браузерский hop всё равно не может подменить User-Agent.
      const uaFromEnv = resolveHhUserAgentFromEnv(env);
      const ua = uaFromEnv || hhUaFromBrowser;
      if (ua) {
        headers['HH-User-Agent'] = ua;
        headers['User-Agent'] = ua;
      }

      const accept = h.accept;
      if (accept) headers.Accept = Array.isArray(accept) ? accept[0] : accept;
      const ct = h['content-type'];
      if (ct) headers['Content-Type'] = Array.isArray(ct) ? ct[0] : ct;

      const r = await fetch(target, {
        method,
        headers,
        body: payload,
      });

      const text = await r.text();
      const ctOut = r.headers.get('content-type');
      if (ctOut) response.setHeader('Content-Type', ctOut);
      // В DevTools на запросе к localhost в колонке User-Agent всегда браузер — смотрите этот заголовок ответа: что реально ушло на api.hh.ru.
      if (ua) response.setHeader('X-Hh-Dev-Upstream-User-Agent', ua.slice(0, 500));
      response.statusCode = r.status;
      response.end(text);
    } catch (e) {
      response.statusCode = 502;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(e instanceof Error ? e.message : 'hh api proxy error');
    }
  });
}

/** Прокси на llm.api.cloud.yandex.net — обход CORS браузера при локальной разработке. */
function attachYandexLlmProxy(middlewares: {
  use: (fn: (req: unknown, res: unknown, next: () => void) => void) => void;
}) {
  middlewares.use(async (req, res, next) => {
    const request = req as {
      url?: string;
      method?: string;
      headers: Record<string, string | string[] | undefined>;
      on: (ev: string, fn: (...args: unknown[]) => void) => void;
    };
    const response = res as {
      statusCode: number;
      setHeader: (name: string, value: string) => void;
      end: (chunk?: string) => void;
    };

    const rawUrl = request.url ?? '';
    const pathname = rawUrl.split('?')[0] ?? '';
    const prefix = '/api/dev/yandex-llm';
    if (!pathname.startsWith(prefix)) {
      next();
      return;
    }

    const rest = pathname.slice(prefix.length);
    const q = rawUrl.includes('?') ? `?${rawUrl.split('?').slice(1).join('?')}` : '';
    const target = `https://llm.api.cloud.yandex.net${rest}${q}`;

    try {
      let payload: string | undefined;
      const method = request.method ?? 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        payload = await body(request);
      }

      const headers: Record<string, string> = {};
      const auth = request.headers.authorization;
      if (auth) headers.Authorization = Array.isArray(auth) ? auth[0] : auth;
      const fid = request.headers['x-folder-id'];
      if (fid) headers['x-folder-id'] = Array.isArray(fid) ? fid[0] : fid;
      const ct = request.headers['content-type'];
      if (ct) headers['Content-Type'] = Array.isArray(ct) ? ct[0] : ct;

      const r = await fetch(target, {
        method,
        headers,
        body: payload,
      });

      const text = await r.text();
      const ctOut = r.headers.get('content-type');
      if (ctOut) response.setHeader('Content-Type', ctOut);
      response.statusCode = r.status;
      response.end(text);
    } catch (e) {
      response.statusCode = 502;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(e instanceof Error ? e.message : 'yandex llm proxy error');
    }
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '');
  const https = devHttpsFromOAuthRedirect(env);

  return {
    root: appRoot,
    envDir: appRoot,
    server: {
      port: 3000,
      https,
    },
    preview: {
      port: 3000,
      https,
    },
    plugins: [
      ...(https ? [basicSsl()] : []),
      react(),
      {
        name: 'hh-oauth-token-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const pathname = req.url?.split('?')[0] ?? '';
            if (pathname !== '/api/dev/hh/oauth/token' || req.method !== 'POST') {
              next();
              return;
            }

            const secret = env.HH_CLIENT_SECRET?.trim();
            if (!secret) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('HH_CLIENT_SECRET is not set — нужен для confidential-клиента при прокси.');
              return;
            }

            try {
              const raw = await body(req);
              const params = new URLSearchParams(raw);
              params.set('client_secret', secret);

              const ua = resolveHhUserAgentFromEnv(env);
              const tokenHeaders: Record<string, string> = {
                'Content-Type': 'application/x-www-form-urlencoded',
              };
              if (ua) {
                tokenHeaders['HH-User-Agent'] = ua;
                tokenHeaders['User-Agent'] = ua;
              }

              const r = await fetch('https://hh.ru/oauth/token', {
                method: 'POST',
                headers: tokenHeaders,
                body: params.toString(),
              });

              const text = await r.text();
              const ct = r.headers.get('content-type');
              if (ct) res.setHeader('Content-Type', ct);
              res.statusCode = r.status;
              res.end(text);
            } catch (e) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(e instanceof Error ? e.message : 'token proxy error');
            }
          });
        },
      },
      {
        name: 'hh-api-proxy',
        configureServer(server) {
          attachHhApiProxy(server.middlewares, env);
        },
        configurePreviewServer(server) {
          attachHhApiProxy(server.middlewares, env);
        },
      },
      {
        name: 'yandex-llm-proxy',
        configureServer(server) {
          attachYandexLlmProxy(server.middlewares);
        },
        configurePreviewServer(server) {
          attachYandexLlmProxy(server.middlewares);
        },
      },
    ],
  };
});
