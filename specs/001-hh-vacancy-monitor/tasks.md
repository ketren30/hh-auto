---
description: "Task list — hh.ru vacancy monitor & cover letters"
---

# Tasks: hh.ru vacancy monitor & cover letters

**Input**: Design documents from `/specs/001-hh-vacancy-monitor/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Not requested in spec — **no dedicated test tasks**. Vitest can be wired in Polish if desired.

**Organization**: Phases follow user stories P1 → P2 → P3 from spec; paths match [plan.md](./plan.md) single SPA layout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallel-safe (different files, no ordering dependency on incomplete sibling tasks)
- **[USn]**: User Story phase label

## Path Conventions

Single project at repo root: `src/`, `public/`, `tests/` (optional later).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Vite + React + TS scaffold and toolchain per plan.

- [x] T001 Scaffold Vite React TypeScript project (`package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`) at repository root
- [x] T002 Install and wire `react-router-dom`; add `src/vite-env.d.ts` for `import.meta.env` typings
- [x] T003 [P] Add ESLint config (`eslint.config.js` or `.eslintrc.cjs`) with React Hooks + TypeScript + `eslint-config-prettier`
- [x] T004 [P] Add Prettier config (`.prettierrc`, `.prettierignore`)
- [x] T005 Add npm scripts (`dev`, `build`, `preview`, `lint`, `format`) in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, storage contract, routing shell, hh/LLM service stubs — **blocks all user stories**.

**⚠️ CRITICAL**: No user story work until this phase completes.

- [x] T006 Define domain TypeScript types (`VacancyItem`, `SavedSearchSubscription`, `UserSession`, `AppSettings`, etc.) in `src/types/index.ts` aligned with [data-model.md](./data-model.md)
- [x] T007 Implement typed persistence helpers read/write/merge for local/session storage in `src/services/storage.ts` following `contracts/local-app-state.schema.json`
- [x] T008 Create application shell with outlets and route map in `src/app/App.tsx` and `src/app/routes.tsx`
- [x] T009 Implement OAuth redirect handler UI route in `src/features/auth/OAuthCallbackPage.tsx` (parse `code`/`state`, call exchange stub)
- [x] T010 Implement `src/services/hhClient.ts`: PKCE helpers (generate verifier/challenge), token exchange placeholder, typed methods for saved searches and negotiation endpoints **stubbed to real hh URLs from docs during implementation**
- [x] T011 [P] Add shared UI building blocks in `src/components/` (`Layout.tsx`, `Button.tsx`, `ErrorBanner.tsx`)

**Checkpoint**: Foundation ready — user story implementation may begin.

---

## Phase 3: User Story 1 — Вход и доступ к подпискам (Priority: P1) 🎯 MVP

**Goal**: OAuth session, list hh subscriptions, toggle monitoring per subscription (persisted locally), save resume text locally.

**Independent Test**: Sign in (or mock tokens), see subscriptions from hh, toggle monitoring flags, save resume — without enabling polling or drafts.

### Implementation for User Story 1

- [x] T012 [US1] Implement auth/session context with login/logout and token persistence in `src/features/auth/AuthProvider.tsx`
- [x] T013 [US1] Build login/start page initiating OAuth PKCE flow in `src/features/auth/LoginPage.tsx`
- [x] T014 [US1] Fetch subscriptions via `hhClient` and render list in `src/features/subscriptions/SubscriptionsPage.tsx`
- [x] T015 [US1] Implement monitoring toggle persistence (`subscriptionMonitoring` map) in `src/features/subscriptions/useSubscriptionMonitoring.ts`
- [x] T016 [US1] Build resume text editor bound to `storage.ts` (`resumeText`) in `src/features/settings/ResumeSettings.tsx`

**Checkpoint**: US1 complete — MVP demo without polling.

---

## Phase 4: User Story 2 — Периодический опрос и новые вакансии (Priority: P2)

**Goal**: User-defined interval; poll only enabled subscriptions while tab/window open; diff snapshots for new vacancy IDs; errors visible.

**Independent Test**: With mocked `hhClient` responses or sandbox, verify timer fires, new vacancies detected once, no false positives on failure paths.

### Implementation for User Story 2

- [x] T017 [US2] Implement polling hook with configurable interval and minimum clamp in `src/features/polling/usePollScheduler.ts`
- [x] T018 [US2] Implement vacancy ID set comparison / snapshot structure in `src/services/pollSnapshot.ts`
- [x] T019 [US2] Orchestrate fetch-per-enabled-subscription and merge results in `src/features/polling/PollingCoordinator.tsx`
- [x] T020 [US2] Show poll status, errors, and optional “last successful poll” time in `src/components/PollStatusBar.tsx`
- [x] T031 [US2] Build poll interval editor (minutes) with enforced minimum and inline hint when below minimum per spec Edge Cases in `src/features/settings/PollingSettings.tsx`; persist `pollIntervalMinutes` via `storage.ts`; add route/link from `src/app/routes.tsx` and `src/components/Layout.tsx`

**Checkpoint**: US1 + US2 — monitoring works end-to-end without LLM.

---

## Phase 5: User Story 3 — Черновики писем, экран и звук (Priority: P3)

**Goal**: Generate drafts via user-configured LLM; editable textarea per vacancy; sound on new batch; single-vacancy apply with confirmation and mapped outcomes.

**Independent Test**: Inject fixture vacancies → drafts appear → edit → confirm apply → mock hh response mapped per FR-015.

### Implementation for User Story 3

- [x] T021 [P] [US3] Implement LLM HTTP client with prompt template meeting FR-006 in `src/services/llmClient.ts`
- [x] T022 [P] [US3] Build LLM settings form (base URL, API key, model) with on-device risk copy in `src/features/settings/LlmSettings.tsx`
- [x] T032 [P] [US3] Build sound notifications on/off toggle bound to `soundEnabled` in `src/features/settings/SoundSettings.tsx`; persist via `storage.ts` (must be readable before `useNewVacancySound` in T025)
- [x] T023 [US3] Build new vacancies page listing vacancy cards each with `<textarea>` draft in `src/features/vacancies/NewVacanciesPage.tsx`
- [x] T024 [US3] Implement draft generation orchestration (loading/error per row) in `src/features/vacancies/useCoverLetterDrafts.ts`
- [x] T025 [US3] Add `public/notification.mp3` and hook `src/hooks/useNewVacancySound.ts` respecting sound toggle in settings
- [x] T026 [US3] Implement per-vacancy confirmation modal and call apply method on `hhClient` in `src/features/vacancies/ApplyConfirmDialog.tsx` (extend `src/services/hhClient.ts` with apply)
- [x] T027 [US3] Normalize hh apply responses to success/failure/follow-up messaging for UI in `src/features/vacancies/applyOutcome.ts`

**Checkpoint**: All user stories functional independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Docs, UX hints, validation against quickstart.

- [x] T028 [P] Add root `README.md` describing app purpose, link to `specs/001-hh-vacancy-monitor/quickstart.md`, OAuth registration note
- [x] T029 Wire optional Page Visibility API hint (“background tabs may delay timers”) in `src/features/polling/usePollScheduler.ts` or `src/components/PollStatusBar.tsx`
- [x] T030 Walk through [quickstart.md](./quickstart.md) smoke steps; fix missing scripts or broken imports
- [x] T033 [P] Maintain `docs/hh-api-notes.md`: OAuth redirect URIs, scopes, and vacancy/subscription/apply endpoints **as wired in `hhClient.ts`**, with pointers to official hh developer documentation (keep updated when T010/T026 change)
- [x] T034 [P] Add root-level React error boundary (`src/components/AppErrorBoundary.tsx`) wrapping the router/app tree in `src/app/App.tsx`; fallback UI without leaking secrets; optional `console.error` with sanitized message per constitution **V**

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on |
|-------|------------|
| Phase 1 Setup | — |
| Phase 2 Foundational | Phase 1 |
| Phase 3 US1 | Phase 2 |
| Phase 4 US2 | Phase 2 **and** US1 recommended (needs auth + subscriptions UI — may mock only after T010–T011 if blocked) |
| Phase 5 US3 | Phase 2 **and** US2 recommended (needs new vacancy feed) |
| Phase 6 Polish | All desired story phases |

**Note**: US2/US3 strictly need `hhClient` + routes from Foundational; US2 logic assumes US1 session/subscription toggles exist — implement US1 before US2 for smoothest path.

### User Story Dependencies

- **US1**: After Foundational — standalone MVP.
- **US2**: After Foundational; practically after US1 for real OAuth + toggles.
- **US3**: After Foundational; after US2 for production-like vacancy pipeline (can use mocks if iterating).

### Parallel Opportunities

| Scope | Parallel tasks |
|-------|----------------|
| Setup | T003 ∥ T004 |
| Foundational | T011 ∥ (T006–T010 careful: T011 independent; T007 ∥ T006 possible if types first agreed) |
| US3 | T021 ∥ T022 ∥ T032 |
| Polish | T028 ∥ T033 ∥ T034 early |

---

## Parallel Example: User Story 3

```text
# Run together after storage/types stable:
- T021 src/services/llmClient.ts
- T022 src/features/settings/LlmSettings.tsx
- T032 src/features/settings/SoundSettings.tsx
```

---

## Parallel Example: User Story 1

```text
# After T012 AuthProvider exists:
- T014 SubscriptionsPage.tsx  (can parallel with T016 if ResumeSettings does not share files — prefer sequential T014 → T015 → T016 for same feature folder clarity)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 → Phase 2 → Phase 3 (US1) → **stop** and demo login + subscriptions + resume.

### Incremental Delivery

1. Add Phase 4 (US2) → polling + new vacancy detection.  
2. Add Phase 5 (US3) → drafts + sound + apply.  
3. Phase 6 polish.

### Metrics

| Metric | Value |
|--------|-------|
| Total tasks | 34 |
| Phase 1 | 5 |
| Phase 2 | 6 |
| US1 | 5 |
| US2 | 5 |
| US3 | 8 |
| Polish | 5 |

---

## Notes

- Implementation MUST comply with `.specify/memory/constitution.md` (privacy, official APIs, spec-driven changes, TS+lint+format, error boundary **T034**).
- Track OAuth/endpoints/scopes in `docs/hh-api-notes.md` per **T033** whenever **T010** / **T026** change.
- Replace hh endpoint URLs and OAuth client IDs using current hh developer documentation during T010/T026.
- Redux Toolkit **not** in task list — introduce only if Context complexity spikes (per plan); then add `src/app/store.ts` and refactor in a follow-up task outside this file.
- FR-011: never send tokens/resume/LLM keys to a developer-controlled backend.
