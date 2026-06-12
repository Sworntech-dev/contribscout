export type ReadmeQuality = "missing" | "thin" | "basic" | "strong";
export type IssueActivity = "quiet" | "warming" | "active";

export type RepositorySignals = {
  goodFirstIssueCount: number;
  helpWantedCount: number;
  hasContributing: boolean;
  hasDocsFolder: boolean;
  readmeQuality: ReadmeQuality;
  issueActivity: IssueActivity;
  isFresh: boolean;
  localizationOpportunity: boolean;
};

export type ScoutRepository = {
  name: string;
  owner: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  topics: string[];
  language: string | null;
  license: string | null;
  category: string;
  signals: RepositorySignals;
};

export type Opportunity = ScoutRepository & {
  roleOpportunityScore: number;
  scoreReason: string;
  suggestedAction: string;
  signalBadges: string[];
};

export type ProofEntry = {
  id: string;
  projectName: string;
  actionTaken: string;
  proofLink: string;
  status: "Planned" | "In progress" | "Submitted" | "Merged" | "Archived";
  notes: string;
  date: string;
};

export type WatchlistStatus = "Watching" | "Planned" | "In Progress" | "Submitted" | "Skipped";

export type WatchlistItem = {
  id: string;
  projectName: string;
  fullName: string;
  score: number;
  category: string;
  suggestedAction: string;
  scoreReason: string;
  repoUrl: string;
  savedAt: string;
  note: string;
  status: WatchlistStatus;
  briefMarkdown?: string;
  briefSavedAt?: string;
};

export type ContributionBriefTarget = {
  id: string;
  projectName: string;
  fullName?: string;
  repoUrl?: string;
  score?: number;
  category?: string;
  suggestedAction?: string;
  scoreReason?: string;
  watchlistStatus?: WatchlistStatus;
  watchlistNote?: string;
  signals?: RepositorySignals;
  openIssues?: number;
  stars?: number;
};

export type OpportunitySort = "best-match" | "highest-score" | "good-first" | "open-issues" | "low-saturation";

export type SmartFilterKey =
  | "score70"
  | "goodFirst"
  | "helpWanted"
  | "missingDocs"
  | "missingContributing"
  | "lowSaturation"
  | "openIssues"
  | "githubOnly";

export type RolePreset =
  | "first-pr"
  | "docs-fix"
  | "good-first"
  | "low-competition"
  | "high-score"
  | "ai-agent-tools"
  | "needs-contributing";

export type SmartFilterState = {
  activePreset: RolePreset | null;
  filters: Record<SmartFilterKey, boolean>;
  sort: OpportunitySort;
};
