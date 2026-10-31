import test from "node:test";
import assert from "node:assert/strict";
import {inspectStagingConfig} from "../src/staging-readiness.js";
const safe={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://team.cloudflareaccess.com/",
 ACCESS_AUD:"synthetic-audience",OWNER_SUB:"synthetic-owner",
 EDITORIAL_ORIGIN:"https://editor.example.org/",
 NEWS_PUBLISHING_ENABLED:"false",NEWS_COLLECTION_ENABLED:"false",
 EDITORIAL_WRITES_ENABLED:"false",EDITORIAL_IMAGE_WRITES_ENABLED:"false",
 NEWS_DB:{prepare(){},batch(){}},NEWS_IMAGES:{put(){},delete(){}}};
test("synthetic isolated staging configuration passes preflight",()=>{
 assert.deepEqual(inspectStagingConfig(safe),{ready:true,failures:[]});
});
test("all unsafe activation flags fail closed",()=>{
 for(const key of ["NEWS_PUBLISHING_ENABLED","NEWS_COLLECTION_ENABLED","EDITORIAL_WRITES_ENABLED","EDITORIAL_IMAGE_WRITES_ENABLED"]){
  const result=inspectStagingConfig({...safe,[key]:"true"});
  assert.equal(result.ready,false);
  assert.ok(result.failures.includes("unsafe_flag_"+key.toLowerCase()));
 }
});
test("missing database or private image bucket fails",()=>{
 assert.equal(inspectStagingConfig({...safe,NEWS_DB:null}).ready,false);
 assert.equal(inspectStagingConfig({...safe,NEWS_IMAGES:null}).ready,false);
});
test("insecure or credentialed origins and shared Access origin fail",()=>{
 for(const origin of ["http://editor.example.org/","https://user:pw@editor.example.org/","https://editor.example.org/admin","https://editor.example.org/?token=x","https://team.cloudflareaccess.com/"]){
  assert.equal(inspectStagingConfig({...safe,EDITORIAL_ORIGIN:origin}).ready,false);
 }
});
test("missing owner configuration and disabled authentication fail",()=>{
 assert.equal(inspectStagingConfig({...safe,OWNER_SUB:""}).ready,false);
 assert.equal(inspectStagingConfig({...safe,AUTH_ENABLED:"false"}).ready,false);
});
