# Quickstart: hh-auto SPA

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm or pnpm
- Registered OAuth application on hh developer portal with redirect URI pointing to local/dev URL (exact steps depend on hh docs)

## Bootstrap (once tasks scaffold the repo)

```bash
npm create vite@latest . -- --template react-ts
npm install react-router-dom
npm install -D eslint prettier eslint-config-prettier @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react vitest @testing-library/react @testing-library/jest-dom jsdom
```

Optional when state grows:

```bash
npm install @reduxjs/toolkit react-redux
```

## Scripts (expected)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest |

(Add exact script names when `package.json` exists.)

## Configuration

- Copy environment hints from [contracts/env.example.md](./contracts/env.example.md) (`VITE_*` only for non-secret public values such as OAuth client id if hh allows public client — secrets must not be committed).
- Enter LLM URL/key/model in **in-app Settings** (stored locally per FR-011).

## Run

```bash
npm run dev
```

Open the printed localhost URL, complete hh login via OAuth redirect flow, **create vacancy search profiles** (filters + exclusions), enable monitoring per profile, set poll interval, and verify polling + Markdown journal updates + draft generation against sandbox/test credentials. Legacy **saved-search subscription** UI may still exist until migration tasks complete — see [spec.md](./spec.md) revision.

## References

- [plan.md](./plan.md) — architecture
- [research.md](./research.md) — integration decisions
- [contracts/](./contracts/) — schemas
