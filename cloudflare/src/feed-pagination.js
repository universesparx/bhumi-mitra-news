import {normalizeFeedOptions} from "./approved-feed-store.js";

const MAX_PAGE_SIZE=50;
const SELECT_COLUMNS="id,headline_hi,summary_hi,source_name,source_url,source_publication_date,category,district,updated_at";
export function validateCursor(cursor) {
 if(cursor===null||cursor===undefined)return null;
 if(typeof cursor!=="string"||cursor.length>250||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}\|[A-Za-z0-9_-]{1,100}$/.test(cursor))
  throw Error("invalid_cursor");
 return cursor;
}
export async function readApprovedPage(db,{limit=20,category=null,district=null,cursor=null}={}) {
 const opts=normalizeFeedOptions({limit,category,district});
 validateCursor(cursor);
 if(!db?.prepare)throw Error("db_required");
 const clauses=["status='approved'","retracted=0","source_verified=1","rights_checked=1","EXISTS (SELECT 1 FROM rights_evidence e WHERE e.item_id=editorial_items.id AND length(trim(e.permission_reference))>0 AND length(trim(e.permission_scope))>0)"];
 const args=[];
 if(opts.category!==null){clauses.push("category=?");args.push(opts.category);}
 if(opts.district!==null){clauses.push("district=?");args.push(opts.district);}
 if(cursor!==null){
  const [date,id]=cursor.split("|");
  clauses.push("(source_publication_date < ? OR (source_publication_date = ? AND id < ?))");
  args.push(date,date,id);
 }
 const sql=`SELECT ${SELECT_COLUMNS} FROM editorial_items
 WHERE ${clauses.join(" AND ")}
 ORDER BY source_publication_date DESC,id DESC LIMIT ?`;
 const result=await db.prepare(sql).bind(...args,Math.min(opts.limit+1,MAX_PAGE_SIZE+1)).all();
 const rows=(result.results||[]).slice(0,opts.limit+1);
 const hasMore=rows.length>opts.limit;
 const items=rows.slice(0,opts.limit).map(row=>Object.fromEntries(
  SELECT_COLUMNS.split(",").map(key=>[key,row[key]])));
 const last=items.at(-1);
 return {items,next_cursor:hasMore&&last?
  last.source_publication_date+"|"+last.id:null};
}
