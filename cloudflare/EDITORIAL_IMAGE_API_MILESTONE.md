# Milestone: editorial image API safety and private-read reliability

This milestone connects the previously isolated image-storage service to an owner-authenticated editorial API route while keeping all write flags off by default. Image writes require both `EDITORIAL_WRITES_ENABLED` and `EDITORIAL_IMAGE_WRITES_ENABLED`, a configured HTTPS `EDITORIAL_ORIGIN`, a valid owner Access JWT, D1, R2 and image-specific rights evidence associated with a pending draft.

## Acceptance checks

- Image API is unavailable without explicit flags, D1 and R2 bindings.
- Unauthorized or cross-origin requests cannot store an image.
- The image bytes must match JPEG, PNG or WebP signatures and stay below the 2 MiB limit.
- A matching rights-evidence row is required for the pending draft; no client-provided rights boolean is accepted.
- D1 attachment conflicts trigger an R2 cleanup attempt.
- Editorial draft and history reads return HTTP 400 for invalid queries and HTTP 503 for database failures.
- Existing public news publishing and automatic collection remain disabled.

## Verification boundary

GitHub CI covers mocked route, service and policy tests plus the existing local D1 schema checks. These are not equivalent to a deployed Worker, real Cloudflare Access, actual R2 operations or live D1 transaction testing. Do not activate the endpoint until these tests and the legal permissions review are completed. A nonempty rights-evidence record or image-specific scope is not itself legal authorization.

No changes to the main Bhumi Mitra application or its AI Land Advisor Worker.
