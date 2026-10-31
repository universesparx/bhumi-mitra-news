# Backend Provider Evaluation — 2026-10-31

**Status:** Preliminary official-document comparison, not deployment approval. The owner requires Android + laptop editorial access, manual approval, zero budget, and no modifications to the existing Bhumi Mitra app.

## Verified published free quotas

| Candidate | Free allowance | Operational caveat |
| --- | --- | --- |
| Firebase Spark / Cloud Firestore | 1 GiB data; 50,000 document reads/day; 20,000 writes/day; 20,000 deletes/day; 10 GiB outbound/month | Some capabilities require Blaze billing. On Spark, quota exhaustion may disable a service until quota resets or the billing cycle changes. |
| Supabase Free | 500 MB database; 50,000 monthly active users; 5 GB egress; 1 GB file storage | Free projects can pause after one week of inactivity; automatic backups not included. |
| Cloudflare Workers Free + D1 | Workers: 100,000 requests/day; D1: 5 million rows read/day, 100,000 rows written/day, 5 GB storage | Custom owner authentication, sessions, authorization and backups require a careful design. Free limits can halt service. |

## Official sources

- Firebase plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firestore quotas: https://firebase.google.com/docs/firestore/pricing
- Supabase pricing: https://supabase.com/pricing
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers/D1 pricing: https://developers.cloudflare.com/workers/platform/pricing/

## Provisional recommendation

**Firebase Spark is the initial candidate for further due diligence**, because it combines a managed authentication product with a document database and supports phone/laptop browser clients. This is a design preference, **not** a verified authorization for this specific application.

## Unresolved requirements before provider selection

1. Verify official terms for the precise proposed production use, including commercial/monetized news and applicable account requirements.
2. Verify whether the selected Firebase Auth sign-in method is usable without billing, its quotas, account recovery, and security settings.
3. Design Firestore security rules with server-enforced owner-only access; client-side checks alone are insufficient.
4. Define encrypted backup/export and restore; Firestore managed backups are not covered by the no-cost quota described above.
5. Confirm data retention, location, privacy notices, incident response, and deletion obligations for Indian users.
6. Determine an approved hosting mechanism for the private responsive editorial UI and the read-only public feed; do not assume all hosting or serverless products remain free.
7. Model rate limits, quota-exhaustion behavior, malicious input, and concurrent edits across devices.
8. Obtain explicit approval before provisioning any provider resources, connecting accounts, deploying, or modifying the main app.

## Immediate next engineering step

Create an **offline-only Firebase-style security rules specification and test plan** for a single owner and approved-only public feed. Do not configure a live project yet.

**No third-party account, deployment, collector, or production authentication has been activated.**
