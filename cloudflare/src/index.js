import {readApprovedFeed} from "./approved-feed-store.js";
import {readApprovedPage} from "./feed-pagination.js";
import {handleEditorial} from "./editorial-api.js";

// Non-deployed scaffold. Authenticated session check only; no publishing or writes.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/api/news" || url.pathname === "/api/news/page")) {
      if (env.NEWS_PUBLISHING_ENABLED !== "true" || !env.NEWS_DB)
        return new Response(JSON.stringify({error:"not_available"}),{
          status:503,headers:{"content-type":"application/json; charset=utf-8",
            "cache-control":"no-store","x-content-type-options":"nosniff"}});
      const paginated=url.pathname === "/api/news/page";
      const allowed=new Set(paginated?["limit","category","district","cursor"]:["limit","category","district"]);
      if ([...url.searchParams.keys()].some(key=>!allowed.has(key)) ||
          [...allowed].some(key=>url.searchParams.getAll(key).length>1))
        return new Response(JSON.stringify({error:"invalid_query"}),{status:400});
      try {
        const rawLimit=url.searchParams.get("limit");
        if(rawLimit!==null&&!/^[1-9][0-9]*$/.test(rawLimit))throw Error("invalid_limit");
        const items=await (paginated?readApprovedPage:readApprovedFeed)(env.NEWS_DB,{
          limit:rawLimit===null?20:Number(rawLimit),
          category:url.searchParams.get("category"),
          district:url.searchParams.get("district"),
          ...(paginated?{cursor:url.searchParams.get("cursor")}: {})
        });
        return new Response(JSON.stringify(items),{status:200,
          headers:{"content-type":"application/json; charset=utf-8",
            "cache-control":"public, max-age=60","x-content-type-options":"nosniff"}});
      } catch {
        return new Response(JSON.stringify({error:"invalid_or_unavailable"}),{
          status:400,headers:{"cache-control":"no-store"}});
      }
    }
    if (url.pathname.startsWith("/api/editorial/")) {
      return handleEditorial(request, env);
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({
        service: "bhumi-mitra-news",
        status: "scaffold",
        publishing_enabled: false,
        collection_enabled: false
      }), {
        status: 200,
        headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}
      });
    }
    return new Response(JSON.stringify({error: "not_available"}), {
      status: 404,
      headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"}
    });
  }
};
