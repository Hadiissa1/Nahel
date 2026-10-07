// Load test: N visitors at the same time, browsing the shop for a while.
//   npm run check:load -- [connections=100] [seconds=30]
//   BASE_URL=https://nahel.com npm run check:load -- 100 30
// Each "connection" requests pages non-stop, so it weighs far more than one
// real visitor (people pause between pages).
import autocannon from "autocannon";

const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const connections = Number(process.argv[2] ?? 100);
const duration = Number(process.argv[3] ?? 30);
const paths = ["/", "/product/oak", "/product/sidr-egy", "/blog", "/blog/how-to-store-honey", "/lot", "/product/clover", "/sitemap.xml"];

console.log(`${connections} visitors at once on ${base} for ${duration} s…`);
const r = await autocannon({ url: base, connections, duration, timeout: 20, requests: paths.map((path) => ({ method: "GET", path })) });
const failed = r.non2xx + r.errors;
console.log(`
Pages served : ${r.requests.total} (${Math.round(r.requests.average)} per second)
Successful   : ${r["2xx"]}   Failed: ${failed} (timeouts: ${r.timeouts})
Response time: median ${r.latency.p50} ms, 90% under ${r.latency.p90} ms, 99% under ${r.latency.p99} ms
Result       : ${failed === 0 ? "OK — nothing failed" : `${((failed / (r.requests.total + failed)) * 100).toFixed(1)}% failed`}`);
process.exit(failed === 0 ? 0 : 1);
