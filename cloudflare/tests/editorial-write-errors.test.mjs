import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const base="https://editor.example.org/api/editorial/";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://access.example.org",
 ACCESS_AUD:"aud",OWNER_SUB:"owner-1",EDITORIAL_ORIGIN:"https://editor.example.org/",
 EDITORIAL_WRITES_ENABLED:"true"};
const verifier=async()=>({sub:"owner-1"});
function post(path,body){
 return new Request(base+path,{method:"POST",headers:{
  "Cf-Access-Jwt-Assertion":"test","Origin":"https://editor.example.org",
  "Sec-Fetch-Site":"same-origin","Content-Type":"application/json"},body:JSON.stringify(body)});
}
const draft={headline_hi:"शीर्षक",summary_hi:"सार",source_name:"Source",
 source_url:"https://example.org/test",source_publication_date:"2026-10-30",
 category:"circular",district:""};
test("draft write returns 503 when D1 is unavailable",async()=>{
 const response=await handleEditorial(post("drafts",draft),{...env,
  NEWS_DB:{batch:async()=>{throw Error("database offline");},prepare(){return {bind(){return {};}};}}},verifier);
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"database_unavailable");
});
test("invalid draft stays 400 and does not write to D1",async()=>{
 let writes=0;
 const response=await handleEditorial(post("drafts",{...draft,source_url:"http://bad.example"}),{...env,
  NEWS_DB:{batch:async()=>{writes++;}}},verifier);
 assert.equal(response.status,400);
 assert.equal(writes,0);
});
test("review write returns 503 when D1 read fails",async()=>{
 const response=await handleEditorial(post("review",{id:"draft1",version:1,
  action:"approve",reason:""}),{...env,
  NEWS_DB:{prepare(){throw Error("D1 outage");}}},verifier);
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"database_unavailable");
});
