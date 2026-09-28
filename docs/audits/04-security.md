# Security audit

**Date:** 2026-09-26 · **Scope:** all source, `index.html`, `vite.config.ts`, `Dockerfile`, `docker/*`,
`.github/workflows/*`, `package-lock.json`

**Threat model:** a static, client-only app with no accounts, server data or network calls. The realistic risks
are:

- XSS through user input or tampered `localStorage`;
- header and CSP weaknesses;
- a compromised supply chain.

## 1. Secrets & credential exposure

No API keys, tokens, passwords or private keys in any file. The workflows use only `secrets.GITHUB_TOKEN`.
`.gitignore` excludes `.env*` (except `.env.example`), `*.pem` and `*.key`.

Score: **100**

## 2. Injection

The app has no SQL, NoSQL, shell or server templates. The only sink is `innerHTML` (9 call sites in `src/ui`).
Every interpolated value passes through `esc()` (`src/lib/dom.ts`). Numbers come from validated data, and
SVG transforms are escaped too. Values from `localStorage` go through `isValidState` / `isValidResult`, and the
category label is re-derived rather than trusted. The code has no `eval`, no `new Function` and no string
`setTimeout`.

Verified by unit tests (`storage.test.ts`, `render.test.ts`) and E2E tests: a hostile name, tampered history and
a corrupt session are all rendered inert. The CSP (`script-src 'self'`, no `unsafe-inline`) is a second layer.

Score: **95**

## 3. Authentication & session security

**Not applicable.** There are no accounts, passwords, tokens or cookies.

## 4. Authorisation & access control

**Not applicable.** There are no protected resources or state-changing endpoints.

## 5. Data validation & output encoding

Names are trimmed, control characters stripped and capped at 40 characters (`cleanName`). The age group is
checked against an allowlist. Stored data is validated against its schema. There are no redirects, so open
redirects are impossible.

Score: **95**

## 6. Transport & infrastructure

**Docker image:** sends CSP with `frame-ancestors 'none'`, HSTS, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`, COOP and CORP. It runs as uid 101, works with `--read-only` and
`--cap-drop ALL`, sets `server_tokens off`, denies dotfiles, and has no debug ports. All of this was verified
with `curl` and `docker exec id -u`, and in the CI smoke job.

Score: **85**

```
[SEVERITY: medium]
OWASP Category: A05:2021 Security Misconfiguration
CWE: CWE-1021
File: .github/workflows/deploy.yml (GitHub Pages target)
Vulnerability: GitHub Pages cannot send custom headers. The CSP is delivered by <meta>, which cannot express
  frame-ancestors, and X-Frame-Options/HSTS headers are absent on that target.
Attack Scenario: A hostile site could frame the Pages deployment for clickjacking. Impact is low: the app has no
  privileged actions, and the worst case is tricking someone into clearing their own local history.
Fix: For header-level protection, deploy the Docker image (or put Cloudflare/Netlify in front of Pages) using the
  headers in docker/security-headers.conf. GitHub Pages itself enforces HTTPS.
```

## 7. Dependency vulnerabilities

`npm audit`: **0 vulnerabilities**. The production bundle has 0 runtime dependencies; all 190 packages are
build/test tooling. Dependencies are pinned exactly, and the lock file is committed.

CI adds `npm audit --audit-level=high`, `dependency-review-action` (fails on high severity), CodeQL with
`security-extended` queries, and Dependabot for npm, Actions and Docker.

Score: **95**

Resolved during this audit: every GitHub Action is pinned to a full commit SHA with the version in a comment
(`uses: actions/checkout@3d3c42e… # v7.0.1`), and Dependabot keeps the pins current. All workflows pass `actionlint`.

## 8. Logging, monitoring & incident readiness

The app has no server and no events of security relevance: no logins, no authorisation decisions, no user data.
Client errors go to the console only, by design (no tracking). nginx writes access logs to stdout in Docker,
so a log collector is needed in production. `SECURITY.md` defines private vulnerability reporting.

Score: **60**

```
[SEVERITY: low]
OWASP Category: A09:2021 Security Logging and Monitoring Failures
CWE: CWE-778
File: docker/nginx.conf
Vulnerability: Container access logs go to stdout, and nothing ships them anywhere or applies rate limiting.
Attack Scenario: Abusive scraping or probing of the Docker deployment would go unnoticed.
Fix: Ship container stdout to your platform's log service, and add limit_req_zone in nginx if the site is public.
```

## Score

Authentication (15 %) and Authorisation (15 %) do not apply, so their weight is removed and the remaining weights
are renormalised over 70 %. The literal rubric would score them 0.

| Category                          | Weight   | Score | Weighted             |
| --------------------------------- | -------- | ----- | -------------------- |
| Secrets & Credential Exposure     | 20 %     | 100   | 2000                 |
| Injection Vulnerabilities         | 20 %     | 95    | 1900                 |
| Authentication & Session          | 15 %     | N/A   | –                    |
| Authorisation & Access Control    | 15 %     | N/A   | –                    |
| Data Validation & Output Encoding | 10 %     | 95    | 950                  |
| Transport & Infrastructure        | 10 %     | 85    | 850                  |
| Dependency Vulnerabilities        | 5 %      | 95    | 475                  |
| Logging & Monitoring              | 5 %      | 60    | 300                  |
| **Total**                         | **70 %** |       | **6475 / 70 = 92.5** |

**Security Deployment Score: 92 / 100**

**Recommendation: DEPLOY.** Score ≥ 85, with zero critical or high findings (1 medium, 1 low).
