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
};

export function runContribScoutAgent({
  request,
  opportunities,
  source,
  notice,
}: RunAgentInput): AgentRunResult {
  if (!opportunities.length) {
    throw new Error("ContribScout Agent needs at least one opportunity to evaluate.");
  }

  const startedAt = new Date().toISOString();
  const businessGoal = normalizeText(request.businessGoal, DEFAULT_BUSINESS_GOAL);
  const teamContext = normalizeText(request.teamContext, DEFAULT_TEAM_CONTEXT);
  const maxOpportunities = clampMaxOpportunities(request.maxOpportunities);
  const ranked = rankOpportunities(opportunities.slice(0, Math.max(maxOpportunities, 1)), businessGoal, teamContext);
  const selected = ranked[0];
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
  const pathScore =
    Math.min(12, opportunity.openIssues) +
    Math.min(14, signals.goodFirstIssueCount * 5) +
    Math.min(12, signals.helpWantedCount * 4) +
    (signals.hasContributing ? 6 : 0);
  const documentationScore =
    (signals.readmeQuality === "thin" || signals.readmeQuality === "basic" ? 8 : 0) +
    (!signals.hasDocsFolder ? 6 : 0) +
    (!signals.hasContributing ? 5 : 0);
  const freshnessScore = signals.isFresh ? 8 : 0;
  const saturationScore = opportunity.stars < 500 ? 7 : opportunity.stars < 2000 ? 3 : -5;
  const noPathPenalty = hasContributionPath ? 0 : 18;

  return (
    opportunity.roleOpportunityScore +
    goalFit +
    pathScore +
    documentationScore +
    freshnessScore +
    saturationScore -
    noPathPenalty
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
    summary: `${opportunity.fullName} is the strongest fit for the goal: ${businessGoal}`,
    growthAngle: `${teamContext} can create visible value by making a small, reviewable contribution that improves the project's contributor path.`,
    whyNow: opportunity.signals.isFresh
      ? "The repository looks fresh enough that early, useful contribution signals can still stand out."
      : "The repository still has enough visible contribution surface to support a focused outreach or PR workflow.",
    evidence,
  };
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
      detail: `Loaded opportunity data from ${source}.`,
      completedAt,
    },
    {
      id: "select-opportunity",
      label: "Select strongest opportunity",
      status: "completed",
      detail: `Selected ${opportunity.fullName} using score, contribution signals, freshness, and business fit.`,
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
}: {
  runId: string;
  businessGoal: string;
  teamContext: string;
  startedAt: string;
  completedAt: string;
  source: AgentRunSource;
  notice?: string;
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
    "",
    "## Business Rationale",
    "",
    businessRationale.summary,
    "",
    `Growth angle: ${businessRationale.growthAngle}`,
    `Why now: ${businessRationale.whyNow}`,
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

function createRunId(startedAt: string, fullName: string) {
  const normalizedName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `csr-${startedAt.replace(/[^0-9]/g, "").slice(0, 14)}-${normalizedName.slice(0, 36)}`;
}
