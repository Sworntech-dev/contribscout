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
  const [agentProofCount, setAgentProofCount] = useState(0);

  useEffect(() => {
    if (activeView !== "proof") return;

    const timeout = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("contribscout.agentProof.v1");
        setAgentProofCount(saved ? JSON.parse(saved).length ?? 0 : 0);
      } catch {
        setAgentProofCount(0);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeView, proofCandidateSaved]);

  useEffect(() => {
    if (activeView !== "scanner" && activeView !== "proof") return;

    const targetId = activeView === "scanner" ? "top-opportunities" : "proof-vault";
    const timeout = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeView]);

  return (
    <main
      id="agent-app-shell"
      className="relative min-h-screen overflow-hidden bg-[#030706] px-4 py-4 sm:px-6 lg:py-6 lg:pl-24 lg:pr-8"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="absolute left-[18%] top-16 -z-10 h-[30rem] w-[30rem] rounded-full bg-mint/12 blur-3xl" />
      <div className="absolute right-[-8rem] top-48 -z-10 h-[32rem] w-[32rem] rounded-full bg-warm/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
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
              <JudgeView
                agentRun={agentRun}
                provisioningResult={provisioningResult}
                proofCandidateSaved={proofCandidateSaved}
              />
            ) : null}

            {activeView === "scanner" || activeView === "mission" || activeView === "proof" ? (
              <MissionView activeView={activeView} agentProofCount={agentProofCount} />
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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen lg:block">
      <nav className="group flex h-full w-[72px] flex-col gap-2 border-r border-cream/10 bg-black/82 p-2.5 shadow-2xl shadow-black/45 backdrop-blur-xl transition-all duration-300 hover:w-[236px]">
        <button
          type="button"
          onClick={() => onSelect("agent")}
          className="flex h-11 items-center gap-3 rounded-2xl border border-mint/25 bg-mint/10 px-2.5 text-left text-mint"
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
                className={`flex h-11 items-center gap-3 rounded-2xl border px-2.5 text-left transition ${
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

function MissionView({ activeView, agentProofCount }: { activeView: AppView; agentProofCount: number }) {
  const heading =
    activeView === "scanner"
      ? {
          eyebrow: "Live scanner",
          title: "Live Scanner",
          body: "Review the GitHub opportunities ContribScout can evaluate for agent runs.",
        }
      : activeView === "proof"
        ? {
            eyebrow: "Proof Vault",
            title: "Proof Vault",
            body: "Review saved agent proof candidates and contribution evidence.",
          }
        : {
            eyebrow: "Mission Control",
            title: "Mission Control",
            body: "Track contribution workflow readiness and product signals.",
          };

  return (
    <ViewFrame>
      <ShellIntro eyebrow={heading.eyebrow} title={heading.title} body={heading.body} />
      {activeView === "proof" ? <ProofCandidateSummary count={agentProofCount} /> : null}
      {activeView === "scanner" ? <ScannerFocusNote /> : null}
      {activeView === "mission" ? <MissionFocusNote /> : null}
      <div className="overflow-hidden rounded-[1.5rem] border border-cream/10 bg-black/20">
        <MissionControlDashboard />
      </div>
    </ViewFrame>
  );
}

function HermesSkillView() {
  return (
    <ViewFrame>
      <ShellIntro
        eyebrow="Hermes Skill"
        title="Hermes-compatible agent layer"
        body="Short instructions for running the skill layer against the ContribScout Agent API."
      />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.5rem] border border-cream/10 bg-black/28 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Skill path</p>
          <p className="mt-2 break-words text-sm font-bold text-white">hermes/skills/contribscout-agent</p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            <p><span className="text-slate-500">Endpoint:</span> /api/agent/run</p>
            <p><span className="text-slate-500">Env:</span> CONTRIBSCOUT_API_URL optional</p>
            <p><span className="text-slate-500">Stripe:</span> not required by the skill script</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-cream/10 bg-black/28 p-5">
          <p className="text-sm font-bold text-white">Command</p>
          <pre className="mt-3 overflow-auto rounded-2xl border border-cream/10 bg-black/45 p-4 text-xs leading-6 text-slate-300">
            {`python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Grow visibility for an AI agent tooling project through useful open-source contributions."`}
          </pre>
        </div>
      </div>
    </ViewFrame>
  );
}

function AboutView() {
  return (
    <ViewFrame>
      <ShellIntro
        eyebrow="About"
        title="Open-source growth operations for AI teams"
        body="A focused agent workspace for turning open-source growth goals into PR-ready contribution workflows."
      />
      <div className="rounded-[1.5rem] border border-cream/10 bg-black/24 p-5 text-sm leading-7 text-slate-300">
        ContribScout scans GitHub opportunities, selects a high-leverage contribution path, prepares a PR-ready plan,
        keeps proof artifacts local, exposes an optional Stripe provisioning step, and ships a Hermes-compatible skill layer
        for agent-assisted reports.
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["GitHub scan", "Live results when configured, honest sample fallback when not."],
          ["PR-ready plan", "Brief, duplicate guard, PR copy, and validation notes."],
          ["Proof + provisioning", "Local Proof Vault plus a real Stripe test-mode checkout path."],
        ].map(([title, body]) => (
          <article key={`about-${title}`} className="rounded-[1.5rem] border border-cream/10 bg-white/[0.025] p-5">
            <h3 className="font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </article>
        ))}
      </div>
    </ViewFrame>
  );
}

function ShellIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-cream sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function ViewFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl space-y-5">{children}</div>;
}

function ScannerFocusNote() {
  return (
    <div className="rounded-[1.25rem] border border-cyan-100/10 bg-cyan-100/[0.035] px-4 py-3 text-sm text-slate-300">
      Tip: this view scrolls to ranked opportunities after loading while preserving the scanner&apos;s existing filters and actions.
    </div>
  );
}

function MissionFocusNote() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["Scanner health", "Watchlist pipeline", "Proof readiness"].map((item) => (
        <div
          key={`mission-focus-${item}`}
          className="rounded-[1.25rem] border border-cream/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-slate-300"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function ProofCandidateSummary({ count }: { count: number }) {
  return (
    <div className="rounded-[1.25rem] border border-cream/10 bg-black/24 px-4 py-3 text-sm text-slate-300">
      {count > 0
        ? `${count} saved agent proof ${count === 1 ? "candidate" : "candidates"} found in local storage.`
        : "Run the agent and save a proof candidate to populate the vault."}
    </div>
  );
}

function JudgeView({
  agentRun,
  provisioningResult,
  proofCandidateSaved,
}: {
  agentRun: AgentRunResult | null;
  provisioningResult: ProvisionResponse | null;
  proofCandidateSaved: boolean;
}) {
  return (
    <ViewFrame>
      <ShellIntro
        eyebrow="Judge package"
        title="Judge Package"
        body="Export the demo narrative, integration status, Hermes command, and submission summary."
      />
      <JudgeDemoPackage
        agentRun={agentRun}
        provisioningResult={provisioningResult}
        proofCandidateSaved={proofCandidateSaved}
        compactHeader
      />
    </ViewFrame>
  );
}
