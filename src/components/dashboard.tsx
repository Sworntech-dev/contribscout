"use client";

import { useEffect, useMemo, useState } from "react";
import { OpportunityCard } from "@/components/opportunity-card";
import { ProofVault } from "@/components/proof-vault";
import type { Opportunity } from "@/lib/types";

type ApiResponse = {
  source: "github" | "sample";
  updatedAt: string;
  notice?: string;
  opportunities: Opportunity[];
};

export function Dashboard({ initialOpportunities }: { initialOpportunities: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [source, setSource] = useState<"github" | "sample">("sample");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadOpportunities() {
      try {
        const response = await fetch("/api/opportunities", { cache: "no-store" });
        const data = (await response.json()) as ApiResponse;

        if (!alive) return;
        setOpportunities(data.opportunities);
        setSource(data.source);
        setError(data.notice ?? null);
      } catch {
        if (!alive) return;
        setError("Live scan unavailable. Showing demo-ready sample opportunities.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOpportunities();
    return () => {
      alive = false;
    };
  }, []);

  const topOpportunity = opportunities[0];
  const averageScore = useMemo(() => {
    const total = opportunities.reduce((sum, opportunity) => sum + opportunity.roleOpportunityScore, 0);
    return Math.round(total / Math.max(opportunities.length, 1));
  }, [opportunities]);
  const isSampleFallback = source === "sample";

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-mint/40 bg-mint/10 text-sm font-black text-mint">
              CS
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ContribScout</p>
              <p className="text-xs text-slate-400">Hermes contributor intelligence</p>
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
              Find Web3 and AI projects where your contribution can matter early.
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
              <Metric label="Avg score" value={averageScore.toString()} />
              <Metric label="Source" value={isSampleFallback ? "sample fallback" : "github"} />
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">Top lead</p>
              <p className="mt-2 text-xl font-bold text-white">{topOpportunity?.name ?? "Loading"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {topOpportunity?.suggestedAction ?? "Scanning contribution paths..."}
              </p>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {loading ? "Refreshing scanner..." : error ?? "Live GitHub scanner returned normalized opportunities."}
            </p>
          </div>
        </section>

        <section id="top-opportunities" className="space-y-4">
          <SectionHeader
            kicker="Top Opportunities"
            title="Projects ranked by contributor leverage"
            body="The scanner favors useful entry points, fresh activity, documentation gaps, and room to be noticed."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.fullName}
                opportunity={opportunity}
                isSampleFallback={isSampleFallback}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <InfoPanel
            title="Role Opportunity Score"
            body="A 1-100 estimate of where a contributor can become useful early. It balances contribution paths, freshness, issue quality, documentation gaps, localization space, and saturation risk."
          />
          <InfoPanel
            title="Suggested Actions"
            body="Every card turns repo signals into a concrete first move, from setup guides and README reviews to good first issues and Turkish onboarding notes."
          />
          <InfoPanel
            title="Proof Loop"
            body="Save what you tried, where the proof lives, and whether it is planned, submitted, merged, or archived."
          />
        </section>

        <ProofVault opportunities={opportunities} />

        <section className="mb-10 border-t border-white/10 pt-8">
          <SectionHeader
            kicker="Roadmap"
            title="Small first, useful next"
            body="The first version stays GitHub-only. Future versions can add role preferences, richer issue detail, Hermes daily reports, Proof Vault export, and optional external community sources."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Hermes daily report", "GitHub token live scan", "Proof Vault export", "Issue drill-down"].map(
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
