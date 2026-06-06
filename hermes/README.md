# ContribScout Hermes Skill Layer

`contribscout_skill.py` is a small Hermes skill layer for ContribScout v0.1. It is not a hosted Hermes runtime inside the Vercel app.

## What It Does

The skill exposes two simple functions:

- `fetch_contribscout_opportunities()` reads top opportunities from a deployed ContribScout API when `CONTRIBSCOUT_APP_URL` is set, or falls back to local sample opportunities.
- `daily_contribution_report()` formats those opportunities into a short Hermes-ready daily report.

## How Hermes Would Use It

A Hermes workflow could call `daily_contribution_report()` on a daily schedule, then deliver the report to a user workspace, inbox, or agent-assisted contributor workflow.

For local testing:

```bash
python hermes/contribscout_skill.py
```

Example output:

```text
ContribScout daily contribution report

1. chaincraft (wallet developer tools)
   Role Opportunity Score: 91
   Suggested action: Help with a good first issue and leave clear reproduction notes.
   Repo: sample fallback
```

## Planned Next Step

Wire this skill layer into a real Hermes cron or daily report flow after the dashboard API and scoring model settle.
