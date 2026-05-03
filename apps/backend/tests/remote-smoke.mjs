/**
 * Probes every HTTP route declared in OpenAPI (/swagger/json) against API_BASE_URL.
 * Uses placeholder IDs for path params and minimal JSON bodies — expects no 404
 * and no hard gateway errors. 401/403/422/400 count as the route being mounted.
 *
 * If MongoDB (or other deps) are unavailable on the target, many routes return 503.
 * Set SMOKE_ALLOW_DEGRADED=1 to still exit 0 in that case (routes exist; service degraded).
 *
 * Usage (from apps/backend):
 *   bun run test:remote
 *   API_BASE_URL=http://localhost:3000 bun tests/remote-smoke.mjs
 *   SMOKE_ALLOW_DEGRADED=1 API_BASE_URL=https://backend-teal-one-10.vercel.app bun tests/remote-smoke.mjs
 */

const baseUrl = (process.env.API_BASE_URL || "https://backend-teal-one-10.vercel.app").replace(
  /\/$/,
  "",
);

const allowDegraded = process.env.SMOKE_ALLOW_DEGRADED === "1";
const concurrency = Math.max(1, Number(process.env.SMOKE_CONCURRENCY || 8));

const PLACEHOLDER_ID = "507f191e810c19729de860ea";

const METHODS = ["get", "post", "put", "patch", "delete"];

function resolvePath(template) {
  return template.replace(/\{[^}]+\}/g, PLACEHOLDER_ID);
}

async function probe(method, pathTemplate) {
  const path = resolvePath(pathTemplate);
  const url = `${baseUrl}${path}`;
  const upper = method.toUpperCase();
  /** @type {RequestInit} */
  const init = { method: upper };
  if (upper !== "GET" && upper !== "HEAD") {
    init.headers = { "Content-Type": "application/json" };
    init.body = "{}";
  }
  try {
    const res = await fetch(url, init);
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function mapPool(items, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

async function main() {
  const specRes = await fetch(`${baseUrl}/swagger/json`);
  if (!specRes.ok) {
    console.error(`Could not load OpenAPI from ${baseUrl}/swagger/json (${specRes.status})`);
    process.exit(1);
  }

  const spec = await specRes.json();
  const paths = spec.paths || {};

  const ops = [];
  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    for (const method of METHODS) {
      if (!pathItem[method]) continue;
      ops.push({ method, pathTemplate });
    }
  }

  const rows = await mapPool(ops, async ({ method, pathTemplate }) => {
    const result = await probe(method, pathTemplate);
    if (!result.ok) {
      return { method: method.toUpperCase(), path: pathTemplate, error: result.error };
    }
    return { method: method.toUpperCase(), path: pathTemplate, status: result.status };
  });

  const degraded = rows.filter((r) => r.status === 503);

  const fatal = rows.filter((r) => {
    if (r.error != null) return true;
    if (r.status === 404) return true;
    if (r.status != null && r.status >= 500 && r.status !== 503) return true;
    if (!allowDegraded && r.status === 503) return true;
    return false;
  });

  console.log(
    JSON.stringify(
      {
        baseUrl,
        allowDegraded,
        routesChecked: rows.length,
        degraded503Count: degraded.length,
        failures: fatal.length,
        results: rows,
      },
      null,
      2,
    ),
  );

  if (allowDegraded && degraded.length > 0) {
    console.error(
      `\nNote: ${degraded.length} route(s) returned 503 (service unavailable / degraded dependencies).`,
    );
  }

  if (fatal.length > 0) {
    console.error("\nRemote smoke failed for:", fatal);
    if (!allowDegraded && degraded.length > 0) {
      console.error(
        "\nHint: if MongoDB or other deps are down on this deployment, retry with SMOKE_ALLOW_DEGRADED=1",
      );
    }
    process.exit(1);
  }
}

await main();
