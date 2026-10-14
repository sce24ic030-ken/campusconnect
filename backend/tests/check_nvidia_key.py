# =========================================================
# NVIDIA NIM KEY CHECK
# Verifies that the configured NVIDIA_API_KEY can reach the
# chat endpoint and receive a streamed reply.
#
# Usage:  python tests/check_nvidia_key.py
#
# The key is NEVER printed - only its presence and length.
# =========================================================

import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config  # noqa: E402


def main():
    key = Config.NVIDIA_API_KEY
    base = Config.CHATBOT_BASE_URL.rstrip("/")
    model = Config.CHATBOT_MODEL

    print("=" * 56)
    print("NVIDIA NIM KEY CHECK")
    print("=" * 56)
    print(f"Key present      : {'YES' if key else 'NO'}")
    print(f"Key length       : {len(key)} chars")
    print(f"Base URL         : {base}")
    print(f"Model            : {model}")
    print("-" * 56)

    if not key:
        print("RESULT: FAIL - NVIDIA_API_KEY is empty. Set it in .env")
        return 1

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Reply with one short sentence."},
            {"role": "user", "content": "Say hello and confirm you are working."},
        ],
        "temperature": Config.CHATBOT_TEMPERATURE,
        "max_tokens": Config.CHATBOT_MAX_TOKENS,
        "stream": True,
    }

    effort = Config.CHATBOT_REASONING_EFFORT
    if effort:
        payload["reasoning_effort"] = effort

    request = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )

    parts = []
    status = None

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            status = response.getcode()
            for raw_line in response:
                line = raw_line.decode("utf-8", "replace").strip()
                if not line or not line.startswith("data:"):
                    continue
                chunk = line[len("data:"):].strip()
                if chunk == "[DONE]":
                    break
                try:
                    event = json.loads(chunk)
                except ValueError:
                    continue
                for choice in event.get("choices") or []:
                    delta = choice.get("delta") or {}
                    if delta.get("content"):
                        parts.append(delta["content"])

    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:300]
        print(f"HTTP status      : {exc.code} {exc.reason}")
        print(f"Response body    : {body}")
        if exc.code in (401, 403):
            print("RESULT: FAIL - the API key was rejected (invalid/expired).")
        elif exc.code == 404:
            print("RESULT: FAIL - model not found; check CHATBOT_MODEL.")
        else:
            print("RESULT: FAIL - API returned an error.")
        return 1

    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"Network error     : {exc}")
        print("RESULT: FAIL - could not reach the NVIDIA API (network/proxy).")
        return 1

    reply = "".join(parts).strip()

    print(f"HTTP status      : {status}")
    print(f"Reply length     : {len(reply)} chars")
    print(f"Reply            : {reply[:200] if reply else '<empty>'}")
    print("-" * 56)

    if reply:
        print("RESULT: PASS - NVIDIA key is working.")
        return 0

    print("RESULT: WARN - connected OK but no content returned.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
