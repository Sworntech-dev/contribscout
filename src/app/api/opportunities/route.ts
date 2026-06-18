import { NextResponse } from "next/server";
import { scoreOpportunity } from "@/lib/scoring";
import { sampleRepositories } from "@/lib/sample-data";
import type { Opportunity, RepositorySignals, ScoutRepository } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEARCH_KEYWORDS = [
  "ai agent",
  "llm agent",
  "mcp",
  "automation tooling",
  "web3",
  "crypto",
  "onchain",
  "defi",
  "wallet",
  "zk",
  "developer tools",
  "developer workflow",
  "documentation",
  "devrel",
  "github actions",
  "ci",
  "security",
  "dependencies",
  "config",
];

const FINAL_RESULT_LIMIT = 12;
const AGENT_RESULT_LIMIT = 40;
const SEARCH_RESULTS_PER_QUERY = 10;
const ENRICHMENT_LIMIT = 72;
const MIN_LIVE_RESULTS = 3;
const GITHUB_CACHE_TTL_MS = 10 * 60 * 1000;
const GITHUB_REQUEST_TIMEOUT_MS = 8000;

const RELEVANCE_TERMS = [
  "agent",
  "ai",
  "llm",
  "web3",
  "crypto",
  "onchain",
  "defi",
  "wallet",
  "zk",
  "developer",
  "tool",
  "sdk",
  "protocol",
];

const NOISE_TERMS = [
  "hello-world",
  "scratch",
  "tmp",
  "personal-test",
  "test-repo",
  "demo-only",
  "practice",
  "homework",
  "coursework",
];

const LOCALIZATION_CONTEXT_TERMS = [
  "docs",
  "documentation",
  "guide",
  "tutorial",
  "onboarding",
  "education",
  "learn",
  "community",
  "starter",
  "quickstart",
];

const GENERIC_STUFFING_TERMS = [
  "crypto",
  "web3",
  "ai",
  "agent",
  "defi",
  "wallet",
  "zk",
  "blockchain",
];

type GitHubSearchItem = {
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  topics?: string[];
  language: string | null;
  license: { name: string } | null;
  archived?: boolean;
  disabled?: boolean;
  fork?: boolean;
};

type GitHubApiPayload = {
  source: "github";
  updatedAt: string;
  notice?: string;
  opportunities: Opportunity[];
};

let githubSuccessCache: GitHubApiPayload | null = null;

const token = process.env.GITHUB_TOKEN;

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isoDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function keywordQuery(keyword: string, qualifier: string) {
  const term = keyword.includes(" ") ? `"${keyword}"` : keyword;
  return `${term} ${qualifier} archived:false fork:false`;
}

function daysSince(value: string) {
  return Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000));
}

function relevanceScore(item: GitHubSearchItem) {
  const topics = item.topics ?? [];
  const haystack = [
    item.name,
    item.full_name,
    item.description ?? "",
    item.language ?? "",
    ...topics,
  ]
    .join(" ")
    .toLowerCase();

  return RELEVANCE_TERMS.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function repeatedTermCount(text: string, term: string) {
  const matches = text.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"));
  return matches?.length ?? 0;
}

function maxRepeatedWordCount(text: string) {
  const counts = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .reduce((words, word) => words.set(word, (words.get(word) ?? 0) + 1), new Map<string, number>());

  return Math.max(0, ...Array.from(counts.values()));
}

function keywordStuffingPenalty(item: GitHubSearchItem) {
  const description = (item.description ?? "").toLowerCase();
  const genericRepeats = GENERIC_STUFFING_TERMS.reduce(
    (total, term) => total + Math.max(0, repeatedTermCount(description, term) - 1),
    0,
  );
  const wordRepeatPenalty = Math.max(0, maxRepeatedWordCount(description) - 3) * 3;
  const relevancePenalty = Math.max(0, relevanceScore(item) - 5) * 2;

  return genericRepeats * 4 + wordRepeatPenalty + relevancePenalty;
}

function looksNoisy(item: GitHubSearchItem) {
  const text = `${item.full_name} ${item.description ?? ""}`.toLowerCase();
  const isTinyOneOff = item.stargazers_count === 0 && item.open_issues_count === 0 && item.forks_count === 0;
  const suspiciousForkRatio = item.forks_count > 20 && item.forks_count > Math.max(3, item.stargazers_count * 4);
  const keywordStuffed = keywordStuffingPenalty(item) >= 14;

  return (
    NOISE_TERMS.some((term) => text.includes(term)) ||
    (isTinyOneOff && text.includes("test")) ||
    suspiciousForkRatio ||
    keywordStuffed
  );
}

function isMinimalLiveCandidate(item: GitHubSearchItem) {
  return (
    !item.archived &&
    !item.disabled &&
    !item.fork &&
    Boolean(item.description?.trim()) &&
    !looksNoisy(item)
  );
}

function isEmergencyLiveCandidate(item: GitHubSearchItem) {
  return Boolean(item.description?.trim()) && !looksNoisy(item);
}

function isLiveCandidate(item: GitHubSearchItem) {
  return isMinimalLiveCandidate(item) && relevanceScore(item) > 0;
}

function contributionSignalCount(repo: ScoutRepository) {
  const signals = repo.signals;
  return [
    repo.openIssues > 0,
    signals.goodFirstIssueCount > 0,
    signals.helpWantedCount > 0,
    signals.hasContributing,
    signals.hasDocsFolder,
    signals.readmeQuality === "basic" || signals.readmeQuality === "strong",
  ].filter(Boolean).length;
}

function isQualityLiveRepository(repo: ScoutRepository) {
  return repo.openIssues > 0 || contributionSignalCount(repo) >= 2;
}

function isUsableLiveRepository(repo: ScoutRepository) {
  return Boolean(repo.url && repo.description.trim());
}

function toSearchItem(repo: ScoutRepository): GitHubSearchItem {
  return {
    name: repo.name,
    full_name: repo.fullName,
    owner: { login: repo.owner },
    description: repo.description,
    html_url: repo.url,
    stargazers_count: repo.stars,
    forks_count: repo.forks,
    open_issues_count: repo.openIssues,
    created_at: repo.createdAt,
    updated_at: repo.updatedAt,
    topics: repo.topics,
    language: repo.language,
    license: repo.license ? { name: repo.license } : null,
  };
}

function isRelevantRepository(repo: ScoutRepository) {
  return relevanceScore(toSearchItem(repo)) > 0;
}

function liveRankingScore(repo: Opportunity) {
  const signals = repo.signals;
  const readmePoints = signals.readmeQuality === "strong" ? 12 : signals.readmeQuality === "basic" ? 8 : 0;
  const labelPoints = Math.min(16, (signals.goodFirstIssueCount + signals.helpWantedCount) * 4);
  const docsPoints = signals.hasDocsFolder ? 8 : 0;
  const issuePoints = Math.min(12, repo.openIssues);
  const freshnessPoints = daysSince(repo.updatedAt) <= 14 ? 12 : 4;
  const relevancePoints = Math.min(14, relevanceScore(toSearchItem(repo)) * 2);
  const noPathPenalty =
    repo.openIssues === 0 &&
    repo.signals.goodFirstIssueCount === 0 &&
    repo.signals.helpWantedCount === 0 &&
    !repo.signals.hasContributing
      ? 22
      : 0;
  const noisePenalty = keywordStuffingPenalty(toSearchItem(repo));

  return (
    repo.roleOpportunityScore +
    readmePoints +
    labelPoints +
    docsPoints +
    issuePoints +
    freshnessPoints +
    relevancePoints -
    noPathPenalty -
    noisePenalty
  );
}

async function searchRepositories(query: string, sort: "created" | "updated") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${SEARCH_RESULTS_PER_QUERY}`,
      {
        headers: githubHeaders(),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as { items: GitHubSearchItem[] };
    return result.items ?? [];
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function contentExists(owner: string, repo: string, path: string) {
  const result = await githubJson<unknown>(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  );
  return Boolean(result);
}

async function issueCount(owner: string, repo: string, label: string) {
  const query = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open label:"${label}"`);
  const result = await githubJson<{ total_count: number }>(
    `https://api.github.com/search/issues?q=${query}&per_page=1`,
  );
  return result?.total_count ?? 0;
}

async function readmeSignal(owner: string, repo: string) {
  const result = await githubJson<{ content?: string; size?: number }>(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
  );
  return {
    exists: Boolean(result),
    size: result?.size ?? 0,
  };
}

async function getSignals(item: GitHubSearchItem): Promise<RepositorySignals> {
  const owner = item.owner.login;
  const repo = item.name;

  const [
    goodFirstIssueCount,
    helpWantedCount,
    contributing,
    docs,
    readme,
  ] = await Promise.all([
    issueCount(owner, repo, "good first issue"),
    issueCount(owner, repo, "help wanted"),
    contentExists(owner, repo, "CONTRIBUTING.md"),
    contentExists(owner, repo, "docs"),
    readmeSignal(owner, repo),
  ]);

  const updatedAt = new Date(item.updated_at);
  const ageInDays = Math.max(
    1,
    Math.round((Date.now() - new Date(item.created_at).getTime()) / 86_400_000),
  );
  const daysSinceUpdate = Math.round((Date.now() - updatedAt.getTime()) / 86_400_000);
  const readmeQuality =
    !readme.exists ? "missing" : readme.size > 3500 ? "strong" : readme.size > 1200 ? "basic" : "thin";
  const context = [
    item.description ?? "",
    item.full_name,
    ...(item.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();
  const hasLocalizationContext = LOCALIZATION_CONTEXT_TERMS.some((term) => context.includes(term));
  const alreadyLocalizationFocused = item.topics?.some((topic) =>
    ["i18n", "l10n", "localization", "translation", "multilingual"].includes(topic),
  );

  return {
    goodFirstIssueCount,
    helpWantedCount,
    hasContributing: contributing,
    hasDocsFolder: docs,
    readmeQuality,
    issueActivity: item.open_issues_count > 12 ? "active" : item.open_issues_count > 3 ? "warming" : "quiet",
    isFresh: daysSinceUpdate <= 21 || ageInDays <= 180,
    localizationOpportunity:
      readme.exists &&
      (readmeQuality === "basic" || readmeQuality === "strong") &&
      (docs || contributing) &&
      hasLocalizationContext &&
      !alreadyLocalizationFocused,
  };
}

function normalizeRepository(item: GitHubSearchItem, signals: RepositorySignals): ScoutRepository {
  const topics = item.topics ?? [];
  const category =
    topics.find((topic) => ["web3", "ai", "agent", "defi", "zk", "wallet"].includes(topic)) ??
    (item.language ? `${item.language} project` : "open source project");

  return {
    name: item.name,
    owner: item.owner.login,
    fullName: item.full_name,
    description: item.description ?? "No description provided yet.",
    url: item.html_url,
    stars: item.stargazers_count,
    forks: item.forks_count,
    openIssues: item.open_issues_count,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    topics,
    language: item.language,
    license: item.license?.name ?? null,
    category,
    signals,
  };
}

async function fetchLiveOpportunities(resultLimit = FINAL_RESULT_LIMIT): Promise<{ opportunities: Opportunity[]; notice?: string }> {
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const createdSince = isoDateDaysAgo(60);
  const updatedSince = isoDateDaysAgo(30);
  const searches = SEARCH_KEYWORDS.flatMap((keyword) => [
    searchRepositories(keywordQuery(keyword, `created:>=${createdSince}`), "created"),
    searchRepositories(keywordQuery(keyword, `pushed:>=${updatedSince}`), "updated"),
  ]);
  const settledSearches = await Promise.allSettled(searches);
  const searchResponses = settledSearches.map((result) =>
    result.status === "fulfilled" ? result.value : null,
  );
  const partialFailures = searchResponses.some((result) => result === null);

  if (searchResponses.every((result) => result === null)) {
    throw new Error("GitHub API request failed.");
  }

  const searchResults = searchResponses.flatMap((result) => result ?? []);

  if (!searchResults.length) {
    throw new Error("GitHub Search returned zero repository items.");
  }

  const minimalCandidates = Array.from(
    searchResults
      .filter(isMinimalLiveCandidate)
      .reduce((repos, item) => {
        if (!repos.has(item.full_name)) {
          repos.set(item.full_name, item);
        }
        return repos;
      }, new Map<string, GitHubSearchItem>())
      .values(),
  );
  const emergencyCandidates = Array.from(
    searchResults
      .filter(isEmergencyLiveCandidate)
      .reduce((repos, item) => {
        if (!repos.has(item.full_name)) {
          repos.set(item.full_name, item);
        }
        return repos;
      }, new Map<string, GitHubSearchItem>())
      .values(),
  );

  const fallbackCandidates = searchResults.filter((item) => Boolean(item.description?.trim()));
  const candidates = (minimalCandidates.length ? minimalCandidates : emergencyCandidates.length ? emergencyCandidates : fallbackCandidates)
    .sort((a, b) => {
      const relevanceDifference = relevanceScore(b) - relevanceScore(a);
      if (relevanceDifference !== 0) return relevanceDifference;
      const updatedDifference = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (updatedDifference !== 0) return updatedDifference;
      return b.stargazers_count - a.stargazers_count;
    })
    .slice(0, ENRICHMENT_LIMIT);

  const normalized = await Promise.all(
    candidates.map(async (item) => normalizeRepository(item, await getSignals(item))),
  );

  const strictOpportunities = normalized
    .filter((repo) => isQualityLiveRepository(repo) && isRelevantRepository(repo))
    .map(scoreOpportunity)
    .sort((a, b) => liveRankingScore(b) - liveRankingScore(a))
    .slice(0, resultLimit);

  if (strictOpportunities.length >= MIN_LIVE_RESULTS) {
    return {
      opportunities: strictOpportunities,
      notice:
        strictOpportunities.length < resultLimit
          ? "GitHub live scan returned limited matches."
          : undefined,
    };
  }

  const relaxedOpportunities = normalized
    .filter((repo) => isUsableLiveRepository(repo) && (isQualityLiveRepository(repo) || isRelevantRepository(repo)))
    .map(scoreOpportunity)
    .sort((a, b) => liveRankingScore(b) - liveRankingScore(a))
    .slice(0, resultLimit);

  if (relaxedOpportunities.length >= MIN_LIVE_RESULTS) {
    return {
      opportunities: relaxedOpportunities,
      notice: "GitHub live scan returned limited matches.",
    };
  }

  const minimalOpportunities = normalized
    .filter(isUsableLiveRepository)
    .map(scoreOpportunity)
    .sort((a, b) => liveRankingScore(b) - liveRankingScore(a))
    .slice(0, resultLimit);

  return {
    opportunities: minimalOpportunities,
    notice: partialFailures
      ? "GitHub live scan returned limited matches after partial GitHub API issues."
      : "GitHub live scan returned limited matches.",
  };
}

function isFreshGithubCache() {
  return Boolean(
    githubSuccessCache &&
      Date.now() - new Date(githubSuccessCache.updatedAt).getTime() < GITHUB_CACHE_TTL_MS,
  );
}

function githubJsonResponse(payload: GitHubApiPayload) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function samplePayload(notice: string) {
  const opportunities = sampleRepositories
    .map(scoreOpportunity)
    .sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);

  return {
    source: "sample" as const,
    updatedAt: new Date().toISOString(),
    notice,
    opportunities,
  };
}

function sampleJsonResponse(notice: string) {
  const payload = samplePayload(notice);

  return NextResponse.json(
    payload,
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export async function getOpportunityPayload({
  resultLimit = FINAL_RESULT_LIMIT,
}: {
  resultLimit?: number;
} = {}) {
  const safeLimit = Math.min(AGENT_RESULT_LIMIT, Math.max(1, Math.round(resultLimit)));

  if (!token) {
    return samplePayload("GITHUB_TOKEN is not configured.");
  }

  if (isFreshGithubCache() && githubSuccessCache) {
    return {
      ...githubSuccessCache,
      opportunities: githubSuccessCache.opportunities.slice(0, safeLimit),
    };
  }

  try {
    const { opportunities, notice } = await fetchLiveOpportunities(AGENT_RESULT_LIMIT);
    const payload: GitHubApiPayload = {
      source: "github",
      updatedAt: new Date().toISOString(),
      notice,
      opportunities,
    };

    githubSuccessCache = payload;

    return {
      ...payload,
      opportunities: payload.opportunities.slice(0, safeLimit),
    };
  } catch (error) {
    if (githubSuccessCache) {
      return {
        ...githubSuccessCache,
        notice: "Showing cached GitHub results after a temporary GitHub API issue.",
        opportunities: githubSuccessCache.opportunities.slice(0, safeLimit),
      };
    }

    return samplePayload(error instanceof Error ? error.message : "Using sample opportunities.");
  }
}

export async function GET() {
  const payload = await getOpportunityPayload({ resultLimit: FINAL_RESULT_LIMIT });

  if (payload.source === "sample") {
    return sampleJsonResponse(payload.notice ?? "Using sample opportunities.");
  }

  return githubJsonResponse(payload);
}
