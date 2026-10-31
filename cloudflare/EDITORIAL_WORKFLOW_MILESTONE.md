# Milestone 1 — editorial workflow (implementation checkpoint)

The Hindi-first owner dashboard now supports draft creation, status-based review, rejection/retraction/correction reasons, private review-history inspection, and rights-evidence-linked image attachment for pending drafts. The same interface is responsive on Android and desktop browsers. All draft and review data is intended to reside in the dedicated news D1 database rather than browser storage.

## Safety boundaries

The owner dashboard is still an HTML integration artifact, not a deployed or authenticated website. The server requires a valid Cloudflare Access owner JWT for all editorial routes. Writes require an explicitly configured HTTPS editorial origin, enabled editorial writes, and D1. Image uploads additionally require an independent image-write flag, R2, a pending draft and an image-specific rights-evidence record. Both flags remain disabled by default. The dashboard only displays image upload controls when the authenticated session advertises that capability.

The dashboard does not set source verification or rights flags. Approval is blocked unless evidence and trusted verification are present. A recorded evidence row alone does not establish legal permission.

## Not yet completed

- Live browser authentication and same-origin hosting under Cloudflare Access
- Actual D1 and R2 integration and failure-recovery tests
- Trusted rights-verification administration, real source permissions and legal review
- Image removal/replacement and public image delivery
- Publication activation, production deployment and main-app integration

These items belong to subsequent milestones. No real unpublished drafts, credentials, or rights documents belong in this public repository.
