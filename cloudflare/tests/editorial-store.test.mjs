import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {createDraft,reviewDraft} from "../src/editorial-store.js";
globalThis.crypto ??= webcrypto;
const draft={id:"item-1",headline_hi:"समाचार",summary_hi:"विवरण",source_name:"Official",
 source_url:"https://example.org/news",source_publication_date:"2026-10-30",
 category:"circular",district:"Gaya",created_at:"2026-10-31",updated_at:"2026-10-31"};
class MockDB {
  constructor(item={id:"item-1",status:"pending",version:1,source_verified:1,
      rights_checked:1,retracted:0,image_key:null}) {
    this.item=item;this.statements=[];this.batches=[];
  }
  prepare(sql) {
    return {bind:(...args)=>({sql,args,first:async()=>this.item})};
  }
  async batch(statements) {
    this.batches.push(statements);
    return statements.map(()=>({meta:{changes:1}}));
  }
}
test("manual draft inserts pending-only fields and create audit together",async()=>{
  const db=new MockDB();
  await createDraft(db,draft,"owner-1");
  assert.equal(db.batches.length,1);
  assert.equal(db.batches[0].length,2);
  assert.match(db.batches[0][0].sql,/INSERT INTO editorial_items/);
  assert.match(db.batches[0][1].sql,/INSERT INTO review_events/);
});
test("draft cannot specify approved status",async()=>{
  await assert.rejects(createDraft(new MockDB(),{...draft,status:"approved"},"owner-1"));
});
test("draft rejects insecure source URL",async()=>{
  await assert.rejects(createDraft(new MockDB(),{...draft,source_url:"http://example.org"},"owner-1"));
});
test("draft rejects missing owner",async()=>{
  await assert.rejects(createDraft(new MockDB(),draft,""));
});
test("review rejects stale version",async()=>{
  await assert.rejects(reviewDraft(new MockDB(),{id:"item-1",action:"approve",
    version:2,reviewerId:"owner-1",reason:"verified",now:"2026-10-31"}),/version_conflict/);
});
test("review blocks missing rights evidence",async()=>{
  const db=new MockDB({...new MockDB().item,rights_checked:0});
  await assert.rejects(reviewDraft(db,{id:"item-1",action:"approve",version:1,
    reviewerId:"owner-1",reason:"",now:"2026-10-31"}),/approval_requirements_missing/);
});
test("review creates guarded update and audit batch",async()=>{
  const db=new MockDB();
  const result=await reviewDraft(db,{id:"item-1",action:"approve",version:1,
    reviewerId:"owner-1",reason:"source verified",now:"2026-10-31"});
  assert.equal(result.status,"approved");
  assert.equal(result.version,2);
  assert.equal(db.batches[0].length,2);
  assert.match(db.batches[0][0].sql,/WHERE id=\? AND version=\? AND status=\?/);
});
test("review fails closed on zero-row conditional update",async()=>{
  const db=new MockDB();
  db.batch=async()=>[{meta:{changes:0}},{meta:{changes:0}}];
  await assert.rejects(reviewDraft(db,{id:"item-1",action:"approve",version:1,
    reviewerId:"owner-1",reason:"",now:"2026-10-31"}),/review_conflict/);
});
test("review does not permit unlicensed image",async()=>{
  const db=new MockDB({...new MockDB().item,image_key:"image.jpg"});
  await assert.rejects(reviewDraft(db,{id:"item-1",action:"approve",version:1,
    reviewerId:"owner-1",reason:"",now:"2026-10-31"}),/image_rights_unconfirmed/);
});
