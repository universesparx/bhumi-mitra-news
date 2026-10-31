# Milestone 2 — local backend verification checkpoint

This checkpoint extends the offline verification boundary without enabling remote Cloudflare services.

## Added automated coverage

- Wrangler local D1 fixture exercises image-specific rights evidence before an image can be attached to a pending draft.
- Conditional D1 image attachment increments the draft version and refuses to overwrite an existing image key.
- Feed cursor tests reject invalid calendar dates and verify stable ordering by publication date plus record ID.
- Approved-feed projection tests verify that a pending record returned by a mocked storage adapter is not exposed in the response.
- Existing Python policy checks, Node unit tests and Wrangler local D1 tests remain part of the GitHub Actions workflow.

## Still unverified

The D1 fixture is synthetic and does not connect to a live Cloudflare account. R2 rollback, Cloudflare Access browser sessions, real D1 concurrency, dashboard deployment and public-feed delivery have not been verified end to end. Rights evidence in the fixture is not real publication permission. Collection, publication and editorial writes remain off by default.

## Required before production activation

1. Verify source permissions and rights evidence through a trusted administrative process.
2. Configure dedicated D1/R2 bindings and Access policies, without changing the AI Land Advisor Worker.
3. Run staging integration tests using synthetic data and verify authentication, concurrency, rollback and read filtering.
4. Obtain explicit approval before deploying, enabling public news or modifying the main Bhumi Mitra app.
