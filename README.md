# ContribScout

ContribScout is a Hermes-powered contributor intelligence agent for discovering early Web3 and AI contribution opportunities.

It helps builders find projects where they can become useful before the obvious contribution paths are crowded. The first MVP is a Vercel-ready Next.js dashboard with a GitHub opportunity scanner, an original Role Opportunity Score, suggested contribution actions, and a small local Proof Vault.

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

The Proof Vault is a localStorage-backed MVP feature for saving contribution evidence. Users can save:

- project name
- action taken
- proof link
- status
- notes
- date

This keeps the first version simple while showing how ContribScout can evolve into a contributor portfolio and reporting workflow.

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
- Hermes skill sketch in Python

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
GITHUB_TOKEN=ghp_your_token_here
NEXT_PUBLIC_APP_NAME=ContribScout
```

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
| `GITHUB_TOKEN` | No | Optional GitHub token used by the server-side scanner. The app works without it using sample data. |
| `NEXT_PUBLIC_APP_NAME` | No | Public app name shown in metadata and UI. Defaults to `ContribScout`. |

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Keep the framework preset as Next.js.
4. Add `GITHUB_TOKEN` in Vercel Project Settings if you want live GitHub scanning.
5. Add `NEXT_PUBLIC_APP_NAME=ContribScout` if desired.
6. Deploy.

The app is safe to deploy without `GITHUB_TOKEN`; it will use sample data.

## Hermes Skill

The file `hermes/contribscout_skill.py` shows how Hermes could trigger a daily contribution report. The skill can read from a deployed ContribScout API endpoint or fall back to embedded sample-style opportunities.

In a production version, Hermes could run this once per day, summarize top opportunities, and route the report into the user's preferred workspace.

## Roadmap

- Add user role preferences such as docs, frontend, contracts, research, localization, and QA.
- Add filters for ecosystem, repo age, language, and contribution type.
- Add optional GitHub issue drill-down views.
- Add Proof Vault export.
- Add Hermes daily digest formatting.
- Add authenticated saved vault sync.
- Add richer evidence tracking for contribution history.
- Add external community sources later, after the GitHub-only MVP is solid.
