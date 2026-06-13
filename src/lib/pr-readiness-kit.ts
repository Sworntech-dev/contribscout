import { sanitizeFilename } from "@/lib/contribution-brief";
import type { ContributionBriefTarget } from "@/lib/types";

export function buildPrReadinessKitMarkdown(target: ContributionBriefTarget) {
  const generatedAt = new Date().toISOString();
  const links = getGithubLinks(target.repoUrl);
  const branchName = sanitizeBranchName(`${getBranchPrefix(target)}/${target.projectName}-${target.suggestedAction || "contribution"}`);
  const description = buildPrDescriptionTemplate(target);
  const update = buildDeveloperUpdateMessage(target);
  const lines = [
    "# ContribScout PR Readiness Kit",
    "",
    `Generated: ${generatedAt}`,
    `Project: ${target.projectName}`,
    `Repository: ${target.repoUrl || "n/a"}`,
    `Role Opportunity Score: ${typeof target.score === "number" ? `${target.score}/100` : "n/a"}`,
    `Suggested action: ${target.suggestedAction || "Review the repo and prepare a small contribution."}`,
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

  lines.push(
    "## Duplicate Guard Checklist",
    "",
    "- Search open PRs for similar changes.",
    "- Search open issues for the same problem.",
    "- Check closed PRs/issues if the report looks old.",
    "- Confirm the issue is still open.",
    "- Check the issue Development section for linked PRs.",
    "- Keep the PR small.",
    "- Avoid unrelated files.",
    "- Confirm the PR preview shows only expected files.",
    "",
  );

  if (links) {
    lines.push(
      "## GitHub Links",
      "",
      `- Open PRs: ${links.openPrs}`,
      `- Closed PRs: ${links.closedPrs}`,
      `- Open issues: ${links.openIssues}`,
      `- Good first issues: ${links.goodFirstIssues}`,
      `- Help wanted: ${links.helpWanted}`,
      "",
    );
  }

  lines.push(
    "## Suggested Submission Details",
    "",
    `- Branch name: \`${branchName}\``,
    `- Commit summary: \`${buildCommitSummary(target)}\``,
    `- PR title: ${buildPrTitle(target)}`,
    "",
    "### PR Description Template",
    "",
    description,
    "",
    "### Validation Checklist",
    "",
    "- [ ] I searched existing PRs and issues for duplicates.",
    "- [ ] I kept the change small and focused.",
    "- [ ] I avoided unrelated files.",
    "- [ ] I ran the relevant setup, docs preview, tests, or manual checks I could run.",
    "- [ ] I used `References #issue` unless this fully resolves the issue.",
    "",
    "### Developer Update Message",
    "",
    update,
    "",
    "## Risk Flags",
    "",
    ...getRiskFlags(target).map((flag) => `- ${flag}`),
  );

  return lines.join("\n").trim();
}

export function buildPrDescriptionTemplate(target: ContributionBriefTarget) {
  return [
    "```markdown",
    "## Summary",
    "",
    `- ${target.suggestedAction || "Prepared a small focused contribution."}`,
    "",
    "## Context",
    "",
    `References #issue`,
    "",
    "> Use `Closes #issue` only if this PR fully resolves the issue.",
    "",
    "## Validation",
    "",
    "- [ ] Checked for duplicate PRs/issues.",
    "- [ ] Reviewed the changed files before submission.",
    "- [ ] Ran relevant local checks or documented why they were not run.",
    "```",
  ].join("\n");
}

export function buildDeveloperUpdateMessage(target: ContributionBriefTarget) {
  return [
    `I am preparing a small first contribution for ${target.projectName}.`,
    `Planned scope: ${target.suggestedAction || "a focused docs, triage, or setup improvement"}.`,
    "I will check for duplicate PRs/issues first and use `References #issue` unless the change fully resolves the issue.",
  ].join(" ");
}

export function sanitizeBranchName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "")
    .slice(0, 80);
}

export function getPrReadinessKitFilename(target: ContributionBriefTarget) {
  return `contribscout-pr-kit-${sanitizeFilename(target.projectName)}.md`;
}

function buildCommitSummary(target: ContributionBriefTarget) {
  const prefix = getCommitPrefix(target);
  const project = sanitizeFilename(target.projectName).replace(/-/g, " ");
  const action = target.suggestedAction?.toLowerCase() ?? "first contribution";

  if (action.includes("readme")) return `${prefix}: clarify README for ${project}`;
  if (action.includes("setup") || action.includes("install")) return `${prefix}: improve setup notes for ${project}`;
  if (action.includes("example") || action.includes("workflow")) return `${prefix}: add example workflow for ${project}`;
  if (action.includes("bug") || action.includes("fix")) return `${prefix}: address small issue in ${project}`;

  return `${prefix}: improve contribution path for ${project}`;
}

function buildPrTitle(target: ContributionBriefTarget) {
  const action = target.suggestedAction || "Improve contributor setup";
  return action.endsWith(".") ? action.slice(0, -1) : action;
}

function getBranchPrefix(target: ContributionBriefTarget) {
  const action = target.suggestedAction?.toLowerCase() ?? "";

  if (action.includes("bug") || action.includes("fix") || action.includes("reproduction")) return "fix";
  if (action.includes("config") || action.includes("workflow")) return "chore";
  return "docs";
}

function getCommitPrefix(target: ContributionBriefTarget) {
  const branchPrefix = getBranchPrefix(target);
  return branchPrefix === "fix" ? "fix" : branchPrefix === "chore" ? "chore" : "docs";
}

function getRiskFlags(target: ContributionBriefTarget) {
  const flags = [
    "Broad issue: use `References #issue`, not `Closes #issue`, unless the PR fully resolves it.",
  ];
  const action = target.suggestedAction ?? "";

  if (!target.repoUrl || !isGithubRepoUrl(target.repoUrl)) {
    flags.push("Missing or non-GitHub repo URL: verify repository and issue links manually.");
  }

  if (target.isSample) {
    flags.push("Sample fallback data: verify the real repository manually before preparing a PR.");
  }

  if (action.length > 90 || /\b(refactor|architecture|rewrite|migrate|overhaul)\b/i.test(action)) {
    flags.push("Large suggested action: keep the first PR smaller than the full idea.");
  }

  return flags;
}

function getGithubLinks(repoUrl?: string) {
  if (!repoUrl || !isGithubRepoUrl(repoUrl)) return null;

  const baseUrl = repoUrl.replace(/\/$/, "");
  const goodFirstQuery = encodeURIComponent('is:issue is:open label:"good first issue"');
  const helpWantedQuery = encodeURIComponent('is:issue is:open label:"help wanted"');

  return {
    openPrs: `${baseUrl}/pulls?q=${encodeURIComponent("is:pr is:open")}`,
    closedPrs: `${baseUrl}/pulls?q=${encodeURIComponent("is:pr is:closed")}`,
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
