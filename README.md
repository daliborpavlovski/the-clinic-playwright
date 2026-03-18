# the-clinic-playwright — Production-Grade Playwright E2E Framework

A senior-level TypeScript Playwright framework testing [The Clinic App](https://github.com/daliborpavlovski/the-clinic-app) across three test layers: **UI (E2E)**, **API (REST)**, and **Visual Regression**.

## Framework Architecture

```
the-clinic-playwright/
├── src/
│   ├── fixtures/         # Merged fixture export (all tests use this)
│   │   ├── index.ts      # Single import point: test + expect
│   │   ├── auth.fixtures.ts    # Role-based browser contexts (storageState)
│   │   ├── api.fixtures.ts     # Pre-authenticated API clients per role
│   │   └── data.fixtures.ts    # Test data factories with auto-cleanup
│   ├── pages/            # Page Object Model (BasePage + role pages)
│   ├── api/
│   │   ├── client/       # BaseClient + typed endpoint clients
│   │   └── helpers/      # Schema assertion, pagination, JWT helpers
│   ├── types/            # Shared TypeScript interfaces
│   └── utils/            # date, random, soft-assertions, retry
├── tests/
│   ├── ui/               # Browser-based E2E tests (auth, appointments, doctors, admin)
│   ├── api/              # REST API tests (auth, CRUD, status machine, authorization)
│   └── visual/           # Screenshot regression tests
├── reporters/
│   ├── custom-reporter.ts  # Tag summary + test-summary.json
│   └── slack-reporter.ts   # Webhook stub for CI notifications
└── .github/workflows/
    ├── playwright-ci.yml   # Full matrix: 3 browsers × 3 shards + API + Allure
    └── smoke-check.yml     # Chromium @smoke only, every PR (~3 min)
```

## Key Design Decisions

### Auth Fixture Pattern (Senior Differentiator)
Global setup (`tests/auth.setup.ts`) logs in via API for each role and saves `storageState` to `.auth/`. UI tests load state directly — **no login through UI on every test**. This is the idiomatic Playwright v1.35+ pattern.

### Single Fixture Import
All tests import only from `src/fixtures/index.ts`:
```typescript
import { test, expect } from '../../../src/fixtures/index';
```
Adding a new fixture requires updating only `index.ts`, not every test file.

### API Client Layer
- `BaseClient` handles token injection, logging, status assertions
- Typed clients per endpoint group (`AppointmentsClient`, `AuthClient`, etc.)
- `ApiBundle` groups all clients per role — clean fixture composition

## Quick Start

```bash
# Prerequisites: the-clinic-app running on http://localhost
# See: github.com/daliborpavlovski/the-clinic-app

npm ci
npx playwright install

# Run smoke tests (fastest — ~3 min)
make smoke

# Run API tests
make api

# Full suite
make test

# Visual baselines (first run generates them)
make update-snapshots
make visual
```

## Test Coverage Matrix

| Scenario | Layer | Tag |
|---|---|---|
| Valid login | UI | @smoke |
| Invalid password → error | UI | |
| Non-existent email → error | UI | |
| New patient register | UI | @smoke |
| Duplicate email register → error | UI | |
| Logout clears token | UI | |
| Book valid appointment | UI | @smoke |
| Past slot blocked | UI | |
| Double-book conflict | UI | |
| Patient cancels pending | UI | |
| Doctor confirms pending | UI | |
| Admin sees all appointments | UI | |
| Doctor listing with pagination | UI | @smoke |
| Doctor profile + slots modal | UI | |
| Admin deactivates user | UI | |
| Register 201 + schema validation | API | @smoke |
| Register missing field → 422 | API | |
| Weak password → 422 | API | |
| Login JWT decode + role check | API | @smoke |
| Expired token → 401 | API | |
| Create appointment 201 | API | @smoke |
| Get as owner 200 | API | |
| Get as other patient → 403 | API | |
| Update notes | API | |
| Delete + 404 confirm | API | |
| Pagination page 1 | API | |
| Page beyond data → empty array | API | |
| pending→confirmed valid | API | |
| confirmed→pending invalid → 400 | API | |
| Double-book → 409 | API | |
| Cross-user delete → 403 | API | |
| Login page baseline | Visual | |
| Patient dashboard baseline | Visual | |
| Appointments list baseline | Visual | |

## CI Architecture

```
PR opened
  └── smoke-check.yml → Chromium @smoke only (~3 min, blocks merge)

Push to main
  ├── start-app        → docker compose up the-clinic-app, seed
  ├── test (×9)        → UI: chromium/firefox/webkit × shards 1/3 2/3 3/3
  ├── api-tests        → API project (no browser)
  └── report           → merge allure artifacts → publish to gh-pages
```

## Playwright Config Projects

| Project | Browser | Tests | Depends On |
|---|---|---|---|
| `setup` | — | `auth.setup.ts` | — |
| `chromium` | Chrome | `tests/ui/**` | setup |
| `firefox` | Firefox | `tests/ui/**` | setup |
| `webkit` | Safari | `tests/ui/**` | setup |
| `api` | — (no browser) | `tests/api/**` | — |
| `visual` | Chrome | `tests/visual/**` | setup |
