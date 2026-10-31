import {evaluateReviewAction} from "./review-policy.js";

const STATUSES = new Set(["pending","approved","rejected"]);
const CATEGORIES = new Set(["survey","circular","policy","service","incident","other"]);
const fields = ["id","headline_hi","summary_hi","source_name","source_url",
  "source_publication_date","category","district","created_at","updated_at"];

function validateDraft(draft) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) throw Error("invalid_draft");
  for (const field of fields) {
    if (typeof draft[field] !== "string" || !draft[field].trim()) {
      if (field === "district" && draft[field] === "") continue;
      throw Error("invalid_" + field);
    }
  }
  if (draft.headline_hi.length > 160 || draft.summary_hi.length > 1000 ||
      !CATEGORIES.has(draft.category)) throw Error("invalid_draft_fields");
  const url = new URL(draft.source_url);
  if (url.protocol !== "https:" || url.username || url.password ||
      !url.hostname || url.hash) throw Error("invalid_source_url");
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
  if (!id || !Number.isSafeInteger(version) || version < 1 ||
      typeof now !== "string" || !now ||
      typeof reason !== "string") throw Error("invalid_review_input");
  const item = await db.prepare(`SELECT id,status,version,source_verified,
    rights_checked,retracted,image_key FROM editorial_items WHERE id=?`).bind(id).first();
  if (!item) throw Error("not_found");
  if (item.version !== version) throw Error("version_conflict");
  const result = evaluateReviewAction({
    ...item, source_verified:item.source_verified === 1,
    rights_checked:item.rights_checked === 1,
    retracted:item.retracted === 1,
    // Images are not yet enabled; fail closed until image-rights evidence is integrated.
    image_rights_checked:false
  },action,true);
  if (!result.ok) throw Error(result.error);
  const eventId = crypto.randomUUID();
  const next = result.nextStatus;
  const updates = db.prepare(`UPDATE editorial_items SET status=?,retracted=?,
    version=version+1,updated_at=?,last_review_event_id=? WHERE id=? AND version=? AND status=?`)
    .bind(next,result.retracted?1:0,now,eventId,id,version,item.status);
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
