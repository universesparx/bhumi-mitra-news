# Owner editorial dashboard — integration boundary

`editorial-dashboard/index.html` is a responsive Hindi owner interface for Android and desktop browsers. It uses same-origin `/api/editorial/session`, `GET /api/editorial/drafts`, `POST /api/editorial/drafts`, and `POST /api/editorial/review` with the authenticated browser session.

**Not deployed or automatically hosted.** The HTML file is an integration artifact, not an activated dashboard. A secure deployment must serve it under the exact HTTPS origin in `EDITORIAL_ORIGIN` behind Cloudflare Access, with the separate news Worker API accessible at the same origin. Do not expose this file on a public Pages site or configure cross-origin credential forwarding. Authentication must be enforced on both the HTML page and API. Cloudflare Access JWT validation and owner identity must be configured and tested before enabling `EDITORIAL_WRITES_ENABLED`.

This UI does not collect news automatically, grant source rights, upload images, or enable publication. Approval requests may be rejected until verified source and rights flags are established via a separate trusted workflow. The UI does not bypass that restriction. The public feed and publishing flag remain independent.

## Remaining launch blockers

- Live owner Access configuration, trusted origin, and end-to-end browser session verification.
- D1 binding, migration, live Worker-to-D1 integration tests and failure handling.
- Rights-evidence verification process, source permissions, and source policy audit.
- Image rights and safe R2 upload/download flow.
- Final security review, production deployment approval, and integration with the existing React Native app.

Never put real draft content, Access tokens, secrets, or source permissions in the public GitHub repository.
