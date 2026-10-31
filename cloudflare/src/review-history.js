// Private owner-only audit history adapter. Do not expose via public news route.
export async function listReviewHistory(db,{itemId,limit=30}={}) {
 if(!db?.prepare)throw Error("db_required");
 if(typeof itemId!=="string"||!/^[A-Za-z0-9_-]{1,100}$/.test(itemId))
  throw Error("invalid_item_id");
 if(!Number.isSafeInteger(limit)||limit<1||limit>50)throw Error("invalid_limit");
 const result=await db.prepare(`SELECT id,item_id,action,reviewer_id,reason,occurred_at
 FROM review_events WHERE item_id=? ORDER BY occurred_at DESC,id DESC LIMIT ?`)
 .bind(itemId,limit).all();
 return result.results||[];
}
