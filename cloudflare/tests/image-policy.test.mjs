import test from "node:test";
import assert from "node:assert/strict";
import {validateImageCandidate, MAX_IMAGE_BYTES} from "../src/image-policy.js";
const jpg = new Uint8Array([255,216,255,224,0,0]);
const candidate = {mime:"image/jpeg",size:120000,firstBytes:jpg,rightsConfirmed:true};
test("valid JPEG candidate accepted for further decoding",()=>{
  assert.equal(validateImageCandidate(candidate).ok,true);
});
test("unlicensed image denied",()=>{
  assert.equal(validateImageCandidate({...candidate,rightsConfirmed:false}).ok,false);
});
test("oversized image denied",()=>{
  assert.equal(validateImageCandidate({...candidate,size:MAX_IMAGE_BYTES+1}).ok,false);
});
test("empty image denied",()=>{
  assert.equal(validateImageCandidate({...candidate,size:0}).ok,false);
});
test("SVG rejected",()=>{
  assert.equal(validateImageCandidate({...candidate,mime:"image/svg+xml"}).ok,false);
});
test("PDF rejected",()=>{
  assert.equal(validateImageCandidate({...candidate,mime:"application/pdf"}).ok,false);
});
test("fake MIME signature denied",()=>{
  assert.equal(validateImageCandidate({...candidate,firstBytes:new Uint8Array([1,2,3,4])}).ok,false);
});
test("invalid size denied",()=>{
  assert.equal(validateImageCandidate({...candidate,size:NaN}).ok,false);
});
test("valid PNG signature accepted for further decoding",()=>{
  const png = new Uint8Array([137,80,78,71,13,10,26,10,0]);
  assert.equal(validateImageCandidate({...candidate,mime:"image/png",firstBytes:png}).ok,true);
});
test("valid WebP signature accepted for further decoding",()=>{
  const webp = new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]);
  assert.equal(validateImageCandidate({...candidate,mime:"image/webp",firstBytes:webp}).ok,true);
});
