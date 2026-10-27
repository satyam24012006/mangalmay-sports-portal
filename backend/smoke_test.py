#!/usr/bin/env python3
"""End-to-end check of the whole registration flow against a running backend.
Usage:  python3 smoke_test.py http://localhost:8080 admin@mangalmay.org 'ADMIN_PASSWORD'
Creates one test student + one test registration (delete them from the admin panel afterwards)."""
import base64, json, sys, time, urllib.request, urllib.error, uuid

base, admin_email, admin_pw = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3]
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
ok = True

def call(method, path, body=None, token=None, multipart=None, raw=False):
    headers = {}
    data = None
    if token: headers["Authorization"] = "Bearer " + token
    if multipart:
        b = "----t" + uuid.uuid4().hex
        parts = b""
        for k, v in multipart.items():
            if isinstance(v, bytes):
                parts += f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="p.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + v + b"\r\n"
            else:
                parts += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        data = parts + f"--{b}--\r\n".encode()
        headers["Content-Type"] = "multipart/form-data; boundary=" + b
    elif body is not None:
        data = json.dumps(body).encode(); headers["Content-Type"] = "application/json"
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            payload = r.read()
            return r.status, (payload if raw else (json.loads(payload) if payload else None))
    except urllib.error.HTTPError as e:
        payload = e.read()
        try: return e.code, json.loads(payload)
        except Exception: return e.code, payload.decode(errors="replace")

def check(name, cond, extra=""):
    global ok
    print(("PASS  " if cond else "FAIL  ") + name + (("  -> " + str(extra)) if not cond else ""))
    ok = ok and cond

s, r = call("GET", "/api/events");  check("public events list", s == 200 and len(r) >= 1, (s, r))
event = next((e for e in r if e["status"] == "Registration open"), None) if s == 200 else None
check("an open event exists", event is not None)
s, r = call("GET", "/api/sports?eventId=" + event["id"]); check("public sports list", s == 200 and len(r) >= 1, (s, r))
sport = next(x for x in r if "Singles" in x["teamSize"])

s, r = call("POST", "/api/auth/login", {"email": admin_email, "password": admin_pw}); check("admin login", s == 200 and r["user"]["role"] == "admin", (s, r))
admin = r["token"] if s == 200 else None
s, r = call("POST", "/api/auth/login", {"email": admin_email, "password": "wrong-password"}); check("wrong password rejected", s == 401, s)

email = f"smoke{int(time.time())}@test.local"
s, r = call("POST", "/api/auth/signup", {"name": "Smoke Test", "email": email, "password": "password123", "college": "Test College"}); check("student signup", s == 200, (s, r))
tok = r["token"]
s, _ = call("GET", "/api/admin/users", token=tok); check("student blocked from admin API", s == 403, s)
s, _ = call("GET", "/api/enrollments/mine"); check("no token -> 401", s == 401, s)

draft = {"eventId": event["id"], "sportId": sport["id"], "name": "Smoke Test", "email": email, "phone": "9876543210",
         "college": "Test College", "team": "", "members": [{"name": "Smoke Test", "phone": ""}], "step": 3}
s, r = call("PUT", "/api/enrollments/draft", draft, tok); check("save draft", s == 200 and r["status"] == "draft", (s, r))
eid = r["id"]
utr = str(int(time.time()))[-10:].zfill(12)
s, r = call("POST", f"/api/enrollments/{eid}/payment", token=tok, multipart={"utr": "123", "file": PNG}); check("bad UTR rejected", s == 400, (s, r))
s, r = call("POST", f"/api/enrollments/{eid}/payment", token=tok, multipart={"utr": utr, "file": b"not an image at all"}); check("fake image rejected", s == 400, (s, r))
s, r = call("POST", f"/api/enrollments/{eid}/payment", token=tok, multipart={"utr": utr, "file": PNG}); check("payment proof submitted", s == 200 and r["status"] == "pending", (s, r))
s, r = call("POST", f"/api/enrollments/{eid}/payment", token=tok, multipart={"utr": utr, "file": PNG}); check("double submit rejected", s == 409, (s, r))
s, _ = call("GET", f"/api/enrollments/{eid}/proof", token=tok, raw=True); check("owner can view proof", s == 200, s)

s, r = call("PATCH", f"/api/admin/enrollments/{eid}/status", {"status": "verified"}, admin); check("admin verifies", s == 200 and r["status"] == "verified", (s, r))
s, r = call("GET", "/api/admin/stats", token=admin); check("admin stats", s == 200 and r["verified"] >= 1, (s, r))
s, r = call("GET", "/api/admin/payments/export", token=admin, raw=True); check("CSV export", s == 200 and b"Smoke Test" in r, s)
s, r = call("GET", "/api/sports?eventId=" + event["id"]); check("slots decreased", s == 200 and next(x for x in r if x["id"] == sport["id"])["remaining"] == sport["remaining"] - 1, r)

print("\nALL GOOD" if ok else "\nSOME CHECKS FAILED, send me the FAIL lines")
sys.exit(0 if ok else 1)
