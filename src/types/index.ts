/** Domain types aligned with data-model.md and contracts/local-app-state.schema.json */

export interface UserSession {
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
  authenticated: boolean;
}

export interface SavedSearchSubscription {
  id: string;
  name: string;
}

export interface VacancyItem {
  id: string;
  title: string;
  employerName?: string;
  descriptionSnippet?: string;
  subscriptionId: string;
  subscriptionName?: string;
  firstSeenAt: string;
}

export interface LlmSettingsPersisted {
  baseUrl: string;
  apiKey: string;
  model?: string;
  /** Каталог Yandex Cloud для Foundation Models и заголовка x-folder-id */
  folderId?: string;
}

/** Persisted local state (subset of runtime AppSettings) */
export interface LocalAppState {
  schemaVersion: number;
  pollIntervalMinutes: number;
  soundEnabled: boolean;
  resumeText: string;
  llm?: LlmSettingsPersisted;
  subscriptionMonitoring: Record<string, boolean>;
  lastPollAt?: string;
}

export type DraftGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CoverLetterDraft {
  vacancyId: string;
  body: string;
  generationStatus: DraftGenerationStatus;
  errorMessage?: string;
}

export type ApplyAttemptStatus = 'pending' | 'success' | 'failure' | 'needs_followup';

export interface ApplyAttempt {
  vacancyId: string;
  status: ApplyAttemptStatus;
  message?: string;
}

export interface PollSnapshotData {
  lastSuccessfulPollAt?: string;
  vacancyIdsBySubscription: Record<string, string[]>;
}
