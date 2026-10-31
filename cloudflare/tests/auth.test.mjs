import test from "node:test";
import assert from "node:assert/strict";
import {requireOwner} from "../src/auth.js";

const env = {
  AUTH_ENABLED: "true",
  ACCESS_TEAM_DOMAIN: "https://example.cloudflareaccess.com",
  ACCESS_AUD: "test-audience",
  OWNER_SUB: "owner-123"
};
const request = token => new Request("https://example.org/private", {
  headers: token ? {"Cf-Access-Jwt-Assertion": token} : {}
});

test("missing configuration denies", async () => {
  assert.equal((await requireOwner(request("token"), {}, async () => ({sub: "owner-123"}))).status, 503);
});
test("missing token denies", async () => {
  assert.equal((await requireOwner(request(), env, async () => ({sub: "owner-123"}))).status, 401);
});
test("invalid signature denies", async () => {
  assert.equal((await requireOwner(request("invalid"), env, async () => {throw Error("bad signature");})).status, 401);
});
test("non-owner denies", async () => {
  assert.equal((await requireOwner(request("token"), env, async () => ({sub: "attacker"}))).status, 403);
});
test("verified owner permitted", async () => {
  const result = await requireOwner(request("token"), env, async (_token, opts) => {
    assert.equal(opts.audience, env.ACCESS_AUD);
    assert.equal(opts.issuer, env.ACCESS_TEAM_DOMAIN);
    return {sub: "owner-123"};
  });
  assert.equal(result.ok, true);
});
test("spoofed email header cannot grant access", async () => {
  const req = new Request("https://example.org/private", {
    headers: {"Cf-Access-Authenticated-User-Email": "owner@example.org"}
  });
  assert.equal((await requireOwner(req, env, async () => ({sub: "owner-123"}))).status, 401);
});
