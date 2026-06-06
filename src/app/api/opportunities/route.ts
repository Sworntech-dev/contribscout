import { NextResponse } from "next/server";
import { scoreOpportunity } from "@/lib/scoring";
import { sampleRepositories } from "@/lib/sample-data";
import type { Opportunity, RepositorySignals, ScoutRepository } from "@/lib/types";

export const dynamic = "force-dynamic";

const SEARCH_TERMS = [
  "web3",
  "ai agents",
  "llm tools",
  "crypto infrastructure",
  "zk",
  "defi",
  "wallet",
  "developer tools",
  "onchain app",
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
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
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

  const query = encodeURIComponent(
    `(${SEARCH_TERMS.map((term) => `"${term}"`).join(" OR ")}) stars:20..2500 pushed:>2025-01-01 archived:false`,
  );
  const result = await githubJson<{ items: GitHubSearchItem[] }>(
    `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=12`,
  );

  if (!result?.items?.length) {
    throw new Error("GitHub returned no repositories.");
  }

  const normalized = await Promise.all(
    result.items.slice(0, 8).map(async (item) => normalizeRepository(item, await getSignals(item))),
  );

  return normalized
    .map(scoreOpportunity)
    .sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);
}

export async function GET() {
  try {
    const opportunities = await fetchLiveOpportunities();
    return NextResponse.json({
      source: "github",
      updatedAt: new Date().toISOString(),
      opportunities,
    });
  } catch (error) {
    const opportunities = sampleRepositories
      .map(scoreOpportunity)
      .sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);

    return NextResponse.json({
      source: "sample",
      updatedAt: new Date().toISOString(),
      notice: error instanceof Error ? error.message : "Using sample opportunities.",
      opportunities,
    });
  }
}
