/** Verify Cloudflare Access RS256 JWTs against the configured team's JWKS.
 * Production requires Access to protect the route and this server-side verification.
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function decodeBase64Url(part) {
  if (typeof part !== "string" || !/^[A-Za-z0-9_-]+$/.test(part)) throw Error("bad encoding");
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(bytes, c => c.charCodeAt(0));
}
function parseJsonPart(part) {
  return JSON.parse(decoder.decode(decodeBase64Url(part)));
}
function normalizeIssuer(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/") throw Error("invalid issuer");
  return url.origin;
}
export async function verifyAccessJwt(token, {issuer, audience}, options = {}) {
  if (!crypto?.subtle || typeof fetch !== "function") throw Error("crypto unavailable");
  const origin = normalizeIssuer(issuer);
  if (!origin.endsWith(".cloudflareaccess.com")) throw Error("unexpected issuer host");
  if (typeof audience !== "string" || !audience) throw Error("missing audience");
  if (typeof token !== "string" || token.length > 16384) throw Error("invalid token");
  const parts = token.split(".");
  if (parts.length !== 3) throw Error("invalid JWT");
  const [header, payload] = [parseJsonPart(parts[0]), parseJsonPart(parts[1])];
  if (!header || header.alg !== "RS256" || header.typ && header.typ !== "JWT" ||
      typeof header.kid !== "string" || !header.kid) throw Error("unsupported header");
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (!payload || payload.iss !== origin ||
      !(typeof payload.aud === "string" ? payload.aud === audience :
        Array.isArray(payload.aud) && payload.aud.includes(audience)) ||
      !Number.isInteger(payload.exp) || payload.exp <= now ||
      !Number.isInteger(payload.iat) || payload.iat > now + 60 ||
      (payload.nbf !== undefined && (!Number.isInteger(payload.nbf) || payload.nbf > now)) ||
      typeof payload.sub !== "string" || !payload.sub) throw Error("invalid claims");
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(origin + "/cdn-cgi/access/certs");
  if (!response.ok) throw Error("JWKS unavailable");
  const jwks = await response.json();
  if (!jwks || !Array.isArray(jwks.keys)) throw Error("invalid JWKS");
  const key = jwks.keys.find(k => k.kid === header.kid && k.kty === "RSA" &&
    k.alg === "RS256" && k.use === "sig");
  if (!key) throw Error("key not found");
  const publicKey = await crypto.subtle.importKey("jwk", key,
    {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["verify"]);
  const signed = encoder.encode(parts[0] + "." + parts[1]);
  const signature = decodeBase64Url(parts[2]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signed)) {
    throw Error("invalid signature");
  }
  return payload;
}
