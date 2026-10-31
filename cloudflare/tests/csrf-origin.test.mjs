import test from "node:test";
import assert from "node:assert/strict";
import {handleEditorial} from "../src/editorial-api.js";
const env={AUTH_ENABLED:"true",ACCESS_TEAM_DOMAIN:"https://team.cloudflareaccess.com",
 ACCESS_AUD:"aud",OWNER_SUB:"owner",EDITORIAL_WRITES_ENABLED:"true",NEWS_DB:{},
 EDITORIAL_ORIGIN:"https://editor.example.org"};
const verifier=async()=>({sub:"owner"});
function req(origin,site) {
 const headers={"Cf-Access-Jwt-Assertion":"synthetic",
  "Content-Type":"application/json"};
 if(origin!==null) headers.Origin=origin;
 if(site!==null) headers["Sec-Fetch-Site"]=site;
 return new Request("https://editor.example.org/api/editorial/drafts",
  {method:"POST",headers,body:"{}"});
}
for(const [name,origin,site,overrides] of [
 ["missing Origin",null,"same-origin",{}],
 ["null Origin","null","same-origin",{}],
 ["attacker Origin","https://attacker.example","cross-site",{}],
 ["cross-site fetch metadata","https://editor.example.org","cross-site",{}],
 ["same-site different origin metadata","https://editor.example.org","same-site",{}],
 ["unconfigured trusted origin","https://editor.example.org","same-origin",
  {EDITORIAL_ORIGIN:undefined}],
 ["HTTP trusted origin","https://editor.example.org","same-origin",
  {EDITORIAL_ORIGIN:"http://editor.example.org"}],
 ["trusted origin with path","https://editor.example.org","same-origin",
  {EDITORIAL_ORIGIN:"https://editor.example.org/admin"}]
]) {
 test("rejects "+name,async()=>{
  const r=await handleEditorial(req(origin,site),{...env,...overrides},verifier);
  assert.equal(r.status,403);
 });
}
test("valid same-origin request passes CSRF boundary into payload validation",async()=>{
 const r=await handleEditorial(req("https://editor.example.org","same-origin"),env,verifier);
 assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:"invalid_or_unavailable"});
});
