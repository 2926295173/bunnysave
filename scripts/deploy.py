#!/usr/bin/env python3
"""Deploy the bunnysave-clone project to Vercel via the REST API.

Flow:
  1. POST /v10/projects       -> create project (or reuse existing)
  2. POST /v2/files           -> upload each file individually with sha1
  3. POST /v13/deployments    -> create deployment referencing file paths + sha1
  4. GET  /v13/deployments/id -> poll until state in (READY, ERROR)
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# SECURITY: never hardcode a Vercel token here. The deploy script must run with
# the token supplied via the environment, e.g.:
#   VERCEL_TOKEN=*** python scripts/deploy.py
# If you accidentally committed a token, revoke it immediately at
# https://vercel.com/account/settings/tokens and reissue.
TOKEN = os.environ.get("VERCEL_TOKEN")
if not TOKEN:
    raise SystemExit(
        "VERCEL_TOKEN env var is required. Set it before running this script:\n"
        "  VERCEL_TOKEN=your_token python scripts/deploy.py"
    )
# Personal accounts don't have a team scope, so leave TEAM_ID unset unless the
# caller explicitly opts in via the VERCEL_TEAM_ID environment variable.
TEAM_ID = os.environ.get("VERCEL_TEAM_ID") or None
PROJECT_NAME = "bunnysave-clone"
ROOT = Path(__file__).resolve().parent.parent

EXCLUDE_DIRS = {".next", "node_modules", ".venv", "data", ".git", "__pycache__"}
EXCLUDE_FILE_PATTERNS = (".env", ".env.local", ".env.*.local", ".DS_Store", "tsconfig.tsbuildinfo", "next-env.d.ts")


def http(method, path, *, data=None, headers=None, query=None, timeout=60):
    url = f"https://api.vercel.com{path}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"
    h = {"Authorization": f"Bearer {TOKEN}", "User-Agent": "bunnysave-deploy/1.0"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), r.headers.get("content-type", "")
    except urllib.error.HTTPError as e:
        return e.code, e.read(), e.headers.get("content-type", "")


def ensure_project() -> str:
    payload = json.dumps({"name": PROJECT_NAME, "framework": "nextjs"}).encode()
    q = {"teamId": TEAM_ID} if TEAM_ID else None
    code, body, _ = http(
        "POST", "/v10/projects",
        data=payload,
        headers={"content-type": "application/json"},
        query=q,
    )
    if code in (200, 201):
        return json.loads(body)["id"]
    if code == 409:
        code, body, _ = http("GET", f"/v9/projects/{PROJECT_NAME}", query=q)
        if code == 200:
            return json.loads(body)["id"]
    raise SystemExit(f"create project failed: {code} {body[:400]!r}")


def should_skip(rel: str, name: str) -> bool:
    parts = rel.split("/")
    # Only exclude top-level directories (don't match nested ones like src/data)
    for i, p in enumerate(parts[:-1]):
        if i == 0 and p in EXCLUDE_DIRS:
            return True
    return any(name == pat or (pat.startswith(".") and name.startswith(pat)) for pat in EXCLUDE_FILE_PATTERNS)


def iter_files():
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT).as_posix()
        if should_skip(rel, p.name):
            continue
        yield rel, p


def upload_one(rel: str, path: Path) -> str:
    data = path.read_bytes()
    sha = hashlib.sha1(data).hexdigest()
    code, body, _ = http(
        "POST", "/v2/files",
        data=data,
        headers={
            "content-type": "application/octet-stream",
            "x-vercel-digest": sha,
        },
        query={"teamId": TEAM_ID},
        timeout=60,
    )
    if code != 200:
        raise SystemExit(f"upload {rel}: {code} {body[:200]!r}")
    return sha


def upload_all() -> list[dict]:
    files_meta: list[dict] = []
    total = 0
    skipped = 0
    start = time.time()
    for i, (rel, p) in enumerate(iter_files(), 1):
        sha = upload_one(rel, p)
        files_meta.append({"file": rel, "sha": sha})
        total += 1
        if i % 10 == 0:
            print(f"  {i} files uploaded ({time.time()-start:.1f}s)")
    print(f"uploaded {total} files in {time.time()-start:.1f}s")
    return files_meta


def create_deployment(files_meta: list[dict]) -> tuple[str, str]:
    payload = {
        "name": PROJECT_NAME,
        "target": "production",
        "files": files_meta,
        "projectSettings": {
            "framework": "nextjs",
            "buildCommand": "next build",
            "installCommand": "pnpm install --frozen-lockfile",
            "outputDirectory": ".next",
        },
        "gitMetadata": {"remoteUrl": "local", "commitMessage": "deploy: initial"},
    }
    code, body, _ = http(
        "POST", "/v13/deployments",
        data=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
        query={"teamId": TEAM_ID, "skipAutoDetectionConfirmation": "1"},
        timeout=120,
    )
    if code not in (200, 201):
        raise SystemExit(f"create deployment failed: {code} {body[:1000]!r}")
    dep = json.loads(body)
    return dep["id"], dep.get("url", "")


def poll(dep_id: str, url_hint: str) -> str:
    deadline = time.time() + 900
    last_state = None
    while time.time() < deadline:
        code, body, _ = http("GET", f"/v13/deployments/{dep_id}", query={"teamId": TEAM_ID})
        if code == 200:
            d = json.loads(body)
            state = d.get("readyState") or d.get("state")
            if state != last_state:
                alias = (d.get("alias") or [""])[0]
                print(f"  state={state}  {alias or url_hint}")
                last_state = state
            if state == "READY":
                return d.get("alias", [url_hint])[0] or url_hint
            if state in ("ERROR", "CANCELED"):
                for b in d.get("builds") or []:
                    print(" build:", b.get("id"), b.get("state"), b.get("errorMessage", ""))
                    for entry in b.get("logs") or []:
                        msg = entry.get("message", "")
                        if msg:
                            print("   ", msg[:300])
                return ""
        time.sleep(10)
    return ""


def main() -> int:
    print(f"team: {TEAM_ID}  project: {PROJECT_NAME}")
    proj = ensure_project()
    print(f"project id: {proj}")
    files_meta = upload_all()
    print("creating deployment…")
    dep_id, url = create_deployment(files_meta)
    print(f"deployment id: {dep_id}")
    print("polling…")
    final = poll(dep_id, url)
    if final:
        print(f"\nLIVE: https://{final}")
        return 0
    print("FAILED")
    return 1


if __name__ == "__main__":
    sys.exit(main())
