/**
 * HTTP-level smoke test against an already-running local server.
 * Catches middleware / error-handler regressions that unit tests miss.
 *
 * Usage (from apps/backend):
 *   bun run dev          # in another terminal
 *   bun tests/local-http-smoke.mjs
 *   API_BASE_URL=http://localhost:3000 bun tests/local-http-smoke.mjs
 */

const baseUrl = (process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const cases = [
  { name: "health is ok",                 method: "GET",  path: "/health",            expect: 200 },
  { name: "root info",                    method: "GET",  path: "/",                  expect: 200 },
  { name: "swagger json",                 method: "GET",  path: "/swagger/json",      expect: 200 },
  { name: "unknown route -> 404",         method: "GET",  path: "/__nope__",          expect: 404 },
  { name: "users/me without token -> 401", method: "GET", path: "/users/me",          expect: 401 },
  { name: "auth/signout no token -> 401", method: "POST", path: "/auth/signout",      expect: 401 },
  { name: "profiles/me no token -> 401",  method: "GET",  path: "/profiles/me",       expect: 401 },
  { name: "discovery/feed no token -> 401", method: "GET", path: "/discovery/feed",   expect: 401 },
  { name: "wallet no token -> 401",       method: "GET",  path: "/wallet/",           expect: 401 },
];

async function run() {
  const failures = [];
  for (const c of cases) {
    const init = { method: c.method };
    if (c.method !== "GET" && c.method !== "HEAD") {
      init.headers = { "Content-Type": "application/json" };
      init.body = "{}";
    }
    let status;
    try {
      const res = await fetch(`${baseUrl}${c.path}`, init);
      status = res.status;
    } catch (err) {
      failures.push({ ...c, error: err instanceof Error ? err.message : String(err) });
      console.log(`✗ ${c.name} — fetch error: ${err}`);
      continue;
    }
    if (status === c.expect) {
      console.log(`✓ ${c.name} (${status})`);
    } else {
      failures.push({ ...c, got: status });
      console.log(`✗ ${c.name} — expected ${c.expect}, got ${status}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s):`, failures);
    process.exit(1);
  }
  console.log(`\nAll ${cases.length} checks passed against ${baseUrl}`);
}

await run();
