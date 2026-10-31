import test from "node:test";
import assert from "node:assert/strict";
import {readApprovedPage,validateCursor} from "../src/feed-pagination.js";
const row=id=>({id,headline_hi:id,summary_hi:"s",source_name:"Source",
 source_url:"https://example.org/"+id,source_publication_date:"2026-10-31",
 category:"survey",district:"Gaya",updated_at:"now",status:"approved",retracted:0,source_verified:1,rights_checked:1});
test("invalid cursors rejected",()=>{
 for(const x of ["","abc","2026-10-31|x;DROP TABLE","2026-10-31|",
  "2026-10-31|a".repeat(200),123])
  assert.throws(()=>validateCursor(x));
});
test("pagination uses bound cursor values and returns next cursor",async()=>{
 let sql,args;
 const db={prepare(q){sql=q;return {bind(...a){args=a;return {
  async all(){return {results:[row("c"),row("b"),row("a")]};}
 };}};}};
 const page=await readApprovedPage(db,{limit:2,category:"survey",
  cursor:"2026-10-30|z"});
 assert.equal(page.items.length,2);
 assert.equal(page.next_cursor,"2026-10-31|b");
 assert.match(sql,/source_verified=1/);
 assert.match(sql,/rights_checked=1/);
 assert.match(sql,/status='approved'/);
 assert.deepEqual(args,["survey","2026-10-30","2026-10-30","z",3]);
});
test("no next cursor on last page",async()=>{
 const db={prepare(){return {bind(){return {async all(){return {results:[row("a")]};}};}};}};
 const page=await readApprovedPage(db,{limit:2});
 assert.equal(page.next_cursor,null);
});
test("missing database rejected",async()=>{
 await assert.rejects(readApprovedPage(null),/db_required/);
});
