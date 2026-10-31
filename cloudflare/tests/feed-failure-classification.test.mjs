import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
const env={NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{prepare(){throw Error("D1 unavailable");}}};
for(const path of ["/api/news","/api/news/page"]){
 test(path+" reports D1 failure as 503, not a client mistake",async()=>{
  const r=await worker.fetch(new Request("https://example.org"+path),env);
  assert.equal(r.status,503);
  assert.equal(r.headers.get("cache-control"),"no-store");
  assert.equal((await r.json()).error,"database_unavailable");
 });
 test(path+" validates query without accessing D1",async()=>{
  const r=await worker.fetch(new Request("https://example.org"+path+"?limit=0"),env);
  assert.equal(r.status,400);
  assert.equal((await r.json()).error,"invalid_query");
 });
}
test("invalid pagination cursor is a 400",async()=>{
 const r=await worker.fetch(new Request("https://example.org/api/news/page?cursor=bad"),env);
 assert.equal(r.status,400);
});
test("publishing disabled remains 503",async()=>{
 const r=await worker.fetch(new Request("https://example.org/api/news"),{});
 assert.equal(r.status,503);
});
