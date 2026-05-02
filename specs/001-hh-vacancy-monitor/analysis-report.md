# Specification Analysis Report

**Feature**: `001-hh-vacancy-monitor`  
**Generated**: 2026-05-01 · **Remediation**: 2026-05-01  

**Artifacts**: [spec.md](./spec.md) · [plan.md](./plan.md) · [tasks.md](./tasks.md) · [constitution](../../.specify/memory/constitution.md)

---

## Remediation applied (2026-05-01)

| Finding | Action taken |
|---------|----------------|
| **G1** (FR-003 UI gap) | Добавлена задача **T031** — `PollingSettings.tsx`, минимальный интервал, маршрут из Layout/routes. |
| **G2** (FR-008 toggle gap) | Добавлена задача **T032** — `SoundSettings.tsx`, `soundEnabled` в storage до **T025**. |
| **I1** (plan vs Vitest) | В **plan.md** уточнено: Vitest рекомендуется, но в текущем tasks автотесты не входят в MVP без явного запроса в спеки. |
| **U1** (hh API tracking) | Добавлена **T033** + создан черновик репозитория **`docs/hh-api-notes.md`** для фиксации URLs/scopes при имплементации. |
| **D1** | Без изменений (редакторское упрощение спеки по желанию). |
| **C1** | Ратифицирована **hh-auto Constitution v1.0.0** в `.specify/memory/constitution.md`; обновлён **plan-template** Constitution Check. |
| **O1** | Задача **T034** — root-level `AppErrorBoundary.tsx` (решение пользователя). |

---

## Findings (baseline audit — partially superseded above)

| ID | Category | Severity | Location(s) | Summary | Status |
|----|----------|----------|-------------|---------|--------|
| G1 | Coverage gap | HIGH | FR-003 / tasks | UI интервала опроса | **Закрыто** — T031 |
| G2 | Coverage gap | MEDIUM | FR-008 / tasks | Переключатель звука | **Закрыто** — T032 |
| I1 | Inconsistency | LOW | plan vs tasks | Vitest vs отсутствие test tasks | **Закрыто** — уточнение в plan.md |
| D1 | Duplication | LOW | spec FR-007 vs US3 | Дублирование формулировок | Открыто — низкий приоритет |
| C1 | Constitution | LOW | constitution.md | Шаблон без MUST | **Закрыто** — v1.0.0 ratified 2026-05-01 |
| U1 | Underspec | MEDIUM | hhClient | Нет трекинга API в репо | **Закрыто** — T033 + docs/hh-api-notes.md |
| O1 | Observability | LOW | — | Error boundaries / логи | **Закрыто** — T034 |

---

## Constitution & reliability

- Живой текст: `.specify/memory/constitution.md` (**v1.0.0**, ratified **2026-05-01**).
- Принцип **V** требует верхнеуровневый React Error Boundary → **T034**.

---

## Success Criteria note

**SC-003** (качество черновиков): пользователь подтвердил, что **достаточно** текущих критериев в спеки — отдельные фикстуры не добавлялись.

## Coverage Summary Table (FR → Tasks) — обновлено

| Requirement Key | Has Task? | Task IDs (primary) | Notes |
|-------------------|-----------|-------------------|--------|
| FR-001 | ✅ | T009, T010, T012, T013 | |
| FR-002 | ✅ | T014 | |
| FR-003 | ✅ | T017, T007, **T031** | UI интервала явно |
| FR-004 | ✅ | T018, T019 | |
| FR-005 | ✅ | T021, T024 | |
| FR-006 | ✅ | T021 | |
| FR-007 | ✅ | T023 | |
| FR-008 | ✅ | T025, **T032** | Переключатель явно |
| FR-009 | ✅ | T016 | |
| FR-010 | ✅ | T019, T020 | |
| FR-011 | ✅ | T007 + Notes | |
| FR-012 | ✅ | T015 | |
| FR-013 | ✅ | T017, T029 | |
| FR-014 | ✅ | T026 | |
| FR-015 | ✅ | T027 | |

---

## Success Criteria (buildable subset)

Без изменений логики отчёта; SC-006 остаётся KPI пост-релиза.

---

## Constitution Alignment Issues

По-прежнему: шаблон конституции — нет извлекаемых MUST.

---

## Unmapped Tasks

**T033** привязана к документации интеграции (не FR-ключ в таблице выше — намеренно).

---

## Metrics (обновлено)

| Metric | Value |
|--------|-------|
| Functional requirements | 15 |
| Total tasks | **34** |
| FR full coverage | **15 / 15** |
| Partial FR count | **0** (после remediation) |
| Critical issues | **0** |

---

## Next Actions

1. Реализовать **T031–T034** вместе с остальными задачами (**T034** — Error Boundary).
2. Заполнить **`docs/hh-api-notes.md`** при выполнении T010/T026.
3. При изменении принципов — править `.specify/memory/constitution.md`, бамп версии и Sync Impact Report вверху файла.
4. По желанию: задача Vitest в Phase 1 или Polish.

---

## Extension Hooks (after analyze)

**Optional Hook**: git — `/speckit.git.commit`
