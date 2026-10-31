// Read-only feed projection. No HTTP route is enabled and no publishing occurs.
const CATEGORIES = new Set(["survey","circular","policy","service","incident","other"]);
export function normalizeFeedOptions({limit=20,category=null,district=null}={}) {
 if (!Number.isSafeInteger(limit) || limit<1 || limit>50) throw Error("invalid_limit");
 if (category!==null && !CATEGORIES.has(category)) throw Error("invalid_category");
 if (district!==null && (typeof district!=="string" || !district.trim() ||
     district.length>120 || /[\u0000-\u001f\u007f]/u.test(district)))
   throw Error("invalid_district");
 return {limit,category,district};
}
export function projectApprovedItem(item) {
 if (!item || item.status!=="approved" || item.retracted!==0 ||
     item.source_verified!==1 || item.rights_checked!==1) return null;
 return Object.fromEntries(["id","headline_hi","summary_hi","source_name",
   "source_url","source_publication_date","category","district","updated_at"]
   .map(key=>[key,item[key]]));
}
export async function readApprovedFeed(db, options={}) {
 const {limit,category,district}=normalizeFeedOptions(options);
 if (!db?.prepare) throw Error("db_required");
 const clauses=["status='approved'","retracted=0","source_verified=1","rights_checked=1"];
 const params=[];
 if (category!==null) {clauses.push("category=?");params.push(category);}
 if (district!==null) {clauses.push("district=?");params.push(district);}
 const sql=`SELECT id,headline_hi,summary_hi,source_name,source_url,
 source_publication_date,category,district,updated_at,status,retracted,
 source_verified,rights_checked FROM editorial_items
 WHERE ${clauses.join(" AND ")}
 ORDER BY source_publication_date DESC, updated_at DESC, id DESC LIMIT ?`;
 const result=await db.prepare(sql).bind(...params,limit).all();
 return (result.results||[]).map(projectApprovedItem).filter(Boolean);
}
