# भू-अलर्ट बिहार — Owner Authentication Boundary

**Status:** Offline authentication contract and tests only. No login is enabled or deployed.

## Proposed authentication

Evaluate **Cloudflare Access** for protecting the private editorial Worker. A future Worker must verify the Access JWT signature, issuer, audience, expiration and any other required claims against Cloudflare's official verification guidance. It must also check a configured immutable owner identifier server-side.

`cloudflare/src/auth.js` provides a fail-closed authorization boundary with a **verifier dependency**. It is not a complete JWT verifier. No implementation may set `AUTH_ENABLED=true` or expose private routes until a correctly implemented, independently tested signature verifier is supplied.

## Explicitly prohibited

- Trusting browser-provided owner IDs, email headers or decoded-only JWT claims.
- Client-side-only approval controls.
- Publishing pending drafts through public endpoints.
- Hardcoding Access credentials, JWT keys or owner identifiers in public GitHub.
- Deploying the current scaffold as an editorial backend.

## Required before enabling

1. Verify Cloudflare Access plan and free-tier eligibility for the owner's actual use.
2. Confirm Android/laptop browser login, session expiry and account recovery.
3. Implement cryptographic JWT validation with key rotation and strict issuer/audience/expiry checks.
4. Ensure Cloudflare Access protects the origin, including alternate `workers.dev` routes.
5. Test forged, expired, wrong-audience, wrong-issuer and non-owner tokens.
6. Add server-side authorization to every draft, review, upload and publish operation.
7. Review audit logs, incident response and device revocation.
8. Obtain explicit owner approval before any live authentication or deployment.

The existing AI Land Advisor Worker and all main Bhumi Mitra files remain unchanged.
