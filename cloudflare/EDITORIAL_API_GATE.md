# Editorial API write-route prototype

Routes now exist in code for POST `/api/editorial/drafts` and POST `/api/editorial/review`. They require verified Cloudflare Access owner identity, an explicit `EDITORIAL_WRITES_ENABLED=true` configuration, a D1 binding, same-origin requests and JSON input. The server generates IDs, timestamps and reviewer identity. The source and rights flags cannot be set from these endpoints.

**Nothing is deployed.** The checked-in Wrangler config sets `AUTH_ENABLED=false` and `EDITORIAL_WRITES_ENABLED=false`, and has no remote D1 binding. No public publishing or source collection endpoints exist.

These are not production-ready endpoints. Before activation, implement stricter URL/date/input validation, anti-CSRF controls beyond Origin checking, request-size enforcement at the edge, rate limits, idempotency, robust D1 error handling, atomicity/concurrency tests under real requests, a controlled source-rights verification workflow, and end-to-end owner-authentication testing. The currently stored rights flags default to false, so new drafts cannot be approved without a separate verified process.

No modifications to the main Bhumi Mitra application or AI Land Advisor.
