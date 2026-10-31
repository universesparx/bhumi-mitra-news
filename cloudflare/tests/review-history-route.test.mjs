import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
import {listReviewHistory} from "../src/review-history.js";
const base="https://example.org/api/editorial/history";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://sample.cloudflareaccess.com",
 ACCESS_AUD:"aud",OWNER_SUB:"owner-1"};
const verifier=async()=>({sub:"owner-1"});
const request=s=>new Request(base+s,{headers:{"Cf-Access-Jwt-Assertion":"synthetic"}});
test("history requires owner authentication",async()=>{
 assert.notEqual((await handleEditorial(new Request(base+"?item_id=a"),env,verifier)).status,200);
});
test("history refuses unconfigured D1",async()=>{
 assert.equal((await handleEditorial(request("?item_id=a"),env,verifier)).status,503);
});
test("history filters and binds item id",async()=>{
 let sql,args;
 const db={prepare(q){sql=q;return {bind(...a){args=a;return {
  async all(){return {results:[{id:"ev",item_id:"a",action:"create"}]};}
 };}};}};
 const r=await handleEditorial(request("?item_id=a&limit=2"),{...env,NEWS_DB:db},verifier);
 assert.equal(r.status,200);
 assert.equal((await r.json()).events[0].action,"create");
 assert.match(sql,/WHERE item_id=\?/);
 assert.deepEqual(args,["a",2]);
});
test("history rejects invalid queries",async()=>{
 for(const s of ["","?item_id=a&item_id=b","?item_id=a&limit=0",
 "?item_id=a&limit=51","?item_id=a&extra=1","?item_id=a%27"]){
  const r=await handleEditorial(request(s),{...env,NEWS_DB:{}},verifier);
  assert.equal(r.status,400);
 }
});
test("history requires valid ID and D1",async()=>{
 await assert.rejects(listReviewHistory(null,{itemId:"a"}),/db_required/);
 await assert.rejects(listReviewHistory({prepare(){}},{itemId:"a;"}),/invalid_item_id/);
});
