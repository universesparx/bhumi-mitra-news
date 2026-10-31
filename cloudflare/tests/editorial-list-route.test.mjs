import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const url="https://example.org/api/editorial/drafts";
const verifier=async()=>({sub:"owner-1"});
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://sample.cloudflareaccess.com",
 ACCESS_AUD:"aud",OWNER_SUB:"owner-1"};
const request=(suffix="")=>new Request(url+suffix,{headers:{"Cf-Access-Jwt-Assertion":"synthetic"}});
test("owner-only list rejects unauthenticated access",async()=>{
 const r=await handleEditorial(new Request(url),env,verifier);
 assert.notEqual(r.status,200);
});
test("owner-only list requires database",async()=>{
 const r=await handleEditorial(request(),env,verifier);
 assert.equal(r.status,503);
});
test("owner-only list returns pending drafts with writes disabled",async()=>{
 let sql,args;
 const db={prepare(q){sql=q;return {bind(...a){args=a;return {
  async all(){return {results:[{id:"a",status:"pending",version:1}]};}
 };}};}};
 const r=await handleEditorial(request(),{...env,NEWS_DB:db},verifier);
 assert.equal(r.status,200);
 assert.deepEqual((await r.json()).items,[{id:"a",status:"pending",version:1}]);
 assert.match(sql,/WHERE status=\?/);
 assert.deepEqual(args,["pending",30]);
});
test("owner-only list rejects invalid filters",async()=>{
 for(const suffix of ["?status=admin","?limit=0","?limit=51",
  "?status=pending&status=approved","?secret=x"]){
  const r=await handleEditorial(request(suffix),{...env,NEWS_DB:{}},verifier);
  assert.equal(r.status,400);
 }
});
test("owner-only list rejects wrong owner",async()=>{
 const r=await handleEditorial(request(),{...env,NEWS_DB:{}},async()=>({sub:"other"}));
 assert.equal(r.status,403);
});
