# भू-अलर्ट बिहार — Existing Cloudflare Account, Isolated Services

**Status:** Safe scaffold committed; not deployed. This project is separate from the existing AI Land Advisor. No changes to its Worker, API, credentials, routes or database are authorized.

## One account, separate resources

- Existing **AI Land Advisor**: leave unchanged.
- New **bhumi-mitra-news** Worker: own name, routes, configuration, secrets and deployment.
- Future **news-only D1 database**: articles, private review events, permission evidence and corrections.
- Future **news-only R2 bucket**: original/licensed image assets and thumbnails, with separate object keys and access policies.

**Cloudflare Free quotas are shared at account level**, including Worker request limits. D1 has per-database and account-wide storage limits; R2 has a separate product allowance and may require payment details to activate.

## Current implementation

The `cloudflare/` directory is a deliberately inert Worker scaffold. Only `GET /health` responds with a non-sensitive status; all other routes return 404. It has no D1/R2 bindings, no secrets, no editorial endpoint, no collection job, no publishing endpoint, and no deployment configuration enabling a public `workers.dev` route. **Do not deploy it as a functioning news service.**

## Planned deployment gates

1. Verify official Cloudflare account plan, existing AI Land Advisor resource consumption, and available shared quota.
2. Review current Cloudflare Workers/D1/R2 pricing, terms, commercial-use rules, billing activation and backup/restore options.
3. Choose and test owner-only authentication with server-side authorization, secure sessions and device revocation.
4. Design D1 migrations, concurrency controls and auditable approval/retraction events.
5. Design R2 upload validation (file type, size, image decoding, rights provenance), private originals and public approved thumbnails.
6. Ensure public news feed contains only approved articles and approved image keys.
7. Add tests for unauthorized API calls, wrong-owner access, unsafe uploads, retractions, duplicate links and quota exhaustion.
8. Obtain explicit approval before creating cloud resources, enabling billing, deploying or modifying the Bhumi Mitra app.

## Local validation

`python -m unittest discover -s tests -v`

The existing GitHub Actions workflow runs these offline tests. No Cloudflare account connection is required.
