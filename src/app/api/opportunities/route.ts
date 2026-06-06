import { NextResponse } from "next/server";
import { scoreOpportunity } from "@/lib/scoring";
import { sampleRepositories } from "@/lib/sample-data";
import type { Opportunity, RepositorySignals, ScoutRepository } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEARCH_KEYWORDS = [
  "ai agent",
  "llm agent",
  "web3",
  "crypto",
  "onchain",
  "defi",
  "wallet",
  "zk",
  "developer tools",
];

const FINAL_RESULT_LIMIT = 12;
const SEARCH_RESULTS_PER_QUERY = 8;
const ENRICHMENT_LIMIT = 24;
const MIN_LIVE_RESULTS = 3;

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
  "practice",
  "homework",
  "coursework",
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

const token = process.env.GITHUB_TOKEN;

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
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

function looksNoisy(item: GitHubSearchItem) {
  const text = `${item.full_name} ${item.description ?? ""}`.toLowerCase();
  const isTinyOneOff = item.stargazers_count === 0 && item.open_issues_count === 0 && item.forks_count === 0;

  return NOISE_TERMS.some((term) => text.includes(term)) || (isTinyOneOff && text.includes("test"));
}

function isLiveCandidate(item: GitHubSearchItem) {
  return (
    !item.archived &&
    !item.disabled &&
    !item.fork &&
    Boolean(item.description?.trim()) &&
    relevanceScore(item) > 0 &&
    !looksNoisy(item)
  );
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

function liveRankingScore(repo: Opportunity) {
  const signals = repo.signals;
  const readmePoints = signals.readmeQuality === "strong" ? 12 : signals.readmeQuality === "basic" ? 8 : 0;
  const labelPoints = Math.min(16, (signals.goodFirstIssueCount + signals.helpWantedCount) * 4);
  const docsPoints = signals.hasDocsFolder ? 8 : 0;
  const issuePoints = Math.min(12, repo.openIssues);
  const freshnessPoints = daysSince(repo.updatedAt) <= 14 ? 12 : 4;
  const relevancePoints = Math.min(14, relevanceScore({
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
  }) * 2);

  return repo.roleOpportunityScore + readmePoints + labelPoints + docsPoints + issuePoints + freshnessPoints + relevancePoints;
}

async function searchRepositories(query: string, sort: "created" | "updated") {
  const result = await githubJson<{ items: GitHubSearchItem[] }>(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${SEARCH_RESULTS_PER_QUERY}`,
  );

  return result?.items ?? [];
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

  return {
    goodFirstIssueCount,
    helpWantedCount,
    hasContributing: contributing,
    hasDocsFolder: docs,
    readmeQuality:
      !readme.exists ? "missing" : readme.size > 3500 ? "strong" : readme.size > 1200 ? "basic" : "thin",
    issueActivity: item.open_issues_count > 12 ? "active" : item.open_issues_count > 3 ? "warming" : "quiet",
    isFresh: daysSinceUpdate <= 21 || ageInDays <= 180,
    localizationOpportunity:
      readme.exists && readme.size > 800 && !item.topics?.some((topic) => topic.includes("i18n")),
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

async function fetchLiveOpportunities(): Promise<Opportunity[]> {
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const createdSince = isoDateDaysAgo(30);
  const updatedSince = isoDateDaysAgo(14);
  const searches = SEARCH_KEYWORDS.flatMap((keyword) => [
    searchRepositories(keywordQuery(keyword, `created:>=${createdSince}`), "created"),
    searchRepositories(keywordQuery(keyword, `pushed:>=${updatedSince}`), "updated"),
  ]);
  const searchResults = (await Promise.all(searches)).flat();
  const deduped = Array.from(
    searchResults
      .filter(isLiveCandidate)
      .reduce((repos, item) => {
        if (!repos.has(item.full_name)) {
          repos.set(item.full_name, item);
        }
        return repos;
      }, new Map<string, GitHubSearchItem>())
      .values(),
  );

  if (!deduped.length) {
    throw new Error("GitHub live scan returned no matches, showing sample fallback.");
  }

  const candidates = deduped
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

  const opportunities = normalized
    .filter(isQualityLiveRepository)
    .map(scoreOpportunity)
    .sort((a, b) => liveRankingScore(b) - liveRankingScore(a))
    .slice(0, FINAL_RESULT_LIMIT);

  if (opportunities.length < MIN_LIVE_RESULTS) {
    throw new Error("GitHub live scan returned fewer than 3 quality matches, showing sample fallback.");
  }

  return opportunities;
}

export async function GET() {
  try {
    const opportunities = await fetchLiveOpportunities();
    return NextResponse.json(
      {
        source: "github",
        updatedAt: new Date().toISOString(),
        opportunities,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    const opportunities = sampleRepositories
      .map(scoreOpportunity)
      .sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);

    return NextResponse.json(
      {
        source: "sample",
        updatedAt: new Date().toISOString(),
        notice: error instanceof Error ? error.message : "Using sample opportunities.",
        opportunities,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}
