# Research: 001-hh-vacancy-monitor

## 1. hh.ru integration (OAuth & API)

**Decision**: Use **OAuth 2.0 Authorization Code flow with PKCE** suitable for a public SPA, registering redirect URI(s) in the hh developer settings; obtain access tokens for applicant-facing APIs documented by hh (Open API / applicant methods — verify exact scopes and endpoint paths against current `dev.hh.ru` / official documentation at implementation time).

**Rationale**: Spec requires official mechanisms only (FR-001, FR-014); PKCE avoids shipping a client secret in the browser while staying standards-based.

**Alternatives considered**:

- **Implicit flow** — deprecated industry-wide; rejected.
- **Backend-for-frontend (BFF)** holding client secret — improves token hygiene but adds a server component conflicting with “no developer server for storing user secrets” unless BFF is strictly stateless and never persists tokens; deferred unless hh mandates confidential client.

**Follow-ups**: Confirm exact OAuth endpoints, token lifetime/refresh, and which methods expose saved searches and negotiation applications for applicants; map each to service functions in `hhClient.ts`.

## 2. Polling in background tabs

**Decision**: Keep **`setInterval`-driven polling** while document/window is open; document in UI that browsers may throttle inactive tabs (already reflected in spec SC-002 / Edge Cases). Optionally combine with **Page Visibility API** to show “last successful poll” timestamp and backoff messaging on errors.

**Rationale**: Matches clarification A (poll continues when tab inactive).

**Alternatives considered**:

- **Web Workers + alarms** — heavier; unnecessary unless timer drift proves unacceptable in testing.

## 3. Redux vs lighter state

**Decision**: **Start without Redux** (Context + hooks + `services/`). Add **Redux Toolkit** when two or more of the following hurt maintainability: coordinated polling + auth expiry + vacancy list updates; deep prop drilling; race conditions on overlapping hh/LLM requests.

**Rationale**: User asked for Redux “if needed”; RTK reduces boilerplate vs classic Redux.

**Alternatives considered**:

- **Zustand / Jotai** — smaller bundles; not requested; optional future refactor.

## 4. LLM access from SPA

**Decision**: User supplies **base URL + API key + model name** in Settings; stored **only in localStorage** (FR-011). App calls LLM over HTTPS from the browser (OpenAI-compatible or documented provider shape). Show explicit warning that keys reside on the user machine and can be read by anyone with device access; never log key contents.

**Rationale**: Matches spec assumption that user brings their own provider keys.

**Alternatives considered**:

- **Proxy service** to hide keys — out of scope unless security review demands it.

## 5. Tooling: ESLint + Prettier + React Router

**Decision**: **ESLint** flat config or legacy config with `eslint-plugin-react-hooks`, `eslint-plugin-react`, **`eslint-config-prettier`** to disable conflicting rules; **Prettier** as formatter; **react-router-dom** v6+ with route-level code splitting optional.

**Rationale**: Matches requested stack; Prettier + ESLint integration is standard.

## 6. Testing stack

**Decision**: **Vitest + Testing Library** aligned with Vite.

**Rationale**: Fast DX; consistent with chosen bundler.
