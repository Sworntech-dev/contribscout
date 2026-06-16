"use client";

import { useEffect, useState } from "react";
import { AgentDemoMode, type ProvisionResponse } from "@/components/agent-demo-mode";
import { JudgeDemoPackage } from "@/components/judge-demo-package";
import { MissionControlDashboard } from "@/components/mission-control-dashboard";
import type { AgentRunResult } from "@/lib/agent-run-types";

type AppView = "agent" | "scanner" | "mission" | "proof" | "judge" | "hermes" | "about";

const navItems: Array<{ id: AppView; label: string; icon: string; detail: string }> = [
  { id: "agent", label: "Agent Console", icon: "A", detail: "Run growth workflow" },
  { id: "scanner", label: "Live Scanner", icon: "S", detail: "GitHub opportunities" },
  { id: "mission", label: "Mission Control", icon: "M", detail: "Full dashboard" },
  { id: "proof", label: "Proof Vault", icon: "P", detail: "Local evidence" },
  { id: "judge", label: "Judge Package", icon: "J", detail: "Demo exports" },
  { id: "hermes", label: "Hermes Skill", icon: "H", detail: "Skill command" },
  { id: "about", label: "About", icon: "?", detail: "What this is" },
];

export function AppShell() {
  const [activeView, setActiveView] = useState<AppView>("agent");
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);
  const [provisioningResult, setProvisioningResult] = useState<ProvisionResponse | null>(null);
  const [proofCandidateSaved, setProofCandidateSaved] = useState(false);

  useEffect(() => {
    if (activeView !== "scanner" && activeView !== "proof") return;

    const targetId = activeView === "scanner" ? "top-opportunities" : "proof-vault";
    const timeout = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeView]);

  return (
    <main id="agent-app-shell" className="relative min-h-screen overflow-hidden bg-[#030706] px-4 pb-6 pt-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="absolute left-[18%] top-16 -z-10 h-[30rem] w-[30rem] rounded-full bg-mint/12 blur-3xl" />
      <div className="absolute right-[-8rem] top-48 -z-10 h-[32rem] w-[32rem] rounded-full bg-warm/10 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:grid-cols-[72px_minmax(0,1fr)]">
        <DesktopSidebar activeView={activeView} onSelect={setActiveView} />

        <div className="relative z-0 min-w-0">
          <MobileTabs activeView={activeView} onSelect={setActiveView} />
          <section
            className={
              activeView === "agent"
                ? "min-h-[calc(100vh-8rem)]"
                : "min-h-[calc(100vh-8rem)] rounded-[2rem] border border-cream/10 bg-black/35 p-3 shadow-2xl shadow-black/35 backdrop-blur sm:p-5"
            }
          >
            {activeView === "agent" ? (
              <AgentDemoMode
                onRunResultChange={setAgentRun}
                onProvisionResultChange={setProvisioningResult}
                onProofSavedChange={setProofCandidateSaved}
              />
            ) : null}

            {activeView === "judge" ? (
              <JudgeDemoPackage
                agentRun={agentRun}
                provisioningResult={provisioningResult}
                proofCandidateSaved={proofCandidateSaved}
              />
            ) : null}

            {activeView === "scanner" || activeView === "mission" || activeView === "proof" ? (
              <MissionView activeView={activeView} />
            ) : null}

            {activeView === "hermes" ? <HermesSkillView /> : null}
            {activeView === "about" ? <AboutView /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function DesktopSidebar({
  activeView,
  onSelect,
}: {
  activeView: AppView;
  onSelect: (view: AppView) => void;
}) {
  return (
    <aside className="relative z-30 hidden lg:block">
      <nav className="group sticky top-24 z-30 flex min-h-[calc(100vh-7rem)] w-[72px] flex-col gap-2 rounded-[1.5rem] border border-cream/10 bg-black/80 p-3 shadow-2xl shadow-black/45 backdrop-blur-xl transition-all duration-300 hover:w-[238px]">
        <button
          type="button"
          onClick={() => onSelect("agent")}
          className="flex h-12 items-center gap-3 rounded-2xl border border-mint/30 bg-mint/10 px-3 text-left text-mint"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-mint/15 text-xs font-black">CS</span>
          <span className="hidden whitespace-nowrap text-sm font-black group-hover:inline">ContribScout Agent</span>
        </button>
        <div className="mt-3 grid gap-2">
          {navItems.map((item) => {
            const active = activeView === item.id;

            return (
              <button
                key={`app-shell-nav-${item.id}`}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex h-12 items-center gap-3 rounded-2xl border px-3 text-left transition ${
                  active
                    ? "border-mint/40 bg-mint/10 text-white"
                    : "border-cream/10 bg-white/[0.03] text-slate-400 hover:border-mint/35 hover:text-white"
                }`}
                title={item.label}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-cream/10 text-xs font-black">
                  {item.icon}
                </span>
                <span className="hidden min-w-0 group-hover:block">
                  <span className="block whitespace-nowrap text-sm font-bold">{item.label}</span>
                  <span className="block whitespace-nowrap text-[11px] text-slate-500">{item.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto h-20 w-px self-center bg-gradient-to-b from-transparent via-mint/40 to-transparent" />
      </nav>
    </aside>
  );
}

function MobileTabs({
  activeView,
  onSelect,
}: {
  activeView: AppView;
  onSelect: (view: AppView) => void;
}) {
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto rounded-2xl border border-cream/10 bg-black/45 p-2 lg:hidden">
      {navItems.map((item) => (
        <button
          key={`app-shell-mobile-${item.id}`}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold ${
            activeView === item.id
              ? "border-mint/40 bg-mint/10 text-white"
              : "border-cream/10 bg-white/[0.03] text-slate-400"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function MissionView({ activeView }: { activeView: AppView }) {
  const heading =
    activeView === "scanner"
      ? {
          eyebrow: "Live scanner",
          title: "GitHub contribution radar",
          body: "The full scanner view is loaded below. It preserves filters, watchlist, reports, briefs, PR kits, and Proof Vault behavior.",
        }
      : activeView === "proof"
        ? {
            eyebrow: "Proof Vault",
            title: "Local contribution evidence",
            body: "The dashboard opens below and scrolls to Proof Vault so existing localStorage-backed proof logic stays untouched.",
          }
        : {
            eyebrow: "Mission Control",
            title: "Full contribution cockpit",
            body: "All original ContribScout dashboard features remain available in the app shell.",
          };

  return (
    <div className="space-y-5">
      <ShellIntro eyebrow={heading.eyebrow} title={heading.title} body={heading.body} />
      <MissionControlDashboard />
    </div>
  );
}

function HermesSkillView() {
  return (
    <div className="space-y-5">
      <ShellIntro
        eyebrow="Hermes Skill"
        title="Hermes-compatible agent layer"
        body="ContribScout remains a standalone Vercel app. The Hermes skill package calls the Agent API and prints the returned Markdown report."
      />
      <div className="rounded-[1.5rem] border border-cream/10 bg-black/35 p-5">
        <p className="text-sm font-bold text-white">Command</p>
        <pre className="mt-3 overflow-auto rounded-2xl border border-cream/10 bg-black/45 p-4 text-xs leading-6 text-slate-300">
          {`python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Grow visibility for an AI agent tooling project through useful open-source contributions."`}
        </pre>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          The skill does not require Stripe credentials and does not host Hermes inside Vercel. It is a skill layer that
          consumes `/api/agent/run`.
        </p>
      </div>
    </div>
  );
}

function AboutView() {
  return (
    <div className="space-y-5">
      <ShellIntro
        eyebrow="About"
        title="Open-source growth operations for AI teams"
        body="ContribScout Agent turns a business goal into a live-or-honest-fallback contribution workflow: scan, select, brief, prepare PR, provision, and package for judges."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["No fake live data", "Sample fallback is always marked as sample."],
          ["No fake provisioning", "Stripe only shows checkout when a real test session exists."],
          ["Local-first proof", "Proof Vault and agent proof candidates stay in browser storage."],
        ].map(([title, body]) => (
          <article key={`about-${title}`} className="rounded-[1.5rem] border border-cream/10 bg-white/[0.035] p-5">
            <h3 className="font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ShellIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-[1.75rem] border border-cream/10 bg-white/[0.035] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-mint">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-cream sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{body}</p>
    </div>
  );
}
