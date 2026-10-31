import {storeEditorialImage} from "./editorial-image-store.js";
import {listReviewHistory} from "./review-history.js";
import {listEditorialDrafts,validateEditorialListOptions} from "./editorial-list.js";
import {requireOwner} from "./auth.js";
import {verifyAccessJwt} from "./verify-access-jwt.js";
import {createDraft, reviewDraft} from "./editorial-store.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status, headers: {"content-type": "application/json; charset=utf-8",
      "cache-control": "no-store", "x-content-type-options": "nosniff"}
  });
}
const route = (path, method) => {
  if (path === "/api/editorial/session" && method === "GET") return "session";
  if (path === "/api/editorial/drafts" && method === "GET") return "list";
  if (path === "/api/editorial/history" && method === "GET") return "history";
  if (path === "/api/editorial/drafts" && method === "POST") return "create";
  if (path === "/api/editorial/review" && method === "POST") return "review";
  if (path === "/api/editorial/image" && method === "POST") return "image";
  return null;
};
function sameOrigin(request, env) {
  // An explicit trusted editorial origin is mandatory before writes can work.
  // Do not infer trust from a spoofable Host header or a forwarded URL.
  if (typeof env.EDITORIAL_ORIGIN !== "string") return false;
  let trusted;
  try {
    trusted = new URL(env.EDITORIAL_ORIGIN);
    if (trusted.protocol !== "https:" || trusted.username || trusted.password ||
        trusted.search || trusted.hash || trusted.pathname !== "/") return false;
  } catch { return false; }
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null" || origin !== trusted.origin) return false;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin") return false;
  return true;
}
async function readJson(request) {
  if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
    throw Error("json_required");
  const length = Number(request.headers.get("content-length"));
  if (request.headers.has("content-length") &&
      (!Number.isSafeInteger(length) || length < 0 || length > 16384))
    throw Error("body_too_large");
  if (!request.body) throw Error("invalid_json");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw Error("body_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const raw = new TextDecoder("utf-8", {fatal:true}).decode(bytes);
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("invalid_json");
  return value;
}
/** Authenticated editorial prototype. Writes are separately disabled by default.
 * Does not implement source rights verification, publishing or image uploads.
 */
export async function handleEditorial(request, env, verifier = verifyAccessJwt) {
  const action = route(new URL(request.url).pathname, request.method);
  if (!action) return json({error:"not_found"},404);
  const access = await requireOwner(request, env, verifier);
  if (!access.ok) return json({error:access.error},access.status);
  if (action === "session")
    return json({authenticated:true,role:"owner",publishing_enabled:false,
      writes_enabled:env.EDITORIAL_WRITES_ENABLED === "true" &&
      typeof env.EDITORIAL_ORIGIN === "string" && Boolean(env.NEWS_DB)},200);
  if (action === "history") {
    if (!env.NEWS_DB) return json({error:"database_unavailable"},503);
    const url=new URL(request.url);
    if ([...url.searchParams.keys()].some(key=>!["item_id","limit"].includes(key)) ||
        ["item_id","limit"].some(key=>url.searchParams.getAll(key).length>1))
      return json({error:"invalid_query"},400);
    const rawLimit=url.searchParams.get("limit");
    if (rawLimit!==null&&!/^[1-9][0-9]*$/.test(rawLimit))
      return json({error:"invalid_query"},400);
    const itemId=url.searchParams.get("item_id"),limit=rawLimit===null?30:Number(rawLimit);
    if(!itemId||!/^[A-Za-z0-9_-]{1,100}$/.test(itemId)||!Number.isSafeInteger(limit)||limit<1||limit>50)
      return json({error:"invalid_query"},400);
    try {
      const events=await listReviewHistory(env.NEWS_DB,{itemId,limit});
      return json({events},200);
    }catch{return json({error:"database_unavailable"},503);}
  }
  if (action === "list") {
    if (!env.NEWS_DB) return json({error:"database_unavailable"},503);
    const url = new URL(request.url);
    if ([...url.searchParams.keys()].some(key=>!["status","limit"].includes(key)) ||
        ["status","limit"].some(key=>url.searchParams.getAll(key).length>1))
      return json({error:"invalid_query"},400);
    const rawLimit=url.searchParams.get("limit");
    if (rawLimit!==null && !/^[1-9][0-9]*$/.test(rawLimit))
      return json({error:"invalid_query"},400);
    let options;
    try { options=validateEditorialListOptions({
      status:url.searchParams.get("status") || "pending",
      limit:rawLimit===null?30:Number(rawLimit)});
    } catch {return json({error:"invalid_query"},400);}
    try {
      const items=await listEditorialDrafts(env.NEWS_DB,options);
      return json({items},200);
    } catch {return json({error:"database_unavailable"},503);}
  }
  if (env.EDITORIAL_WRITES_ENABLED !== "true" || !env.NEWS_DB)
    return json({error:"editorial_writes_disabled"},503);
  if (!sameOrigin(request, env)) return json({error:"origin_denied"},403);
  if (action === "image") {
    if (env.EDITORIAL_IMAGE_WRITES_ENABLED !== "true" || !env.NEWS_IMAGES)
      return json({error:"image_writes_disabled"},503);
    const itemId=request.headers.get("X-Editorial-Item-Id");
    const evidenceId=request.headers.get("X-Rights-Evidence-Id");
    try {
      const result=await storeEditorialImage({db:env.NEWS_DB,bucket:env.NEWS_IMAGES,
        request,itemId,evidenceId,ownerId:access.subject});
      return json(result,201);
    }catch(error){
      const conflict=error.message==="image_attachment_conflict";
      const unavailable=["storage_unavailable","image_cleanup_failed","image_storage_failed"].includes(error.message);
      const denied=["rights_evidence_missing","owner_required"].includes(error.message);
      return json({error:unavailable?"storage_unavailable":conflict?"conflict":denied?"rights_not_verified":"invalid_image"},
        unavailable?503:conflict?409:denied?403:400);
    }
  }
  let body;
  try { body = await readJson(request); }
  catch { return json({error:"invalid_request"},400); }
  try {
    if (action === "create") {
      // The server, not the browser, sets identity, timestamps and draft ID.
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const draft = {
        id, headline_hi:body.headline_hi,summary_hi:body.summary_hi,
        source_name:body.source_name,source_url:body.source_url,
        source_publication_date:body.source_publication_date,
        category:body.category,district:body.district || "",
        created_at:now,updated_at:now
      };
      await createDraft(env.NEWS_DB,draft,access.subject);
      return json({id,status:"pending"},201);
    }
    // Rights flags cannot be set via this API. Approvals remain blocked until
    // separately verified source and rights evidence is recorded server-side.
    const result = await reviewDraft(env.NEWS_DB,{
      id:body.id,action:body.action,version:body.version,
      reason:body.reason || "",reviewerId:access.subject,
      now:new Date().toISOString()
    });
    return json(result,200);
  } catch (error) {
    const conflict = ["version_conflict","review_conflict"].includes(error.message);
    const missing = error.message === "not_found";
    const duplicate = /UNIQUE constraint/i.test(error.message);
    return json({error: conflict || duplicate ? "conflict" :
      missing ? "not_found" : "invalid_or_unavailable"},
      conflict || duplicate ? 409 : missing ? 404 : 400);
  }
}
