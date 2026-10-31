import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {verifyAccessJwt} from "../src/verify-access-jwt.js";

globalThis.crypto ??= webcrypto;
const issuer = "https://sample.cloudflareaccess.com";
const audience = "aud-123";
const now = 2000000000;
const encode = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");

async function fixture(overrides = {}, headerOverrides = {}) {
  const keys = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
    publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256"
  }, true, ["sign","verify"]);
  const header = {alg: "RS256", typ: "JWT", kid: "key-1", ...headerOverrides};
  const claims = {iss: issuer, aud: [audience], sub: "owner-1",
    iat: now-100, exp: now+100, ...overrides};
  const body = encode(header) + "." + encode(claims);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey,
    new TextEncoder().encode(body));
  const token = body + "." + Buffer.from(signature).toString("base64url");
  const jwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const fetcher = async url => {
    assert.equal(url, issuer + "/cdn-cgi/access/certs");
    return {ok: true, json: async () => ({keys: [{...jwk, kid: "key-1", alg: "RS256", use: "sig"}]})};
  };
  return {token, fetcher};
}
const verify = (token, fetcher) => verifyAccessJwt(token, {issuer, audience}, {now, fetcher});

test("valid cryptographically signed Access JWT accepted", async () => {
  const {token, fetcher} = await fixture();
  assert.equal((await verify(token, fetcher)).sub, "owner-1");
});
test("modified payload rejected by signature check", async () => {
  const {token, fetcher} = await fixture();
  const parts = token.split(".");
  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  claims.sub = "attacker";
  parts[1] = encode(claims);
  await assert.rejects(verify(parts.join("."), fetcher));
});
test("expired token rejected", async () => {
  const {token, fetcher} = await fixture({exp: now-1});
  await assert.rejects(verify(token, fetcher));
});
test("wrong issuer rejected", async () => {
  const {token, fetcher} = await fixture({iss: "https://evil.example"});
  await assert.rejects(verify(token, fetcher));
});
test("wrong audience rejected", async () => {
  const {token, fetcher} = await fixture({aud: ["wrong"]});
  await assert.rejects(verify(token, fetcher));
});
test("future not-before rejected", async () => {
  const {token, fetcher} = await fixture({nbf: now+100});
  await assert.rejects(verify(token, fetcher));
});
test("unsupported algorithm rejected", async () => {
  const {token, fetcher} = await fixture({}, {alg: "none"});
  await assert.rejects(verify(token, fetcher));
});
test("missing JWKS key rejected", async () => {
  const {token} = await fixture();
  await assert.rejects(verify(token, async () => ({ok: true, json: async () => ({keys: []})})));
});
test("malformed JWT rejected", async () => {
  await assert.rejects(verify("not.a.jwt", async () => {throw Error("should not fetch")}));
});
test("non-Cloudflare issuer rejected", async () => {
  const {token, fetcher} = await fixture();
  await assert.rejects(verifyAccessJwt(token, {issuer: "https://evil.example", audience},
    {now, fetcher}));
});
