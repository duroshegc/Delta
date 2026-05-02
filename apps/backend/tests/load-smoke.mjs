const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
const concurrency = Number(process.env.LOAD_CONCURRENCY || 10);
const requests = Number(process.env.LOAD_REQUESTS || 100);

const startedAt = Date.now();
let ok = 0;
let failed = 0;

await Promise.all(
  Array.from({ length: concurrency }, async (_, worker) => {
    for (let i = worker; i < requests; i += concurrency) {
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) ok += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
  }),
);

const durationMs = Date.now() - startedAt;
console.log(
  JSON.stringify(
    {
      baseUrl,
      requests,
      concurrency,
      ok,
      failed,
      durationMs,
      requestsPerSecond: Math.round((requests / durationMs) * 1000),
    },
    null,
    2,
  ),
);

if (failed > 0) process.exit(1);

