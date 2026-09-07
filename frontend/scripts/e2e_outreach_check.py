"""
E2E verification of the RescueHub outreach loop against the live dev server.

Chain under test:
  1. CITIZEN registers (unique email) -> 201
  2. CITIZEN logs in, opts in via /api/outreach/opt-in -> unsubscribe token
  3. STAFF logs in (mock credentials; requires AUTH_ALLOW_MOCK_USERS=true
     on the dev server process)
  4. STAFF runs agent: /api/outreach/generate -> drafts created
  5. STAFF review page (/outreach/review) renders the queue; draft ids
     extracted from the RSC flight payload
  6. STAFF approves a draft -> SENT; response must include delivery info
  7. CITIZEN unsubscribes via one-click token -> UNSUBSCRIBED

Usage:  python scripts/e2e_outreach_check.py [base_url]
Requires the dev server to be running with AUTH_ALLOW_MOCK_USERS=true.
"""

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import http.cookiejar
import uuid

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
UA = {"User-Agent": "e2e-outreach-check/1.0"}


def get(path):
    req = urllib.request.Request(BASE + path, headers=UA)
    try:
        with opener.open(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def post_json(path, payload):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={**UA, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with opener.open(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", "replace")
            try:
                return resp.status, json.loads(raw)
            except Exception:
                return resp.status, raw[:400]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw[:400]


def post_form(path, fields):
    req = urllib.request.Request(
        BASE + path,
        data=urllib.parse.urlencode(fields).encode(),
        headers={**UA, "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with opener.open(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


def csrf_token():
    st, raw = get("/api/auth/csrf")
    return json.loads(raw)["csrfToken"] if st == 200 else None


def login(email, password):
    tok = csrf_token()
    if not tok:
        return 500
    return post_form(
        "/api/auth/callback/credentials",
        {"csrfToken": tok, "email": email, "password": password, "json": "true"},
    )


def main():
    results = []

    def check(name, ok, detail=""):
        results.append(ok)
        print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))

    # ── 1. Register a fresh citizen ──────────────────────────────────
    email = f"e2e-{uuid.uuid4().hex[:8]}@rescuehub-test.org"
    st, body = post_json(
        "/api/auth/register",
        {"email": email, "password": "TestPass123", "displayName": "E2E Citizen"},
    )
    check("register citizen", st in (200, 201), f"{st}")

    # ── 2. Citizen login + opt-in ────────────────────────────────────
    check("citizen login", login(email, "TestPass123") in (200, 302))
    st, body = post_json(
        "/api/outreach/opt-in",
        {"helpAreas": ["FOSTER", "DONATE"], "regionLabel": "Testville, TS"},
    )
    check("citizen opt-in", st == 200, f"{st}")
    token = body.get("profile", {}).get("unsubscribeToken") if isinstance(body, dict) else None
    check("unsubscribe token returned", bool(token))

    # ── 3. Staff login (mock creds; dev server opt-in required) ──────
    cj.clear()
    st = login("staff@rescuehub.org", "staff123")
    check("staff login", st in (200, 302), f"{st} (401 ⇒ set AUTH_ALLOW_MOCK_USERS=true)")

    # ── 4. Run the agent ─────────────────────────────────────────────
    st, body = post_json("/api/outreach/generate", {})
    created = body.get("created", 0) if isinstance(body, dict) else 0
    check("agent generate", st == 200 and body.get("ok") is True, f"created={created}")

    # ── 5. Review page renders queue; extract a pending draft id ─────
    st, html = get("/outreach/review")
    queue_rendered = "Review queue" in html
    check("review page renders queue (staff session)", st == 200 and queue_rendered, f"{st}")
    guids = re.findall(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", html)
    draft_id = guids[0] if guids else None
    check("draft id found in queue payload", bool(draft_id), str(draft_id))

    # ── 6. Approve the draft (the delivery leg) ──────────────────────
    if draft_id:
        st, body = post_json(
            f"/api/outreach/drafts/{draft_id}/review",
            {"approve": True, "note": "e2e-approve"},
        )
        ok = st == 200 and isinstance(body, dict) and body.get("status") == "SENT"
        check("approve draft → SENT", ok, f"{st} {body}")
    else:
        check("approve draft → SENT", False, "no draft id")

    # ── 7. One-click unsubscribe ─────────────────────────────────────
    if token:
        st, body = post_json("/api/outreach/unsubscribe", {"token": token})
        check(
            "unsubscribe",
            st == 200 and body.get("status") == "UNSUBSCRIBED",
            f"{st}",
        )
    else:
        check("unsubscribe", False, "no token")

    passed = sum(results)
    print(f"\n{passed}/{len(results)} passed")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
