# Contributing

Thanks for helping improve Cognitive Index. This guide covers the local setup and what a change needs before review.

## Setup

You need Node.js 22.12 or newer (`.nvmrc` pins 24).

```bash
npm ci
npx playwright install --with-deps   # first time only: downloads browsers
npm run dev                          # http://localhost:5173
```

`npm ci` also installs a Git pre-commit hook (Husky + lint-staged) that lints and formats staged files.

## Before opening a pull request

```bash
npm run check      # typecheck, lint, format check, unit tests
npm run test:e2e   # Playwright across Chromium, Firefox, WebKit and two mobile profiles
```

CI runs the same commands plus `npm audit`, a Docker smoke test and CodeQL. A PR is ready to merge when CI is green.

## Conventions

- **Branches:** `feature/<short-name>`, `fix/<short-name>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- **Code layout:** pure logic lives in `src/lib` and is unit-tested; DOM code lives in `src/ui`. Screens do not import
  each other; `src/app.ts` wires them together.
- **HTML strings:** escape every interpolated value with `esc()`. Do not add inline `style` attributes or inline
  scripts: the Content-Security-Policy blocks them. Add a CSS class instead.
- **Tests:** new behaviour gets a Playwright test using the page objects in `tests/e2e/pages`. Use role-based locators
  (`getByRole`, `getByLabel`) and web-first assertions; never `waitForTimeout`.
- **Changelog:** add user-visible changes under "Unreleased" in `CHANGELOG.md`.

## Editing the question bank

Questions live in `src/data/questions.ts`. `tests/unit/questions.test.ts` checks that every question has four
distinguishable options, a valid answer index, an explanation, and that each domain has five questions. Give every
figure option a description a screen-reader user can tell apart from the others, without revealing the answer.

## Releasing

1. Move "Unreleased" entries in `CHANGELOG.md` under a new version heading.
2. Bump `version` in `package.json`.
3. Tag and push: `git tag v1.1.0 && git push origin v1.1.0`. The Release workflow publishes the container image and a
   GitHub release.
