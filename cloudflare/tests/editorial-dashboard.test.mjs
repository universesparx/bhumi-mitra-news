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
 assert.match(html,/!session\.writes_enabled/);
});
test("review requests include server-version concurrency and reason",()=>{
 assert.match(html,/version:item\.version,action,reason/);
});
