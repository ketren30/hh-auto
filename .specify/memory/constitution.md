<!--
Sync Impact Report
Version change: (none / template) → 1.0.0 — initial ratification
Modified principles: N/A (initial adoption)
Added sections: Core Principles I–V; Security & privacy; Delivery workflow; Governance
Removed sections: None (replaced placeholder template body)
Templates: plan-template.md ✅ Constitution Check aligned; constitution-template.md ⚠ source template unchanged by design; spec-template.md ⚠ optional cross-ref only; tasks-template.md ⚠ optional cross-ref only
Follow-ups: None
-->

# hh-auto Constitution

## Core Principles

### I. Privacy-first & local credentials (NON-NEGOTIABLE)

User secrets—hh.ru session tokens, resume text, LLM API keys, subscription monitoring choices—MUST NOT be transmitted to or persisted on infrastructure operated by the application author except where the user explicitly invokes third parties they chose (hh.ru OAuth/API, user-configured LLM HTTPS endpoint). Client-side storage MUST be the default; document any exception in spec/plan before implementation.

### II. Official integrations only

All hh.ru access MUST use mechanisms documented and permitted by hh for applicant/developer use (OAuth, published APIs, registration rules). Scraping or circumventing official APIs is forbidden. LLM usage MUST respect provider terms and user-supplied configuration only.

### III. Spec-driven delivery

Material behavior changes start from or update `specs/<feature>/spec.md`, then `plan.md` / `tasks.md` as appropriate. Merging implementation that contradicts an approved spec without updating the spec first is forbidden unless explicitly labeled a time-boxed spike and reconciled immediately after.

### IV. Type-safe baseline & consistent style

Application code MUST use TypeScript with strict checking enabled. ESLint and Prettier MUST run clean on changed files before merge (or CI equivalent once introduced). New dependencies MUST serve a clear requirement from spec/plan—avoid speculative libraries.

### V. User-visible reliability

Critical UI MUST NOT fail silently for recoverable errors in auth, polling, apply, or generation flows. The SPA MUST include a top-level **React error boundary** so unexpected render errors surface a safe fallback UI instead of a blank screen. User-facing messages MUST NOT embed secrets (tokens, keys).

## Security & privacy standards

- Treat browser storage as sensitive: minimize retention of access tokens; prefer short-lived session patterns where hh allows.
- Never log raw OAuth codes, access tokens, refresh tokens, or LLM keys.
- Document integration endpoints and scopes in `docs/hh-api-notes.md` (or successor) when touching `hhClient`.

## Delivery workflow & quality gates

- Feature branches follow Spec Kit conventions (`NNN-short-name` or timestamped per project config).
- Constitution checks in `plan.md` MUST be satisfied or explicitly justified before Phase 0 research proceeds.
- README / quickstart MUST remain accurate enough for a new contributor to run OAuth registration and local dev.

## Governance

This constitution supersedes ad-hoc conventions when they conflict. Amendments: propose change in a PR that edits `.specify/memory/constitution.md`, bumps **semantic version** (MAJOR for incompatible principle removal/redefinition; MINOR for new principles or expanded MUST rules; PATCH for clarifications), updates **Last Amended**, and summarizes impact in the Sync Impact Report HTML comment at the top of this file. Ratification date is unchanged unless governance structure changes (then record in report). Every non-trivial PR SHOULD note which principles remain satisfied.

**Version**: 1.0.0 | **Ratified**: 2026-05-01 | **Last Amended**: 2026-05-01
