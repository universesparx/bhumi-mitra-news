import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
const request=(path,method="GET")=>new Request("https://news.example.org"+path,{method});
test("default production-safe configuration blocks all news routes",async()=>{
 for(const path of ["/api/news","/api/news/page","/api/news?limit=20"]){
  const response=await worker.fetch(request(path),{NEWS_PUBLISHING_ENABLED:"false"});
  assert.equal(response.status,503);
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.deepEqual(await response.json(),{error:"not_available"});
 }
});
test("enabled flag without database still blocks public feed",async()=>{
 const response=await worker.fetch(request("/api/news"),{NEWS_PUBLISHING_ENABLED:"true"});
 assert.equal(response.status,503);
});
test("publishing flag alone never exposes unlicensed rows",async()=>{
 let query;
 const db={prepare(sql){query=sql;return {bind(){return {all:async()=>({results:[]})};}};}};
 const response=await worker.fetch(request("/api/news"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:db});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),[]);
 assert.match(query,/source_verified=1/);
 assert.match(query,/rights_checked=1/);
 assert.match(query,/EXISTS \(SELECT 1 FROM rights_evidence/);
});
test("public route rejects malformed query and does not hit D1",async()=>{
 let called=false;
 const db={prepare(){called=true;throw Error("should not be reached");}};
 const response=await worker.fetch(request("/api/news?limit=0"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:db});
 assert.equal(response.status,400);
 assert.equal(called,false);
});
test("unavailable database returns 503 without exposing exception details",async()=>{
 const db={prepare(){throw Error("secret connection details");}};
 const response=await worker.fetch(request("/api/news"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:db});
 assert.equal(response.status,503);
 const body=JSON.stringify(await response.json());
 assert.doesNotMatch(body,/secret connection details/);
});
