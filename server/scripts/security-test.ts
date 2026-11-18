// Security checks against a running Bling Fest server (local or live).
//   BASE_URL=https://your-site npm run test:security
// Optional, for the logged-in checks (use real team accounts):
//   OWNER_EMAIL / OWNER_PASSWORD, REVIEWER_EMAIL / REVIEWER_PASSWORD
// It submits a few test applications (brand "SECURITY TEST — delete me"). Delete them afterwards.

import jwt from "jsonwebtoken";

const BASE = (process.env.BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const H = { "X-Requested-With": "blingfest" };
let pass = 0, fail = 0;
const results: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  ok ? pass++ : fail++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function login(email?: string, password?: string): Promise<string | null> {
  if (!email || !password) return null;
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const c = r.headers.get("set-cookie");
  return r.ok && c ? c.split(";")[0] : null;
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
let n = 0;
function appForm(over: Record<string, string> = {}, files: { name: string; type: string; data: Buffer }[] = []) {
  const f = new FormData();
  const base: Record<string, string> = {
    participation: "other_sme", brand_name: "SECURITY TEST — delete me", full_name: "Security Test",
    email: `security-test-${Date.now()}-${n++}@example.com`, phone: "0772123456", location: "Kampala",
    business_category: "Other", description: "Automated security test application. Please delete.", consent: "true",
  };
  for (const [k, v] of Object.entries({ ...base, ...over })) f.set(k, v);
  for (const file of files) f.append("photos", new Blob([new Uint8Array(file.data)], { type: file.type }), file.name);
  return f;
}
const submit = (f: FormData, headers: Record<string, string> = H) => fetch(`${BASE}/api/applications`, { method: "POST", headers, body: f });

// --- Anonymous access --------------------------------------------------------------------
for (const path of ["/api/admin/stats", "/api/admin/applications", "/api/admin/vendors", "/api/admin/photos/00000000-0000-0000-0000-000000000000"]) {
  const r = await fetch(BASE + path);
  check(`Anonymous blocked from ${path}`, r.status === 401, `got ${r.status}`);
}

// --- Forged / tampered sessions ----------------------------------------------------------
const forged = jwt.sign({ sub: "00000000-0000-0000-0000-000000000000", v: 0 }, "wrong-secret-wrong-secret-wrong-secret-123");
const noneAlg = Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url") + "." + Buffer.from('{"sub":"x","v":0}').toString("base64url") + ".";
for (const [name, tok] of [["wrong secret", forged], ['alg "none"', noneAlg]] as const) {
  for (const cookie of ["bf_session", "__Host-bf_session"]) {
    const r = await fetch(`${BASE}/api/admin/stats`, { headers: { Cookie: `${cookie}=${tok}` } });
    if (r.status !== 401) { check(`Forged session (${name}) rejected`, false, `${cookie} got ${r.status}`); break; }
  }
  check(`Forged session (${name}) rejected`, true);
}

// --- CSRF ------------------------------------------------------------------------------------
{
  const r = await submit(appForm(), {});
  check("POST without the CSRF header is blocked", r.status === 403, `got ${r.status}`);
  const r2 = await submit(appForm(), { ...H, Origin: "https://evil.example" });
  check("POST from a foreign Origin is blocked", r2.status === 403, `got ${r2.status}`);
}

// --- Input validation ----------------------------------------------------------------------
{
  let r = await submit(appForm({ social_link: "javascript:alert(document.cookie)" }));
  check("javascript: link rejected", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({ participation: "admin" }));
  check("Unknown participation category rejected", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({ consent: "false" }));
  check("Missing consent rejected", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({ description: "x".repeat(5000) }));
  check("Over-long description rejected", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({}, [{ name: "evil.jpg", type: "image/jpeg", data: Buffer.from("<?php system($_GET['c']); ?>") }]));
  check("Fake JPEG (script inside) rejected by byte check", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({}, [{ name: "x.svg", type: "image/svg+xml", data: Buffer.from("<svg onload=alert(1)>") }]));
  check("SVG upload rejected", r.status === 400, `got ${r.status}`);
  r = await submit(appForm({}, [{ name: "big.jpg", type: "image/jpeg", data: Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024 + 10)]) }]));
  check("Photo over 5 MB rejected", r.status === 400 || r.status === 413, `got ${r.status}`);
  r = await submit(appForm({}, Array.from({ length: 7 }, (_, i) => ({ name: `${i}.jpg`, type: "image/jpeg", data: JPEG }))));
  check("7 photos rejected (max 6)", r.status === 400, `got ${r.status}`);
}

// --- Public data doesn't leak private fields ------------------------------------------------
{
  const r = await fetch(`${BASE}/api/vendors`);
  const text = await r.text();
  check("Public vendor list hides contact emails", r.ok && !text.includes("contact_email"), `status ${r.status}`);
}

// --- Headers ---------------------------------------------------------------------------------
{
  const r = await fetch(`${BASE}/`);
  const h = r.headers;
  check("CSP blocks inline/third-party scripts", /script-src 'self'(;|$)/.test(h.get("content-security-policy") ?? ""));
  check("Clickjacking blocked (X-Frame-Options DENY)", h.get("x-frame-options") === "DENY");
  check("HSTS header present", (h.get("strict-transport-security") ?? "").includes("max-age=63072000"));
  check("X-Powered-By hidden", !h.get("x-powered-by"));
  check("nosniff header present", h.get("x-content-type-options") === "nosniff");
}

// --- Logged-in checks --------------------------------------------------------------------------
const owner = await login(process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD);
const reviewer = await login(process.env.REVIEWER_EMAIL, process.env.REVIEWER_PASSWORD);
if (BASE.startsWith("https://") && owner) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.OWNER_EMAIL, password: process.env.OWNER_PASSWORD }) });
  const c = (r.headers.get("set-cookie") ?? "").toLowerCase();
  check("Session cookie is HttpOnly + Secure + SameSite=Strict", c.includes("httponly") && c.includes("secure") && c.includes("samesite=strict"));
}
if (owner) {
  // A status sent with the application is ignored: it always starts as pending.
  const f = appForm({ status: "approved", reviewed_by: "attacker" });
  const r = await submit(f);
  const ref = r.ok ? ((await r.json()) as { reference: string }).reference : null;
  const list = await fetch(`${BASE}/api/admin/applications?q=${ref}`, { headers: { Cookie: owner } });
  const rows = ((await list.json()) as { data: { rows: { status: string }[] } }).data.rows;
  check("Applicant can't self-approve (status forced to pending)", rows[0]?.status === "pending", `got ${rows[0]?.status}`);

  // Loud injection: on Render, Cloudflare's firewall usually blocks it before it reaches the app.
  // Either outcome is safe: blocked at the edge (403 that isn't the app's JSON), or the app treats it as text.
  const inj = await fetch(`${BASE}/api/admin/applications?q=${encodeURIComponent("' or 1=1; drop table applications; --")}`, { headers: { Cookie: owner } });
  const injBody = await inj.text();
  let appAnswered = false, injRows = -1;
  try { const j = JSON.parse(injBody); appAnswered = typeof j.success === "boolean"; injRows = j.data?.count ?? -1; } catch { /* not the app */ }
  const edgeBlocked = inj.status === 403 && !appAnswered;
  check("SQL injection (loud) blocked by firewall or treated as text", edgeBlocked || (inj.ok && injRows === 0),
    edgeBlocked ? "blocked by the hosting firewall" : `status ${inj.status}, rows ${injRows}`);

  // Quiet injection the firewall lets through: proves the app's own parameterised queries.
  const quiet = await fetch(`${BASE}/api/admin/applications?q=${encodeURIComponent("zz' or 'a'='a")}`, { headers: { Cookie: owner } });
  const quietRows = quiet.ok ? ((await quiet.json()) as { data: { count: number } }).data.count : -1;
  check("SQL injection (quiet) treated as plain text by the app", quiet.ok && quietRows === 0, `status ${quiet.status}, rows ${quietRows}`);

  const wild = await fetch(`${BASE}/api/admin/applications?q=%25`, { headers: { Cookie: owner } });
  const wildRows = ((await wild.json()) as { data: { count: number } }).data.count;
  check("Search wildcard % is matched literally", wildRows === 0, `rows ${wildRows}`);

  const noCsrf = await fetch(`${BASE}/api/admin/applications/00000000-0000-0000-0000-000000000000/status`, { method: "PATCH", headers: { Cookie: owner, "Content-Type": "application/json" }, body: '{"status":"approved"}' });
  check("Signed-in admin action without CSRF header is blocked", noCsrf.status === 403, `got ${noCsrf.status}`);
} else {
  results.push("SKIP  Owner checks (set OWNER_EMAIL / OWNER_PASSWORD)");
}
if (reviewer) {
  const list = await fetch(`${BASE}/api/admin/applications`, { headers: { Cookie: reviewer } });
  const first = ((await list.json()) as { data: { rows: { id: string }[] } }).data.rows[0];
  if (first) {
    const r = await fetch(`${BASE}/api/admin/applications/${first.id}/status`, { method: "PATCH", headers: { ...H, Cookie: reviewer, "Content-Type": "application/json" }, body: '{"status":"approved"}' });
    check("Reviewer can't approve/reject", r.status === 403, `got ${r.status}`);
  }
  const ev = await fetch(`${BASE}/api/admin/announcements`, { method: "POST", headers: { ...H, Cookie: reviewer, "Content-Type": "application/json" }, body: '{"title":"x hacked","body":"x"}' });
  check("Reviewer can't publish announcements", ev.status === 403, `got ${ev.status}`);
} else {
  results.push("SKIP  Reviewer checks (set REVIEWER_EMAIL / REVIEWER_PASSWORD)");
}

// --- Rate limit (last: it uses up this connection's allowance) ------------------------------
{
  const email = `security-test-rl-${Date.now()}@example.com`;
  const codes: number[] = [];
  for (let i = 0; i < 4; i++) codes.push((await submit(appForm({ email }))).status);
  check("Repeated applications are refused (per-email and per-connection limits)", codes[3] === 429, `codes ${codes.join(",")}`);
}

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
