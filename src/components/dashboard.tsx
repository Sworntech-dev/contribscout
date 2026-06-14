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
const PROOF_STORAGE_KEY = "contribscout-proof-vault";

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
  const [proofCount, setProofCount] = useState(0);

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
    try {
      const saved = window.localStorage.getItem(PROOF_STORAGE_KEY);
      if (saved) {
        queueMicrotask(() => setProofCount(JSON.parse(saved).length ?? 0));
      }
    } catch {
      queueMicrotask(() => setProofCount(0));
    }
  }, []);

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
  const activeFilterCount = getActiveFilterCount(smartFilters);
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
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-md border border-cream/10 bg-cream/[0.045] px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-moss/40 bg-moss/10 text-sm font-black text-cream shadow-[0_0_30px_rgba(157,191,154,0.18)]">
              CS
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-black text-cream">ContribScout</p>
              <span className="rounded-md border border-moss/25 bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
                Hermes Skill Layer
              </span>
            </div>
          </div>
          <a
            href="#proof-vault"
            className="rounded-md border border-cream/10 bg-cream/[0.06] px-3 py-2 text-sm text-cream/85 transition hover:border-moss/50 hover:text-cream"
          >
            Proof Vault
          </a>
        </nav>

        <section className="relative overflow-hidden rounded-md border border-cream/10 bg-[linear-gradient(135deg,rgba(243,234,215,0.105),rgba(13,23,19,0.82)_42%,rgba(5,7,9,0.94))] p-5 shadow-[0_42px_130px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-moss/70 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,transparent,rgba(157,191,154,0.08),transparent)]" />
          <div className="absolute bottom-0 left-0 h-1/2 w-full bg-[linear-gradient(90deg,rgba(217,168,95,0.055),transparent_45%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-end">
            <div className="max-w-4xl py-6 sm:py-10">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-moss">
                ContribScout / Open-source mission control
              </p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] text-cream sm:text-7xl">
                Find the right open-source contribution before you open the PR.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-cream/72">
                ContribScout scans GitHub signals, scores contribution leverage, and turns repo discovery into a clean PR workflow.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {["Live GitHub Scanner", "Hermes Skill Layer", "PR Workflow Kit", "Local Proof Vault"].map((badge) => (
                  <span
                    key={`hero-badge-${badge}`}
                    className="rounded-md border border-cream/10 bg-cream/[0.075] px-3 py-2 text-sm font-semibold text-cream/80"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#top-opportunities"
                  className="rounded-md bg-warm px-4 py-3 text-center text-sm font-black text-ink shadow-[0_18px_60px_rgba(217,168,95,0.22)] transition hover:bg-cream"
                >
                  Review opportunities
                </a>
                <a
                  href="#daily-report"
                  className="rounded-md border border-cream/10 bg-cream/[0.065] px-4 py-3 text-center text-sm font-semibold text-cream/85 transition hover:border-moss/50 hover:text-cream"
                >
                  Generate report
                </a>
              </div>
            </div>

            <div className="relative rounded-md border border-cream/12 bg-[#f3ead7]/[0.075] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur">
              <p className="text-sm font-semibold text-cream/80">Current operation</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric
                  label="Visible"
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
                <p className="text-sm text-cream/55">Top lead</p>
                <p className="mt-2 text-xl font-bold text-cream">
                  {topOpportunity?.name ?? (opportunities.length ? "No matching opportunities" : "Running live GitHub scan...")}
                </p>
                <p className="mt-2 text-sm leading-6 text-cream/70">
                  {topOpportunity?.suggestedAction ??
                    (opportunities.length
                      ? "Clear filters or choose a broader preset to see more projects."
                      : "Fetching current repositories before showing fallback data.")}
                </p>
              </div>
              <p className="mt-5 rounded-md border border-cream/10 bg-black/20 px-3 py-2 text-xs leading-5 text-cream/55">
                {loading ? "Running live GitHub scan..." : error ?? "Live GitHub scanner returned normalized opportunities."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatusCard label="Visible opportunities" value={filteredOpportunities.length.toString()} detail={`${opportunities.length} scanned`} />
          <StatusCard label="Watchlist" value={watchlist.length.toString()} detail="local pipeline" />
          <StatusCard label="Proof Vault" value={proofCount.toString()} detail="local entries" />
          <StatusCard label="Source" value={sourceLabel} detail={isSampleFallback ? "sample fallback" : "live preference"} />
          <StatusCard label="Active filters" value={activeFilterCount.toString()} detail={activeFilterCount ? "mission narrowed" : "all signals"} />
        </section>

        <WorkflowStrip />

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
            kicker="Opportunities"
            title="Ranked contribution targets"
            body="Filter the live scan, inspect contribution fit, and move promising repos into a PR-ready workflow."
          />
          {loading && opportunities.length === 0 ? (
            <LoadingOpportunities />
          ) : opportunities.length === 0 ? (
            <EmptyOpportunitiesState />
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

        <DailyOpportunityReport
          opportunities={filteredOpportunities}
          source={source}
          notice={error}
          loading={loading}
          usesFilteredResults={filtersActive}
        />

        <RepoWatchlist
          items={watchlist}
          onUpdate={updateWatchlistItem}
          onRemove={removeWatchlistItem}
          onCreateBrief={createBriefFromWatchlist}
          onCreatePrKit={createPrKitFromWatchlist}
        />

        <ProofVault opportunities={opportunities} onEntryCountChange={setProofCount} />

        <section className="mb-10 border-t border-white/10 pt-8">
          <SectionHeader
            kicker="Roadmap"
            title="Small first, useful next"
            body="ContribScout remains a standalone Vercel dashboard with a Hermes-compatible skill package. Future work can deepen templates, automation, and optional sync without changing the local-first core."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Proof report templates", "Proof Vault import polish", "Hermes daily report automation", "Issue drill-down"].map(
              (item, index) => (
                <div
                  key={`roadmap-${index}-${item}`}
                  className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300"
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
    <div className="rounded-md border border-cream/10 bg-cream/[0.055] p-3">
      <p className="text-xs text-cream/45">{label}</p>
      <p className="mt-1 truncate text-lg font-bold capitalize text-cream">{value}</p>
    </div>
  );
}

function StatusCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-cream/10 bg-cream/[0.045] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">{label}</p>
      <p className="mt-3 text-3xl font-black text-cream">{value}</p>
      <p className="mt-1 text-sm capitalize text-cream/58">{detail}</p>
    </div>
  );
}

function WorkflowStrip() {
  const steps = ["Discover", "Filter", "Save", "Brief", "PR Kit", "Proof Vault"];

  return (
    <section className="rounded-md border border-cream/10 bg-cream/[0.035] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Workflow</p>
          <h2 className="mt-2 text-xl font-bold text-cream">From signal to proof</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => (
            <div key={`workflow-${step}`} className="flex items-center gap-2">
              <span className="rounded-md border border-cream/10 bg-ink/60 px-3 py-2 text-sm font-semibold text-cream/78">
                {step}
              </span>
              {index < steps.length - 1 ? <span className="hidden text-warm/45 sm:inline">/</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warm">{kicker}</p>
      <h2 className="mt-2 text-2xl font-bold text-cream sm:text-3xl">{title}</h2>
      <p className="mt-2 leading-7 text-cream/58">{body}</p>
    </div>
  );
}

function LoadingOpportunities() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {["scan-a", "scan-b", "scan-c", "scan-d"].map((item) => (
        <div key={item} className="rounded-md border border-white/10 bg-panel/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between gap-4">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-14 w-20 rounded-md border border-mint/20 bg-mint/10" />
          </div>
          <div className="mt-4 h-8 w-56 rounded bg-white/10" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-4/5 rounded bg-white/10" />
            <div className="h-3 w-2/3 rounded bg-white/10" />
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold text-white">Running live GitHub scan...</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Normalizing repository signals before the cockpit opens.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyOpportunitiesState() {
  return (
    <div className="grid min-h-72 place-items-center rounded-md border border-cream/10 bg-cream/[0.045] p-5 text-center">
      <div>
        <p className="text-lg font-bold text-cream">No opportunities loaded yet</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-cream/58">
          The scanner did not return projects for this view. If GitHub is temporarily unavailable, sample fallback will keep the cockpit usable.
        </p>
      </div>
    </div>
  );
}

function EmptyFilteredState({ onClear }: { onClear: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-md border border-cream/10 bg-cream/[0.045] p-5 text-center">
      <div>
        <p className="text-lg font-bold text-cream">No opportunities match these filters</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-cream/58">
          Try a broader preset, switch sort back to best match, or clear filters to return to the full scan.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-md border border-moss/40 bg-moss/10 px-3 py-2 text-sm font-semibold text-moss transition hover:border-moss/70 hover:text-cream"
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

function getActiveFilterCount(state: SmartFilterState) {
  return (state.activePreset ? 1 : 0) + (state.sort !== "best-match" ? 1 : 0) + Object.values(state.filters).filter(Boolean).length;
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
