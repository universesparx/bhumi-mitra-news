# भू-अलर्ट बिहार — Android + Laptop Editorial Workspace

**Status:** Approved requirement; architecture proposal only. No production login, synchronization, storage, hosting or publishing implemented.

## Confirmed requirement

The owner must add, edit, review, approve, reject, correct and retract news from **both an Android phone and a laptop**. A laptop-only SQLite database does not meet this requirement.

## Recommended user experience

Use one responsive, Hindi-first editorial web interface (mobile browser and laptop browser). The same authenticated account sees the same private queue and audit history on both devices. The Bhumi Mitra Android app remains a **read-only consumer** of the eventual approved public feed, not an admin interface.

## Trust boundaries

- **Private service:** authenticated owner account, server-side authorization, private drafts, review events, source-rights evidence, and corrections.
- **Public feed:** only validated approved items; no private notes, credentials or pending drafts.
- **Clients:** phone and laptop are untrusted presentation layers. Hiding buttons in the browser does not enforce authorization.
- **Source collection:** remains disabled pending source-specific permission evidence.

## Zero-budget architecture candidates

1. **Free-tier private backend + responsive web UI:** most practical for near-real-time cross-device synchronization, but free-tier quotas, inactivity, provider terms, data processing, account recovery and commercial-use conditions require explicit review before selection.
2. **Owner-hosted service on laptop + phone access:** avoids a third-party database, but remote access, uptime, TLS, firewall, backup and key security create operational burden. Do not expose a laptop directly to the internet.
3. **Offline-only per-device editing with manual encrypted transfer:** can avoid hosting but has conflicts, recovery and usability costs. Not recommended as the default for frequent phone/laptop editing.

No provider is selected, and no claim is made that any free tier is suitable or permanently free.

## Security and compliance gates before implementation

- Review candidate provider's **official** pricing, commercial-use rights, retention, privacy/data location, authentication and API terms.
- Owner-only login with server-enforced authorization; session expiry, credential recovery and device revocation.
- Encrypt transport with HTTPS; assess encryption at rest, backup encryption and key ownership.
- Keep secrets out of the public GitHub repo and the Android application.
- Store immutable review-event history; implement corrections and retractions.
- Prevent publishing unless approval, source verification and content-rights checks all pass.
- Test concurrency, lost connectivity, duplicate links, cross-device updates, and unauthorized writes.
- Obtain owner approval for the final provider and architecture **before** connecting any account or deploying a service.

## Delivery phases

**Phase A (now):** Cross-device UX and threat-model design, offline browser prototype, and automated tests without external services.

**Phase B (after approval):** Authenticated private backend and persistent synchronized editorial queue.

**Phase C (after compliance/hosting review):** Approved-only public feed and Hindi-first mobile reader.

**Phase D (after source rights verified):** Optional authorized automated source collection.

## Acceptance criteria

1. Same draft and review status visible on Android and laptop after synchronization.
2. Unauthenticated users cannot read pending drafts or perform review actions.
3. Only explicit owner approval can move a story to the public feed.
4. Reject/retract/correct actions propagate to both devices and public projection.
5. Offline actions never silently overwrite newer server changes.
6. No private editorial data, secrets or credentials are committed to public GitHub.
7. Tests cover access control, synchronization conflicts, duplicate links and feed sanitization.
8. No paid service or main Bhumi Mitra module change without explicit approval.
