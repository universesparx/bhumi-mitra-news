/** Cloudflare Access JWT verification boundary.
 * This module does NOT trust client-supplied identity headers or decoded-only JWTs.
 * It requires a verified identity from an external, configured verifier.
 * No production verifier is configured in this scaffold; requests fail closed.
 */
export async function requireOwner(request, env, verifyJwt) {
  if (!env || env.AUTH_ENABLED !== "true") {
    return {ok: false, status: 503, error: "auth_not_configured"};
  }
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD ||
      !env.OWNER_SUB || typeof verifyJwt !== "function") {
    return {ok: false, status: 503, error: "auth_not_configured"};
  }
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return {ok: false, status: 401, error: "authentication_required"};
  let claims;
  try {
    claims = await verifyJwt(token, {
      issuer: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD
    });
  } catch {
    return {ok: false, status: 401, error: "invalid_token"};
  }
  if (!claims || claims.sub !== env.OWNER_SUB) {
    return {ok: false, status: 403, error: "not_owner"};
  }
  return {ok: true, subject: claims.sub};
}
