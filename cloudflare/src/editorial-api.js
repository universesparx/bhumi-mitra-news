import {requireOwner} from "./auth.js";
import {verifyAccessJwt} from "./verify-access-jwt.js";

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status, headers: {"content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"}
  });
}

/** No persistent writes or publication. Authenticated endpoint is diagnostic only. */
export async function handleEditorial(request, env, verifier = verifyAccessJwt) {
  const path = new URL(request.url).pathname;
  if (path !== "/api/editorial/session" || request.method !== "GET") {
    return json({error: "not_found"}, 404);
  }
  const access = await requireOwner(request, env, verifier);
  if (!access.ok) return json({error: access.error}, access.status);
  return json({authenticated: true, role: "owner", publishing_enabled: false}, 200);
}
