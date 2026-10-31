# Milestone 2 — backend verification and staging release gate

## Automated offline verification

- Python source-collection policy tests and disabled-source registry checks.
- Node tests for Access JWT verification, owner authorization, same-origin CSRF protection, bounded payloads, editorial validation, review transitions and optimistic concurrency.
- Node tests for image type/signature/size validation, rights scope, private R2 adapter rollback, upload authorization, feed projection and cursor pagination.
- Wrangler local D1 migration and synthetic fixtures for approval, rejection/correction, stale-version guards, image attachment, overwrite rejection, image-rights approval restrictions and rights-gated feed inclusion.
- Separate 400 invalid-input and 503 database-outage contracts for editorial writes and reads.

The GitHub Actions offline-tests workflow runs without Cloudflare credentials, paid hosting or remote database access.

## Staging acceptance checklist — NOT performed

A trusted owner must explicitly authorize and configure a separate staging news Worker with its own Cloudflare Access application, D1 database and R2 bucket. Never reuse the AI Land Advisor Worker, bindings or credentials.

1. Verify Access issuer, audience, owner identity and HTTPS editorial origin. Test forged, expired and wrong-owner JWTs against the actual Worker.
2. Apply migrations to staging-only D1; with synthetic records verify create, list, review, stale-version conflict, audit history, approval/retraction and feed visibility.
3. Test private staging R2 upload, invalid media, rights evidence, R2 failure, D1 conflict cleanup and no public bucket access.
4. Verify same-origin authenticated dashboard behavior and Android/desktop rendering behind Access.
5. Confirm news endpoints remain unavailable while publishing is disabled. Only separately authorized staging tests may exercise the enabled feed with synthetic records.
6. Reconfirm collection, public publishing, editorial writes and image writes remain disabled in production.

## Release gate

Offline tests cannot certify actual Cloudflare Access/D1/R2 integration. Milestone 2 must not be called fully end-to-end verified without staging results. No production deployment, scraping, rights attestation or publication is authorized. Milestone 3 requires the latest main-app project and separate permission.
