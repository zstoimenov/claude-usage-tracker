// Local stand-in for Neon's /sql endpoint, backed by a local Postgres.
// Mirrors the driver's protocol: text output, array mode, 400 with {message, code}.
import { createServer } from "node:http";
import pg from "pg";
export async function startSqlMock(conn) {
  const pool = new pg.Pool({ connectionString: conn, max: 2 });
  const seen = [];
  const server = createServer(async (req, res) => {
    let b = ""; for await (const c of req) b += c;
    seen.push({ path: req.url, headers: req.headers });
    const { query, params } = JSON.parse(b);
    try {
      const r = await pool.query({ text: query, values: params, rowMode: "array", types: { getTypeParser: () => v => v } });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ fields: r.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })), rows: r.rows }));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ message: e.message, code: e.code })); }
  });
  await new Promise(r => server.listen(0, "localhost", r));
  return { url: `http://localhost:${server.address().port}/sql`, seen, close: async () => { server.close(); await pool.end(); } };
}
