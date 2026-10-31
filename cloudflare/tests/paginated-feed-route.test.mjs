import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
const request=s=>new Request("https://example.org/api/news/page"+s);
test("paginated feed disabled unless explicitly enabled",async()=>{
 const r=await worker.fetch(request(""),{});
 assert.equal(r.status,503);
});
test("paginated feed rejects unknown or duplicate query parameters",async()=>{
 const env={NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{}};
 for(const s of ["?bad=x","?limit=1&limit=2","?cursor=a&cursor=b"]){
  assert.equal((await worker.fetch(request(s),env)).status,400);
 }
});
test("paginated feed returns bounded approved-only items",async()=>{
 let sql,args;
 const db={prepare(q){sql=q;return {bind(...a){args=a;return {
  async all(){return {results:[
   {id:"b",headline_hi:"Hindi",summary_hi:"Summary",source_name:"Office",
    source_url:"https://example.org",source_publication_date:"2026-10-31",
    category:"circular",district:"Gaya",updated_at:"now",status:"approved",retracted:0,source_verified:1,rights_checked:1},
   {id:"a",headline_hi:"Hindi",summary_hi:"Summary",source_name:"Office",
    source_url:"https://example.org",source_publication_date:"2026-10-31",
    category:"circular",district:"Gaya",updated_at:"now"}
  ]};}
 };}};}};
 const r=await worker.fetch(request("?limit=1"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:db});
 assert.equal(r.status,200);
 const body=await r.json();
 assert.equal(body.items.length,1);
 assert.equal(body.next_cursor,"2026-10-31|b");
 assert.match(sql,/rights_evidence/);
 assert.deepEqual(args,[2]);
});
test("paginated feed rejects malformed cursor",async()=>{
 const env={NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{prepare(){throw Error("unexpected");}}};
 assert.equal((await worker.fetch(request("?cursor=bad"),env)).status,400);
});
