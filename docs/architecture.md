# Architecture

Cognitive Index is a static single-page app with no backend. Vite bundles TypeScript and CSS into three files
(`index.html`, one JS bundle, one stylesheet: about 18 KB gzipped in total).

## Layers

```
src/
├── main.ts          Entry point: imports CSS, installs error handlers, calls boot()
├── app.ts           Wires screens together; the only module that knows about all of them
├── config.ts        Constants: time limit, weights, IQ scale, age norms, storage keys
├── types.ts         Shared types (questions, figures, session state, results)
├── data/
│   └── questions.ts The 20-question bank
├── lib/             Pure logic, no DOM access. Unit-tested (≥ 90 % coverage enforced)
│   ├── math.ts      erf / normal CDF, percentile, formatting
│   ├── scoring.ts   computeResult(), classify()
│   ├── storage.ts   Guarded localStorage access + schema validation
│   ├── figures.ts   SVG string renderers and accessible descriptions
│   └── dom.ts       esc(), $(), cleanName()
└── ui/              DOM code, one module per screen. Covered by Playwright
    ├── welcome.ts   Name and age form, past results
    ├── quiz.ts      Active session, timer, keyboard shortcuts
    ├── results.ts   Score, stats, domain bars, formula
    ├── curve.ts     Interactive bell curve
    ├── history.ts   History list and sparkline
    ├── review.ts    Per-question review with filters
    ├── screens.ts   Screen switching, document title, focus management
    ├── feedback.ts  Toast and confirmation modal
    └── errors.ts    Global error handler and fatal-error screen
```

**Dependency rule:** `lib` never imports from `ui`; screens in `ui` never import each other. `app.ts` passes
callbacks (`onStart`, `onFinish`, `onReview` …) into each screen's `init*()` function. This keeps the graph acyclic.

## State

| State               | Owner                       | Persistence                                                          |
| ------------------- | --------------------------- | -------------------------------------------------------------------- |
| Active test session | `ui/quiz.ts` (module-level) | `localStorage["cogidx.active.v1"]` on every change and on `pagehide` |
| Score history       | `lib/storage.ts`            | `localStorage["cogidx.history.v1"]`, capped at 50                    |
| Result being viewed | `app.ts`                    | memory only                                                          |

The timer is deadline-based (`deadline = start + 15 min`), so reloading, sleeping the laptop or backgrounding the tab
never adds time. A session found expired on load is scored immediately.

## Security model

Every string placed into `innerHTML` goes through `esc()`. Data read back from `localStorage` is validated against
the expected schema (`isValidState`, `isValidResult`), and invalid entries are discarded. The production build
carries a strict CSP; there are no inline scripts or `style` attributes, so no `unsafe-inline` is needed. See
[SECURITY.md](../SECURITY.md).

## Rendering

Screens are rendered with template strings and `innerHTML`, then wired with delegated event listeners. With five
screens and fewer than 100 interactive elements, a framework would add weight without simplifying the code.
