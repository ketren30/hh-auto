# Data model: 001-hh-vacancy-monitor

Logical entities derived from [spec.md](./spec.md). Persisted fields use browser storage unless noted.

## UserSession

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| accessToken | string (opaque) | sessionStorage preferred | From hh OAuth; clear on logout |
| refreshToken | string optional | sessionStorage or memory | If hh issues refresh; follow hh docs |
| expiresAt | ISO datetime optional | sessionStorage | Derived from token response |
| authenticated | boolean | derived | |

## AppSettings

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| pollIntervalMinutes | number | localStorage | Enforce minimum (spec: ≥3 default policy) |
| soundEnabled | boolean | localStorage | FR-008 |
| llmBaseUrl | string | localStorage | User-configured HTTPS endpoint |
| llmApiKey | string | localStorage | Sensitive; never sync to developer servers |
| llmModel | string optional | localStorage | Provider-specific |
| lastPollAt | ISO datetime optional | localStorage | UX / diagnostics |

## ResumeProfile

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| resumeText | string | localStorage | FR-009; used in LLM prompts |

## SavedSearchSubscription (from hh.ru)

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| id | string | transient from API | hh identifier for saved search |
| name | string | transient | Display label |
| monitoringEnabled | boolean | localStorage map `subscriptionId → boolean` | FR-012 |

## VacancyItem

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| id | string | transient | Stable vacancy id from hh |
| title | string | transient | |
| employerName | string optional | transient | |
| descriptionSnippet | string optional | transient | As much as API returns |
| subscriptionId | string | transient | Source subscription |
| firstSeenAt | ISO datetime | memory/local optional | For UX ordering |

## CoverLetterDraft

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| vacancyId | string | memory | |
| body | string | memory | FR-007 editable field |
| generationStatus | enum | memory | idle \| loading \| success \| error |
| errorMessage | string optional | memory | |

## PollSnapshot

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| lastSuccessfulPollAt | ISO datetime | memory | |
| vacancyIdsBySubscription | Map\<string, Set\<string\>\> | memory | Compare to detect “new” (FR-004) |

## ApplyAttempt

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| vacancyId | string | memory | |
| status | enum | memory | pending \| success \| failure \| needs_followup |
| message | string optional | memory | From hh.ru response mapping FR-015 |

## Validation rules

- `pollIntervalMinutes`: integer ≥ configured minimum (align with hh limits in implementation).
- `resumeText`: non-empty required before generating drafts (surface friendly error if empty).
- `monitoringEnabled`: at least one subscription must be enabled for polling to run (spec Edge Cases).

## State transitions

- **Poll cycle**: idle → fetching → success | error; on success compute new vacancy IDs vs `PollSnapshot`.
- **Draft generation**: idle → loading → success | error per vacancy.
- **Apply**: user confirms → pending → outcome per FR-015.
