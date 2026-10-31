// Deliberately non-production Cloudflare Worker scaffold.
// No database, object storage, authentication, or publishing endpoints.
export default {
  async fetch(request) {
    const url = new URL(request.url);
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
