import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://sample.cloudflareaccess.com",
 ACCESS_AUD:"aud",OWNER_SUB:"owner-1",EDITORIAL_WRITES_ENABLED:"true",
 EDITORIAL_ORIGIN:"https://example.org",NEWS_DB:{}};
const verifier=async()=>({sub:"owner-1"});
function request(body,extraHeaders={}) {
 return new Request("https://example.org/api/editorial/drafts",{
  method:"POST",headers:{"Cf-Access-Jwt-Assertion":"synthetic",
   Origin:"https://example.org","Content-Type":"application/json",...extraHeaders},
  body
 });
}
test("oversized body with no content-length is rejected",async()=>{
 const r=await handleEditorial(request("x".repeat(20000)),env,verifier);
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:"invalid_request"});
});
test("exactly 16 KiB body is read but invalid JSON rejected",async()=>{
 const r=await handleEditorial(request(" ".repeat(16384)),env,verifier);
 assert.equal(r.status,400);
});
test("multibyte UTF-8 size is enforced",async()=>{
 const r=await handleEditorial(request("क".repeat(6000)),env,verifier);
 assert.equal(r.status,400);
});
test("invalid UTF-8 is rejected before JSON parsing",async()=>{
 const r=await handleEditorial(request(new Uint8Array([0xff,0xfe])),env,verifier);
 assert.equal(r.status,400);
});
test("incorrect content-length is rejected",async()=>{
 const r=await handleEditorial(request("{}",{"Content-Length":"20000"}),env,verifier);
 assert.equal(r.status,400);
});
test("small valid JSON reaches draft validation",async()=>{
 const r=await handleEditorial(request("{}"),env,verifier);
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:"invalid_request"});
});
