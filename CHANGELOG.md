# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-26

First release as a structured project. The original single-file `index.html` app was
rebuilt with the same questions, scoring and storage keys, so existing history carries over.

### Added

- Vite + TypeScript (strict) project split into data, scoring, storage, rendering and UI modules.
- 90 Vitest unit tests for scoring, maths, storage validation, rendering and question-bank integrity.
- Playwright end-to-end suite (33 tests × 5 browser/device projects) using page objects, including
  axe-core WCAG 2.2 AA scans, CSP-violation detection and a fake-clock timer test.
- Strict Content-Security-Policy (no `unsafe-inline`), injected at build time and sent as a header by the Docker image.
- Hardened Docker image: non-root nginx, security headers, gzip, health check, read-only-filesystem compatible.
- GitHub Actions: CI (typecheck, lint, format, audit, unit tests on Node 22/24, build, sharded E2E, Docker smoke test,
  dependency review), deployment to GitHub Pages with manual rollback, tagged releases to GHCR, CodeQL, Dependabot.
- Keyboard exploration of the results distribution curve.
- Global error handler with a recoverable message, and a fallback screen if the app cannot start.
- ESLint, Prettier, EditorConfig, Husky + lint-staged pre-commit hook.

### Fixed

- Saved history and sessions from `localStorage` are now validated before rendering; tampered entries
  (including HTML/script payloads) are dropped instead of being injected into the page.
- Malformed saved sessions are removed instead of lingering in storage.
- Mental-rotation options were all announced as "F-shaped figure"; each now has a distinct description.
- Matrix cells, number sequences and answer options now expose accessible names (previously `aria-label` on generic `div`s).
- Hint text contrast raised to meet WCAG AA.
- Live announcements (time remaining, curve values) moved out of a hidden section so screen readers hear them.
- Focus moves to each screen's heading on navigation; the modal makes the page behind it inert.
- The "Clear history" dialog no longer relies on a `MutationObserver` to reset its button label.
- Result IDs include a random suffix so two results in the same millisecond cannot collide.
- Names are trimmed, whitespace-collapsed and stripped of control characters.
