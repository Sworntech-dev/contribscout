import {
  buildContributionBriefMarkdown,
} from "@/lib/contribution-brief";
import {
  buildDeveloperUpdateMessage,
  buildPrDescriptionTemplate,
  buildPrReadinessKitMarkdown,
} from "@/lib/pr-readiness-kit";
import type {
  AgentRunRequest,
  AgentRunResult,
  AgentRunSource,
  AgentRunStep,
  BusinessRationale,
  ContributionBrief,
  OpsRecommendation,
  PrReadinessKit,
  ProofVaultCandidate,
  SelectedOpportunity,
} from "@/lib/agent-run-types";
import type { ContributionBriefTarget, Opportunity } from "@/lib/types";

const DEFAULT_BUSINESS_GOAL =
  "Grow visibility for an AI agent tooling project through useful open-source contributions.";

const DEFAULT_TEAM_CONTEXT = "Small AI tooling team";

const STARTER_CHECKLIST = [
  "Read the README and installation notes.",
  "Check whether a CONTRIBUTING guide exists.",
  "Review open issues and maintainer labels.",
  "Confirm no duplicate PR already exists.",
  "Keep the first change small, useful, and easy to review.",
  "Save the issue or PR link as proof after submission.",
];

const DUPLICATE_GUARD = [
  "Search open PRs for similar changes.",
  "Search open issues for the same problem.",
  "Check closed PRs/issues if the context looks old.",
  "Confirm the issue is still open.",
  "Check the issue Development section for linked PRs.",
  "Avoid unrelated files.",
  "Confirm the PR preview only shows expected files.",
];

type RunAgentInput = {
  request: AgentRunRequest;
  opportunities: Opportunity[];
  source: AgentRunSource;
  notice?: string;
  scannedCount?: number;
  tokenConfigured?: boolean;
};

export function runContribScoutAgent({
  request,
  opportunities,
  source,
  notice,
  scannedCount,
  tokenConfigured,
}: RunAgentInput): AgentRunResult {
  if (!opportunities.length) {
    throw new Error("ContribScout Agent needs at least one opportunity to evaluate.");
  }

  const startedAt = new Date().toISOString();
  const businessGoal = normalizeText(request.businessGoal, DEFAULT_BUSINESS_GOAL);
  const teamContext = normalizeText(request.teamContext, DEFAULT_TEAM_CONTEXT);
  const maxOpportunities = clampMaxOpportunities(request.maxOpportunities);
  const considered = opportunities.slice(0, Math.max(maxOpportunities, 1));
  const ranked = rankOpportunities(considered, businessGoal, teamContext);
  const selected = ranked[0];
  const selectedReason = buildSelectedReason(selected, businessGoal, teamContext);
  const target = toContributionBriefTarget(selected, source);
  const contributionBriefMarkdown = buildContributionBriefMarkdown(target);
  const prKitMarkdown = buildPrReadinessKitMarkdown(target);
  const prDescriptionTemplate = buildPrDescriptionTemplate(target);
  const developerUpdateMessage = buildDeveloperUpdateMessage(target);
  const completedAt = new Date().toISOString();
  const selectedOpportunity = toSelectedOpportunity(selected);
  const businessRationale = buildBusinessRationale(selected, businessGoal, teamContext);
  const proofVaultCandidate = buildProofVaultCandidate(selected, completedAt);
  const opsRecommendation = buildOpsRecommendation(selected, teamContext);
  const steps = buildSteps(selected, completedAt, source);
  const contributionBrief: ContributionBrief = {
    title: "ContribScout Contribution Brief",
    markdown: contributionBriefMarkdown,
    starterChecklist: STARTER_CHECKLIST,
  };
  const prReadinessKit: PrReadinessKit = {
    title: "ContribScout PR Readiness Kit",
    markdown: prKitMarkdown,
    duplicateGuard: DUPLICATE_GUARD,
    prDescriptionTemplate,
    developerUpdateMessage,
  };
  const runId = createRunId(startedAt, selected.fullName);
  const markdownSummary = buildMarkdownSummary({
    runId,
    businessGoal,
    teamContext,
    startedAt,
    completedAt,
    source,
    notice,
    scannedCount: scannedCount ?? opportunities.length,
    consideredCount: considered.length,
    selectedReason,
    tokenConfigured,
    selectedOpportunity,
    businessRationale,
    proofVaultCandidate,
    opsRecommendation,
  });

  return {
    runId,
    businessGoal,
    teamContext,
    startedAt,
    completedAt,
    source,
    notice,
    scannedCount: scannedCount ?? opportunities.length,
    consideredCount: considered.length,
    selectedReason,
    tokenConfigured,
    steps,
    selectedOpportunity,
    businessRationale,
    contributionBrief,
    prReadinessKit,
    proofVaultCandidate,
    opsRecommendation,
    markdownSummary,
  };
}

function rankOpportunities(opportunities: Opportunity[], businessGoal: string, teamContext: string) {
  return [...opportunities].sort((a, b) => {
    const scoreDifference =
      agentSelectionScore(b, businessGoal, teamContext) - agentSelectionScore(a, businessGoal, teamContext);

    if (scoreDifference !== 0) return scoreDifference;
    if (b.roleOpportunityScore !== a.roleOpportunityScore) return b.roleOpportunityScore - a.roleOpportunityScore;
    return a.fullName.localeCompare(b.fullName);
  });
}

function agentSelectionScore(opportunity: Opportunity, businessGoal: string, teamContext: string) {
  const signals = opportunity.signals;
  const hasContributionPath =
    opportunity.openIssues > 0 ||
    signals.goodFirstIssueCount > 0 ||
    signals.helpWantedCount > 0 ||
    signals.hasContributing;
  const goalText = `${businessGoal} ${teamContext}`.toLowerCase();
  const opportunityText = [
    opportunity.name,
    opportunity.fullName,
    opportunity.description,
    opportunity.category,
    opportunity.language ?? "",
    ...opportunity.topics,
  ]
    .join(" ")
    .toLowerCase();
  const goalFit = goalKeywordScore(goalText, opportunityText);
  const categoryFit = categoryMatchScore(goalText, opportunity);
  const pathScore =
    Math.min(12, opportunity.openIssues) +
    Math.min(18, signals.goodFirstIssueCount * 6) +
    Math.min(14, signals.helpWantedCount * 5) +
    (signals.hasContributing ? 5 : 0);
  const documentationScore =
    (signals.readmeQuality === "thin" ? 10 : signals.readmeQuality === "basic" ? 7 : 0) +
    (!signals.hasDocsFolder ? 8 : signals.hasDocsFolder ? 3 : 0) +
    (!signals.hasContributing ? 7 : 0);
  const freshnessScore = signals.isFresh ? 10 : 0;
  const saturationScore = opportunity.stars < 250 ? 10 : opportunity.stars < 1000 ? 6 : opportunity.stars < 3000 ? 2 : -6;
  const noPathPenalty = hasContributionPath ? 0 : 18;
  const issueQualityPenalty =
    opportunity.openIssues === 0 && signals.goodFirstIssueCount === 0 && signals.helpWantedCount === 0 ? 12 : 0;

  return (
    opportunity.roleOpportunityScore +
    goalFit +
    categoryFit +
    pathScore +
    documentationScore +
    freshnessScore +
    saturationScore -
    noPathPenalty -
    issueQualityPenalty
  );
}

function goalKeywordScore(goalText: string, opportunityText: string) {
  const goalTerms = [
    "ai",
    "agent",
    "llm",
    "tool",
    "developer",
    "workflow",
    "automation",
    "web3",
    "crypto",
    "wallet",
    "defi",
    "zk",
    "docs",
    "visibility",
    "growth",
  ];

  return goalTerms.reduce((score, term) => {
    const goalHasTerm = goalText.includes(term);
    const opportunityHasTerm = opportunityText.includes(term);
    return score + (goalHasTerm && opportunityHasTerm ? 5 : opportunityHasTerm ? 1 : 0);
  }, 0);
}

function categoryMatchScore(goalText: string, opportunity: Opportunity) {
  const categoryText = [opportunity.category, opportunity.description, ...opportunity.topics].join(" ").toLowerCase();
  const groups = [
    ["ai", "agent", "llm", "automation"],
    ["web3", "crypto", "onchain", "wallet", "defi", "zk"],
    ["developer", "tool", "sdk", "cli", "workflow"],
    ["docs", "devrel", "visibility", "growth", "community"],
  ];

  return groups.reduce((score, group) => {
    const goalHit = group.some((term) => goalText.includes(term));
    const repoHit = group.some((term) => categoryText.includes(term));
    return score + (goalHit && repoHit ? 8 : 0);
  }, 0);
}

function buildSelectedReason(opportunity: Opportunity, businessGoal: string, teamContext: string) {
  const signals = opportunity.signals;
  const reasons = [
    `${opportunity.roleOpportunityScore}/100 Role Opportunity Score`,
    signals.isFresh ? "fresh project activity" : "usable contribution surface",
  ];

  if (signals.goodFirstIssueCount > 0) reasons.push(`${signals.goodFirstIssueCount} good first issue path`);
  if (signals.helpWantedCount > 0) reasons.push(`${signals.helpWantedCount} help wanted path`);
  if (opportunity.openIssues > 0) reasons.push(`${opportunity.openIssues} open issues`);
  if (signals.readmeQuality === "thin" || signals.readmeQuality === "basic") {
    reasons.push(`${signals.readmeQuality} README leaves room for contributor-facing improvements`);
  }
  if (!signals.hasContributing) reasons.push("missing CONTRIBUTING guide creates a clear onboarding gap");
  if (opportunity.stars < 1000) reasons.push("lower saturation gives a small team room to stand out");

  const goalFit = goalKeywordScore(
    `${businessGoal} ${teamContext}`.toLowerCase(),
    [opportunity.name, opportunity.fullName, opportunity.description, opportunity.category, ...opportunity.topics]
      .join(" ")
      .toLowerCase(),
  );

  if (goalFit >= 10) reasons.push("repo language/category aligns with the business goal");

  return `Selected ${opportunity.fullName} because it combines ${joinHumanList(reasons.slice(0, 5))}.`;
}

function buildBusinessRationale(
  opportunity: Opportunity,
  businessGoal: string,
  teamContext: string,
): BusinessRationale {
  const evidence = [
    `${opportunity.fullName} has a Role Opportunity Score of ${opportunity.roleOpportunityScore}/100.`,
    `${opportunity.openIssues} open issues are visible from the repository metadata.`,
    `${opportunity.signals.goodFirstIssueCount} good first issue and ${opportunity.signals.helpWantedCount} help wanted paths were detected.`,
    `README quality is ${opportunity.signals.readmeQuality}; docs folder is ${opportunity.signals.hasDocsFolder ? "present" : "missing"}.`,
  ];

  if (!opportunity.signals.hasContributing) {
    evidence.push("The missing CONTRIBUTING guide creates a low-risk contributor experience improvement angle.");
  }

  return {
    summary: `${opportunity.fullName} is the strongest contribution target for the goal: ${businessGoal}`,
    growthAngle: `${teamContext} can use a narrow, maintainer-friendly contribution to create public proof of usefulness in a related open-source ecosystem.`,
    whyNow: opportunity.signals.isFresh
      ? "The repository looks fresh enough that early, useful contribution signals can still stand out."
      : "The repository still has enough visible contribution surface to support a focused outreach or PR workflow.",
    highLeverageReason: buildHighLeverageReason(opportunity),
    immediateNextAction: opportunity.suggestedAction,
    riskToCheck: buildRiskToCheck(opportunity),
    evidence,
  };
}

function buildHighLeverageReason(opportunity: Opportunity) {
  const signals = opportunity.signals;

  if (signals.goodFirstIssueCount > 0 || signals.helpWantedCount > 0) {
    return "Maintainer labels create a warmer path than cold outreach, so a small accepted contribution can become visible DevRel proof quickly.";
  }

  if (!signals.hasContributing || signals.readmeQuality === "thin" || !signals.hasDocsFolder) {
    return "Contributor-facing docs gaps are high leverage because they improve the project for every future builder while keeping the first PR reviewable.";
  }

  if (opportunity.openIssues > 0) {
    return "Open issues provide concrete context for triage, reproduction notes, or a narrow fix that can start a useful maintainer conversation.";
  }

  return "The opportunity is best approached as a small discovery contribution: validate setup, document friction, and ask maintainers before expanding scope.";
}

function buildRiskToCheck(opportunity: Opportunity) {
  if (opportunity.openIssues === 0 && opportunity.signals.goodFirstIssueCount === 0 && opportunity.signals.helpWantedCount === 0) {
    return "No obvious issue path is visible. Check recent PRs/issues and consider opening a small discussion or setup-friction issue before coding.";
  }

  if (!opportunity.signals.hasContributing) {
    return "Contribution rules may be unclear. Check README, existing PR style, and maintainer expectations before submitting.";
  }

  return "Check for duplicate PRs/issues and keep the first PR narrow enough for a fast maintainer review.";
}

function buildProofVaultCandidate(opportunity: Opportunity, completedAt: string): ProofVaultCandidate {
  return {
    projectName: opportunity.fullName,
    actionTaken: opportunity.suggestedAction,
    proofLink: opportunity.url,
    status: "Planned",
    notes: `Agent-selected opportunity. Score reason: ${opportunity.scoreReason}`,
    date: completedAt.slice(0, 10),
  };
}

function buildOpsRecommendation(opportunity: Opportunity, teamContext: string): OpsRecommendation {
  const hasBeginnerPath = opportunity.signals.goodFirstIssueCount > 0 || opportunity.signals.helpWantedCount > 0;
  const hasDocsGap = !opportunity.signals.hasDocsFolder || opportunity.signals.readmeQuality !== "strong";

  return {
    priority: opportunity.roleOpportunityScore >= 75 && (hasBeginnerPath || hasDocsGap) ? "high" : "medium",
    nextMove: opportunity.suggestedAction,
    ownerHint: `${teamContext} should assign one contributor to validate scope before opening a PR.`,
    followUp: "After submission, save the PR or issue link in Proof Vault and reuse the summary in the next growth update.",
    successSignal: "A maintainer response, merged PR, or clear issue discussion that creates public proof of useful participation.",
  };
}

function buildSteps(opportunity: Opportunity, completedAt: string, source: AgentRunSource): AgentRunStep[] {
  return [
    {
      id: "load-opportunities",
      label: "Load opportunities",
      status: "completed",
      detail: source === "github" ? "Loaded live GitHub opportunity data from the scanner." : "Loaded sample fallback data from the scanner.",
      completedAt,
    },
    {
      id: "select-opportunity",
      label: "Select strongest opportunity",
      status: "completed",
      detail: `Selected ${opportunity.fullName} using score, freshness, issue paths, documentation gaps, saturation, and business fit.`,
      completedAt,
    },
    {
      id: "build-brief",
      label: "Build contribution brief",
      status: "completed",
      detail: "Generated a deterministic contribution brief from repository signals.",
      completedAt,
    },
    {
      id: "prepare-pr-kit",
      label: "Prepare PR readiness kit",
      status: "completed",
      detail: "Generated duplicate checks, PR copy, validation notes, and developer update text.",
      completedAt,
    },
    {
      id: "prepare-proof",
      label: "Prepare Proof Vault candidate",
      status: "completed",
      detail: "Prepared a local Proof Vault candidate for later evidence tracking.",
      completedAt,
    },
  ];
}

function toContributionBriefTarget(opportunity: Opportunity, source: AgentRunSource): ContributionBriefTarget {
  return {
    id: opportunity.url || opportunity.fullName,
    projectName: opportunity.fullName,
    fullName: opportunity.fullName,
    repoUrl: opportunity.url,
    score: opportunity.roleOpportunityScore,
    category: opportunity.category,
    suggestedAction: opportunity.suggestedAction,
    scoreReason: opportunity.scoreReason,
    isSample: source === "sample",
    signals: opportunity.signals,
    openIssues: opportunity.openIssues,
    stars: opportunity.stars,
  };
}

function toSelectedOpportunity(opportunity: Opportunity): SelectedOpportunity {
  return {
    name: opportunity.name,
    owner: opportunity.owner,
    fullName: opportunity.fullName,
    description: opportunity.description,
    url: opportunity.url,
    category: opportunity.category,
    roleOpportunityScore: opportunity.roleOpportunityScore,
    suggestedAction: opportunity.suggestedAction,
    scoreReason: opportunity.scoreReason,
    signalBadges: opportunity.signalBadges,
    openIssues: opportunity.openIssues,
    stars: opportunity.stars,
    forks: opportunity.forks,
    language: opportunity.language,
    topics: opportunity.topics,
    signals: opportunity.signals,
  };
}

function buildMarkdownSummary({
  runId,
  businessGoal,
  teamContext,
  startedAt,
  completedAt,
  source,
  notice,
  selectedOpportunity,
  businessRationale,
  proofVaultCandidate,
  opsRecommendation,
  scannedCount,
  consideredCount,
  selectedReason,
  tokenConfigured,
}: {
  runId: string;
  businessGoal: string;
  teamContext: string;
  startedAt: string;
  completedAt: string;
  source: AgentRunSource;
  notice?: string;
  scannedCount?: number;
  consideredCount?: number;
  selectedReason?: string;
  tokenConfigured?: boolean;
  selectedOpportunity: SelectedOpportunity;
  businessRationale: BusinessRationale;
  proofVaultCandidate: ProofVaultCandidate;
  opsRecommendation: OpsRecommendation;
}) {
  const lines = [
    "# ContribScout Agent Run",
    "",
    `Run ID: ${runId}`,
    `Started: ${startedAt}`,
    `Completed: ${completedAt}`,
    `Source: ${source}`,
    `GITHUB_TOKEN configured: ${tokenConfigured ? "yes" : "no"}`,
    `Scanned opportunities: ${scannedCount ?? "n/a"}`,
    `Considered opportunities: ${consideredCount ?? "n/a"}`,
  ];

  if (notice) {
    lines.push(`Notice: ${notice}`);
  }

  lines.push(
    "",
    "## Business Goal",
    "",
    businessGoal,
    "",
    `Team context: ${teamContext}`,
    "",
    "## Selected Opportunity",
    "",
    `- Project: ${selectedOpportunity.fullName}`,
    `- Repository: ${selectedOpportunity.url || "n/a"}`,
    `- Role Opportunity Score: ${selectedOpportunity.roleOpportunityScore}/100`,
    `- Category: ${selectedOpportunity.category}`,
    `- Suggested action: ${selectedOpportunity.suggestedAction}`,
    `- Score reason: ${selectedOpportunity.scoreReason}`,
    `- Selected reason: ${selectedReason ?? "Selected by deterministic agent ranking."}`,
    "",
    "## Business Rationale",
    "",
    businessRationale.summary,
    "",
    `Growth angle: ${businessRationale.growthAngle}`,
    `Why now: ${businessRationale.whyNow}`,
    `High leverage reason: ${businessRationale.highLeverageReason}`,
    `Immediate next action: ${businessRationale.immediateNextAction}`,
    `Risk to check: ${businessRationale.riskToCheck}`,
    "",
    "Evidence:",
    ...businessRationale.evidence.map((item) => `- ${item}`),
    "",
    "## Ops Recommendation",
    "",
    `- Priority: ${opsRecommendation.priority}`,
    `- Next move: ${opsRecommendation.nextMove}`,
    `- Owner hint: ${opsRecommendation.ownerHint}`,
    `- Follow-up: ${opsRecommendation.followUp}`,
    `- Success signal: ${opsRecommendation.successSignal}`,
    "",
    "## Proof Vault Candidate",
    "",
    `- Project: ${proofVaultCandidate.projectName}`,
    `- Action taken: ${proofVaultCandidate.actionTaken}`,
    `- Proof link: ${proofVaultCandidate.proofLink}`,
    `- Status: ${proofVaultCandidate.status}`,
    `- Notes: ${proofVaultCandidate.notes}`,
    `- Date: ${proofVaultCandidate.date}`,
  );

  return lines.join("\n").trim();
}

function clampMaxOpportunities(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 8;
  return Math.min(12, Math.max(1, Math.round(value)));
}

function normalizeText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function joinHumanList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function createRunId(startedAt: string, fullName: string) {
  const normalizedName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `csr-${startedAt.replace(/[^0-9]/g, "").slice(0, 14)}-${normalizedName.slice(0, 36)}`;
}
