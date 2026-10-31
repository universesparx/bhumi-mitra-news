import test from "node:test";
import assert from "node:assert/strict";
import {validateImageUpload} from "../src/image-upload-validation.js";
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const request=(bytes,mime="image/png",headers={})=>new Request("https://example.org/upload",{
 method:"POST",body:bytes,headers:{"content-type":mime,...headers}});
const rights={rightsEvidenceId:"evidence-1",rightsConfirmed:true};
test("valid PNG signature and rights identifier accepted",async()=>{
 const result=await validateImageUpload(request(png),rights);
 assert.equal(result.mime,"image/png");
 assert.equal(result.extension,".png");
 assert.deepEqual(result.bytes,png);
});
test("rejects missing rights, invalid evidence identifiers and unsupported types",async()=>{
 await assert.rejects(validateImageUpload(request(png)),/image_rights_unconfirmed/);
 await assert.rejects(validateImageUpload(request(png),{...rights,rightsEvidenceId:"../evil"}),/image_rights_unconfirmed/);
 await assert.rejects(validateImageUpload(request(png,"image/svg+xml"),rights),/unsupported_image_type/);
});
test("rejects spoofed signatures and declared oversized images",async()=>{
 await assert.rejects(validateImageUpload(request(Uint8Array.from([1,2,3])),rights),/invalid_image_signature/);
 await assert.rejects(validateImageUpload(request(png,"image/png",{"content-length":"2097153"}),rights),/invalid_image_size/);
});
test("rejects streamed body exceeding maximum even without content-length",async()=>{
 const bytes=new Uint8Array(2*1024*1024+1);bytes.set(png);
 await assert.rejects(validateImageUpload(request(bytes),rights),/invalid_image_size/);
});
