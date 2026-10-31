import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const base="https://editor.example.org/api/editorial/";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://access.example.org",ACCESS_AUD:"aud",OWNER_SUB:"owner-1",NEWS_DB:{prepare(){throw Error("database unavailable");}}};
const verifier=async()=>({sub:"owner-1"});
const get=path=>new Request(base+path,{headers:{"Cf-Access-Jwt-Assertion":"test-token"}});
for(const [path,invalid] of [["drafts","drafts?limit=0"],["history?item_id=entry1","history?item_id=../bad"]]){
 test("private "+path+" reports D1 outage as 503",async()=>{
  const response=await handleEditorial(get(path),env,verifier);
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,"database_unavailable");
 });
 test("private "+invalid+" rejects invalid input as 400",async()=>{
  const response=await handleEditorial(get(invalid),env,verifier);
  assert.equal(response.status,400);
  assert.equal((await response.json()).error,"invalid_query");
 });
}
