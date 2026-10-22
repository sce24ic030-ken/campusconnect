#!/usr/bin/env python3
"""Trigger a Render deploy for CampusConnect and wait for it to go live.

The Render service has autoDeploy enabled, but the Render GitHub App is not
installed on the GitHub repository, so a `git push` does NOT start a deploy.
Until that App is connected, this script is the deploy path: it asks the
Render API to deploy the branch head, then polls until the deploy settles
and reports which commit went live.

Usage (PowerShell):

    $env:RENDER_API_KEY = "rnd_..."
    python scripts/deploy_render.py

Usage (bash):

    RENDER_API_KEY=rnd_... python scripts/deploy_render.py

The API key is never written to disk by this script; it is read from the
environment (or --api-key) and only used in the Authorization header.

To restore plain `git push` deploys instead, connect the repository in the
Render dashboard: Settings -> Repository -> Connect, which installs the
Render GitHub App on sce24ic030-ken/campusconnect.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

DEFAULT_SERVICE_ID = "srv-db7qpv0473hc73eb6r50"
DEFAULT_BRANCH = "main"
API_ROOT = "https://api.render.com/v1"

# Deploy states that mean "stop waiting".
FINISHED = {"live", "deactivated", "build_failed", "update_failed",
            "canceled", "pre_deploy_failed", "build_cancelled"}


def request(method, path, api_key, body=None):
    """One Render API call. Returns the parsed JSON body."""
    url = path if path.startswith("http") else API_ROOT + path
    data = None
    headers = {"Authorization": "Bearer " + api_key, "Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        raise SystemExit("Render API %s %s -> HTTP %s\n%s" % (method, url, err.code, detail))

    return json.loads(raw) if raw.strip() else {}


def git(*args, cwd=None):
    """Run git and return stdout (empty string when git is unavailable)."""
    try:
        out = subprocess.run(
            ["git", *args], cwd=cwd, check=True,
            capture_output=True, text=True, timeout=60,
        )
        return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def main():
    parser = argparse.ArgumentParser(description="Deploy CampusConnect to Render.")
    parser.add_argument("--api-key", default=os.environ.get("RENDER_API_KEY", ""),
                        help="Render API key (defaults to $RENDER_API_KEY)")
    parser.add_argument("--service-id", default=DEFAULT_SERVICE_ID)
    parser.add_argument("--branch", default=DEFAULT_BRANCH)
    parser.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    parser.add_argument("--poll", type=int, default=10, help="seconds between status checks")
    parser.add_argument("--timeout", type=int, default=900, help="seconds to wait for the deploy")
    parser.add_argument("--no-clear-cache", action="store_true")
    args = parser.parse_args()

    api_key = args.api_key.strip()
    if not api_key:
        raise SystemExit("No API key. Set RENDER_API_KEY or pass --api-key.")

    local_head = git("rev-parse", "HEAD", cwd=args.repo)
    remote_head = git("rev-parse", "origin/" + args.branch, cwd=args.repo)

    print("Service : %s" % args.service_id)
    print("Branch  : %s" % args.branch)
    print("Local   : %s" % (local_head or "(git unavailable)"))
    print("Remote  : %s" % (remote_head or "(git unavailable)"))

    if local_head and remote_head and local_head != remote_head:
        raise SystemExit(
            "\norigin/%s is behind the local checkout (%s != %s).\n"
            "Push the branch before deploying." % (args.branch, local_head[:7], remote_head[:7])
        )

    body = {"clearCache": "do_not_clear" if args.no_clear_cache else "clear"}
    deploy = request("POST", "/services/%s/deploys" % args.service_id, api_key, body)

    deploy_id = deploy.get("id")
    print("\nDeploy  : %s" % (deploy_id or "(no id returned)"))
    if not deploy_id:
        raise SystemExit("Render did not return a deploy id: %s" % json.dumps(deploy)[:400])

    deadline = time.time() + args.timeout
    status = deploy.get("status", "")
    commit = ""
    while True:
        current = request("GET", "/services/%s/deploys/%s" % (args.service_id, deploy_id), api_key)
        status = current.get("status", status)
        commit = (current.get("commit") or {}).get("id", commit)
        print("  status=%-16s commit=%s" % (status, (commit or "")[:7]))

        if status in FINISHED:
            break
        if time.time() > deadline:
            raise SystemExit("Timed out after %ss waiting for deploy %s (last status: %s)"
                             % (args.timeout, deploy_id, status))
        time.sleep(args.poll)

    print("\nDeploy %s finished with status '%s'." % (deploy_id, status))

    if status != "live":
        raise SystemExit("Deploy did not go live (status: %s)." % status)

    if local_head and commit and not commit.startswith(local_head):
        print("WARNING: the live commit %s is not the local HEAD %s."
              % (commit[:7], local_head[:7]))

    print("Live    : %s" % (commit or "(unknown commit)"))
    print("URL     : https://campusconnect-p4h4.onrender.com")
    return 0


if __name__ == "__main__":
    sys.exit(main())
