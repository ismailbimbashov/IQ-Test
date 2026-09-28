# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub:
**Security → Report a vulnerability** on this repository. Do not open a public issue.

You should get an acknowledgement within 5 working days.

## Scope and threat model

Cognitive Index is a static, client-only web app. It has no server-side code, accounts, cookies, network requests or
third-party scripts. All data (the in-progress test and score history) stays in the visitor's own `localStorage`.

Relevant issues include:

- Script injection (XSS) through names, stored data or question content.
- Weaknesses in the Content-Security-Policy or other response headers set by `docker/nginx.conf`.
- Vulnerable dependencies that end up in the production bundle or container image.

Out of scope: a user editing their own `localStorage` to change their own score or timer. The test runs entirely on
the user's device, so it is a self-assessment tool and makes no anti-cheating guarantees.

## Hardening in place

- CSP with `default-src 'none'` and no `unsafe-inline` or `unsafe-eval` (build-time `<meta>` plus HTTP header in Docker).
- All values interpolated into HTML are escaped; stored data is schema-validated before use.
- Container runs as a non-root user, works with a read-only filesystem and sends HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and cross-origin isolation headers.
- CI: `npm audit`, dependency review on PRs, CodeQL (security-extended) and Dependabot.
