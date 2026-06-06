---
name: contribscout
description: Fetch and summarize early contribution opportunities from the ContribScout API.
version: 0.2.0
author: Sworntech
license: MIT
platforms: [windows, macos, linux]
metadata:
  hermes:
    tags:
      - contribution-intelligence
      - github
      - open-source
      - developer-tools
      - daily-report
required_environment_variables:
  - name: CONTRIBSCOUT_API_URL
    required: false
    default: https://contribscout.vercel.app/api/opportunities
    description: Optional ContribScout API endpoint for fetching opportunity data.
---

# ContribScout

Use this skill when Hermes should prepare an agent-assisted contributor workflow report from ContribScout opportunity data.

ContribScout remains a standalone Vercel dashboard. This skill package is a Hermes skill layer that consumes the ContribScout API and formats a daily contribution report. It is not a hosted Hermes runtime inside Vercel.

## What This Skill Does

- Fetches opportunity data from `CONTRIBSCOUT_API_URL`.
- Defaults to `https://contribscout.vercel.app/api/opportunities`.
- Formats the top 5 projects into Markdown.
- Includes source, notice, project name, Role Opportunity Score, category, suggested action, score reason, and repository URL when available.
- Calls out sample fallback clearly when the API reports `source: sample`.

## Run The Report

```bash
python hermes/skills/contribscout/scripts/daily_report.py
```

To point at another deployment:

```bash
CONTRIBSCOUT_API_URL=https://your-app.vercel.app/api/opportunities python hermes/skills/contribscout/scripts/daily_report.py
```

## Output Format

The script prints Markdown:

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

## Verify It Worked

1. Run the script.
2. Confirm the output starts with `# ContribScout Daily Contribution Report`.
3. Confirm `Source` is either `github` or `sample`.
4. Confirm at least one opportunity appears under a numbered heading.

## Pitfalls

- If the API is unavailable, the script exits gracefully with a clear error message.
- If the dashboard API reports sample fallback, the report labels it as sample data.
- If GitHub returns limited matches, the report includes the API notice instead of hiding that context.
- Do not pass GitHub tokens to this skill. The Vercel app handles GitHub access server-side.
