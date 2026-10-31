import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {reviewDraft} from "../src/editorial-store.js";
globalThis.crypto ??= webcrypto;
const valid={id:"item-1",action:"approve",version:1,reviewerId:"owner-1",
 reason:"source checked",now:"2026-10-31T10:00:00.000Z"};
const db=()=>({prepare(){throw Error("database_should_not_be_accessed")}});
for(const [name,patch] of [
 ["missing ID",{id:""}],
 ["oversized ID",{id:"x".repeat(101)}],
 ["SQL-like ID",{id:"a';DROP"}],
 ["invalid action",{action:"publish"}],
 ["noninteger version",{version:1.5}],
 ["zero version",{version:0}],
 ["oversized reason",{reason:"x".repeat(1001)}],
 ["control-character reason",{reason:"a\u0000b"}],
 ["invalid timestamp",{now:"not-a-date"}],
 ["empty rejection reason",{action:"reject",reason:" "}],
 ["empty retraction reason",{action:"retract",reason:""}]
]) {
 test("rejects "+name+" before querying D1",async()=>{
  await assert.rejects(reviewDraft(db(),{...valid,...patch}),/invalid_review_input/);
 });
}
