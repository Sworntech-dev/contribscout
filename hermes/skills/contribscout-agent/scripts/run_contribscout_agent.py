#!/usr/bin/env python3
"""Run the ContribScout Agent workflow and print a Markdown report."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


DEFAULT_API_URL = "https://contribscout.vercel.app"
DEFAULT_GOAL = "Grow visibility for an AI agent tooling project through useful open-source contributions."
DEFAULT_TEAM_CONTEXT = "Small AI tooling team"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run ContribScout Agent and print a Markdown growth operations report.",
    )
    parser.add_argument(
        "business_goal",
        nargs="?",
        default=DEFAULT_GOAL,
        help="Business or growth goal for the agent run.",
    )
    parser.add_argument(
        "--team-context",
        default=DEFAULT_TEAM_CONTEXT,
        help="Short context about the team using the workflow.",
    )
    parser.add_argument(
        "--max-opportunities",
        type=int,
        default=8,
        help="Maximum number of opportunities the API should consider.",
    )
    args = parser.parse_args()

    base_url = os.environ.get("CONTRIBSCOUT_API_URL", DEFAULT_API_URL).rstrip("/")
    endpoint = f"{base_url}/api/agent/run"
    payload = {
        "businessGoal": args.business_goal,
        "teamContext": args.team_context,
        "maxOpportunities": args.max_opportunities,
    }

    try:
        result = post_json(endpoint, payload)
    except RuntimeError as error:
        print(f"ContribScout Agent failed: {error}", file=sys.stderr)
        return 1

    markdown = result.get("markdownSummary")
    if not isinstance(markdown, str) or not markdown.strip():
        print("ContribScout Agent failed: API response did not include markdownSummary.", file=sys.stderr)
        return 1

    print(markdown.strip())
    return 0


def post_json(url: str, payload: dict[str, object]) -> dict[str, object]:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "contribscout-agent-skill/0.1",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach {url}: {error.reason}") from error
    except TimeoutError as error:
        raise RuntimeError(f"Request to {url} timed out.") from error

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as error:
        raise RuntimeError("API returned invalid JSON.") from error

    if not isinstance(parsed, dict):
        raise RuntimeError("API returned an unexpected response shape.")

    if "error" in parsed:
        raise RuntimeError(str(parsed["error"]))

    return parsed


if __name__ == "__main__":
    raise SystemExit(main())
