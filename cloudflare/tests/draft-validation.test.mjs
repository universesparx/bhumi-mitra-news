import test from "node:test";
import assert from "node:assert/strict";
import {validateDraft} from "../src/editorial-store.js";
const base={id:"draft-1",headline_hi:"शीर्षक",summary_hi:"विवरण",
 source_name:"Bihar Government",source_url:"https://example.org/news",
 source_publication_date:"2026-10-30",category:"circular",district:"",
 created_at:"2026-10-31",updated_at:"2026-10-31"};
const invalid=(patch)=>assert.throws(()=>validateDraft({...base,...patch}));
test("accepts valid manual draft",()=>assert.equal(validateDraft(base).category,"circular"));
test("rejects nonexistent calendar date",()=>invalid({source_publication_date:"2026-02-30"}));
test("rejects future source date",()=>invalid({source_publication_date:"2099-01-01"}));
test("rejects malformed date",()=>invalid({source_publication_date:"2026-2-1"}));
test("rejects oversized headline",()=>invalid({headline_hi:"x".repeat(161)}));
test("rejects oversized summary",()=>invalid({summary_hi:"x".repeat(1001)}));
test("rejects oversized source name",()=>invalid({source_name:"x".repeat(181)}));
test("rejects oversized URL",()=>invalid({source_url:"https://example.org/"+"x".repeat(2100)}));
test("rejects control characters",()=>invalid({headline_hi:"a\u0000b"}));
test("rejects URL credentials",()=>invalid({source_url:"https://a:b@example.org/news"}));
test("rejects URL fragment",()=>invalid({source_url:"https://example.org/news#section"}));
test("rejects nonstandard URL port",()=>invalid({source_url:"https://example.org:8443/news"}));
test("rejects malformed URL",()=>invalid({source_url:"not a url"}));
test("rejects invalid category",()=>invalid({category:"other; DROP TABLE"}));
