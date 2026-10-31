// Explicitly opt-in local D1 verification. No remote commands or deployment.
import {spawnSync} from "node:child_process";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const scratch = mkdtempSync(join(tmpdir(), "bhumi-news-d1-"));
const dbName = "bhumi_news_local_test";
const config = join(scratch, "wrangler.jsonc");
const fixture = join(scratch, "checks.sql");
writeFileSync(config, JSON.stringify({
  name:"bhumi-news-local-d1-check",main:join(root,"src/index.js"),
  compatibility_date:"2026-10-31",workers_dev:false,
  d1_databases:[{binding:"NEWS_DB",database_name:dbName,database_id:"00000000-0000-4000-8000-000000000001"}]
}));
writeFileSync(fixture, `
PRAGMA foreign_keys=ON;
INSERT INTO editorial_items (id,headline_hi,summary_hi,source_name,source_url,
 source_publication_date,category,created_at,updated_at,source_verified,rights_checked)
VALUES ('local-a','Test','Summary','Synthetic','https://example.org/local-a',
 '2026-10-31','circular','now','now',1,1);
UPDATE editorial_items SET status='approved',version=version+1,
 last_review_event_id='review-1',updated_at='later'
 WHERE id='local-a' AND version=1 AND status='pending';
INSERT INTO review_events(id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'review-1',id,'approve','synthetic-owner','local test','later'
 FROM editorial_items WHERE id='local-a' AND version=2
 AND status='approved' AND last_review_event_id='review-1';
UPDATE editorial_items SET status='approved',version=version+1,
 last_review_event_id='review-stale',updated_at='later'
 WHERE id='local-a' AND version=1 AND status='pending';
INSERT INTO review_events(id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'review-stale',id,'approve','synthetic-owner','stale','later'
 FROM editorial_items WHERE id='local-a' AND version=2
 AND status='approved' AND last_review_event_id='review-stale';
INSERT INTO editorial_items (id,headline_hi,summary_hi,source_name,source_url,
 source_publication_date,category,created_at,updated_at)
VALUES ('local-b','Second test','Summary','Synthetic','https://example.org/local-b',
 '2026-10-31','survey','now','now');
INSERT INTO review_events(id,item_id,action,reviewer_id,occurred_at)
 VALUES ('create-b','local-b','create','synthetic-owner','now');
UPDATE editorial_items SET status='rejected',version=version+1,
 last_review_event_id='reject-b',updated_at='later'
 WHERE id='local-b' AND version=1 AND status='pending';
INSERT INTO review_events(id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'reject-b',id,'reject','synthetic-owner','needs verification','later'
 FROM editorial_items WHERE id='local-b' AND version=2
 AND status='rejected' AND last_review_event_id='reject-b';
UPDATE editorial_items SET status='pending',version=version+1,
 last_review_event_id='correct-b',updated_at='latest'
 WHERE id='local-b' AND version=2 AND status='rejected';
INSERT INTO review_events(id,item_id,action,reviewer_id,reason,occurred_at)
 SELECT 'correct-b',id,'correct','synthetic-owner','updated','latest'
 FROM editorial_items WHERE id='local-b' AND version=3
 AND status='pending' AND last_review_event_id='correct-b';
SELECT 'ASSERT_SECOND_ITEM' AS marker,status,version,last_review_event_id
 FROM editorial_items WHERE id='local-b';
SELECT 'ASSERT_SECOND_AUDIT' AS marker,count(*) AS count
 FROM review_events WHERE item_id='local-b';
SELECT 'ASSERT_ITEM' AS marker,status,version,last_review_event_id
 FROM editorial_items WHERE id='local-a';
SELECT 'ASSERT_AUDIT' AS marker,count(*) AS count FROM review_events;
`);
const run = (file) => {
  const result = spawnSync("npx", ["--no-install","wrangler","d1","execute",dbName,
    "--local","--config",config,"--persist-to",scratch,"--file",file,"--json"],{
    cwd:root,encoding:"utf8",timeout:90000
  });
  if (result.error || result.status !== 0) throw Error(
    "Local D1 command failed: "+(result.stderr||result.error||result.stdout));
  return result.stdout;
};
try {
  run(join(root,"migrations/0001_news_schema.sql"));
  const output=run(fixture);
  // Wrangler CLI JSON output is structured; require both expected query results.
  const parsed=JSON.parse(output.slice(output.indexOf("[")));
  const rows=parsed.flatMap(batch=>batch.results||[]);
  const item=rows.find(row=>row.marker==="ASSERT_ITEM");
  const audit=rows.find(row=>row.marker==="ASSERT_AUDIT");
  const second=rows.find(row=>row.marker==="ASSERT_SECOND_ITEM");
  const secondAudit=rows.find(row=>row.marker==="ASSERT_SECOND_AUDIT");
  if (!second || second.status!=="pending" || second.version!==3 ||
      second.last_review_event_id!=="correct-b" || !secondAudit ||
      secondAudit.count!==3) throw Error("Reject/correct D1 assertions failed");
  if (!item || item.status!=="approved" || item.version!==2 ||
      item.last_review_event_id!=="review-1" || !audit || audit.count!==4)
    throw Error("Local D1 assertions failed: "+JSON.stringify(rows));
  process.stdout.write("Local D1 migration, stale-approval, rejection and correction assertions passed.\n");
} finally {
  rmSync(scratch,{recursive:true,force:true});
}
