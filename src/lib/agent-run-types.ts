import type { Opportunity, RepositorySignals } from "@/lib/types";

export type AgentRunSource = "github" | "sample";

export type AgentRunRequest = {
  businessGoal: string;
  teamContext?: string;
  maxOpportunities?: number;
};

export type AgentRunStep = {
  id: string;
  label: string;
  status: "completed";
  detail: string;
  completedAt: string;
};

export type SelectedOpportunity = {
  name: string;
  owner: string;
  fullName: string;
  description: string;
  url: string;
  category: string;
  roleOpportunityScore: number;
  suggestedAction: string;
  scoreReason: string;
  signalBadges: string[];
  openIssues: number;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  signals: RepositorySignals;
};

export type BusinessRationale = {
  summary: string;
  growthAngle: string;
  whyNow: string;
  highLeverageReason: string;
  immediateNextAction: string;
  riskToCheck: string;
  evidence: string[];
};

export type ContributionBrief = {
  title: string;
  markdown: string;
  starterChecklist: string[];
};

export type PrReadinessKit = {
  title: string;
  markdown: string;
  duplicateGuard: string[];
  prDescriptionTemplate: string;
  developerUpdateMessage: string;
};

export type ProofVaultCandidate = {
  projectName: string;
  actionTaken: string;
  proofLink: string;
  status: "Planned";
  notes: string;
  date: string;
};

export type OpsRecommendation = {
  priority: "high" | "medium" | "low";
  nextMove: string;
  ownerHint: string;
  followUp: string;
  successSignal: string;
};

export type AgentRunResult = {
  runId: string;
  businessGoal: string;
  teamContext?: string;
  startedAt: string;
  completedAt: string;
  source: AgentRunSource;
  notice?: string;
  scannedCount?: number;
  consideredCount?: number;
  selectedReason?: string;
  tokenConfigured?: boolean;
  steps: AgentRunStep[];
  selectedOpportunity: SelectedOpportunity;
  businessRationale: BusinessRationale;
  contributionBrief: ContributionBrief;
  prReadinessKit: PrReadinessKit;
  proofVaultCandidate: ProofVaultCandidate;
  opsRecommendation: OpsRecommendation;
  markdownSummary: string;
};

export type AgentOpportunityPayload = {
  source: AgentRunSource;
  notice?: string;
  opportunities: Opportunity[];
};
