import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../editorial-dashboard/index.html",import.meta.url),"utf8");
test("editor dashboard is responsive and Hindi-first",()=>{
 assert.match(html,/lang="hi"/);
 assert.match(html,/max-width:740px/);
 assert.match(html,/समीक्षा सूची/);
});
test("dashboard uses only authenticated same-origin APIs",()=>{
 assert.match(html,/credentials:"same-origin"/);
 assert.match(html,/\/api\/editorial\/session/);
 assert.match(html,/\/api\/editorial\/drafts/);
 assert.match(html,/\/api\/editorial\/review/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|document\.cookie|eval\(/);
});
test("dashboard never interpolates source text as HTML",()=>{
 assert.match(html,/el\.textContent=String/);
 assert.doesNotMatch(html,/innerHTML|insertAdjacentHTML|document\.write/);
 assert.match(html,/noopener noreferrer/);
});
test("write form remains disabled until authenticated session enables writes",()=>{
 assert.match(html,/id="save" type="submit" disabled/);
 assert.match(html,/canWrite=session\.writes_enabled===true/);
});
test("review requests include server-version concurrency and reason",()=>{
 assert.match(html,/version:item\.version,action,reason/);
});

test("image controls are gated by authenticated session and pending status",()=>{
 assert.match(html,/canUpload=session\.image_writes_enabled===true/);
 assert.match(html,/canUpload && item\.status==="pending" && !item\.image_key/);
 assert.match(html,/X-Rights-Evidence-Id/);
 assert.match(html,/image\.size>2097152/);
});
test("review lifecycle and audit history are available to owner",()=>{
 assert.match(html,/\["retract","वापस लें"\]/);
 assert.match(html,/\["correct","सुधार हेतु लौटाएँ"\]/);
 assert.match(html,/\/api\/editorial\/history\?item_id=/);
});
