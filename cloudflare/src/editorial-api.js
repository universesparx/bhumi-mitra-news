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
  if (path === "/api/editorial/drafts" && method === "POST") return "create";
  if (path === "/api/editorial/review" && method === "POST") return "review";
  return null;
};
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false; // fail closed for browser-style mutation requests
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}
async function readJson(request) {
  if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
    throw Error("json_required");
  const length = Number(request.headers.get("content-length"));
  if (request.headers.has("content-length") &&
      (!Number.isSafeInteger(length) || length < 0 || length > 16384))
    throw Error("body_too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 16384) throw Error("body_too_large");
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
      writes_enabled:env.EDITORIAL_WRITES_ENABLED === "true"},200);
  if (env.EDITORIAL_WRITES_ENABLED !== "true" || !env.NEWS_DB)
    return json({error:"editorial_writes_disabled"},503);
  if (!sameOrigin(request)) return json({error:"origin_denied"},403);
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
