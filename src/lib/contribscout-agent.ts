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

type GoalIntent = "ai-tooling" | "web3-devtools" | "devrel" | "general";

type SelectionBreakdown = {
  baseScore: number;
  freshness: number;
  issuePaths: number;
  docsOpportunity: number;
  saturation: number;
  goalFit: number;
  total: number;
  intent: GoalIntent;
  matchedTerms: string[];
};

type ScoredOpportunity = {
  opportunity: Opportunity;
  breakdown: SelectionBreakdown;
};

const AI_TERMS = ["ai", "agent", "llm", "mcp", "model", "automation", "workflow", "developer workflow", "tooling", "sdk"];
const WEB3_TERMS = ["web3", "wallet", "onchain", "crypto", "defi", "blockchain", "zk", "evm", "solidity", "typescript sdk", "sdk"];
const DEVREL_TERMS = ["devrel", "docs", "documentation", "readme", "contributing", "examples", "beginner", "onboarding", "community", "proof"];
const CLOSE_SCORE_DELTA = 10;

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
  const considered = opportunities.slice(0, Math.min(opportunities.length, Math.max(maxOpportunities, 12)));
  const ranked = rankOpportunities(considered, businessGoal, teamContext);
  const selectedRank = ranked[0];
  const selected = selectedRank.opportunity;
  const selectedReason = buildSelectedReason(selectedRank, businessGoal, teamContext);
  const target = toContributionBriefTarget(selected, source);
  const contributionBriefMarkdown = buildContributionBriefMarkdown(target);
  const prKitMarkdown = buildPrReadinessKitMarkdown(target);
  const prDescriptionTemplate = buildPrDescriptionTemplate(target);
  const developerUpdateMessage = buildDeveloperUpdateMessage(target);
  const completedAt = new Date().toISOString();
  const selectedOpportunity = toSelectedOpportunity(selected);
  const businessRationale = buildBusinessRationale(selected, businessGoal, teamContext, selectedRank);
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
  const scored = opportunities.map((opportunity) => ({
    opportunity,
    breakdown: agentSelectionScore(opportunity, businessGoal, teamContext),
  }));

  return scored.sort((a, b) => {
    const scoreDifference = b.breakdown.total - a.breakdown.total;

    if (
      Math.abs(scoreDifference) <= CLOSE_SCORE_DELTA &&
      Math.abs(b.breakdown.goalFit - a.breakdown.goalFit) >= 6
    ) {
      return b.breakdown.goalFit - a.breakdown.goalFit;
    }

    if (scoreDifference !== 0) return scoreDifference;
    if (b.breakdown.goalFit !== a.breakdown.goalFit) return b.breakdown.goalFit - a.breakdown.goalFit;
    if (b.opportunity.roleOpportunityScore !== a.opportunity.roleOpportunityScore) {
      return b.opportunity.roleOpportunityScore - a.opportunity.roleOpportunityScore;
    }
    return a.opportunity.fullName.localeCompare(b.opportunity.fullName);
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
  const opportunityText = buildOpportunitySearchText(opportunity);
  const intent = detectGoalIntent(goalText);
  const goalFit = goalIntentFit(intent, goalText, opportunity, opportunityText);
  const baseScore = opportunity.roleOpportunityScore * 0.62;
  const issuePaths =
    Math.min(10, opportunity.openIssues * 0.75) +
    Math.min(18, signals.goodFirstIssueCount * 7) +
    Math.min(14, signals.helpWantedCount * 5) +
    (signals.hasContributing ? 4 : 0);
  const docsOpportunity =
    (signals.readmeQuality === "thin" ? 12 : signals.readmeQuality === "basic" ? 8 : 0) +
    (!signals.hasDocsFolder ? 10 : signals.hasDocsFolder ? 2 : 0) +
    (!signals.hasContributing ? 8 : 0);
  const freshness = signals.isFresh ? 12 : 0;
  const saturation = opportunity.stars < 250 ? 12 : opportunity.stars < 1000 ? 7 : opportunity.stars < 3000 ? 2 : -8;
  const noPathPenalty = hasContributionPath ? 0 : 20;
  const issueQualityPenalty =
    opportunity.openIssues === 0 && signals.goodFirstIssueCount === 0 && signals.helpWantedCount === 0 ? 14 : 0;
  const total =
    baseScore +
    goalFit.score +
    issuePaths +
    docsOpportunity +
    freshness +
    saturation -
    noPathPenalty -
    issueQualityPenalty;

  return {
    baseScore,
    freshness,
    issuePaths,
    docsOpportunity,
    saturation,
    goalFit: goalFit.score,
    total,
    intent,
    matchedTerms: goalFit.matchedTerms,
  };
}

function buildOpportunitySearchText(opportunity: Opportunity) {
  return [
    opportunity.name,
    opportunity.fullName,
    opportunity.description,
    opportunity.category,
    opportunity.language ?? "",
    opportunity.suggestedAction,
    opportunity.scoreReason,
    ...opportunity.signalBadges,
    ...opportunity.topics,
  ]
    .join(" ")
    .toLowerCase();
}

function detectGoalIntent(goalText: string): GoalIntent {
  if (["web3", "onchain", "wallet", "crypto", "defi", "blockchain", "zk"].some((term) => termInText(term, goalText))) {
    return "web3-devtools";
  }

  if (["ai", "agent", "llm", "mcp"].some((term) => termInText(term, goalText))) {
    return "ai-tooling";
  }

  if (["devrel", "docs", "documentation", "examples", "readme", "community"].some((term) => termInText(term, goalText))) {
    return "devrel";
  }

  const scores = [
    { intent: "ai-tooling" as const, score: countTermMatches(goalText, AI_TERMS) },
    { intent: "web3-devtools" as const, score: countTermMatches(goalText, WEB3_TERMS) },
    { intent: "devrel" as const, score: countTermMatches(goalText, DEVREL_TERMS) },
  ].sort((a, b) => b.score - a.score);

  if (scores[0].score === 0) return "general";
  return scores[0].intent;
}

function goalIntentFit(intent: GoalIntent, goalText: string, opportunity: Opportunity, opportunityText: string) {
  if (intent === "ai-tooling") {
    const base = termFit(AI_TERMS, opportunityText, 11, 64);
    const exactBoost = ["ai", "agent", "llm", "mcp"].some((term) => termInText(term, opportunityText)) ? 10 : 0;
    return { score: Math.min(74, base.score + exactBoost), matchedTerms: base.matchedTerms };
  }
  if (intent === "web3-devtools") {
    const base = termFit(WEB3_TERMS, opportunityText, 11, 66);
    const exactBoost = ["web3", "wallet", "onchain", "crypto", "defi", "blockchain", "zk"].some((term) =>
      termInText(term, opportunityText),
    )
      ? 12
      : 0;
    const tsSdkBoost = termInText("typescript", opportunityText) || termInText("sdk", opportunityText) ? 7 : 0;
    return { score: Math.min(82, base.score + exactBoost + tsSdkBoost), matchedTerms: base.matchedTerms };
  }
  if (intent === "devrel") {
    const termScore = termFit(DEVREL_TERMS, opportunityText, 8, 40);
    const signals = opportunity.signals;
    const docsFit =
      (signals.readmeQuality === "thin" ? 16 : signals.readmeQuality === "basic" ? 11 : 0) +
      (!signals.hasDocsFolder ? 14 : 0) +
      (!signals.hasContributing ? 14 : 0) +
      Math.min(18, signals.goodFirstIssueCount * 6 + signals.helpWantedCount * 5) +
      (opportunity.openIssues > 0 ? 7 : 0);
    const matchedTerms = [...termScore.matchedTerms];

    if (!signals.hasDocsFolder) matchedTerms.push("docs gap");
    if (!signals.hasContributing) matchedTerms.push("contribution guide gap");
    if (signals.goodFirstIssueCount > 0) matchedTerms.push("good first issues");
    if (signals.helpWantedCount > 0) matchedTerms.push("help wanted");

    return { score: Math.min(86, termScore.score + docsFit), matchedTerms: uniqueTerms(matchedTerms) };
  }

  return {
    score: Math.min(30, goalKeywordScore(goalText, opportunityText) + categoryMatchScore(goalText, opportunity)),
    matchedTerms: [],
  };
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
    const goalHasTerm = termInText(term, goalText);
    const opportunityHasTerm = termInText(term, opportunityText);
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
    const goalHit = group.some((term) => termInText(term, goalText));
    const repoHit = group.some((term) => termInText(term, categoryText));
    return score + (goalHit && repoHit ? 8 : 0);
  }, 0);
}

function termFit(terms: string[], text: string, pointsPerTerm: number, maxScore: number) {
  const matchedTerms = terms.filter((term) => termInText(term, text));
  return {
    score: Math.min(maxScore, matchedTerms.length * pointsPerTerm),
    matchedTerms,
  };
}

function countTermMatches(text: string, terms: string[]) {
  return terms.filter((term) => termInText(term, text)).length;
}

function termInText(term: string, text: string) {
  if (term.includes(" ")) return text.includes(term);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function uniqueTerms(terms: string[]) {
  return Array.from(new Set(terms)).slice(0, 6);
}

function buildSelectedReason(scored: ScoredOpportunity, businessGoal: string, teamContext: string) {
  const opportunity = scored.opportunity;
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

  const goalReason = buildGoalFitReason(scored, businessGoal, teamContext);

  return `Selected ${opportunity.fullName} because it combines ${joinHumanList(reasons.slice(0, 4))}. ${goalReason}`;
}

function buildGoalFitReason(scored: ScoredOpportunity, businessGoal: string, teamContext: string) {
  const { breakdown } = scored;
  const matched = breakdown.matchedTerms.length ? ` Signals matched: ${joinHumanList(breakdown.matchedTerms.slice(0, 4))}.` : "";
  const context = `${businessGoal} ${teamContext}`;

  if (breakdown.intent === "ai-tooling") {
    return `It fits the AI/tooling growth goal by matching agent, LLM, automation, or developer-workflow intent.${matched}`;
  }
  if (breakdown.intent === "web3-devtools") {
    return `It fits the Web3 developer-tools goal by matching onchain, wallet, crypto, SDK, or infrastructure intent.${matched}`;
  }
  if (breakdown.intent === "devrel") {
    return `It fits the DevRel pipeline goal because the repo has documentation, onboarding, issue, or beginner-friendly contribution angles.${matched}`;
  }

  return `It best matched the requested goal context: ${context}.`;
}

function buildBusinessRationale(
  opportunity: Opportunity,
  businessGoal: string,
  teamContext: string,
  scored: ScoredOpportunity,
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
    highLeverageReason: `${buildHighLeverageReason(opportunity)} ${buildGoalFitReason(scored, businessGoal, teamContext)}`,
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
