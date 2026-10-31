# Isolated staging preflight — no deployment performed

This repository does **not** contain a Cloudflare account connection or production credentials. The staging preflight is a pure JavaScript validator in src/staging-readiness.js and is exercised by tests/staging-readiness.test.mjs. It requires Access authentication, a separate HTTPS editorial origin, an owner identity, dedicated D1 and private R2 bindings, and all four collection/publication/write flags disabled.

Run locally from the cloudflare directory with `npm test`. The GitHub Actions offline workflow also runs local Wrangler D1 SQL fixtures and route-level Worker tests.

## Owner-controlled staging procedure (future, separate approval)

1. Create an isolated staging Cloudflare Access application and protect both the dashboard page and editorial API. Never publish an unprotected dashboard.
2. Provision staging-only D1 and private R2 resources. Do not share production AI Land Advisor resources or credentials.
3. Configure exact issuer, audience, owner subject and HTTPS editorial origin using Cloudflare secrets/settings; never commit them.
4. Keep collection, publication, editorial writes and image writes disabled during the initial verification.
5. Apply schema only to staging D1 and test synthetic drafts, authorization, approval, audit history, image conflict cleanup and disabled public routes.
6. Enable only explicitly approved staging operations for bounded tests. Restore disabled flags afterward.
7. Review source rights and obtain explicit production deployment authorization separately.

**Current result:** automated local preflight and mocked route tests are available. No live Access, D1, R2 or browser session has been configured or verified by these changes. This is not a live staging sign-off.
