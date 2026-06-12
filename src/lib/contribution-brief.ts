import type { ContributionBriefTarget, IssueActivity, ReadmeQuality } from "@/lib/types";

export function buildContributionBriefMarkdown(target: ContributionBriefTarget) {
  const generatedAt = new Date().toISOString();
  const issueLinks = getIssueLinks(target.repoUrl);
  const lines = [
    "# ContribScout Contribution Brief",
    "",
    `Generated: ${generatedAt}`,
    `Project: ${target.projectName}`,
    `Repository: ${target.repoUrl || "n/a"}`,
    `Role Opportunity Score: ${typeof target.score === "number" ? `${target.score}/100` : "n/a"}`,
    `Category: ${target.category || "open source"}`,
    `Suggested action: ${target.suggestedAction || "Review the project and choose a small first contribution."}`,
    `Score reason: ${target.scoreReason || "No score reason available."}`,
    "",
  ];

  if (target.watchlistStatus || target.watchlistNote) {
    lines.push(
      "## Watchlist Context",
      "",
      `- Status: ${target.watchlistStatus || "n/a"}`,
      `- Note: ${target.watchlistNote || "n/a"}`,
      "",
    );
  }

  lines.push("## Contribution Fit Signals", "");

  if (target.signals) {
    lines.push(
      `- Open issues: ${typeof target.openIssues === "number" ? target.openIssues : "n/a"}`,
      `- Good first issues: ${target.signals.goodFirstIssueCount}`,
      `- Help wanted: ${target.signals.helpWantedCount}`,
      `- README quality: ${labelForReadme(target.signals.readmeQuality)}`,
      `- Docs folder: ${target.signals.hasDocsFolder ? "Present" : "Missing"}`,
      `- CONTRIBUTING guide: ${target.signals.hasContributing ? "Present" : "Missing"}`,
      `- Issue activity: ${labelForActivity(target.signals.issueActivity)}`,
      `- Saturation: ${typeof target.stars === "number" && target.stars < 500 ? "Low" : "Moderate or unknown"}`,
    );
  } else {
    lines.push("- Full contribution fit signals are not available for this saved watchlist item.");
  }

  lines.push("");

  if (issueLinks) {
    lines.push(
      "## Issue Drill-down Links",
      "",
      `- Open issues: ${issueLinks.openIssues}`,
      `- Good first issues: ${issueLinks.goodFirstIssues}`,
      `- Help wanted: ${issueLinks.helpWanted}`,
      "",
    );
  }

  lines.push(
    "## Starter Checklist",
    "",
    "- Read README.",
    "- Check CONTRIBUTING guide if available.",
    "- Review open issues.",
    "- Confirm no duplicate PR already exists.",
    "- Run project setup locally if possible.",
    "- Keep first PR small and focused.",
    "",
    "## Suggested PR Approach",
    "",
    ...getSuggestedApproach(target).map((item) => `- ${item}`),
    "",
    "## Risk / Quality Checklist",
    "",
    "- Avoid broad rewrites or unsolicited architecture changes.",
    "- Keep the proposed change easy for maintainers to review.",
    "- Include reproduction notes, screenshots, or before/after examples when useful.",
    "- Mention any setup friction clearly and calmly.",
    "- Stop before touching security-sensitive code unless the maintainer asks.",
    "",
    "## Proof Tracking Reminder",
    "",
    "- Save the issue, PR, commit, or discussion link in Proof Vault after you submit or complete the work.",
  );

  return lines.join("\n").trim();
}

export function sanitizeFilename(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return cleaned || "project";
}

export function getContributionBriefFilename(target: ContributionBriefTarget) {
  return `contribscout-brief-${sanitizeFilename(target.projectName)}.md`;
}

function getSuggestedApproach(target: ContributionBriefTarget) {
  const signals = target.signals;
  const approach: string[] = [];

  if (signals?.readmeQuality === "missing" || signals?.readmeQuality === "thin") {
    approach.push("Start with README clarity, setup notes, or a small quickstart improvement.");
  }

  if (signals && !signals.hasDocsFolder) {
    approach.push("Look for a focused docs gap, such as installation steps, examples, or environment variables.");
  }

  if (signals && !signals.hasContributing) {
    approach.push("Suggest a lightweight contribution guide or clarify the setup path for first-time contributors.");
  }

  if (signals && signals.goodFirstIssueCount > 0) {
    approach.push("Pick one small good first issue and leave clear notes before opening a PR.");
  }

  if (signals && signals.helpWantedCount > 0) {
    approach.push("Check maintainer-requested help wanted tasks before inventing a new direction.");
  }

  if (typeof target.stars === "number" && target.stars < 500) {
    approach.push("Because saturation looks low, start with a small docs, test, or triage contribution that is easy to accept.");
  }

  if (!approach.length) {
    approach.push("Begin with issue triage, reproduction notes, or a small docs cleanup before changing code.");
  }

  return approach.slice(0, 4);
}

function getIssueLinks(repoUrl?: string) {
  if (!repoUrl || !isGithubRepoUrl(repoUrl)) return null;

  const baseUrl = repoUrl.replace(/\/$/, "");
  const goodFirstQuery = encodeURIComponent('is:issue is:open label:"good first issue"');
  const helpWantedQuery = encodeURIComponent('is:issue is:open label:"help wanted"');

  return {
    openIssues: `${baseUrl}/issues`,
    goodFirstIssues: `${baseUrl}/issues?q=${goodFirstQuery}`,
    helpWanted: `${baseUrl}/issues?q=${helpWantedQuery}`,
  };
}

function isGithubRepoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    return parsed.hostname === "github.com" && pathParts.length >= 2;
  } catch {
    return false;
  }
}

function labelForReadme(quality: ReadmeQuality) {
  return quality === "missing" ? "Missing" : quality === "thin" ? "Thin" : quality === "basic" ? "Basic" : "Strong";
}

function labelForActivity(activity: IssueActivity) {
  return activity === "active" ? "Active" : activity === "warming" ? "Warming" : "Quiet";
}
