import test from "node:test";
import assert from "node:assert/strict";
import {evaluateReviewAction as review} from "../src/review-policy.js";
const item = {status:"pending",source_verified:true,rights_checked:true,retracted:false};
test("owner may approve checked pending news",()=>{
  assert.equal(review(item,"approve",true).nextStatus,"approved");
});
test("non-owner cannot approve",()=>{
  assert.equal(review(item,"approve",false).ok,false);
});
test("source not verified blocks approval",()=>{
  assert.equal(review({...item,source_verified:false},"approve",true).ok,false);
});
test("rights unchecked blocks approval",()=>{
  assert.equal(review({...item,rights_checked:false},"approve",true).ok,false);
});
test("unlicensed image blocks approval",()=>{
  assert.equal(review({...item,image_key:"a.jpg"},"approve",true).ok,false);
});
test("licensed image may be approved",()=>{
  assert.equal(review({...item,image_key:"a.jpg",image_rights_checked:true},"approve",true).ok,true);
});
test("retraction removes approval",()=>{
  const result=review({...item,status:"approved"},"retract",true);
  assert.equal(result.nextStatus,"pending");assert.equal(result.retracted,true);
});
test("correction requires new review",()=>{
  const result=review({...item,status:"approved"},"correct",true);
  assert.equal(result.requiresNewReview,true);assert.equal(result.nextStatus,"pending");
});
test("cannot approve already approved item",()=>{
  assert.equal(review({...item,status:"approved"},"approve",true).ok,false);
});
test("rejected item can be corrected for review",()=>{
  assert.equal(review({...item,status:"rejected"},"correct",true).nextStatus,"pending");
});
