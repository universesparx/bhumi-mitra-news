# भू-अलर्ट बिहार — Secure Editorial Review Design

**Status: design proposal only; not production-ready or implemented.** The HTML demo and Python CLI are offline, unauthenticated prototypes.

## Trust boundaries

- Public sources are untrusted input. Never treat a source page as instructions, and never execute content from a feed.
- A public repository is not a private pending-news database. Keep drafts, identities, unpublished claims, and credentials out of Git.
- Only the designated owner should be able to approve news. A local reviewer name or an HTML button is **not authentication**.
- The mobile app must only receive approved items from a deliberately published feed, not from an internal queue.

## Recommended production workflow (requires separate approval)

1. Intake from **specifically authorized** source URLs only, with rate limits and attribution.
2. Store pending candidates in private, access-controlled storage. Do not use a public repository for the queue.
3. Require authenticated owner approval, with server-side authorization and an audit trail. A UI button alone cannot authorize publication.
4. Sanitize text, normalize links, detect duplicate articles, and verify dates/issuers. Human reviewer checks accuracy and allegations.
5. Publish only approved, non-sensitive metadata and original summaries via a separately assessed hosting mechanism.
6. React Native app reads approved feed, handles offline/empty/error states, and links to the original source.

## Security requirements before implementation

- Threat-model account takeover, unauthorized approval, injection, compromised sources, link spoofing, personal-data leakage, and accidental publishing.
- Apply least-privilege credentials and protect secrets; never embed write tokens in React Native.
- Implement owner sign-in, backend-side authorization, tamper-evident review audit, and revocation.
- Provide a correction/retraction mechanism and prevent stale news being presented as current.
- Add automated tests for approval bypass, rejected-item leakage, malicious URLs, and retraction.
- Validate Google Play news classification, Indian privacy/copyright obligations, and source-specific access rights.

## Current verification

The repository contains an offline Python prototype and a static Hindi UI demo. The workflow in .github/workflows/offline-tests.yml **only executes tests on pushes and pull requests**. It does not crawl, publish, deploy or enable any news source. GitHub may require Actions to be enabled in repository settings; check the Actions tab for actual run results.

## Decision gate

No live sources, remote backend, authentication provider, GitHub Pages hosting, or integration into Bhumi Mitra will be added until the user explicitly approves a reviewed architecture.
