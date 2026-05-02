# Implementation Plan: hh.ru vacancy monitor & cover letters

**Branch**: `001-hh-vacancy-monitor` | **Date**: 2026-05-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hh-vacancy-monitor/spec.md`

**Stack (explicit)**: React, ESLint, Prettier, React Router; Redux optional — recommended as **Redux Toolkit** only when shared async/UI state (polling, auth/session, vacancy lists) grows beyond comfortable Context scope (see [research.md](./research.md)).

## Summary

Single-page web application that lets a signed-in hh.ru user monitor selected saved searches (subscriptions), poll them on a user-defined interval while the tab stays open, detect newly appeared vacancies, generate editable cover-letter drafts via a user-configured LLM endpoint using locally stored resume text, play a sound on new items, and submit responses one vacancy at a time through hh.ru–supported mechanisms with explicit per-vacancy confirmation. No developer-hosted persistence for secrets or resume (FR-011): tokens, resume, LLM credentials, and subscription toggles live in browser storage only.

Technical approach: **Vite + React + TypeScript** (standard toolchain with ESLint/Prettier), **React Router** for navigation (login/settings/subscriptions/new vacancies), modular **services** for hh API client and LLM client, **polling orchestration** via `setInterval`/`requestAnimationFrame` fallback patterns aware of background tab throttling. State: start with **React context + hooks**; introduce **@reduxjs/toolkit** if polling/vacancy/auth state becomes hard to reason about (see research).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18+  
**Primary Dependencies**: Vite, React, react-router-dom, ESLint, Prettier, eslint-config-prettier; optional `@reduxjs/toolkit` + `react-redux`  
**Storage**: Browser only — `localStorage` / `sessionStorage` for tokens (prefer sessionStorage for access tokens if acceptable UX), resume text, LLM base URL/key (user-provided), per-subscription monitoring flags, polling interval, sound toggle; no app backend DB  
**Testing**: Recommended stack Vitest + Testing Library (align with Vite). **Initial `tasks.md` omits automated test tasks** because the feature spec did not request TDD; add Vitest in Setup/Polish when you want CI-quality coverage (see tasks Notes + T030).  
**Target Platform**: Modern evergreen desktop browsers (Chrome, Firefox, Edge); mobile browsers explicitly out of scope per spec assumptions  
**Project Type**: Web SPA (frontend-only)  
**Performance Goals**: Meet spec SC-004/SC-005/SC-007 time-to-feedback targets under typical connectivity; tolerate SC-002 timer slack in background tabs  
**Constraints**: FR-011 local-only secrets; hh.ru rate limits and OAuth/API surface as documented; SPA exposes LLM API key in runtime memory/localStorage — mitigated by user education (see research)  
**Scale/Scope**: Single user, single tab session focus; tens of subscriptions and hundreds of vacancy rows reasonable upper bound for UI lists  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is **ratified** (v1.0.0+). **Gate status**: verify plan against principles **I–V** (privacy-first, official hh/LLM integrations, spec alignment, TS+lint+format, error boundary / visible failures). Document justified exceptions in **Complexity Tracking**.

Re-check post-design: frontend-only storage and integration choices still align with principles **I** and **II**; reliability (**V**) includes top-level React error boundary per constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-hh-vacancy-monitor/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — schemas & integration contracts
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

Greenfield SPA at repository root:

```text
public/
└── (optional static assets, e.g. notification.mp3)

src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── store.ts              # present only if Redux Toolkit adopted
├── components/               # shared UI
├── features/
│   ├── auth/
│   ├── subscriptions/
│   ├── polling/
│   ├── vacancies/
│   └── settings/
├── hooks/
├── services/
│   ├── hhClient.ts           # wraps hh OAuth + REST calls
│   ├── llmClient.ts          # user-configured LLM HTTP API
│   └── storage.ts            # typed localStorage/sessionStorage
├── types/
└── main.tsx

tests/
├── unit/
└── integration/
```

**Structure Decision**: Single **Vite React** project under `src/` with **feature folders** co-locating UI and hooks; **`services/`** isolates hh.ru and LLM HTTP boundaries for testing and future Redux/async middleware. Tests live under `tests/` (or `src/**/*.test.tsx` — choose one convention in implementation).

## Complexity Tracking

> No constitution violations requiring justification. Placeholder constitution does not impose extra complexity gates.

## Phase overview (for implementers)

| Phase | Focus |
|-------|--------|
| 0 | [research.md](./research.md) — hh OAuth/PKCE, API capabilities, polling & LLM key risks |
| 1 | [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) |
| 2 | `/speckit-tasks` — actionable tasks.md |
