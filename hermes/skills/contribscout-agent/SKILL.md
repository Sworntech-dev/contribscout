---
name: contribscout-agent
description: Run the ContribScout Agent workflow for open-source growth operations.
version: 0.1.0
author: Sworntech
license: MIT
platforms: [windows, macos, linux]
metadata:
  hermes:
    tags:
      - contribution-intelligence
      - open-source-growth
      - github
      - developer-tools
      - pr-workflow
required_environment_variables:
  - name: CONTRIBSCOUT_API_URL
    required: false
    default: https://contribscout.vercel.app
    description: Base URL for the ContribScout dashboard API.
  - name: STRIPE_SECRET_KEY
    required: false
    description: Optional test-mode Stripe secret key for the dashboard provisioning endpoint. The skill script does not require it.
---

# ContribScout Agent Skill

Use this skill when Hermes needs to turn a business or growth goal into a concrete open-source contribution workflow using ContribScout data.

ContribScout remains a standalone Vercel dashboard. This skill is a Hermes-compatible skill layer that calls the ContribScout Agent API and formats the returned run as Markdown. It does not host Hermes inside Vercel, create PRs, or perform external actions by itself.

## What It Does

The skill calls:

```text
POST /api/agent/run
```

with a business goal such as:

```text
Grow visibility for an AI agent tooling project through useful open-source contributions.
```

The API returns a structured agent run with:

- selected opportunity
- business rationale
- contribution brief
- PR readiness kit
- Proof Vault candidate
- operations recommendation
- markdown summary

The dashboard also includes an optional provisioning step at `POST /api/ops/provision`. That endpoint requires
`STRIPE_SECRET_KEY` with a Stripe test-mode key. If it is missing, ContribScout returns a clear `not_configured`
status and does not create a fake checkout URL.

## Run Locally

```bash
python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Find high-leverage OSS contribution opportunities for an AI agent tooling project"
```

To point at a local development server:

```bash
CONTRIBSCOUT_API_URL=http://localhost:3000 python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Find high-leverage OSS contribution opportunities for an AI agent tooling project"
```

On PowerShell:

```powershell
$env:CONTRIBSCOUT_API_URL="http://localhost:3000"
python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Find high-leverage OSS contribution opportunities for an AI agent tooling project"
```

## Expected Output

The script prints a Markdown report headed:

```text
# ContribScout Agent Run
```

If ContribScout is using sample fallback data, the report includes `Source: sample` and the API notice. If live GitHub data is available, the report includes `Source: github`.

## Verification

The skill worked if:

- the script exits with status code `0`
- Markdown is printed to stdout
- the output includes a run ID, selected opportunity, rationale, and operations recommendation

## Pitfalls

- If the ContribScout API is unavailable, the script exits non-zero with a concise error.
- If `GITHUB_TOKEN` is missing in the deployed dashboard environment, ContribScout may return sample fallback data.
- If GitHub returns limited matches, the report should still mark `Source: github` when live repositories are used.
- The optional Stripe provisioning step requires a test-mode `STRIPE_SECRET_KEY`; missing Stripe setup should be treated as a setup state, not a successful provision.
- This skill does not submit PRs or write Proof Vault entries automatically; it prepares the workflow artifacts for a human or a later Hermes flow.
