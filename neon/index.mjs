// Sync endpoint for Claude Usage Tracker, deployed as a Neon Function.
// POST /rpc/<fn> with a JSON body runs one of the three tracker_* SQL
// functions and returns its result, like the old Supabase /rest/v1/rpc calls.
// Data is end-to-end encrypted on the device; this only ever sees ciphertext.
// No dependencies: queries go over Neon's SQL-over-HTTP endpoint.
const DB = process.env.DATABASE_URL;
const SQL_URL = process.env.SQL_URL || "https://" + new URL(DB).hostname.replace(/^[^.]+\./, "api.") + "/sql";

const ORIGINS = new Set(["https://zstoimenov.github.io"]);
const MAX_BODY = 300 * 1024;
const CALLS = {
  tracker_pull:   { query: "select public.tracker_pull($1)::text as r",         params: b => [b.p_code] },
  tracker_push:   { query: "select public.tracker_push($1, $2, $3)::text as r", params: b => [b.p_code, JSON.stringify(b.p_data), String(b.p_rev)] },
  tracker_revoke: { query: "select public.tracker_revoke($1)::text as r",       params: b => [b.p_code] },
};

async function run(query, params) {
  const r = await fetch(SQL_URL, {
    method: "POST",
    headers: { "Neon-Connection-String": DB, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true", "content-type": "application/json" },
    body: JSON.stringify({ query, params }),
  });
  if (r.status === 400) { const e = await r.json(); throw Object.assign(new Error(e.message), { code: e.code }); }
  if (!r.ok) throw new Error("database " + r.status);
  const v = (await r.json()).rows?.[0]?.[0];
  return v == null ? null : JSON.parse(v);
}

function cors(req) {
  const o = req.headers.get("origin");
  return ORIGINS.has(o)
    ? { "access-control-allow-origin": o, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", "access-control-max-age": "86400", vary: "origin" }
    : { vary: "origin" };
}
const json = (status, body, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(req) {
    const h = cors(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    const fn = new URL(req.url).pathname.match(/^\/rpc\/(\w+)$/)?.[1];
    const call = fn && Object.hasOwn(CALLS, fn) ? CALLS[fn] : null;
    if (req.method !== "POST" || !call) return json(404, { message: "not found" }, h);
    const text = await req.text();
    if (text.length > MAX_BODY) return json(413, { message: "payload too large" }, h);
    let body;
    try { body = JSON.parse(text); } catch { return json(400, { message: "bad json" }, h); }
    if (!body || typeof body !== "object" || typeof body.p_code !== "string") return json(400, { message: "bad request" }, h);
    if (fn === "tracker_push" && !Number.isInteger(body.p_rev)) return json(400, { message: "bad request" }, h);
    try {
      return json(200, await run(call.query, call.params(body)), h);
    } catch (e) {
      // P0001: raised by the SQL checks (bad code, too large, not encrypted, row cap)
      return json(e.code === "P0001" ? 400 : 502, { message: e.code === "P0001" ? e.message : "request failed" }, h);
    }
  },
};
