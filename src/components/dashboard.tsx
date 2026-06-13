"use client";

import { useEffect, useMemo, useState } from "react";
import { ContributionBriefModal } from "@/components/contribution-brief-modal";
import { DailyOpportunityReport } from "@/components/daily-opportunity-report";
import { OpportunityCard } from "@/components/opportunity-card";
import { PrReadinessKitModal } from "@/components/pr-readiness-kit-modal";
import { ProofVault } from "@/components/proof-vault";
import { RepoWatchlist } from "@/components/repo-watchlist";
import { SmartFilters } from "@/components/smart-filters";
import type {
  ContributionBriefTarget,
  Opportunity,
  OpportunitySort,
  RolePreset,
  SmartFilterKey,
  SmartFilterState,
  WatchlistItem,
} from "@/lib/types";

type ApiResponse = {
  source: "github" | "sample";
  updatedAt: string;
  notice?: string;
  opportunities: Opportunity[];
};

const WATCHLIST_STORAGE_KEY = "contribscout.watchlist.v1";
const FILTER_STORAGE_KEY = "contribscout.filters.v1";

const defaultSmartFilters: SmartFilterState = {
  activePreset: null,
  sort: "best-match",
  filters: {
    score70: false,
    goodFirst: false,
    helpWanted: false,
    missingDocs: false,
    missingContributing: false,
    lowSaturation: false,
    openIssues: false,
    githubOnly: false,
  },
};

const presetLabels: Record<RolePreset, string> = {
  "first-pr": "First PR",
  "docs-fix": "Docs Fix",
  "good-first": "Good First Issues",
  "low-competition": "Low Competition",
  "high-score": "High Score",
  "ai-agent-tools": "AI / Agent Tools",
  "needs-contributing": "Needs CONTRIBUTING",
};

const filterLabels: Record<SmartFilterKey, string> = {
  score70: "Score 70+",
  goodFirst: "Good first issues",
  helpWanted: "Help wanted",
  missingDocs: "Missing docs",
  missingContributing: "Missing CONTRIBUTING",
  lowSaturation: "Low saturation",
  openIssues: "Open issues",
  githubOnly: "GitHub source only",
};

const sortLabels: Record<OpportunitySort, string> = {
  "best-match": "Best match",
  "highest-score": "Highest score",
  "good-first": "Most good first issues",
  "open-issues": "Most open issues",
  "low-saturation": "Lowest saturation",
};

export function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [source, setSource] = useState<"github" | "sample" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [smartFilters, setSmartFilters] = useState<SmartFilterState>(defaultSmartFilters);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [briefTarget, setBriefTarget] = useState<ContributionBriefTarget | null>(null);
  const [prKitTarget, setPrKitTarget] = useState<ContributionBriefTarget | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadOpportunities() {
      try {
        const response = await fetch("/api/opportunities", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const data = (await response.json()) as ApiResponse;

        if (!alive) return;
        setOpportunities(data.opportunities);
        setSource(data.source);
        setError(data.notice ?? null);
      } catch {
        if (!alive) return;
        setError("Live scan unavailable. Try refreshing the scanner.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOpportunities();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (saved) {
      queueMicrotask(() => setWatchlist(JSON.parse(saved) as WatchlistItem[]));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    let nextFilters = defaultSmartFilters;

    try {
      const saved = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        nextFilters = normalizeFilterState(JSON.parse(saved));
      }
    } catch {
      nextFilters = defaultSmartFilters;
    }

    queueMicrotask(() => {
      setSmartFilters(nextFilters);
      setFiltersHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(smartFilters));
  }, [filtersHydrated, smartFilters]);

  const filteredOpportunities = useMemo(
    () => getFilteredOpportunities(opportunities, smartFilters, source),
    [opportunities, smartFilters, source],
  );
  const filtersActive = isSmartFilterActive(smartFilters);
  const activeFilterSummary = getActiveFilterSummary(smartFilters);
  const topOpportunity = filteredOpportunities[0];
  const averageScore = useMemo(() => {
    const total = filteredOpportunities.reduce((sum, opportunity) => sum + opportunity.roleOpportunityScore, 0);
    return Math.round(total / Math.max(filteredOpportunities.length, 1));
  }, [filteredOpportunities]);
  const isSampleFallback = source === "sample";
  const sourceLabel = loading && !source ? "scanning" : isSampleFallback ? "sample fallback" : "github";

  function toggleFilter(key: SmartFilterKey) {
    setSmartFilters((current) => ({
      activePreset: null,
      sort: current.sort,
      filters: {
        ...current.filters,
        [key]: !current.filters[key],
      },
    }));
  }

  function selectPreset(preset: RolePreset) {
    setSmartFilters((current) => ({
      activePreset: current.activePreset === preset ? null : preset,
      sort: current.activePreset === preset ? "best-match" : presetSort(preset),
      filters: { ...defaultSmartFilters.filters },
    }));
  }

  function changeSort(sort: OpportunitySort) {
    setSmartFilters((current) => ({ ...current, sort }));
  }

  function clearFilters() {
    setSmartFilters(defaultSmartFilters);
  }

  function isInWatchlist(opportunity: Opportunity) {
    const repoUrl = opportunity.url.toLowerCase();
    const projectName = opportunity.name.toLowerCase();

    return watchlist.some((item) => {
      const savedUrl = item.repoUrl.toLowerCase();
      const savedName = item.projectName.toLowerCase();
      return (repoUrl && savedUrl === repoUrl) || savedName === projectName;
    });
  }

  function saveToWatchlist(opportunity: Opportunity) {
    if (isInWatchlist(opportunity)) return;

    setWatchlist((current) => [
      {
        id: crypto.randomUUID(),
        projectName: opportunity.name,
        fullName: opportunity.fullName,
        score: opportunity.roleOpportunityScore,
        category: opportunity.category,
        suggestedAction: opportunity.suggestedAction,
        scoreReason: opportunity.scoreReason,
        repoUrl: opportunity.url,
        savedAt: new Date().toISOString(),
        note: "",
        status: "Watching",
      },
      ...current,
    ]);
  }

  function updateWatchlistItem(
    id: string,
    updates: Partial<Pick<WatchlistItem, "note" | "status">>,
  ) {
    setWatchlist((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function removeWatchlistItem(id: string) {
    setWatchlist((current) => current.filter((item) => item.id !== id));
  }

  function createBriefFromOpportunity(opportunity: Opportunity) {
    const savedItem = findWatchlistItemForOpportunity(watchlist, opportunity);
    setBriefTarget(opportunityToBriefTarget(opportunity, isSampleFallback, savedItem));
  }

  function createBriefFromWatchlist(item: WatchlistItem) {
    setBriefTarget(watchlistItemToBriefTarget(item));
  }

  function createPrKitFromOpportunity(opportunity: Opportunity) {
    const savedItem = findWatchlistItemForOpportunity(watchlist, opportunity);
    setPrKitTarget(opportunityToBriefTarget(opportunity, isSampleFallback, savedItem));
  }

  function createPrKitFromWatchlist(item: WatchlistItem) {
    setPrKitTarget(watchlistItemToBriefTarget(item));
  }

  function saveBriefToWatchlist(target: ContributionBriefTarget, markdown: string) {
    const savedItem = findWatchlistItemForBriefTarget(watchlist, target);
    if (!savedItem) return;

    setWatchlist((current) =>
      current.map((item) =>
        item.id === savedItem.id ? { ...item, briefMarkdown: markdown, briefSavedAt: new Date().toISOString() } : item,
      ),
    );
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-mint/40 bg-mint/10 text-sm font-black text-mint">
              CS
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">ContribScout</p>
              <span className="rounded-md border border-mint/25 bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
                Hermes Skill Layer
              </span>
            </div>
          </div>
          <a
            href="#proof-vault"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-mint/50 hover:text-white"
          >
            Proof Vault
          </a>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl py-8 sm:py-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-mint">
              Early contribution radar
            </p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              Find early open-source projects where your contribution can matter early.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              ContribScout scans GitHub signals, scores contribution leverage, and turns noisy repo discovery
              into a short list of useful next actions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-mint">
                Role Opportunity Score
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                Sample fallback ready
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                Vercel deployable
              </span>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-panel/80 p-5 shadow-glow">
            <p className="text-sm text-slate-400">Current scan</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric
                label="Projects"
                value={
                  opportunities.length
                    ? `${filteredOpportunities.length}/${opportunities.length}`
                    : opportunities.length.toString()
                }
              />
              <Metric label="Avg score" value={filteredOpportunities.length ? averageScore.toString() : "-"} />
              <Metric label="Source" value={sourceLabel} />
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">Top lead</p>
              <p className="mt-2 text-xl font-bold text-white">
                {topOpportunity?.name ?? (opportunities.length ? "No matching opportunities" : "Running live GitHub scan...")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {topOpportunity?.suggestedAction ??
                  (opportunities.length
                    ? "Clear filters or choose a broader preset to see more projects."
                    : "Fetching current repositories before showing fallback data.")}
              </p>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {loading ? "Running live GitHub scan..." : error ?? "Live GitHub scanner returned normalized opportunities."}
            </p>
          </div>
        </section>

        <SmartFilters
          state={smartFilters}
          totalCount={opportunities.length}
          filteredCount={filteredOpportunities.length}
          activeSummary={activeFilterSummary}
          onToggleFilter={toggleFilter}
          onSelectPreset={selectPreset}
          onSortChange={changeSort}
          onClear={clearFilters}
        />

        <section id="top-opportunities" className="space-y-4">
          <SectionHeader
            kicker="Top Opportunities"
            title="Projects ranked by contributor leverage"
            body="The scanner favors useful entry points, fresh activity, documentation gaps, and room to be noticed."
          />
          {loading && opportunities.length === 0 ? (
            <LoadingOpportunities />
          ) : filteredOpportunities.length === 0 ? (
            <EmptyFilteredState onClear={clearFilters} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.fullName}
                  opportunity={opportunity}
                  isSampleFallback={isSampleFallback}
                  isInWatchlist={isInWatchlist(opportunity)}
                  onSaveToWatchlist={saveToWatchlist}
                  onCreateBrief={createBriefFromOpportunity}
                  onCreatePrKit={createPrKitFromOpportunity}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoPanel
            title="Role Opportunity Score"
            body="A 1-100 estimate of where a contributor can become useful early. It balances contribution paths, freshness, issue quality, documentation gaps, localization space, and saturation risk."
          />
          <InfoPanel
            title="Suggested Actions"
            body="Every card turns repo signals into a concrete first move, from setup guides and README reviews to issue notes, docs fixes, and first-run feedback."
          />
          <InfoPanel
            title="Proof Loop"
            body="Save what you tried, where the proof lives, and whether it is planned, submitted, merged, or archived."
          />
        </section>

        <RepoWatchlist
          items={watchlist}
          onUpdate={updateWatchlistItem}
          onRemove={removeWatchlistItem}
          onCreateBrief={createBriefFromWatchlist}
          onCreatePrKit={createPrKitFromWatchlist}
        />

        <ProofVault opportunities={opportunities} />

        <DailyOpportunityReport
          opportunities={filteredOpportunities}
          source={source}
          notice={error}
          loading={loading}
          usesFilteredResults={filtersActive}
        />

        <section className="mb-10 border-t border-white/10 pt-8">
          <SectionHeader
            kicker="Roadmap"
            title="Small first, useful next"
            body="The first version stays GitHub-only. Future versions can add role preferences, richer issue detail, Hermes daily reports, proof templates, and optional external community sources."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Proof report templates", "Proof Vault import polish", "Hermes daily report automation", "Issue drill-down"].map(
              (item, index) => (
                <div
                  key={`roadmap-${index}-${item}`}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
      </section>
      <ContributionBriefModal
        target={briefTarget}
        canSaveToWatchlist={briefTarget ? Boolean(findWatchlistItemForBriefTarget(watchlist, briefTarget)) : false}
        onClose={() => setBriefTarget(null)}
        onSaveToWatchlist={saveBriefToWatchlist}
      />
      <PrReadinessKitModal target={prKitTarget} onClose={() => setPrKitTarget(null)} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold capitalize text-white">{value}</p>
    </div>
  );
}

function SectionHeader({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">{kicker}</p>
      <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 leading-7 text-slate-400">{body}</p>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function LoadingOpportunities() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {["scan-a", "scan-b", "scan-c", "scan-d"].map((item) => (
        <div key={item} className="rounded-md border border-white/10 bg-panel/75 p-5">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-4 h-8 w-52 rounded bg-white/10" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-4/5 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white">Running live GitHub scan...</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Checking current repositories before showing sample fallback.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFilteredState({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-md border border-white/10 bg-panel/75 p-5 text-center">
      <div>
        <p className="text-lg font-bold text-white">No opportunities match these filters</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Try a broader preset, switch sort back to best match, or clear filters to return to the full scan.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-md border border-mint/40 bg-mint/10 px-3 py-2 text-sm font-semibold text-mint transition hover:border-mint/70 hover:text-white"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

function getFilteredOpportunities(
  opportunities: Opportunity[],
  state: SmartFilterState,
  source: "github" | "sample" | null,
) {
  const filtered = opportunities.filter(
    (opportunity) =>
      matchesManualFilters(opportunity, state.filters, source) && matchesPreset(opportunity, state.activePreset),
  );

  return sortOpportunities(filtered, state.sort);
}

function matchesManualFilters(
  opportunity: Opportunity,
  filters: SmartFilterState["filters"],
  source: "github" | "sample" | null,
) {
  if (filters.score70 && opportunity.roleOpportunityScore < 70) return false;
  if (filters.goodFirst && opportunity.signals.goodFirstIssueCount <= 0) return false;
  if (filters.helpWanted && opportunity.signals.helpWantedCount <= 0) return false;
  if (filters.missingDocs && opportunity.signals.hasDocsFolder) return false;
  if (filters.missingContributing && opportunity.signals.hasContributing) return false;
  if (filters.lowSaturation && !isLowSaturation(opportunity)) return false;
  if (filters.openIssues && opportunity.openIssues <= 0) return false;
  if (filters.githubOnly && (source !== "github" || !isGithubRepoUrl(opportunity.url))) return false;
  return true;
}

function matchesPreset(opportunity: Opportunity, preset: RolePreset | null) {
  if (!preset) return true;

  if (preset === "first-pr") {
    return (
      opportunity.roleOpportunityScore >= 60 &&
      (opportunity.signals.goodFirstIssueCount > 0 || opportunity.signals.helpWantedCount > 0) &&
      opportunity.stars < 1500
    );
  }

  if (preset === "docs-fix") {
    return (
      !opportunity.signals.hasDocsFolder ||
      !opportunity.signals.hasContributing ||
      opportunity.signals.readmeQuality === "missing" ||
      opportunity.signals.readmeQuality === "thin"
    );
  }

  if (preset === "good-first") return opportunity.signals.goodFirstIssueCount > 0;
  if (preset === "low-competition") return isLowSaturation(opportunity) && opportunity.roleOpportunityScore >= 60;
  if (preset === "high-score") return opportunity.roleOpportunityScore >= 80;
  if (preset === "needs-contributing") return !opportunity.signals.hasContributing;

  return isAiOrDeveloperTool(opportunity);
}

function sortOpportunities(opportunities: Opportunity[], sort: OpportunitySort) {
  const sorted = [...opportunities];

  if (sort === "highest-score") {
    return sorted.sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);
  }

  if (sort === "good-first") {
    return sorted.sort((a, b) => b.signals.goodFirstIssueCount - a.signals.goodFirstIssueCount);
  }

  if (sort === "open-issues") {
    return sorted.sort((a, b) => b.openIssues - a.openIssues);
  }

  if (sort === "low-saturation") {
    return sorted.sort((a, b) => a.stars - b.stars || b.roleOpportunityScore - a.roleOpportunityScore);
  }

  return sorted;
}

function presetSort(preset: RolePreset): OpportunitySort {
  if (preset === "good-first" || preset === "first-pr") return "good-first";
  if (preset === "low-competition") return "low-saturation";
  if (preset === "high-score") return "highest-score";
  return "best-match";
}

function getActiveFilterSummary(state: SmartFilterState) {
  const parts = [
    state.activePreset ? `Preset: ${presetLabels[state.activePreset]}` : null,
    ...Object.entries(state.filters)
      .filter(([, enabled]) => enabled)
      .map(([key]) => filterLabels[key as SmartFilterKey]),
    state.sort !== "best-match" ? `Sorted by ${sortLabels[state.sort].toLowerCase()}` : null,
  ].filter(Boolean);

  return parts.length ? `Active: ${parts.join(", ")}.` : "No filters active.";
}

function isSmartFilterActive(state: SmartFilterState) {
  return state.activePreset !== null || state.sort !== "best-match" || Object.values(state.filters).some(Boolean);
}

function normalizeFilterState(value: unknown): SmartFilterState {
  if (!value || typeof value !== "object") return defaultSmartFilters;

  const candidate = value as Partial<SmartFilterState>;
  const activePreset = isRolePreset(candidate.activePreset) ? candidate.activePreset : null;
  const sort = isOpportunitySort(candidate.sort) ? candidate.sort : "best-match";
  const savedFilters: Partial<Record<SmartFilterKey, boolean>> =
    candidate.filters && typeof candidate.filters === "object" ? candidate.filters : {};

  return {
    activePreset,
    sort,
    filters: {
      score70: Boolean(savedFilters.score70),
      goodFirst: Boolean(savedFilters.goodFirst),
      helpWanted: Boolean(savedFilters.helpWanted),
      missingDocs: Boolean(savedFilters.missingDocs),
      missingContributing: Boolean(savedFilters.missingContributing),
      lowSaturation: Boolean(savedFilters.lowSaturation),
      openIssues: Boolean(savedFilters.openIssues),
      githubOnly: Boolean(savedFilters.githubOnly),
    },
  };
}

function isRolePreset(value: unknown): value is RolePreset {
  return typeof value === "string" && value in presetLabels;
}

function isOpportunitySort(value: unknown): value is OpportunitySort {
  return typeof value === "string" && value in sortLabels;
}

function isLowSaturation(opportunity: Opportunity) {
  return opportunity.stars < 500;
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

function isAiOrDeveloperTool(opportunity: Opportunity) {
  const haystack = [
    opportunity.name,
    opportunity.fullName,
    opportunity.description,
    opportunity.category,
    opportunity.language ?? "",
    ...opportunity.topics,
  ]
    .join(" ")
    .toLowerCase();

  return /\b(ai|agent|llm|tool|tools|automation|developer|devtool|sdk|cli)\b/.test(haystack);
}

function opportunityToBriefTarget(
  opportunity: Opportunity,
  isSampleFallback: boolean,
  savedItem?: WatchlistItem,
): ContributionBriefTarget {
  return {
    id: `opportunity:${opportunity.fullName}`,
    projectName: opportunity.name,
    fullName: opportunity.fullName,
    repoUrl: opportunity.url,
    score: opportunity.roleOpportunityScore,
    category: opportunity.category,
    suggestedAction: opportunity.suggestedAction,
    scoreReason: opportunity.scoreReason,
    signals: opportunity.signals,
    openIssues: opportunity.openIssues,
    stars: opportunity.stars,
    watchlistStatus: savedItem?.status,
    watchlistNote: savedItem?.note,
    isSample: isSampleFallback,
  };
}

function watchlistItemToBriefTarget(item: WatchlistItem): ContributionBriefTarget {
  return {
    id: `watchlist:${item.id}`,
    projectName: item.projectName,
    fullName: item.fullName,
    repoUrl: item.repoUrl,
    score: item.score,
    category: item.category,
    suggestedAction: item.suggestedAction,
    scoreReason: item.scoreReason,
    watchlistStatus: item.status,
    watchlistNote: item.note,
  };
}

function findWatchlistItemForOpportunity(items: WatchlistItem[], opportunity: Opportunity) {
  const repoUrl = opportunity.url.toLowerCase();
  const projectName = opportunity.name.toLowerCase();

  return items.find((item) => {
    const savedUrl = item.repoUrl.toLowerCase();
    const savedName = item.projectName.toLowerCase();
    return (repoUrl && savedUrl === repoUrl) || savedName === projectName;
  });
}

function findWatchlistItemForBriefTarget(items: WatchlistItem[], target: ContributionBriefTarget) {
  if (target.id.startsWith("watchlist:")) {
    const id = target.id.replace("watchlist:", "");
    return items.find((item) => item.id === id);
  }

  const repoUrl = target.repoUrl?.toLowerCase() ?? "";
  const projectName = target.projectName.toLowerCase();

  return items.find((item) => {
    const savedUrl = item.repoUrl.toLowerCase();
    const savedName = item.projectName.toLowerCase();
    return (repoUrl && savedUrl === repoUrl) || savedName === projectName;
  });
}
