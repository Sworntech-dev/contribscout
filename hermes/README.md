# ContribScout Hermes Skill Layer

ContribScout remains a standalone Vercel dashboard. The Hermes files in this folder provide a skill layer that consumes the ContribScout API and formats daily contribution reports. They do not host a Hermes runtime inside Vercel.

The newer Hermes-compatible package lives at `hermes/skills/contribscout/`.

## What It Does

There are two integration sketches:

- `contribscout_skill.py` is the original small Python sketch.
- `skills/contribscout/` follows Hermes Agent skill conventions with `SKILL.md` and `scripts/daily_report.py`.

The skill package fetches top opportunities from `https://contribscout.vercel.app/api/opportunities` by default, then formats the top 5 opportunities into Markdown.

## How Hermes Would Use It

A Hermes workflow could call the report script on a daily schedule, then deliver the report to a user workspace, inbox, or agent-assisted contributor workflow.

For local testing:

```bash
python hermes/skills/contribscout/scripts/daily_report.py
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
