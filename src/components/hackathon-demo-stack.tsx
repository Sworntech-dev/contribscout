"use client";

import { useState } from "react";
import { AgentDemoMode, type ProvisionResponse } from "@/components/agent-demo-mode";
import { JudgeDemoPackage } from "@/components/judge-demo-package";
import type { AgentRunResult } from "@/lib/agent-run-types";

export function HackathonDemoStack() {
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);
  const [provisioningResult, setProvisioningResult] = useState<ProvisionResponse | null>(null);
  const [proofCandidateSaved, setProofCandidateSaved] = useState(false);
  const navItems = [
    { label: "Overview", href: "#agent-workspace-overview" },
    { label: "Agent Run", href: "#agent-demo" },
    { label: "Ops Provisioning", href: "#ops-provisioning" },
    { label: "Judge Package", href: "#judge-demo-package" },
    { label: "Mission Control", href: "#mission-control" },
  ];

  return (
    <section id="agent-workspace" className="relative overflow-hidden border-y border-cream/10 bg-black/45 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(128,185,154,0.18),transparent_26%),radial-gradient(circle_at_90%_28%,rgba(244,181,98,0.12),transparent_28%),linear-gradient(180deg,rgba(4,8,7,0.96),rgba(2,4,4,0.98))]" />
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 rounded-md border border-cream/10 bg-black/35 p-3 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-mint">
              Agent Workspace
            </p>
            <div className="mt-2 grid gap-1">
              {navItems.map((item) => (
                <a
                  key={`agent-workspace-nav-${item.href}`}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto rounded-md border border-cream/10 bg-black/30 p-2">
              {navItems.map((item) => (
                <a
                  key={`agent-workspace-mobile-nav-${item.href}`}
                  href={item.href}
                  className="whitespace-nowrap rounded-md border border-cream/10 px-3 py-2 text-xs font-bold text-slate-300"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div id="agent-workspace-overview" className="premium-panel rounded-md p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-warm">Hackathon flow</p>
            <h2 className="mt-2 text-3xl font-black text-cream sm:text-4xl">Agent Workspace</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Follow one clean demo path: business goal to agent run, selected opportunity, brief and PR kit,
              Stripe provisioning status, Proof Vault evidence, and judge-ready exports.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
              {["Business goal", "Agent run", "Selected opportunity", "Brief / PR Kit", "Stripe + Proof", "Judge package"].map(
                (step, index) => (
                  <span key={`agent-workspace-flow-${step}`} className="rounded-full border border-cream/10 bg-white/[0.04] px-3 py-1.5">
                    {index + 1}. {step}
                  </span>
                ),
              )}
            </div>
          </div>

          <AgentDemoMode
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
