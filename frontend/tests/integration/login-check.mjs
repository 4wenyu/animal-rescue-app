/**
 * Manual login probe: confirms the credentials provider issues a session
 * cookie for a given email/password against a running server.
 *
 *   node tests/integration/login-check.mjs admin@rescuehub.org admin123
 */
const BASE = process.env.NEXT_TEST_BASE_URL ?? "http://localhost:3199";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("usage: node login-check.mjs <email> <password>");
  process.exit(2);
}

const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorb(res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const idx = pair.indexOf("=");
    jar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
}

const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
absorb(csrfRes);
const { csrfToken } = await csrfRes.json();

const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
  method: "POST",
  redirect: "manual",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    cookie: cookieHeader(),
  },
  body: new URLSearchParams({ email, password, csrfToken }),
});
absorb(loginRes);

const sessionCookie = [...jar.keys()].find((k) => k.includes("session-token"));

const sessionRes = await fetch(`${BASE}/api/auth/session`, {
  headers: { cookie: cookieHeader() },
});
const session = await sessionRes.json();

const dashRes = await fetch(`${BASE}/dashboard`, {
  redirect: "manual",
  headers: { cookie: cookieHeader() },
});

console.log(`login POST      : ${loginRes.status} -> ${loginRes.headers.get("location")}`);
console.log(`session cookie  : ${sessionCookie ?? "NONE"}`);
console.log(`session payload : ${JSON.stringify(session)}`);
console.log(`GET /dashboard  : ${dashRes.status}`);

const ok = Boolean(sessionCookie) && dashRes.status === 200;
console.log(ok ? "\nRESULT: login works" : "\nRESULT: login FAILED");
process.exit(ok ? 0 : 1);
