import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";

const env = {AUTH_ENABLED: "true", ACCESS_TEAM_DOMAIN: "https://sample.cloudflareaccess.com",
  ACCESS_AUD: "aud", OWNER_SUB: "owner-1"};
const req = (path, method="GET", token) => new Request("https://example.org"+path, {
  method, headers: token ? {"Cf-Access-Jwt-Assertion": token} : {}
});
test("private endpoint disabled without configuration", async () => {
  const r = await handleEditorial(req("/api/editorial/session", "GET", "token"), {},
    async () => ({sub:"owner-1"}));
  assert.equal(r.status, 503);
});
test("private endpoint requires a token", async () => {
  assert.equal((await handleEditorial(req("/api/editorial/session"), env,
    async () => ({sub:"owner-1"}))).status, 401);
});
test("non-owner cannot access", async () => {
  assert.equal((await handleEditorial(req("/api/editorial/session", "GET", "token"), env,
    async () => ({sub:"attacker"}))).status, 403);
});
test("owner can only inspect session, not publish", async () => {
  const r = await handleEditorial(req("/api/editorial/session", "GET", "token"), env,
    async () => ({sub:"owner-1"}));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).publishing_enabled, false);
});
test("POST is not implemented", async () => {
  assert.equal((await handleEditorial(req("/api/editorial/session", "POST", "token"), env,
    async () => ({sub:"owner-1"}))).status, 404);
});
test("publishing endpoint is not implemented", async () => {
  assert.equal((await handleEditorial(req("/api/editorial/publish", "POST", "token"), env,
    async () => ({sub:"owner-1"}))).status, 404);
});
