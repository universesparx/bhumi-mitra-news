// Owner-only draft listing. Never route this function to a public endpoint.
const ALLOWED=new Set(["pending","approved","rejected"]);
export function validateEditorialListOptions({status="pending",limit=30}={}) {
 if(!ALLOWED.has(status))throw Error("invalid_status");
 if(!Number.isSafeInteger(limit)||limit<1||limit>50)throw Error("invalid_limit");
 return {status,limit};
}
export async function listEditorialDrafts(db,options={}) {
 const {status,limit}=validateEditorialListOptions(options);
 if(!db?.prepare)throw Error("db_required");
 const result=await db.prepare(`SELECT id,headline_hi,summary_hi,source_name,source_url,
 source_publication_date,category,district,status,source_verified,rights_checked,
 retracted,image_key,version,created_at,updated_at
 FROM editorial_items WHERE status=? ORDER BY updated_at DESC,id DESC LIMIT ?`)
 .bind(status,limit).all();
 return result.results||[];
}
