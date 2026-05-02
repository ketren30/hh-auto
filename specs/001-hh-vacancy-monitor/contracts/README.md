# Contracts: 001-hh-vacancy-monitor

Interfaces this SPA relies on or exposes.

## External systems

| System | Contract kind | Notes |
|--------|----------------|-------|
| hh.ru OAuth / REST | HTTP per hh official docs | Implement in `services/hhClient.ts`; update when hh revises API |
| LLM provider | HTTPS JSON (shape TBD — OpenAI-compatible assumed) | Implement in `services/llmClient.ts`; version prompt template per FR-006 |

## Internal persistence

- [local-app-state.schema.json](./local-app-state.schema.json) — canonical JSON blob shape for `localStorage` key(s) (implementation may split keys).

## Environment

- [env.example.md](./env.example.md) — public build-time variables only.
