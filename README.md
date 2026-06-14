# ContribScout

ContribScout is a Hermes-ready contributor intelligence dashboard for discovering early Web3 and AI contribution opportunities.

It helps builders find projects where they can become useful before the obvious contribution paths are crowded. ContribScout is a Vercel-ready Next.js dashboard with a GitHub opportunity scanner, an original Role Opportunity Score, suggested contribution actions, a small local Proof Vault, and a Hermes-compatible skill package for daily report formatting.

## Why It Exists

Generic `good first issue` lists are useful, but they usually answer only one question: "Where is there an open beginner issue?"

ContribScout asks a broader contributor question:

> Where can a thoughtful contributor create visible value early?

That means looking at repository freshness, open contribution paths, documentation gaps, localization opportunities, issue activity, project saturation, and whether the project still has room for a new contributor to stand out.

## How It Works

The MVP uses a server-side Next.js API route to search GitHub for repositories related to:

- Web3
- AI agents
- LLM tools
- crypto infrastructure
- ZK
- DeFi
- wallets
- developer tools
- onchain apps

For each repository, ContribScout normalizes basic metadata such as owner, repo name, description, URL, stars, forks, open issues, dates, topics, language, and license. It then checks contributor-friendly signals:

- `good first issue`
- `help wanted`
- `CONTRIBUTING.md`
- README quality
- docs folder
- issue activity
- project freshness

If `GITHUB_TOKEN` is missing or GitHub requests fail, the app automatically falls back to sample opportunities so the dashboard remains demoable.

## Role Opportunity Score

The Role Opportunity Score is an original scoring module that estimates where a contributor can become useful early. It considers:

- early project activity
- open contribution paths
- issue quality
- documentation gaps
- localization opportunity
- project freshness
- saturation risk

The score is not a popularity score. A huge repository can have many issues and still be saturated. A smaller, fresh project with weak docs, active issues, and clear contribution paths can score higher because a new contributor has more room to make a meaningful mark.

## Suggested Actions

Each opportunity includes a short recommended action, such as:

- write a beginner setup guide
- help with a good first issue
- create a Turkish onboarding note
- review README clarity
- open a docs improvement issue
- contribute a small bugfix

## Proof Vault

The Proof Vault is a localStorage-backed feature for saving contribution evidence. Users can save:

- project name
- action taken
- proof link
- status
- notes
- date

In v0.3, Proof Vault can export local proof entries as Markdown or JSON. Markdown export is useful for project updates, applications, or personal contribution logs. JSON export is useful for backup or later restore work. Data remains local to the browser; no account or database is used.

In v0.4, project cards include Contribution Fit Details and GitHub issue drill-down links. These help builders move from "interesting repo" to "where do I start?" by exposing docs, issue, README, and contribution-guide signals directly on each card.

In v0.5, the dashboard adds a Daily Opportunity Report that turns the current top opportunities into Markdown. The report can be copied or downloaded and mirrors the kind of daily opportunity summary the Hermes-compatible skill package is designed to consume.

In v0.6, Repo Watchlist adds a local contribution pipeline for tracking interesting repositories before they become Proof Vault entries. Watchlist is for planned or in-progress opportunities; Proof Vault remains for completed or submitted contribution evidence.

In v0.7, Smart Filters and Role Presets help users narrow opportunities by contribution style, issue signals, score, and saturation. The Daily Opportunity Report uses the currently filtered results when filters are active.

In v0.8, Contribution Brief Builder turns one selected opportunity into a copy-ready Markdown plan before starting a PR. Briefs include repo context, contribution fit signals, issue links, starter checks, suggested approach, and proof tracking reminders.

In v0.9, PR Readiness Kit helps users prepare a clean open-source PR from an opportunity. It generates duplicate checks, GitHub review links, branch and commit suggestions, PR description copy, validation steps, developer update text, and risk flags.

In v1.0, Mission Control redesign upgrades the dashboard into a polished contribution cockpit. The update focuses on UI/UX clarity, workflow ordering, status visibility, premium dark styling, and making the contribution path from discovery to proof easier to understand.

In v1.0.1, the visual polish pass adds a more premium landing-page feel inspired by high-end agency design patterns without copying any brand or layout. The focus is first impression, editorial spacing, richer dark surfaces, muted green accents, warm CTAs, and clearer open-source workflow presentation.

In v1.0.2, Premium Scroll Experience adds section-level scene backgrounds, richer scroll depth, integrated hero workflow treatment, premium card hover states, and more cinematic visual pacing across the contribution workflow.

In v1.0.3, Cinematic Scroll Motion adds Framer Motion-powered scroll depth, parallax hero layers, animated section reveals, staggered workflow/card entrances, premium modal motion, and reduced-motion fallbacks.

In v1.0.4, Real Cinematic Landing Scroll adds a dedicated landing story before the dashboard: a full-screen hero, pinned scroll-driven workflow section, animated product cards, moving background gradients, and a clear handoff into Mission Control.

## What Makes It Different

ContribScout is not just a good-first-issue finder.

It combines repository context, contribution paths, documentation and localization gaps, freshness, and saturation risk into a contributor-first view. The goal is to help people choose where their effort can become legible, useful, and early.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel deployment target
- GitHub REST API with sample fallback
- localStorage Proof Vault
- Hermes skill layer in Python

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Optionally add a GitHub token:

```bash
GITHUB_TOKEN=<your_github_token>
NEXT_PUBLIC_APP_NAME=ContribScout
```

Never commit real tokens. Keep local secrets in `.env.local` and production secrets in Vercel Environment Variables.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | Optional GitHub token used by the server-side scanner. The app works without it by using sample fallback data. |
| `NEXT_PUBLIC_APP_NAME` | No | Public app name shown in metadata and UI. Defaults to `ContribScout`. |

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Keep the framework preset as Next.js.
4. Add `GITHUB_TOKEN` in Vercel Project Settings if you want live GitHub scanning.
5. Add `NEXT_PUBLIC_APP_NAME=ContribScout` if desired.
6. Deploy.

The app is safe to deploy without `GITHUB_TOKEN`; it will use sample data.

## Hermes Skill Layer

ContribScout is a standalone Vercel dashboard. The v0.2 Hermes integration adds a Hermes-compatible skill package at `hermes/skills/contribscout/`, alongside the earlier `hermes/contribscout_skill.py` sketch.

The skill package can fetch top contribution opportunities from `https://contribscout.vercel.app/api/opportunities` and format them as a Hermes-ready daily report. This supports an agent-assisted contributor workflow without claiming that Vercel hosts a Hermes runtime.

The v0.5 dashboard can also generate a Daily Opportunity Report from the currently loaded opportunities. This is a browser-side export from the standalone Vercel app, separate from running the Hermes skill package.

This is a Hermes skill layer, not a hosted Hermes runtime inside Vercel. A later version can wire the skill into a real Hermes cron or daily report flow.

See `hermes/README.md`, `hermes/skills/contribscout/SKILL.md`, and `hermes/sample_daily_report.md` for the current integration notes and sample output.

## Roadmap

- Add user role preferences such as docs, frontend, contracts, research, localization, and QA.
- Add filters for ecosystem, repo age, language, and contribution type.
- Add issue drill-down refinements.
- Add Hermes daily report.
- Add GitHub token live scan refinements.
- Add watchlist import/export polish.
- Add saved filter templates.
- Add authenticated saved vault sync.
- Add richer evidence tracking for contribution history.
- Add external community sources later, after the GitHub-only MVP is solid.
