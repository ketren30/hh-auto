/**
 * hh.ru OAuth + REST client. URLs align with official applicant API where possible.
 * See docs/hh-api-notes.md — verify paths against current dev.hh.ru documentation.
 */

import type { SavedSearchSubscription, VacancyItem } from '../types';

const HH_API_PUBLIC_BASE = 'https://api.hh.ru';

/** В dev при `VITE_HH_API_PROXY=true` запросы идут на прокси Vite — иначе браузер блокирует CORS к api.hh.ru. */
function hhApiDevProxyEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const p = import.meta.env.VITE_HH_API_PROXY?.trim();
  return p === 'true' || p === '1';
}

function getHhApiBase(): string {
  return hhApiDevProxyEnabled() ? '/api/dev/hh-api' : HH_API_PUBLIC_BASE;
}
/** OAuth endpoints (HH applicant OAuth). */
export const HH_OAUTH_AUTHORIZE = 'https://hh.ru/oauth/authorize';
export const HH_OAUTH_TOKEN = 'https://hh.ru/oauth/token';

const PKCE_VERIFIER_KEY = 'hh-auto:pkce_verifier';
const OAUTH_STATE_KEY = 'hh-auto:oauth_state';

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64Url(digest);
}

function randomUrlSafeString(length = 64): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return bytesToBase64Url(arr.buffer);
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface HhNegotiationApplyPayload {
  vacancyId: string;
  resumeId: string;
  message: string;
}

function getClientId(): string {
  const id = import.meta.env.VITE_HH_CLIENT_ID?.trim();
  return id ?? '';
}

/** Формат из документации hh: `MyApp/1.0 (feedback@example.com)` — иначе возможны отказ или 403. */
function getHhUserAgent(): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  const full =
    import.meta.env.VITE_HH_USER_AGENT?.trim() || env['VITE_HH_USER-AGENT']?.trim();
  if (full) return stripEnvQuotes(full);
  const email = import.meta.env.VITE_HH_CONTACT_EMAIL?.trim();
  if (email) return `hh-auto/1.0 (${stripEnvQuotes(email)})`;
  return 'hh-auto/1.0 (set-VITE_HH_CONTACT_EMAIL-in-env@local)';
}

function getHhSiteHost(): string {
  return stripEnvQuotes(import.meta.env.VITE_HH_SITE_HOST?.trim() || 'hh.ru');
}

/** Параметр `host` для выбора сайта hh (см. OpenAPI → Host). */
function appendHhApiQueryDefaults(path: string): string {
  if (/^[a-z]+:\/\//i.test(path)) return path;
  const join = path.includes('?') ? '&' : '?';
  if (/[?&]host=/.test(path)) return path;
  return `${path}${join}host=${encodeURIComponent(getHhSiteHost())}`;
}

function formatHhApiError(apiPath: string, status: number, body: string): string {
  let detail = body.slice(0, 400).trim();
  try {
    const j = JSON.parse(body) as {
      errors?: { type?: string; value?: string; reason?: string }[];
      description?: string;
      error?: string;
      error_description?: string;
    };
    if (j.error) {
      detail = [j.error, j.error_description].filter(Boolean).join(': ');
    }
    const parts = j.errors?.map((e) =>
      [e.type, e.value ?? e.reason].filter(Boolean).join(': '),
    );
    if (parts?.length) detail = parts.join('; ');
    else if (!j.error && j.description) detail = j.description;
  } catch {
    /* оставить сырое тело */
  }
  let hint = '';
  if (status === 403) {
    hint =
      ' Проверьте HH-User-Agent (VITE_HH_USER_AGENT в .env для прокси), тип пользователя по GET /me (должен быть соискатель), список scope в кабинете dev.hh.ru и переменную VITE_HH_OAUTH_SCOPE при необходимости.';
    const low = detail.toLowerCase();
    if (low.includes('oauth') || low.includes('bad_authorization') || low.includes('user_auth_expected')) {
      hint +=
        ' Часто это токен приложения вместо пользователя или истёкший access_token — выйдите и войдите снова.';
    }
    if (apiPath.includes('saved_searches')) {
      hint +=
        ' Для автопоисков нужны applicant и scope applicant_saved_searches.';
    }
  }
  return `hh API ${apiPath}: ${status} ${detail}${hint}`;
}

function stripEnvQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Нормализация значения из `.env`: BOM, неразрывные пробелы, типичные «кавычки» из редакторов. */
function normalizeResumeEnvInput(raw: string): string {
  let s = stripEnvQuotes(raw.trim()).replace(/^\uFEFF/, '').replace(/\u00a0/g, ' ');
  if (
    (s.startsWith('\u201c') && s.endsWith('\u201d')) ||
    (s.startsWith('\u201e') && s.endsWith('\u201c'))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Извлекает `resume_id` для API из публичной ссылки вида
 * `https://{subdomain}.hh.ru/resume/{id}` или строки только с идентификатором (hex).
 */
export function parseResumeIdFromHhPublicUrl(raw: string): string | null {
  let s = normalizeResumeEnvInput(raw);
  if (!s) return null;
  if (s.startsWith('<') && s.endsWith('>')) s = normalizeResumeEnvInput(s.slice(1, -1));

  if (/^[a-f0-9]{20,64}$/i.test(s)) return s.toLowerCase();

  const slash = s.match(/\/resume\/([a-f0-9]+)(?:\/|[\s?#]|$)/i);
  if (slash?.[1]) return slash[1].toLowerCase();

  try {
    const url = /^https?:\/\//i.test(s) ? new URL(s) : new URL(`https://${s.replace(/^\/+/, '')}`);
    const segments = url.pathname.split('/').filter(Boolean);
    const i = segments.indexOf('resume');
    const id = i >= 0 ? segments[i + 1] : null;
    if (id && /^[a-f0-9]+$/i.test(id)) return id.toLowerCase();
    return null;
  } catch {
    return null;
  }
}

function readEnvString(key: 'VITE_HH_RESUME_URL' | 'VITE_HH_RESUME_ID'): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

/** Задано ли что‑то из переменных резюме в `.env` (сырое значение, до парсинга). */
export function hasResumeEnvVariables(): boolean {
  const url = readEnvString('VITE_HH_RESUME_URL');
  const id = readEnvString('VITE_HH_RESUME_ID');
  return Boolean(normalizeResumeEnvInput(url ?? '') || normalizeResumeEnvInput(id ?? ''));
}

/**
 * Если заданы `VITE_HH_RESUME_ID` или `VITE_HH_RESUME_URL`, отклики используют этот `resume_id`
 * без вызова GET `/resumes/mine`. Сначала читается явный id, затем ссылка.
 */
export function getConfiguredResumeIdFromEnv(): string | null {
  const idRaw = readEnvString('VITE_HH_RESUME_ID');
  if (idRaw) {
    const parsed = parseResumeIdFromHhPublicUrl(idRaw);
    if (parsed) return parsed;
  }
  const urlRaw = readEnvString('VITE_HH_RESUME_URL');
  if (!urlRaw) return null;
  return parseResumeIdFromHhPublicUrl(urlRaw);
}

/**
 * Должен **байт-в-байт** совпадать с redirect URI в настройках приложения hh.ru.
 * Задайте `VITE_OAUTH_REDIRECT_URI` полным URL (например `http://localhost:3000/oauth/callback`).
 * В `VITE_OAUTH_REDIRECT_PATH` указывайте только путь (`/oauth/callback`), не `https://…`.
 */
export function getOAuthRedirectUri(): string {
  const fixedRaw = import.meta.env.VITE_OAUTH_REDIRECT_URI?.trim();
  if (fixedRaw) return stripEnvQuotes(fixedRaw);

  let path = import.meta.env.VITE_OAUTH_REDIRECT_PATH?.trim() || '/oauth/callback';
  path = stripEnvQuotes(path);

  // Если в PATH ошибочно указали полный URL — используем как redirect_uri целиком.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomUrlSafeString(48);
  const challenge = await sha256Base64Url(verifier);
  return { verifier, challenge };
}

export function storePkceVerifier(verifier: string): void {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

export function takePkceVerifier(): string | null {
  const v = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  return v;
}

export function storeOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
}

export function peekOAuthState(): string | null {
  return sessionStorage.getItem(OAUTH_STATE_KEY);
}

export function takeOAuthState(): string | null {
  const s = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  return s;
}

export function buildAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
  scope?: string;
}): string {
  const clientId = getClientId();
  const redirectUri = getOAuthRedirectUri();
  const defaultScopes = 'openid profile email applicant_saved_searches applicant_negotiations';
  const scopeFromEnv = import.meta.env.VITE_HH_OAUTH_SCOPE?.trim();
  const scope =
    params.scope ??
    (scopeFromEnv ? stripEnvQuotes(scopeFromEnv) : defaultScopes);
  const u = new URL(HH_OAUTH_AUTHORIZE);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('state', params.state);
  u.searchParams.set('code_challenge', params.codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  if (scope) u.searchParams.set('scope', scope);

  /** Роль токена: без этого при активной сессии «работодатель» на hh.ru выдаётся не соискатель ([документация hh](https://api.hh.ru/openapi/redoc#section/Avtorizaciya/Zapros-avtorizacii-pod-drugim-polzovatelem)). */
  const roleRaw = import.meta.env.VITE_HH_OAUTH_ROLE?.trim();
  const role = roleRaw || 'applicant';
  if (role === 'applicant' || role === 'employer') {
    u.searchParams.set('role', role);
    u.searchParams.set('force_role', 'true');
  }

  const skipChoose = import.meta.env.VITE_HH_OAUTH_SKIP_CHOOSE_ACCOUNT?.trim();
  if (skipChoose === 'true' || skipChoose === '1') {
    u.searchParams.set('skip_choose_account', 'true');
  }

  return u.toString();
}

/** В dev при VITE_HH_TOKEN_PROXY запрос идёт на локальный прокси — секрет не в бандле. */
function getTokenEndpoint(): string {
  const p = import.meta.env.VITE_HH_TOKEN_PROXY?.trim();
  if (p === 'true' || p === '1') {
    return '/api/dev/hh/oauth/token';
  }
  return HH_OAUTH_TOKEN;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = getClientId();
  const verifier = takePkceVerifier();
  if (!verifier) throw new Error('PKCE verifier отсутствует — начните вход заново');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: getOAuthRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch(getTokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Обмен кода на токен: ${res.status} ${text.slice(0, 200)}`);
  }

  return (await res.json()) as TokenResponse;
}

async function hhFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const pathWithHost = appendHhApiQueryDefaults(path);
  const url = path.startsWith('http') ? path : `${getHhApiBase()}${pathWithHost}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'HH-User-Agent': getHhUserAgent(),
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatHhApiError(pathWithHost, res.status, text));
  }
  return (await res.json()) as T;
}

/** Краткая проверка GET /me — не соискатель часто даёт 403 на applicant-методах. */
export interface MeAuthSummary {
  authType: string | null;
  isApplicant: boolean;
  isEmployer: boolean;
}

export async function fetchMeAuthSummary(accessToken: string): Promise<MeAuthSummary | null> {
  try {
    const data = await hhFetch<Record<string, unknown>>(accessToken, '/me');
    return {
      authType: typeof data.auth_type === 'string' ? data.auth_type : null,
      isApplicant: data.is_applicant === true,
      isEmployer: data.is_employer === true,
    };
  } catch {
    return null;
  }
}

function mapSavedSearchItems(payload: unknown): SavedSearchSubscription[] {
  if (!payload || typeof payload !== 'object') return [];
  const o = payload as Record<string, unknown>;
  const items = o.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((raw): SavedSearchSubscription | null => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const id = r.id != null ? String(r.id) : null;
      const name =
        typeof r.name === 'string'
          ? r.name
          : typeof r.title === 'string'
            ? r.title
            : id ?? 'Подписка';
      if (!id) return null;
      return { id, name };
    })
    .filter((x): x is SavedSearchSubscription => x !== null);
}

/** GET /saved_searches/vacancies — сохранённые поиски вакансий (автопоиски) текущего соискателя. */
export async function listSavedSearches(accessToken: string): Promise<SavedSearchSubscription[]> {
  const data = await hhFetch<unknown>(accessToken, '/saved_searches/vacancies');
  return mapSavedSearchItems(data);
}

interface VacancyListResponse {
  items?: unknown[];
}

function mapVacancyRow(
  raw: unknown,
  subscriptionId: string,
  subscriptionName?: string,
): VacancyItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = r.id != null ? String(r.id) : null;
  if (!id) return null;
  const title =
    typeof r.name === 'string'
      ? r.name
      : typeof r.title === 'string'
        ? r.title
        : `Вакансия ${id}`;
  let employerName: string | undefined;
  const emp = r.employer;
  if (emp && typeof emp === 'object') {
    const e = emp as Record<string, unknown>;
    if (typeof e.name === 'string') employerName = e.name;
  }
  let snippet: string | undefined;
  const sn = r.snippet;
  if (sn && typeof sn === 'object') {
    const s = sn as Record<string, unknown>;
    if (typeof s.requirement === 'string') snippet = s.requirement;
    else if (typeof s.responsibility === 'string') snippet = s.responsibility;
  }
  if (!snippet && typeof r.description === 'string') {
    snippet = r.description.slice(0, 500);
  }

  return {
    id,
    title,
    employerName,
    descriptionSnippet: snippet,
    subscriptionId,
    subscriptionName,
    firstSeenAt: new Date().toISOString(),
  };
}

/**
 * Вакансии по сохранённому поиску — параметр saved_search_id для GET /vacancies.
 * Уточните в актуальной документации HH при изменении контракта.
 */
export async function fetchVacanciesForSavedSearch(
  accessToken: string,
  subscriptionId: string,
  subscriptionName?: string,
): Promise<VacancyItem[]> {
  const path = `/vacancies?saved_search_id=${encodeURIComponent(subscriptionId)}&per_page=100`;
  const data = await hhFetch<VacancyListResponse>(accessToken, path);
  const items = data.items ?? [];
  return items
    .map((row) => mapVacancyRow(row, subscriptionId, subscriptionName))
    .filter((x): x is VacancyItem => x !== null);
}

/** Элемент списка GET /resumes/mine (краткое представление — поля зависят от актуального контракта hh). */
export interface MyResumeItem {
  id: string;
  title: string;
  alternateUrl?: string;
}

function mapMyResumeRow(raw: unknown): MyResumeItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = r.id != null ? String(r.id) : null;
  if (!id) return null;
  const title =
    typeof r.title === 'string'
      ? r.title
      : typeof r.name === 'string'
        ? r.name
        : `Резюме ${id}`;
  const alternateUrl = typeof r.alternate_url === 'string' ? r.alternate_url : undefined;
  return { id, title, alternateUrl };
}

/** GET /resumes/mine — резюме текущего соискателя. */
export async function listMyResumes(accessToken: string): Promise<MyResumeItem[]> {
  const data = await hhFetch<{ items?: unknown[] }>(accessToken, '/resumes/mine?per_page=100');
  const items = data.items ?? [];
  return items.map(mapMyResumeRow).filter((x): x is MyResumeItem => x !== null);
}

/** Первое доступное резюме соискателя для отклика. */
export async function getPrimaryResumeId(accessToken: string): Promise<string | null> {
  const fromEnv = getConfiguredResumeIdFromEnv();
  if (fromEnv) return fromEnv;

  try {
    const list = await listMyResumes(accessToken);
    return list[0]?.id ?? null;
  } catch {
    return null;
  }
}

export interface ApplyNegotiationResult {
  ok: boolean;
  status: number;
  raw: unknown;
}

/**
 * Отклик на вакансию — POST /negotiations (форма зависит от актуальной документации HH).
 */
export async function applyNegotiation(
  accessToken: string,
  payload: HhNegotiationApplyPayload,
): Promise<ApplyNegotiationResult> {
  const body = {
    vacancy_id: payload.vacancyId,
    resume_id: payload.resumeId,
    message: payload.message,
  };

  const res = await fetch(`${getHhApiBase()}${appendHhApiQueryDefaults('/negotiations')}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'HH-User-Agent': getHhUserAgent(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    raw,
  };
}
