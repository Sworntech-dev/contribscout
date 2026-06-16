# ContribScout Hermes Skill Layer

ContribScout remains a standalone Vercel dashboard. The Hermes files in this folder provide a skill layer that consumes the ContribScout API and formats daily contribution reports. They do not host a Hermes runtime inside Vercel.

The daily report skill package lives at `hermes/skills/contribscout/`. The Hackathon Phase 1 agent workflow package lives at `hermes/skills/contribscout-agent/`.

## What It Does

There are two integration sketches:

- `contribscout_skill.py` is the original small Python sketch.
- `skills/contribscout/` follows Hermes Agent skill conventions with `SKILL.md` and `scripts/daily_report.py`.
- `skills/contribscout-agent/` calls `/api/agent/run` and formats a ContribScout Agent run for open-source growth operations.

The skill package fetches top opportunities from `https://contribscout.vercel.app/api/opportunities` by default, then formats the top 5 opportunities into Markdown.

The agent skill package posts a business goal to `https://contribscout.vercel.app/api/agent/run` by default. The API selects one opportunity from the current scanner results and returns a business rationale, contribution brief, PR readiness kit, Proof Vault candidate, operations recommendation, and Markdown summary.

Proof Vault export is separate from this Hermes skill package. Proof Vault reports are generated locally in the browser as Markdown or JSON and are not sent to Hermes automatically.

The v0.5 dashboard also includes a Daily Opportunity Report export. It produces a similar Markdown summary from the opportunities currently loaded in the browser, while this Hermes skill package remains the separate skill-layer path for scheduled or agent-assisted report generation.

The v0.6 Repo Watchlist complements this Markdown-report workflow by letting users keep a local contribution pipeline before moving completed work into Proof Vault. Watchlist data stays in the browser and is not sent to Hermes automatically.

The v0.7 Smart Filters and Role Presets help users shape the browser-side Markdown report and watchlist workflow before exporting or copying results.

The v0.8 Contribution Brief Builder complements the same Markdown workflow by creating a focused plan for one selected repo before a user starts a PR.

The v0.9 PR Readiness Kit extends the browser-side preparation flow with deterministic PR checklist and submission copy. Hermes can still consume reports separately through the skill package.

The v1.0 Mission Control redesign improves the standalone dashboard experience while keeping Hermes as a compatible skill layer, not a runtime hosted by the Vercel app.

## How Hermes Would Use It

A Hermes workflow could call the report script on a daily schedule, then deliver the report to a user workspace, inbox, or agent-assisted contributor workflow.

For local testing:

```bash
python hermes/skills/contribscout/scripts/daily_report.py
```

For a ContribScout Agent run:

```bash
python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Find high-leverage OSS contribution opportunities for an AI agent tooling project"
```

To use another ContribScout deployment, set `CONTRIBSCOUT_API_URL`.

Example output:

```markdown
# ContribScout Daily Contribution Report

- Source: github
- Notice: GitHub live scan returned limited matches.

## 1. project-name

- Score: 74/100
- Category: developer tools
- Suggested action: Test the quickstart and report friction.
- Reason: 74/100 because it shows fresh commits, docs can improve.
- Repository: https://github.com/example/project
```

## Planned Next Step

Wire `hermes/skills/contribscout/scripts/daily_report.py` into a real Hermes cron or daily report flow after the dashboard API and scoring model settle.
