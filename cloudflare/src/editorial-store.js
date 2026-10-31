import {evaluateReviewAction} from "./review-policy.js";

const CATEGORIES = new Set(["survey","circular","policy","service","incident","other"]);
const fields = ["id","headline_hi","summary_hi","source_name","source_url",
  "source_publication_date","category","district","created_at","updated_at"];

export function validateDraft(draft) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) throw Error("invalid_draft");
  for (const field of fields) {
    if (typeof draft[field] !== "string" || !draft[field].trim()) {
      if (field === "district" && draft[field] === "") continue;
      throw Error("invalid_" + field);
    }
  }
  for (const [key,max] of Object.entries({headline_hi:160,summary_hi:1000,
    source_name:180,source_url:2048,district:120})) {
    if (draft[key].length > max || /[\u0000-\u001f\u007f]/u.test(draft[key]))
      throw Error("invalid_" + key);
  }
  if (!CATEGORIES.has(draft.category)) throw Error("invalid_category");
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(draft.source_publication_date))
    throw Error("invalid_source_date");
  const parsedDate = new Date(draft.source_publication_date+"T00:00:00Z");
  if (!Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0,10) !== draft.source_publication_date ||
      parsedDate.getTime() > Date.now()+86400000)
    throw Error("invalid_source_date");
  let url;
  try { url = new URL(draft.source_url); }
  catch { throw Error("invalid_source_url"); }
  if (url.protocol !== "https:" || url.username || url.password ||
      !url.hostname || url.hash || !url.hostname.includes(".") ||
      url.port && url.port !== "443") throw Error("invalid_source_url");
  if (draft.status !== undefined && draft.status !== "pending") throw Error("status_must_be_pending");
  return {...draft, source_url: url.href};
}

/** D1-only storage adapter. Caller must authenticate and authorize first.
 * No publishing, collection, or network requests.
 */
export async function createDraft(db, draft, reviewerId) {
  const d = validateDraft(draft);
  if (!reviewerId) throw Error("owner_required");
  const eventId = crypto.randomUUID();
  return db.batch([
    db.prepare(`INSERT INTO editorial_items
      (id,headline_hi,summary_hi,source_name,source_url,source_publication_date,
       category,district,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(...fields.map(k => d[k])),
    db.prepare(`INSERT INTO review_events
      (id,item_id,action,reviewer_id,occurred_at)
      VALUES (?,?,'create',?,?)`).bind(eventId,d.id,reviewerId,d.created_at)
  ]);
}

/** Review is an optimistic-concurrency guarded, atomic D1 batch.
 * Caller must be an authenticated owner. This does not publish an article.
 */
export async function reviewDraft(db, {id, action, version, reviewerId, reason, now}) {
  if (!reviewerId) throw Error("owner_required");
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
      !Number.isSafeInteger(version) || version < 1 ||
      !new Set(["approve","reject","correct","retract"]).has(action) ||
      typeof now !== "string" || !Number.isFinite(Date.parse(now)) ||
      typeof reason !== "string" || reason.length > 1000 ||
      /[\u0000-\u001f\u007f]/u.test(reason) ||
      (action === "reject" || action === "retract") && !reason.trim())
    throw Error("invalid_review_input");
  const item = await db.prepare(`SELECT id,status,version,source_verified,
    rights_checked,retracted,image_key FROM editorial_items WHERE id=?`).bind(id).first();
  if (!item) throw Error("not_found");
  if (item.version !== version) throw Error("version_conflict");
  let rightsEvidencePresent = false;
  let imageRightsPresent = false;
  if (action === "approve") {
    const evidence = await db.prepare(`SELECT
      EXISTS (SELECT 1 FROM rights_evidence WHERE item_id=? AND length(trim(permission_reference))>0 AND length(trim(permission_scope))>0) AS source_rights,
      EXISTS (SELECT 1 FROM rights_evidence WHERE item_id=? AND length(trim(permission_reference))>0 AND lower(permission_scope) LIKE '%image%') AS image_rights`).bind(id,id).first();
    rightsEvidencePresent = evidence?.source_rights === 1;
    imageRightsPresent = evidence?.image_rights === 1;
  }
  const result = evaluateReviewAction({
    ...item, source_verified:item.source_verified === 1,
    rights_checked:item.rights_checked === 1,
    retracted:item.retracted === 1,
    image_rights_checked:imageRightsPresent
  },action,true);
  if (!result.ok) throw Error(result.error);
  if (action === "approve" && !rightsEvidencePresent) throw Error("rights_evidence_missing");
  const eventId = crypto.randomUUID();
  const next = result.nextStatus;
  const updates = db.prepare(`UPDATE editorial_items SET status=?,retracted=?,
    version=version+1,updated_at=?,last_review_event_id=? WHERE id=? AND version=? AND status=?
    AND (? != 'approve' OR (source_verified=1 AND rights_checked=1 AND retracted=0
      AND EXISTS (SELECT 1 FROM rights_evidence WHERE item_id=editorial_items.id AND length(trim(permission_reference))>0 AND length(trim(permission_scope))>0)
      AND (image_key IS NULL OR EXISTS (SELECT 1 FROM rights_evidence WHERE item_id=editorial_items.id AND lower(permission_scope) LIKE '%image%' AND length(trim(permission_reference))>0))))`)
    .bind(next,result.retracted?1:0,now,eventId,id,version,item.status,action);
  const audit = db.prepare(`INSERT INTO review_events
    (id,item_id,action,reviewer_id,reason,occurred_at)
    SELECT ?,id,?,?,?,? FROM editorial_items
    WHERE id=? AND version=? AND status=? AND last_review_event_id=?`)
    .bind(eventId,action,reviewerId,reason,now,id,version+1,next,eventId);
  // Audit SELECT only inserts when the guarded update actually changed the item.
  // D1 batch executes statements in order; inspect both row counts before success.
  const responses = await db.batch([updates,audit]);
  if (responses[0]?.meta?.changes !== 1 || responses[1]?.meta?.changes !== 1)
    throw Error("review_conflict");
  return {id,status:next,version:version+1};
}
