import test from "node:test";
import assert from "node:assert/strict";
import {normalizeFeedOptions,projectApprovedItem,readApprovedFeed} from "../src/approved-feed-store.js";
const approved={id:"a",headline_hi:"शीर्षक",summary_hi:"सार",source_name:"Official",
 source_url:"https://example.org/news",source_publication_date:"2026-10-31",
 category:"circular",district:"Gaya",updated_at:"now",status:"approved",
 retracted:0,source_verified:1,rights_checked:1,private_note:"secret",image_key:"private-key"};
test("feed projection excludes internal fields",()=>{
 const result=projectApprovedItem(approved);
 assert.equal(result.private_note,undefined);
 assert.equal(result.image_key,undefined);
 assert.equal(result.status,undefined);
 assert.equal(result.headline_hi,"शीर्षक");
});
for (const [name,patch] of [["pending",{status:"pending"}],
 ["retracted",{retracted:1}],["unverified",{source_verified:0}],
 ["rights unchecked",{rights_checked:0}]]) {
 test("feed rejects "+name,()=>assert.equal(projectApprovedItem({...approved,...patch}),null));
}
test("feed validates bounded filters",()=>{
 for(const options of [{limit:0},{limit:51},{limit:1.2},{category:"unknown"},
 {district:"\n"},{district:"x".repeat(121)}])
  assert.throws(()=>normalizeFeedOptions(options));
});
test("query requires approved, nonretracted and verified items",async()=>{
 let sql,params;
 const db={prepare(query){sql=query;return {bind(...args){params=args;return {
  async all(){return {results:[approved,{...approved,status:"pending"}]};}
 };}};}};
 const rows=await readApprovedFeed(db,{category:"circular",district:"Gaya",limit:3});
 assert.equal(rows.length,1);
 assert.match(sql,/status='approved'/);
 assert.match(sql,/retracted=0/);
 assert.match(sql,/source_verified=1/);
 assert.match(sql,/rights_checked=1/);
 assert.deepEqual(params,["circular","Gaya",3]);
});
test("feed fails closed without D1",async()=>{
 await assert.rejects(readApprovedFeed(null),/db_required/);
});
