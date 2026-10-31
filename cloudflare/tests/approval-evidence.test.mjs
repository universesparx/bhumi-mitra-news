import test from "node:test";
import assert from "node:assert/strict";
import {reviewDraft} from "../src/editorial-store.js";
const item={id:"a",status:"pending",version:1,source_verified:1,rights_checked:1,retracted:0,image_key:null};
function database({sourceRights=1,imageRights=0,imageKey=null}={}){
 const batches=[];const queries=[];
 const db={prepare(sql){queries.push(sql);return {bind(){return {sql,first:async()=>sql.includes("AS source_rights")?{source_rights:sourceRights,image_rights:imageRights}:{...item,image_key:imageKey}};}};},
 async batch(statements){batches.push(statements);return [{meta:{changes:1}},{meta:{changes:1}}];}};
 return {db,batches,queries};
}
const input={id:"a",action:"approve",version:1,reviewerId:"owner",reason:"checked",now:"2026-10-31"};
test("approval requires recorded source rights",async()=>{
 const {db,batches}=database({sourceRights:0});
 await assert.rejects(reviewDraft(db,input),/rights_evidence_missing/);
 assert.equal(batches.length,0);
});
test("image approval requires image-scoped rights",async()=>{
 const {db}=database({imageKey:"private/a.jpg"});
 await assert.rejects(reviewDraft(db,input),/image_rights_unconfirmed/);
});
test("image approval with evidence generates guarded D1 update",async()=>{
 const {db,batches,queries}=database({imageKey:"private/a.jpg",imageRights:1});
 const result=await reviewDraft(db,input);
 assert.equal(result.status,"approved");
 assert.equal(batches.length,1);
 assert.ok(queries.some(sql=>sql.includes("UPDATE editorial_items") && sql.includes("EXISTS")));
});
