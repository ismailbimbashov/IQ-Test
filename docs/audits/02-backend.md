# Backend audit

**Date:** 2026-09-26

## Finding: there is no backend

The repository contains no server-side code. It has:

- no API routes, handlers or resolvers;
- no database, ORM, migrations or schema;
- no authentication, sessions or tokens;
- no server runtime beyond static file serving: GitHub Pages, or nginx in `Dockerfile` with its config in
  `docker/nginx.conf`.

All state is kept in the visitor's own `localStorage`. The app makes no network requests (CSP `connect-src 'self'`,
and the code has no `fetch`/`XMLHttpRequest`).

Under the prompt's rules, each category is "Unable to verify — no evidence found in the provided code". Applied
literally, the rubric scores every category 0, which yields 0 / 100 and BLOCK. That result would describe the
absence of a backend, not a defect. So this audit is reported as **not applicable** and does not gate deployment.

| Category                        | Result                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Technology & Language Detection | N/A: no backend language; the static server is nginx 1.30 (`nginxinc/nginx-unprivileged:1.30-alpine`) |
| API Design & Routing            | N/A: no endpoints. The only server route is `GET /healthz` (static 200, nginx)                        |
| Authentication & Authorisation  | N/A: no accounts or protected resources                                                               |
| Database & Data Layer           | N/A: client `localStorage` only, schema-validated in `src/lib/storage.ts`                             |
| Error Handling & Logging        | N/A: nginx returns static 403/404 pages that expose no version (`server_tokens off`)                  |
| Configuration & Secrets         | No secrets anywhere in the repo; no environment variables needed                                      |
| Scalability & Resilience        | Stateless static files; `/healthz` probe and Docker `HEALTHCHECK` present                             |
| Dependency Health               | Covered by the frontend and security audits (`npm audit`: 0 vulnerabilities)                          |

The static-server hardening (headers, non-root user, read-only filesystem) is assessed in the Security and
Architecture audits.

**Backend Deployment Score: N/A** (literal rubric: 0 / 100 because no backend exists)

**Recommendation: not applicable.** Re-run this audit if a server component (for example, shared leaderboards or
accounts) is ever added.
