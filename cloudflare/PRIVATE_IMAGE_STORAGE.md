# Private image storage: integration status

The `editorial-image-store.js` service is deliberately **not exposed as an HTTP endpoint**. It accepts an already owner-authenticated request only when called by a future guarded route. Before storing an image, it requires an existing D1 rights-evidence record associated with a pending editorial item, validates the uploaded bytes and type, stores an unpredictable private R2 key, and conditionally attaches the key to the pending item. A failed D1 attachment triggers an R2 deletion attempt.

## Security and launch blockers

- A populated rights-evidence row is a technical precondition, **not proof of legal permission**. Permission scope, ownership and actual authorization still require manual review.
- This service must not be connected to an HTTP route until owner Access JWT verification, exact same-origin checks, a separately disabled-by-default image-write flag, upload rate limits, and R2/D1 bindings are configured and tested.
- The image is not publicly readable. Public serving needs a separate approved-only rights-aware route, safe caching and an image-retraction policy.
- A failed cleanup raises `image_cleanup_failed`; an operational orphan-cleanup process is needed before production.
- Replacing images, updating metadata and review history must be designed as auditable operations.
- The current R2 integration is unit-tested with mocks, not verified against live R2 or D1. No deployment, collection, publication or existing app integration is authorized.
