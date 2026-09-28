# Project structure, architecture & CI/CD audit

**Date:** 2026-09-26

## Step 1: stack detection

| Item                    | Detected                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| Language                | TypeScript 6.0.3, HTML, CSS                                         |
| Framework               | None (vanilla DOM), built with Vite 8.3.1                           |
| Layout                  | Single package (polyrepo)                                           |
| Package manager / build | npm 11 · `tsc --noEmit && vite build`                               |
| Tests                   | Vitest 5.0.2 (unit), Playwright 1.63.0 (E2E)                        |
| Delivery                | GitHub Pages (static) and Docker (`nginx-unprivileged:1.30-alpine`) |

## Step 2: evaluation

### 1. Directory layout & conventions (90)

The layout follows Vite conventions: `index.html` and `public/` at the root, sources in `src/`, tests in
`tests/unit` and `tests/e2e`, docs in `docs/`, container files in `docker/`. Build and test output (`dist/`,
`coverage/`, `playwright-report/`, `test-results/`) is git-ignored.

### 2. Separation of concerns (95)

- `src/lib` holds pure logic with no DOM access.
- `src/ui` holds one module per screen.
- `src/data` holds content.
- `src/config.ts` centralises constants.

Storage access is isolated in `lib/storage.ts`.

### 3. Module boundaries (95)

The import graph is acyclic: `lib` never imports `ui`, screens never import each other, and `app.ts` is the only
composition point. There are no god-files; the largest is `src/data/questions.ts` at 358 lines, and it is data
only. The stylesheet was split into 7 per-area files during this audit (it had been 1,141 lines). No directory
has more than 10 files.

### 4. Configuration & environment (95)

- `.env.example` documents that no variables are needed.
- `.gitignore` covers build output, test output, env files, keys, logs and IDE/OS files.
- `.editorconfig`, `.gitattributes` (LF) and `.nvmrc` are present.
- The CSP is defined in two places (`vite.config.ts` and `docker/security-headers.conf`), and each carries a
  "keep in sync" comment.

### 5. GitHub Actions: CI (85)

`ci.yml` runs on PRs, pushes to `main` and manual dispatch, and cancels superseded runs. It has parallel jobs:

- `quality`: typecheck, lint, format, audit;
- `unit`: matrix over Node 22 and 24, covering the `engines` range;
- `build`;
- `e2e`: 2 shards in the Playwright container;
- `docker`: build, health check and header assertions;
- `dependency-review` (PRs only).

npm is cached via `setup-node`. There are no hardcoded secrets, and permissions are `contents: read` by default.
Separately, `codeql.yml` runs weekly and on push/PR.

```
[SEVERITY: medium]
Category: GitHub Actions — CI Pipeline
File/Path: .github/workflows/ci.yml
Issue: Not yet executed on GitHub (the repo has not been pushed), and branch protection / required checks cannot
       be verified from the repository. Every step's command passes locally, including the E2E container run.
Fix: Push, confirm a green run, then in Settings → Branches require the checks "Typecheck, lint & format",
     "Unit tests (Node 24)", "Production build", "E2E (Playwright, shard 1/2)", "E2E (Playwright, shard 2/2)"
     and "Docker image builds & passes health check".
```

### 6. GitHub Actions: CD (80)

- `deploy.yml` deploys to GitHub Pages only after CI succeeds on `main` (`workflow_run`), and deploys the exact
  commit SHA that CI verified.
- It deploys through the `github-pages` environment, with concurrency set so it never cancels a deploy in
  progress.
- To roll back, run it manually (`workflow_dispatch`) with an earlier tag or SHA.
- `release.yml` runs on `v*.*.*` tags. It publishes semver-tagged images to GHCR with provenance and an SBOM,
  and creates a GitHub release with the zipped site.

```
[SEVERITY: low]
Category: GitHub Actions — CD / Deployment Pipeline
File/Path: .github/workflows/deploy.yml
Issue: There is no separate staging environment, and the production approval gate depends on a repository setting.
Fix: In Settings → Environments → github-pages, add required reviewers. For staging, deploy the "sha-*" GHCR
     image to a preview host, or add a second Pages-like target triggered from a "staging" branch.

[SEVERITY: low]
Category: GitHub Actions — CD / Deployment Pipeline
File/Path: repository settings
Issue: GitHub Pages must be set to "Source: GitHub Actions", or the deploy job will fail.
Fix: Settings → Pages → Build and deployment → Source: GitHub Actions.
```

### 7. Documentation files (95)

Present with real content: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md` (Keep a Changelog), `LICENSE` (MIT),
`CODE_OF_CONDUCT.md`, `SECURITY.md`, `docs/architecture.md`, `docs/scoring.md`, `docs/audits/`, and a PR
template plus a bug-report issue form.

### 8. Developer experience (95)

- `npm run dev` / `check` / `test:e2e:ui` scripts.
- A Husky pre-commit hook runs lint-staged (ESLint + Prettier).
- ESLint flat config (typescript-eslint type-checked + the Playwright plugin), Prettier, and a strict `tsconfig`.
- `docker compose up --build` gives a production-like run.

## Step 3: current structure (matches the recommended structure)

```
.
├── .github/
│   ├── workflows/ci.yml          # quality, unit (Node 22/24), build, e2e (sharded), docker, dependency review
│   ├── workflows/deploy.yml      # GitHub Pages after green CI; manual rollback by ref
│   ├── workflows/release.yml     # v*.*.* tags → GHCR image + GitHub release
│   ├── workflows/codeql.yml      # static analysis, weekly + push/PR
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── .husky/pre-commit             # lint-staged
├── docker/                       # nginx.conf, security-headers.conf
├── docs/                         # architecture, scoring method, audit reports
├── public/favicon.svg
├── src/
│   ├── data/                     # question bank
│   ├── lib/                      # pure logic (unit-tested)
│   ├── styles/                   # base, components, per-screen CSS
│   ├── ui/                       # one module per screen + feedback/errors
│   ├── app.ts  config.ts  main.ts  types.ts
├── tests/
│   ├── unit/                     # Vitest
│   └── e2e/                      # Playwright specs, fixtures.ts, pages/ (POM)
├── Dockerfile  docker-compose.yml  index.html
├── package.json  package-lock.json  tsconfig.json  vite.config.ts  playwright.config.ts  eslint.config.js
└── README.md  CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  CODE_OF_CONDUCT.md  LICENSE
```

## Step 4: starter workflows

Not needed: CI and CD workflows exist and are not critically flawed.

## Score

| Category                       | Weight | Score | Weighted |
| ------------------------------ | ------ | ----- | -------- |
| Directory Layout & Conventions | 15 %   | 90    | 13.5     |
| Separation of Concerns         | 15 %   | 95    | 14.25    |
| Module Boundaries              | 10 %   | 95    | 9.5      |
| Configuration & Environment    | 10 %   | 95    | 9.5      |
| CI Pipeline                    | 20 %   | 85    | 17.0     |
| CD Pipeline                    | 15 %   | 80    | 12.0     |
| Documentation Files            | 5 %    | 95    | 4.75     |
| Developer Experience           | 10 %   | 95    | 9.5      |

**Architecture & CI/CD Score: 90 / 100**

**Recommendation: HOLD until the first CI run on GitHub is green, then DEPLOY.** The score is ≥ 80 with no
critical issues, but DEPLOY also requires that the CI pipeline "exists and passes", and a hosted run can't be
verified before the repository is pushed.
