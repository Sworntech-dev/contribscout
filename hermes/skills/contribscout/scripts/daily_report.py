"""Format a ContribScout daily opportunity report for Hermes.

Python 3.11+; standard library only.
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_API_URL = "https://contribscout.vercel.app/api/opportunities"
REQUEST_TIMEOUT_SECONDS = 15
MAX_OPPORTUNITIES = 5


def fetch_payload(api_url: str) -> dict[str, Any]:
    request = Request(
        api_url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Hermes-ContribScout-Skill/0.2.0",
        },
    )

    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise RuntimeError(f"ContribScout API returned HTTP {error.code}.") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach ContribScout API: {error.reason}.") from error
    except TimeoutError as error:
        raise RuntimeError("ContribScout API request timed out.") from error
    except json.JSONDecodeError as error:
        raise RuntimeError("ContribScout API returned invalid JSON.") from error


def text_value(value: Any, fallback: str = "n/a") -> str:
    if value is None:
        return fallback

    text = str(value).strip()
    return text if text else fallback


def format_opportunity(index: int, opportunity: dict[str, Any], source: str) -> list[str]:
    name = text_value(opportunity.get("name"), "Unnamed project")
    score = text_value(opportunity.get("roleOpportunityScore"))
    category = text_value(opportunity.get("category"), "open source")
    action = text_value(
        opportunity.get("suggestedAction"),
        "Review the project and choose a small contribution.",
    )
    reason = text_value(opportunity.get("scoreReason"), "No score reason provided.")
    repo_url = text_value(opportunity.get("url"), "sample fallback" if source == "sample" else "n/a")

    return [
        f"## {index}. {name}",
        "",
        f"- Score: {score}/100" if score.isdigit() else f"- Score: {score}",
        f"- Category: {category}",
        f"- Suggested action: {action}",
        f"- Reason: {reason}",
        f"- Repository: {repo_url}",
        "",
    ]


def format_report(payload: dict[str, Any]) -> str:
    source = text_value(payload.get("source"), "unknown")
    notice = text_value(payload.get("notice"), "No notice.")
    opportunities = payload.get("opportunities")

    if not isinstance(opportunities, list) or not opportunities:
        raise RuntimeError("ContribScout API returned no opportunities.")

    lines = [
        "# ContribScout Daily Contribution Report",
        "",
        f"- Source: {source}",
        f"- Notice: {notice}",
        "",
    ]

    if source == "sample":
        lines.extend(
            [
                "> This report is using ContribScout sample fallback data.",
                "",
            ]
        )

    for index, opportunity in enumerate(opportunities[:MAX_OPPORTUNITIES], start=1):
        if isinstance(opportunity, dict):
            lines.extend(format_opportunity(index, opportunity, source))

    return "\n".join(lines).strip()


def main() -> int:
    api_url = os.getenv("CONTRIBSCOUT_API_URL", DEFAULT_API_URL)

    try:
        payload = fetch_payload(api_url)
        print(format_report(payload))
    except RuntimeError as error:
        print(f"ContribScout daily report failed: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
