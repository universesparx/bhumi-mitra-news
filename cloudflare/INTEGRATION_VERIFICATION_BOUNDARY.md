# Editorial D1 integration verification boundary

Updated: 2026-10-31.

## Verified in automated CI

- SQLite schema constraints and indexes are tested.
- Wrangler **local** D1 executes synthetic SQL fixtures, including approval, stale-version rejection, rejection, correction, and audit rows.
- JavaScript `createDraft` and `reviewDraft` have unit tests with mocked D1 interfaces.
- Authentication, review-input validation, origin checks, and bounded request parsing have separate unit tests.

## Not yet verified

The actual JavaScript `createDraft` and `reviewDraft` functions have **not** been exercised against a real D1 binding through the Worker runtime. SQL fixture success must not be described as an end-to-end API test.

Before any production use, add an isolated local Worker integration harness that invokes those functions with a real D1 binding and checks transactional failure behavior, concurrent review attempts, and audit consistency. The harness must not use the production Cloudflare account, deploy a Worker, or turn on editorial writes by default.

The source rights/permission workflow, Cloudflare Access production configuration, and publication controls are separately unverified. All production flags remain disabled.
