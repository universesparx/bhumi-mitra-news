# Cloudflare Access JWT verification prototype

`src/verify-access-jwt.js` verifies RS256 signatures against Cloudflare Access team JWKS and checks issuer, audience, expiry, issued-at, not-before and subject. Tests generate synthetic RSA keys locally and never contact Cloudflare.

**Still not production ready:** No live Access policy, owner identity, secure session configuration, protected route, JWKS caching/rate limiting, deployment or security review exists. The Worker scaffold has no private routes. `auth.js` accepts a verifier dependency but is **not wired to any deployed endpoint**.

Before enabling, confirm Cloudflare's current official Access JWT specification, issuer formatting and identity claim semantics; configure Access policy for a single owner, test revoked sessions and key rotation, and protect all origin routes. Do not rely on a decoded JWT or a spoofable email header. Keep the existing AI Land Advisor completely separate.
