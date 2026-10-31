import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
const req=(suffix="")=>new Request("https://example.org/api/news"+suffix);
test("public feed unavailable by default",async()=>{
 const r=await worker.fetch(req(),{NEWS_DB:{},NEWS_PUBLISHING_ENABLED:"false"});
 assert.equal(r.status,503);
});
test("public feed requires D1 even if flag is on",async()=>{
 const r=await worker.fetch(req(),{NEWS_PUBLISHING_ENABLED:"true"});
 assert.equal(r.status,503);
});
test("public feed rejects unknown filters",async()=>{
 const r=await worker.fetch(req("?secret=x"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{}});
 assert.equal(r.status,400);
});
test("public feed rejects duplicate filters",async()=>{
 const r=await worker.fetch(req("?limit=1&limit=2"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{}});
 assert.equal(r.status,400);
});
test("public feed rejects invalid limit",async()=>{
 const r=await worker.fetch(req("?limit=0"),{NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:{}});
 assert.equal(r.status,400);
});
test("public feed returns only projected approved content",async()=>{
 const approved={id:"a",headline_hi:"शीर्षक",summary_hi:"सार",source_name:"Source",
  source_url:"https://example.org/a",source_publication_date:"2026-10-31",
  category:"survey",district:"Gaya",updated_at:"now",status:"approved",
  retracted:0,source_verified:1,rights_checked:1,private_note:"secret"};
 let sql;
 const db={prepare(query){sql=query;return {bind(){return {
  async all(){return {results:[approved,{...approved,status:"pending"}]};}
 };}};}};
 const r=await worker.fetch(req("?limit=1&category=survey"),{
  NEWS_PUBLISHING_ENABLED:"true",NEWS_DB:db});
 assert.equal(r.status,200);
 assert.equal(r.headers.get("x-content-type-options"),"nosniff");
 assert.match(sql,/status='approved'/);
 const rows=await r.json();
 assert.equal(rows.length,1);
 assert.equal(rows[0].private_note,undefined);
 assert.equal(rows[0].status,undefined);
});
