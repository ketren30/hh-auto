# Data model: 001-hh-vacancy-monitor

Logical entities derived from [spec.md](./spec.md). Persisted fields use browser storage unless noted. **Revised 2026-05-01**: профили поиска и Markdown-журналы замещают сохранённые подписки hh.ru как основной источник мониторинга.

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
| pollIntervalMinutes | number | localStorage | ≥ minimum (spec: ≥3 default policy) |
| soundEnabled | boolean | localStorage | FR-008 |
| llmBaseUrl | string | localStorage | User-configured HTTPS endpoint |
| llmApiKey | string | localStorage | Sensitive; never sync to developer servers |
| llmModel | string optional | localStorage | Provider-specific |
| lastPollAt | ISO datetime optional | localStorage | UX / diagnostics |

## ResumeProfile

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| resumeText | string | localStorage | FR-009; used in LLM prompts |

## VacancySearchProfile

Пользовательский набор фильтров для опроса `GET /vacancies` (или эквивалента по документации hh.ru).

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| id | string | localStorage | Stable UUID or opaque id generated client-side |
| displayName | string optional | localStorage | Short label in UI / journal title |
| text | string | localStorage | Main search query (`text` param) |
| experience | string optional | localStorage | hh experience id / enum as string — align with API |
| employment | string optional | localStorage | Employment type if exposed by API |
| schedule | string optional | localStorage | Schedule / remote-related filters per hh docs |
| areaId | string optional | localStorage | Region/city as hh **area** id (string for JSON safety) |
| excludePhrases | string[] | localStorage | Case-insensitive substring filter on title + snippet after fetch |
| monitoringEnabled | boolean | localStorage | May be stored inline **or** in separate map keyed by `id` (schema allows map — see contract) |

## SearchMonitoringMap (optional layout)

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| searchMonitoring | Record\<profileId, boolean\> | localStorage | FR-012; if not inlined on profile |

Legacy: **`subscriptionMonitoring`** (saved-search id → boolean) may coexist during migration; spec baseline uses **profiles**.

## VacancyItem

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| id | string | transient | Stable vacancy id from hh |
| title | string | transient | |
| employerName | string optional | transient | |
| descriptionSnippet | string optional | transient | As API returns |
| searchProfileId | string | transient | **Source profile** (replaces subscriptionId as primary) |
| subscriptionId | string optional | transient | Legacy alias if dual-write during migration |
| firstSeenAt | ISO datetime | transient / journal | UX ordering |

## SearchJournalRow (logical; serialized inside Markdown table)

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| vacancyId | string | inside MD / derived | |
| title | string | inside MD | |
| employer | string optional | inside MD | |
| url | string | inside MD | Public vacancy URL |
| firstSeenAt | ISO datetime | inside MD | |
| applied | boolean | inside MD | yes/no in file |
| appliedAt | ISO datetime optional | inside MD | |

## SearchJournalDocument

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| profileId | string | key | One journal per profile |
| markdownBody | string | localStorage | Full `.md` content per [search-journal-format.md](./contracts/search-journal-format.md) |
| lastPersistedAt | ISO datetime optional | localStorage | When body last regenerated |

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
| lastSuccessfulPollAt | ISO datetime | memory | Global or per-profile |
| vacancyIdsBySearchProfile | Map\<profileId, Set\<vacancyId\>\> | memory | FR-004 diff **per profile** |

Legacy: `vacancyIdsBySubscription` — superseded naming during migration.

## ApplyAttempt

| Field | Type | Storage | Notes |
|-------|------|---------|--------|
| vacancyId | string | memory | |
| searchProfileId | string optional | memory | To update correct journal |
| status | enum | memory | pending \| success \| failure \| needs_followup |
| message | string optional | memory | From hh.ru response mapping FR-015 |

## Validation rules

- `pollIntervalMinutes`: integer ≥ configured minimum (align with hh limits in implementation).
- `resumeText`: non-empty required before generating drafts (surface friendly error if empty).
- At least one profile with `monitoringEnabled === true` required for polling (spec Edge Cases).
- `excludePhrases`: trim empties; optional max length per phrase to avoid accidental huge paste (implementation).
- `vacancySearchProfiles[].text`: non-empty trimmed string required before enabling monitoring (recommended validation).

## State transitions

- **Poll cycle**: per enabled profile → fetch vacancies → client-side exclusion filter → diff vs `PollSnapshot` for that profile → merge into journal rows → regenerate `markdownBody` → optional export.
- **Draft generation**: unchanged per vacancy.
- **Apply**: user confirms → pending → outcome FR-015 → on success update journal row `applied` / `appliedAt` and regenerate Markdown.
