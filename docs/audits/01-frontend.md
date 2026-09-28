# Frontend audit

**Date:** 2026-09-26 · **Scope:** `index.html`, `src/**`, `vite.config.ts`, `package.json`, `package-lock.json`

## 1. Technology & framework detection

| Item                 | Detected                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Language             | TypeScript 6.0.3 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), HTML, CSS |
| Framework            | None: vanilla DOM with template strings                                                        |
| Bundler              | Vite 8.3.1 (Rolldown)                                                                          |
| Package manager      | npm 11 (`package-lock.json` v3), Node ≥ 22.12 (`.nvmrc` = 24)                                  |
| Runtime dependencies | **0**                                                                                          |

Score: **95**

## 2. Project structure & code quality

Pure logic (`src/lib`) is separate from DOM code (`src/ui`); screens don't import each other, and `src/app.ts`
wires them together. The largest source file is 289 lines (`src/ui/quiz.ts`). ESLint (typescript-eslint
`recommendedTypeChecked`) and Prettier pass with zero warnings. There is no dead code: `noUnusedLocals` and
`noUnusedParameters` are enforced.

Score: **90**

```
[SEVERITY: low]
Category: Code Quality
File: src/ui/*.ts
Issue: Screens render with template strings + innerHTML. It is safe here (every interpolation goes through esc()),
       but that safety depends on developer discipline rather than being structural.
Fix: Keep the esc() rule in CONTRIBUTING.md (done). If the UI grows, move to lit-html or a small framework
     whose templates escape by default.
```

## 3. UI/UX & accessibility

Axe (WCAG 2.0/2.1/2.2 A + AA) reports **0 violations** on the welcome, quiz (matrix, sequence, text and figure
questions), dialog, results and review screens, across all 5 Playwright projects. Other measures:

- Semantic landmarks, one `h1` per screen.
- Focus moves to the heading on every screen change.
- The modal traps focus and makes the page behind it `inert`.
- Every figure has a text description.
- A live region announces time warnings.
- The results chart can be explored with the keyboard.
- `prefers-reduced-motion` is honoured.
- The layout works at phone width.

Score: **90**

```
[SEVERITY: low]
Category: Accessibility
File: index.html, src/ui/*.ts
Issue: All UI strings are hard-coded English; there is no i18n layer.
Fix: If localisation is needed, move strings into src/i18n/en.ts and look them up by key.

[SEVERITY: low]
Category: Accessibility
File: src/ui/quiz.ts (initQuiz, radiogroup keydown)
Issue: Arrow keys move focus between options without selecting them. This deliberately deviates from the WAI-ARIA
       radio pattern (where arrows also select), so browsing options never changes an answer on a timed test.
Fix: None required; the choice is documented in a code comment. Revisit if user testing shows confusion.
```

## 4. Performance

Production output: HTML 3.9 KB, CSS 4.4 KB and JS 13.8 KB, all gzipped (≈ 22 KB total, zero third-party
scripts, system fonts, inline SVG only). Code splitting and lazy loading are unnecessary at this size.
The timer updates text only when it changes (`setText`).

Score: **95**

## 5. State management & data flow

State lives in a few places. The active session is owned by `ui/quiz.ts` and persisted on every change and
on `pagehide`. History lives in `lib/storage.ts`, and the result being viewed in `app.ts`. There is no prop
drilling. The app makes no async network calls, so there are no loading states to handle.

Score: **90**

## 6. Build & deployment readiness

`npm run build` (typecheck + Vite) succeeds. A strict CSP `<meta>` is injected at build time, and source maps
are disabled for production. The app needs no environment variables; `.env.example` documents that. No secrets
exist in client code. The relative `base: './'` works on GitHub Pages sub-paths and in Docker.

Score: **90**

## 7. Error handling & logging

A global `error`/`unhandledrejection` handler (`src/ui/errors.ts`) logs to the console and shows a recoverable
toast. A fallback screen appears if `boot()` throws. Storage failures produce specific messages (for example
"history could not be saved").

Score: **80**

```
[SEVERITY: low]
Category: Error Handling
File: src/ui/errors.ts:9
Issue: No crash-reporting service. This is intentional: the app promises no network traffic ("no tracking").
Fix: If remote reporting is ever wanted, call it from report() and add its origin to connect-src in both CSP
     definitions (vite.config.ts, docker/security-headers.conf).
```

## 8. Dependency health

`npm audit`: **0 vulnerabilities** (190 packages, all dev-only). `npm outdated` shows two held-back majors:
`typescript` 7.0.2 (typescript-eslint 8.70 supports `<6.1`) and `@types/node` 26 (the project targets Node 24).
Dependabot is configured.

Score: **95**

## Score

| Category              | Weight | Score | Weighted |
| --------------------- | ------ | ----- | -------- |
| Code Quality          | 20 %   | 90    | 18.0     |
| Accessibility         | 15 %   | 90    | 13.5     |
| Performance           | 15 %   | 95    | 14.25    |
| State Management      | 10 %   | 90    | 9.0      |
| Build Readiness       | 15 %   | 90    | 13.5     |
| Error Handling        | 10 %   | 80    | 8.0      |
| Dependency Health     | 10 %   | 95    | 9.5      |
| Structure & Detection | 5 %    | 95    | 4.75     |

**Frontend Deployment Score: 90 / 100**

**Recommendation: DEPLOY.** Score ≥ 80 with zero critical issues.
