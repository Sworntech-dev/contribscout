"""Hermes skill sketch for ContribScout daily opportunity reports.

This file is intentionally small for the MVP. In production, Hermes would call
`daily_contribution_report()` on a schedule and deliver the returned summary to
the user's preferred workspace.
"""

from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


SAMPLE_OPPORTUNITIES = [
    {
        "name": "chaincraft",
        "category": "wallet developer tools",
        "roleOpportunityScore": 91,
        "suggestedAction": "Help with a good first issue and leave clear reproduction notes.",
        "url": "",
    },
    {
        "name": "agent-mesh-kit",
        "category": "AI agent infrastructure",
        "roleOpportunityScore": 88,
        "suggestedAction": "Open a docs improvement issue proposing a lightweight contribution guide.",
        "url": "",
    },
    {
        "name": "zk-lab-notes",
        "category": "ZK education",
        "roleOpportunityScore": 84,
        "suggestedAction": "Write a beginner setup guide that turns the first run into a short checklist.",
        "url": "",
    },
]


def fetch_contribscout_opportunities(app_url: str | None = None) -> list[dict[str, Any]]:
    """Return top opportunities from a deployed app API or local sample data."""

    base_url = app_url or os.getenv("CONTRIBSCOUT_APP_URL")
    if not base_url:
        return SAMPLE_OPPORTUNITIES

    request = Request(
        f"{base_url.rstrip('/')}/api/opportunities",
        headers={"Accept": "application/json", "User-Agent": "Hermes-ContribScout-MVP"},
    )

    try:
        with urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, json.JSONDecodeError):
        return SAMPLE_OPPORTUNITIES

    return payload.get("opportunities", SAMPLE_OPPORTUNITIES)[:5]


def daily_contribution_report(app_url: str | None = None) -> str:
    """Build the daily Hermes report body for the highest leverage projects."""

    opportunities = fetch_contribscout_opportunities(app_url)
    lines = ["ContribScout daily contribution report", ""]

    for index, opportunity in enumerate(opportunities[:5], start=1):
        lines.extend(
            [
                f"{index}. {opportunity['name']} ({opportunity.get('category', 'open source')})",
                f"   Role Opportunity Score: {opportunity.get('roleOpportunityScore', 'n/a')}",
                f"   Suggested action: {opportunity.get('suggestedAction', 'Review the repo and choose a small contribution.')}",
                f"   Repo: {opportunity.get('url') or 'sample fallback'}",
                "",
            ]
        )

    return "\n".join(lines).strip()


if __name__ == "__main__":
    print(daily_contribution_report())
