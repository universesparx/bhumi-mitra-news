import test from "node:test";
import assert from "node:assert/strict";
import {storeEditorialImage} from "../src/editorial-image-store.js";
const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4]);
const req=()=>new Request("https://example.org/private-image",{method:"POST",
 headers:{"content-type":"image/png"},body:png});
const args={itemId:"draft-1",evidenceId:"evidence-1",ownerId:"owner-1"};
function fixture({evidence=true,changes=1,failWrite=false}={}){
 const calls=[];const bucket={async put(key,bytes,metadata){calls.push(["put",key,bytes,metadata]);if(failWrite)throw Error("R2 unavailable");},
 async delete(key){calls.push(["delete",key]);}};
 const db={prepare(sql){calls.push(["sql",sql]);return {bind(...values){calls.push(["bind",values]);return {
 async first(){return evidence?{id:"evidence-1"}:null;},
 async run(){return {meta:{changes}};}
 };}};}};
 return {db,bucket,calls};
}
test("valid rights evidence stores private image and attaches D1 key",async()=>{
 const f=fixture();const result=await storeEditorialImage({...args,...f,request:req()});
 assert.match(result.imageKey,/^editorial\/draft-1\/[a-f0-9-]+\.png$/);
 assert.equal(result.size,png.length);
 assert.equal(f.calls.filter(x=>x[0]==="put").length,1);
 assert.equal(f.calls.filter(x=>x[0]==="delete").length,0);
 assert.match(f.calls.find(x=>x[0]==="sql"&&x[1].includes("UPDATE"))[1],/image_key IS NULL/);
});
test("no R2 write when evidence is absent",async()=>{
 const f=fixture({evidence:false});
 await assert.rejects(storeEditorialImage({...args,...f,request:req()}),/rights_evidence_missing/);
 assert.equal(f.calls.filter(x=>x[0]==="put").length,0);
});
test("failed D1 attach deletes orphaned image",async()=>{
 const f=fixture({changes:0});
 await assert.rejects(storeEditorialImage({...args,...f,request:req()}),/image_attachment_conflict/);
 assert.equal(f.calls.filter(x=>x[0]==="delete").length,1);
});
test("missing storage and malformed item IDs fail closed",async()=>{
 await assert.rejects(storeEditorialImage({...args,db:{},bucket:{},request:req()}),/storage_unavailable/);
 const f=fixture();
 await assert.rejects(storeEditorialImage({...args,itemId:"../bad",...f,request:req()}),/invalid_item_id/);
});

test("both evidence lookup and conditional attachment require image-specific scope",async()=>{
 const f=fixture();await storeEditorialImage({...args,...f,request:req()});
 const queries=f.calls.filter(x=>x[0]==="sql").map(x=>x[1]);
 assert.equal(queries.length,2);
 for(const sql of queries)assert.match(sql,/lower\((?:e\.)?permission_scope\) LIKE '%image%'/);
});
