import type { LocalAppState } from '../types';

export const LOCAL_STORAGE_KEY = 'hh-auto:localState';

export const SCHEMA_VERSION = 1 as const;
export const MIN_POLL_INTERVAL_MINUTES = 3;
export const DEFAULT_POLL_INTERVAL_MINUTES = 5;

function defaultState(): LocalAppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    pollIntervalMinutes: DEFAULT_POLL_INTERVAL_MINUTES,
    soundEnabled: true,
    resumeText: '',
    subscriptionMonitoring: {},
  };
}

function sanitizeState(raw: unknown): LocalAppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;

  const schemaVersion =
    typeof o.schemaVersion === 'number' && o.schemaVersion >= 1 ? o.schemaVersion : SCHEMA_VERSION;

  let pollIntervalMinutes =
    typeof o.pollIntervalMinutes === 'number'
      ? Math.floor(o.pollIntervalMinutes)
      : base.pollIntervalMinutes;
  if (pollIntervalMinutes < MIN_POLL_INTERVAL_MINUTES) {
    pollIntervalMinutes = MIN_POLL_INTERVAL_MINUTES;
  }

  const soundEnabled = typeof o.soundEnabled === 'boolean' ? o.soundEnabled : base.soundEnabled;
  const resumeText = typeof o.resumeText === 'string' ? o.resumeText : base.resumeText;

  let llm: LocalAppState['llm'];
  if (o.llm && typeof o.llm === 'object') {
    const L = o.llm as Record<string, unknown>;
    const baseUrl = typeof L.baseUrl === 'string' ? L.baseUrl : '';
    const apiKey = typeof L.apiKey === 'string' ? L.apiKey : '';
    const model = typeof L.model === 'string' ? L.model : undefined;
    const folderId = typeof L.folderId === 'string' ? L.folderId : undefined;
    if (baseUrl || apiKey || model || folderId) {
      llm = { baseUrl, apiKey, model, folderId };
    }
  }

  let subscriptionMonitoring: Record<string, boolean> = {};
  if (o.subscriptionMonitoring && typeof o.subscriptionMonitoring === 'object') {
    subscriptionMonitoring = Object.fromEntries(
      Object.entries(o.subscriptionMonitoring as Record<string, unknown>).filter(
        ([k, v]) => typeof k === 'string' && typeof v === 'boolean',
      ),
    ) as Record<string, boolean>;
  }

  const lastPollAt =
    typeof o.lastPollAt === 'string' && o.lastPollAt.length > 0 ? o.lastPollAt : undefined;

  return {
    schemaVersion,
    pollIntervalMinutes,
    soundEnabled,
    resumeText,
    llm,
    subscriptionMonitoring,
    lastPollAt,
  };
}

export function readLocalState(): LocalAppState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed: unknown = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch {
    return defaultState();
  }
}

export function writeLocalState(next: LocalAppState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('hh-auto:storage'));
  } catch {
    /* quota / private mode */
  }
}

export function mergeLocalState(patch: Partial<LocalAppState>): LocalAppState {
  const cur = readLocalState();
  const merged: LocalAppState = {
    ...cur,
    ...patch,
    subscriptionMonitoring: {
      ...cur.subscriptionMonitoring,
      ...(patch.subscriptionMonitoring ?? {}),
    },
    llm:
      patch.llm !== undefined
        ? patch.llm
        : cur.llm !== undefined
          ? { ...cur.llm }
          : undefined,
  };
  if (merged.pollIntervalMinutes < MIN_POLL_INTERVAL_MINUTES) {
    merged.pollIntervalMinutes = MIN_POLL_INTERVAL_MINUTES;
  }
  writeLocalState(merged);
  return merged;
}
