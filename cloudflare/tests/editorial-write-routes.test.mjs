import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://sample.cloudflareaccess.com",
  ACCESS_AUD:"aud",OWNER_SUB:"owner-1"};
const verifier=async()=>({sub:"owner-1"});
const request=(path,body,origin="https://example.org")=>new Request("https://example.org"+path,{
  method:"POST",headers:{"Cf-Access-Jwt-Assertion":"synthetic",
    "Origin":origin,"Content-Type":"application/json"},
  body:JSON.stringify(body)
});
const draft={headline_hi:"शीर्षक",summary_hi:"विवरण",source_name:"Source",
  source_url:"https://example.org/a",source_publication_date:"2026-10-30",
  category:"circular",district:"Gaya"};
test("draft writes disabled by default even for owner",async()=>{
  const r=await handleEditorial(request("/api/editorial/drafts",draft),env,verifier);
  assert.equal(r.status,503);
});
test("review writes disabled by default",async()=>{
  const r=await handleEditorial(request("/api/editorial/review",
    {id:"a",action:"approve",version:1}),env,verifier);
  assert.equal(r.status,503);
});
test("cross-origin writes rejected when explicitly enabled",async()=>{
  const r=await handleEditorial(request("/api/editorial/drafts",draft,
    "https://attacker.example"),{...env,EDITORIAL_WRITES_ENABLED:"true",NEWS_DB:{}},verifier);
  assert.equal(r.status,403);
});
test("unverified owner cannot write",async()=>{
  const r=await handleEditorial(request("/api/editorial/drafts",draft),
    {...env,EDITORIAL_WRITES_ENABLED:"true",NEWS_DB:{}},
    async()=>({sub:"attacker"}));
  assert.equal(r.status,403);
});
test("missing database blocks writes",async()=>{
  const r=await handleEditorial(request("/api/editorial/drafts",draft),
    {...env,EDITORIAL_WRITES_ENABLED:"true"},verifier);
  assert.equal(r.status,503);
});
test("unknown editorial routes remain closed",async()=>{
  const r=await handleEditorial(request("/api/editorial/publish",draft),env,verifier);
  assert.equal(r.status,404);
});
test("owner session reports writes disabled",async()=>{
  const req=new Request("https://example.org/api/editorial/session",
    {headers:{"Cf-Access-Jwt-Assertion":"synthetic"}});
  const r=await handleEditorial(req,env,verifier);
  assert.equal((await r.json()).writes_enabled,false);
});
