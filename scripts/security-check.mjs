// Quick security check of a running site (read-only by default).
//   npm run check:security
//   BASE_URL=https://nahel.com npm run check:security
// It never signs in and changes nothing on the site.
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const problems = [];
const ok = (c, msg) => { console.log((c ? "✔ " : "✘ ") + msg); if (!c) problems.push(msg); };
const get = (p, init = {}) => fetch(base + p, { redirect: "manual", ...init });

console.log(`Security check of ${base}\n`);
const r = await get("/");
const h = (k) => r.headers.get(k) ?? "";
ok(r.status === 200, "home page answers");
ok(h("content-security-policy").includes("default-src 'self'") && h("content-security-policy").includes("frame-ancestors 'none'"), "Content-Security-Policy");
ok(h("x-frame-options") === "DENY", "X-Frame-Options: DENY");
ok(h("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
ok(h("strict-transport-security").includes("max-age="), "HSTS (HTTPS only)");
ok(!r.headers.get("x-powered-by"), "no X-Powered-By");
if (base.startsWith("https://")) {
  const http = await fetch(base.replace("https://", "http://"), { redirect: "manual" }).catch(() => null);
  ok(!http || (http.status >= 300 && http.status < 400), "plain http:// redirects to https://");
}

const admin = ["/admin", "/admin/orders", "/admin/subscribers", "/admin/promotions", "/admin/team", "/admin/products/new"];
const open = [];
for (const p of admin) if (!(await (await get(p)).text()).includes("/admin/login")) open.push(p);
ok(open.length === 0, `admin pages require signing in (${open.join(", ") || "all closed"})`);
ok((await get("/admin/subscribers/export")).status === 401, "subscriber export requires signing in");
ok((await (await get("/admin/orders", { headers: { cookie: "nahel_admin=forged-0123456789abcdef" } })).text()).includes("/admin/login"), "a forged session cookie is refused");

const secret = ["/data/nahel.db", "/.env", "/.git/config", "/package.json", "/media/..%2Fnahel.db", "/docs/..%2Fnahel.db", "/media/%2e%2e%2f%2e%2e%2fetc%2fpasswd"];
const leaks = [];
for (const p of secret) {
  const res = await get(p);
  const body = Buffer.from(await res.arrayBuffer());
  if (res.status === 200 && (body.includes("SQLite format") || body.includes("root:") || body.includes("[core]") || body.includes('"dependencies"') || body.includes("ADMIN_PASSWORD"))) leaks.push(p);
}
ok(leaks.length === 0, `server files are never served (${leaks.join(", ") || "none"})`);

const inj = ["/product/'%20OR%201=1--", "/lot/'%20OR%20'1'='1", "/lot/%3Cscript%3Ealert(1)%3C%2Fscript%3E", "/blog/x';%20DROP%20TABLE%20articles;--"];
const bad = [];
for (const p of inj) {
  const res = await get(p);
  const html = await res.text();
  if (res.status >= 500 || html.includes("<script>alert(1)</script>")) bad.push(`${p} (${res.status})`);
}
ok(bad.length === 0, `injection attempts in addresses are harmless (${bad.join(", ") || "none"})`);
ok((await get("/")).status === 200, "site still up at the end");

console.log(problems.length ? `\n${problems.length} problem(s) found.` : "\nAll checks passed.");
process.exit(problems.length ? 1 : 0);
