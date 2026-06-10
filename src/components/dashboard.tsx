"use client";

import { useEffect, useMemo, useState } from "react";
import { DailyOpportunityReport } from "@/components/daily-opportunity-report";
import { OpportunityCard } from "@/components/opportunity-card";
import { ProofVault } from "@/components/proof-vault";
import { RepoWatchlist } from "@/components/repo-watchlist";
import type { Opportunity, WatchlistItem } from "@/lib/types";

type ApiResponse = {
  source: "github" | "sample";
  updatedAt: string;
  notice?: string;
  opportunities: Opportunity[];
};

const WATCHLIST_STORAGE_KEY = "contribscout.watchlist.v1";

export function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [source, setSource] = useState<"github" | "sample" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

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

  const topOpportunity = opportunities[0];
  const averageScore = useMemo(() => {
    const total = opportunities.reduce((sum, opportunity) => sum + opportunity.roleOpportunityScore, 0);
    return Math.round(total / Math.max(opportunities.length, 1));
  }, [opportunities]);
  const isSampleFallback = source === "sample";
  const sourceLabel = loading && !source ? "scanning" : isSampleFallback ? "sample fallback" : "github";

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
              <Metric label="Projects" value={opportunities.length.toString()} />
              <Metric label="Avg score" value={opportunities.length ? averageScore.toString() : "-"} />
              <Metric label="Source" value={sourceLabel} />
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">Top lead</p>
              <p className="mt-2 text-xl font-bold text-white">
                {topOpportunity?.name ?? "Running live GitHub scan..."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {topOpportunity?.suggestedAction ?? "Fetching current repositories before showing fallback data."}
              </p>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {loading ? "Running live GitHub scan..." : error ?? "Live GitHub scanner returned normalized opportunities."}
            </p>
          </div>
        </section>

        <section id="top-opportunities" className="space-y-4">
          <SectionHeader
            kicker="Top Opportunities"
            title="Projects ranked by contributor leverage"
            body="The scanner favors useful entry points, fresh activity, documentation gaps, and room to be noticed."
          />
          {loading && opportunities.length === 0 ? (
            <LoadingOpportunities />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.fullName}
                  opportunity={opportunity}
                  isSampleFallback={isSampleFallback}
                  isInWatchlist={isInWatchlist(opportunity)}
                  onSaveToWatchlist={saveToWatchlist}
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
        />

        <ProofVault opportunities={opportunities} />

        <DailyOpportunityReport
          opportunities={opportunities}
          source={source}
          notice={error}
          loading={loading}
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
