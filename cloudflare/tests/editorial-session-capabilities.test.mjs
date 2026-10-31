import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const endpoint="https://editor.example.org/api/editorial/session";
const verifier=async()=>({sub:"owner1"});
const req=new Request(endpoint,{headers:{"Cf-Access-Jwt-Assertion":"test"}});
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://access.example.org",ACCESS_AUD:"aud",OWNER_SUB:"owner1",EDITORIAL_ORIGIN:"https://editor.example.org/",EDITORIAL_WRITES_ENABLED:"true",EDITORIAL_IMAGE_WRITES_ENABLED:"true",NEWS_DB:{},NEWS_IMAGES:{}};
test("session advertises image capability only when all dependencies are present",async()=>{
 const result=await handleEditorial(req,env,verifier);
 assert.equal(result.status,200);
 assert.equal((await result.json()).image_writes_enabled,true);
 for(const override of [{EDITORIAL_WRITES_ENABLED:"false"},{EDITORIAL_IMAGE_WRITES_ENABLED:"false"},{NEWS_IMAGES:null},{NEWS_DB:null},{EDITORIAL_ORIGIN:null}]){
  const response=await handleEditorial(req,{...env,...override},verifier);
  assert.equal((await response.json()).image_writes_enabled,false);
 }
});
test("session does not disclose capabilities without verified owner",async()=>{
 const response=await handleEditorial(new Request(endpoint),env,verifier);
 assert.equal(response.status,401);
});
