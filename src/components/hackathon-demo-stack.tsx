"use client";

import { useState } from "react";
import { AgentDemoMode, type ProvisionResponse } from "@/components/agent-demo-mode";
import { JudgeDemoPackage } from "@/components/judge-demo-package";
import type { AgentRunResult } from "@/lib/agent-run-types";

const DEFAULT_AGENT_GOAL = "Grow visibility for an AI agent tooling project through useful open-source contributions.";
const DEFAULT_TEAM_CONTEXT = "Small AI tooling team";

export function HackathonDemoStack() {
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);
  const [agentBusinessGoal, setAgentBusinessGoal] = useState(DEFAULT_AGENT_GOAL);
  const [agentTeamContext, setAgentTeamContext] = useState(DEFAULT_TEAM_CONTEXT);
  const [provisioningResult, setProvisioningResult] = useState<ProvisionResponse | null>(null);
  const [proofCandidateSaved, setProofCandidateSaved] = useState(false);
  const navItems = [
    { label: "Home", short: "H", href: "#agent-console-home" },
    { label: "Agent", short: "A", href: "#agent-run-results" },
    { label: "Ops", short: "O", href: "#ops-provisioning" },
    { label: "Judge", short: "J", href: "#judge-demo-package" },
    { label: "Mission Control", short: "M", href: "#mission-control" },
  ];

  return (
    <section
      id="agent-workspace"
      className="relative overflow-hidden border-y border-cream/10 bg-[#030706] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute left-1/2 top-20 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-mint/12 blur-3xl" />
      <div className="absolute right-[-12rem] top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-warm/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[78px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 flex min-h-[calc(100vh-8rem)] flex-col items-center gap-3 rounded-2xl border border-cream/10 bg-black/35 px-3 py-4 shadow-2xl shadow-black/30 backdrop-blur">
            <a
              href="#agent-console-home"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-sm font-black text-mint"
              aria-label="Agent console home"
            >
              CS
            </a>
            <div className="mt-3 grid gap-2">
              {navItems.map((item) => (
                <a
                  key={`agent-workspace-nav-${item.href}`}
                  href={item.href}
                  title={item.label}
                  className="group grid h-11 w-11 place-items-center rounded-2xl border border-cream/10 bg-white/[0.035] text-xs font-black text-slate-300 transition hover:border-mint/50 hover:bg-mint/10 hover:text-white"
                >
                  {item.short}
                </a>
              ))}
            </div>
            <div className="mt-auto h-20 w-px bg-gradient-to-b from-transparent via-mint/40 to-transparent" />
          </nav>
        </aside>

        <div className="min-w-0 space-y-8">
          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto rounded-2xl border border-cream/10 bg-black/40 p-2 backdrop-blur">
              {navItems.map((item) => (
                <a
                  key={`agent-workspace-mobile-nav-${item.href}`}
                  href={item.href}
                  className="whitespace-nowrap rounded-xl border border-cream/10 px-3 py-2 text-xs font-bold text-slate-300"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <AgentDemoMode
            agentRun={agentRun}
            businessGoal={agentBusinessGoal}
            teamContext={agentTeamContext}
            provisioningResult={provisioningResult}
            proofCandidateSaved={proofCandidateSaved}
            onBusinessGoalChange={setAgentBusinessGoal}
            onTeamContextChange={setAgentTeamContext}
            onRunResultChange={setAgentRun}
            onProvisionResultChange={setProvisioningResult}
            onProofSavedChange={setProofCandidateSaved}
          />
          <JudgeDemoPackage
            agentRun={agentRun}
            provisioningResult={provisioningResult}
            proofCandidateSaved={proofCandidateSaved}
          />
        </div>
      </div>
    </section>
  );
}
