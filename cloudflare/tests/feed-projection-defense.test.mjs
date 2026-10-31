import test from "node:test";
import assert from "node:assert/strict";
import {readApprovedPage} from "../src/feed-pagination.js";
const good={id:"safe",headline_hi:"Title",summary_hi:"Summary",source_name:"Official",
 source_url:"https://example.org",source_publication_date:"2026-10-31",
 category:"policy",district:"Gaya",updated_at:"now",status:"approved",
 retracted:0,source_verified:1,rights_checked:1,secret_note:"never publish"};
test("pagination strips private fields even if mock D1 returns extra columns",async()=>{
 const db={prepare(){return {bind(){return {async all(){return {results:[good]};}};}};}};
 const page=await readApprovedPage(db);
 assert.equal(page.items.length,1);
 assert.equal(page.items[0].secret_note,undefined);
 assert.equal(page.items[0].status,undefined);
 assert.equal(page.items[0].rights_checked,undefined);
});
test("pagination refuses unapproved and retracted rows even if DB layer misbehaves",async()=>{
 const rows=[{...good,id:"pending",status:"pending"},{...good,id:"retracted",retracted:1},
  {...good,id:"unverified",source_verified:0},{...good,id:"valid"}];
 const db={prepare(){return {bind(){return {async all(){return {results:rows};}};}};}};
 const page=await readApprovedPage(db);
 assert.deepEqual(page.items.map(item=>item.id),["valid"]);
});
