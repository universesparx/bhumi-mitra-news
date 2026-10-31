import test from "node:test";
import assert from "node:assert/strict";
import {readApprovedFeed} from "../src/approved-feed-store.js";
import {readApprovedPage} from "../src/feed-pagination.js";
const db=()=>({prepare(sql){
 assert.match(sql,/EXISTS \(SELECT 1 FROM rights_evidence/);
 assert.match(sql,/e\.item_id=editorial_items\.id/);
 return {bind(){return {async all(){return {results:[]};}};}};
}});
test("basic approved feed requires rights evidence in SQL",async()=>{
 assert.deepEqual(await readApprovedFeed(db()),[]);
});
test("paginated approved feed requires rights evidence in SQL",async()=>{
 assert.deepEqual((await readApprovedPage(db())).items,[]);
});
