import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const endpoint="https://editor.example.org/api/editorial/image";
const auth=async()=>({sub:"owner-1"});
const base={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://access.example.org",ACCESS_AUD:"aud",OWNER_SUB:"owner-1",EDITORIAL_ORIGIN:"https://editor.example.org/",EDITORIAL_WRITES_ENABLED:"true",EDITORIAL_IMAGE_WRITES_ENABLED:"true"};
const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4]);
function request(origin="https://editor.example.org"){return new Request(endpoint,{method:"POST",headers:{"Cf-Access-Jwt-Assertion":"test-token",Origin:origin,"Content-Type":"image/png","X-Editorial-Item-Id":"item1","X-Rights-Evidence-Id":"proof1"},body:png});}
function services(evidence=true){const writes=[];return {writes,NEWS_DB:{prepare(){return {bind(){return {first:async()=>evidence?{id:"proof1"}:null,run:async()=>({meta:{changes:1}})};}};}},NEWS_IMAGES:{put:async key=>writes.push(key),delete:async()=>{}}};}
test("image uploads are disabled by default",async()=>{const s=services();const r=await handleEditorial(request(),{...base,...s,EDITORIAL_IMAGE_WRITES_ENABLED:"false"},auth);assert.equal(r.status,503);assert.equal(s.writes.length,0);});
test("image uploads require same origin",async()=>{const s=services();const r=await handleEditorial(request("https://other.example.org"),{...base,...s},auth);assert.equal(r.status,403);assert.equal(s.writes.length,0);});
test("image uploads require matching evidence",async()=>{const s=services(false);const r=await handleEditorial(request(),{...base,...s},auth);assert.equal(r.status,403);assert.equal(s.writes.length,0);});
test("owner can attach validated image",async()=>{const s=services();const r=await handleEditorial(request(),{...base,...s},auth);assert.equal(r.status,201);assert.equal(s.writes.length,1);});
