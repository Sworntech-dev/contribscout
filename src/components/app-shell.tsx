"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AgentDemoMode, type ProvisionResponse } from "@/components/agent-demo-mode";
import { JudgeDemoPackage } from "@/components/judge-demo-package";
import { MissionControlDashboard } from "@/components/mission-control-dashboard";
import type { AgentRunResult } from "@/lib/agent-run-types";
import type { Opportunity } from "@/lib/types";

type AppView = "agent" | "workspace" | "judge" | "hermes" | "about";
type WorkspaceTab = "scanner" | "mission" | "proof";

const DEFAULT_AGENT_GOAL = "Grow visibility for an AI agent tooling project through useful open-source contributions.";
const DEFAULT_TEAM_CONTEXT = "Small AI tooling team";

const navItems: Array<{ id: AppView; label: string; icon: string; detail: string }> = [
  { id: "agent", label: "Agent Console", icon: "A", detail: "Run growth workflow" },
  { id: "workspace", label: "Workspace", icon: "W", detail: "Scanner, mission, proof" },
  { id: "judge", label: "Judge Package", icon: "J", detail: "Demo exports" },
  { id: "hermes", label: "Hermes Skill", icon: "H", detail: "Skill command" },
  { id: "about", label: "About", icon: "?", detail: "What this is" },
];

const workspaceTabs: Array<{ id: WorkspaceTab; label: string; targetId: string; detail: string }> = [
  { id: "scanner", label: "Scanner", targetId: "top-opportunities", detail: "GitHub opportunity discovery" },
  { id: "mission", label: "Mission Control", targetId: "mission-control", detail: "Readiness and pipeline overview" },
  { id: "proof", label: "Proof Vault", targetId: "proof-vault", detail: "Saved contribution evidence" },
];

export function AppShell() {
  const [activeView, setActiveView] = useState<AppView>("agent");
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);
  const [agentBusinessGoal, setAgentBusinessGoal] = useState(DEFAULT_AGENT_GOAL);
  const [agentTeamContext, setAgentTeamContext] = useState(DEFAULT_TEAM_CONTEXT);
  const [provisioningResult, setProvisioningResult] = useState<ProvisionResponse | null>(null);
  const [proofCandidateSaved, setProofCandidateSaved] = useState(false);
  const [agentProofCount, setAgentProofCount] = useState(0);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("scanner");

  useEffect(() => {
    if (activeView !== "workspace") return;

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

  return (
    <main
      id="agent-app-shell"
      className="relative min-h-screen overflow-x-clip bg-[#030706] px-3 py-3 sm:px-6 lg:py-6 lg:pl-24 lg:pr-8"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:46px_46px]" />
      <div className="absolute left-[18%] top-16 -z-10 h-[30rem] w-[30rem] rounded-full bg-mint/12 blur-3xl" />
      <div className="absolute right-[-14rem] top-48 -z-10 h-[28rem] w-[28rem] rounded-full bg-warm/10 blur-3xl sm:right-[-8rem] sm:h-[32rem] sm:w-[32rem]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <DesktopSidebar activeView={activeView} onSelect={setActiveView} />

        <div className="relative z-0 min-w-0">
          <MobileTabs activeView={activeView} onSelect={setActiveView} />
          <section
            className={
              activeView === "agent"
                ? "min-h-[calc(100vh-8rem)]"
                : "overflow-x-clip rounded-3xl border border-cream/10 bg-black/35 p-2 shadow-2xl shadow-black/35 backdrop-blur sm:p-5 lg:min-h-[calc(100vh-8rem)] lg:rounded-[2rem]"
            }
          >
            {activeView === "agent" ? (
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
            ) : null}

            {activeView === "judge" ? (
              <JudgeView
                agentRun={agentRun}
                provisioningResult={provisioningResult}
                proofCandidateSaved={proofCandidateSaved}
              />
            ) : null}

            {activeView === "workspace" ? (
              <WorkspaceView
                activeTab={workspaceTab}
                agentProofCount={agentProofCount}
                onSelectTab={setWorkspaceTab}
              />
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
          className="flex h-11 items-center gap-3 rounded-2xl bg-mint/10 px-2 text-left text-mint transition hover:bg-mint/14"
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl">
            <span className="text-[9px] text-mint/25">CS</span>
            <Image
              src="/brand/contribscout-logo.png"
              alt="ContribScout"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </span>
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
                className={`flex h-11 items-center gap-3 rounded-2xl px-2.5 text-left transition ${
                  active
                    ? "bg-mint/10 text-white"
                    : "bg-white/[0.025] text-slate-400 hover:bg-mint/[0.07] hover:text-white"
                }`}
                title={item.label}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs font-black">
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
    <div className="mb-3 flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-cream/10 bg-black/45 p-2 lg:hidden">
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

function WorkspaceView({
  activeTab,
  agentProofCount,
  onSelectTab,
}: {
  activeTab: WorkspaceTab;
  agentProofCount: number;
  onSelectTab: (tab: WorkspaceTab) => void;
}) {
  function selectTab(tab: WorkspaceTab) {
    onSelectTab(tab);
    const targetId = workspaceTabs.find((item) => item.id === tab)?.targetId;

    if (!targetId) return;

    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
  }

  return (
    <ViewFrame>
      <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <ShellIntro
          eyebrow="Workspace"
          title="Scanner Workspace"
          body="One compact operating space for discovery, workflow readiness, and saved contribution proof."
        />
        <ProofCandidateSummary count={agentProofCount} />
      </div>
      <div className="rounded-[1.25rem] border border-cream/10 bg-black/24 p-1.5 sm:rounded-[1.5rem] sm:p-2">
        <div className="grid gap-2 md:grid-cols-3">
          {workspaceTabs.map((tab) => (
            <button
              key={`workspace-tab-${tab.id}`}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`rounded-[1.1rem] border px-4 py-3 text-left transition ${
                activeTab === tab.id
                  ? "border-cyan-200/30 bg-cyan-200/[0.07] text-white"
                  : "border-transparent bg-white/[0.025] text-slate-400 hover:border-cyan-200/20 hover:text-white"
              }`}
            >
              <span className="block text-sm font-black">{tab.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{tab.detail}</span>
            </button>
          ))}
        </div>
      </div>
      <WorkspaceFocusNotes activeTab={activeTab} />
      {activeTab === "scanner" ? (
        <div className="block md:hidden">
          <MobileOpportunityList />
        </div>
      ) : null}
      <div
        className={`max-w-full overflow-x-clip rounded-[1.25rem] border border-cream/10 bg-black/20 sm:rounded-[1.5rem] ${
          activeTab === "scanner" ? "hidden md:block" : "block"
        }`}
      >
        <MissionControlDashboard />
      </div>
    </ViewFrame>
  );
}

function MobileOpportunityList() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [source, setSource] = useState<"github" | "sample" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadOpportunities() {
      try {
        const response = await fetch("/api/opportunities?limit=12", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const payload = (await response.json()) as {
          source?: "github" | "sample";
          opportunities?: Opportunity[];
          notice?: string;
        };

        if (!alive) return;

        if (!response.ok) {
          setError(payload.notice || "Could not load opportunities right now.");
          setOpportunities([]);
          return;
        }

        setSource(payload.source ?? null);
        setOpportunities(Array.isArray(payload.opportunities) ? payload.opportunities : []);
        setError("");
      } catch {
        if (!alive) return;
        setError("Could not load opportunities right now.");
        setOpportunities([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOpportunities();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="top-opportunities" className="space-y-3 rounded-2xl border border-cream/10 bg-black/24 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warm">Opportunities</p>
        <h2 className="mt-2 text-xl font-black text-cream">Ranked contribution targets</h2>
        <p className="mt-2 text-sm leading-6 text-cream/58">
          Mobile scanner view with compact cards from the current opportunity API.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.045] p-4 text-sm text-slate-300">
          Scanning opportunities...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-warm/30 bg-warm/10 p-4 text-sm text-warm">
          {error}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.045] p-4 text-sm text-slate-300">
          No opportunities available yet.
        </div>
      ) : (
        <div className="grid w-full min-w-0 gap-3">
          {opportunities.map((opportunity) => (
            <MobileOpportunityCard
              key={`workspace-mobile-opportunity-${opportunity.fullName}`}
              opportunity={opportunity}
              source={source}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MobileOpportunityCard({
  opportunity,
  source,
}: {
  opportunity: Opportunity;
  source: "github" | "sample" | null;
}) {
  const signals = [
    opportunity.openIssues > 0 ? `${opportunity.openIssues.toLocaleString()} open issues` : null,
    opportunity.signals.goodFirstIssueCount > 0 ? `${opportunity.signals.goodFirstIssueCount} good first` : null,
    opportunity.signals.helpWantedCount > 0 ? `${opportunity.signals.helpWantedCount} help wanted` : null,
    opportunity.signals.hasContributing ? "CONTRIBUTING" : null,
  ].filter(Boolean);

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-2xl border border-cream/10 bg-cream/[0.045] p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-base font-black text-cream">{opportunity.fullName || opportunity.name}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-cream/62">{opportunity.description}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-warm/35 bg-warm/10 px-3 py-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm">Score</p>
          <p className="text-2xl font-black text-cream">{opportunity.roleOpportunityScore ?? "n/a"}</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <span className="max-w-full break-words rounded-md border border-moss/25 bg-moss/10 px-2 py-1 text-[11px] font-semibold capitalize text-moss">
          {opportunity.category || "open source"}
        </span>
        <span className="rounded-md border border-cream/10 bg-cream/[0.055] px-2 py-1 text-[11px] font-semibold text-cream/70">
          {source === "github" ? "GitHub live" : source === "sample" ? "Sample fallback" : "Scanner"}
        </span>
        {signals.slice(0, 3).map((signal) => (
          <span
            key={`${opportunity.fullName}-mobile-shell-signal-${signal}`}
            className="max-w-full break-words rounded-md bg-black/18 px-2 py-1 text-xs text-cream/68"
          >
            {signal}
          </span>
        ))}
      </div>

      <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-cream">
        {opportunity.suggestedAction}
      </p>

      {opportunity.url ? (
        <a
          href={opportunity.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex max-w-full rounded-md border border-cream/10 bg-cream/[0.07] px-3 py-2 text-sm font-semibold text-cream"
        >
          Open repository
        </a>
      ) : null}
    </article>
  );
}

function HermesSkillView() {
  return (
    <ViewFrame>
      <ShellIntro
        eyebrow="Hermes Skill"
        title="Hermes-compatible agent layer"
        body="The browser UI calls the ContribScout Agent API. The Hermes Skill Layer can run the same workflow separately through the included skill script."
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 rounded-[1.5rem] border border-cream/10 bg-black/28 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Skill path</p>
          <p className="mt-2 break-words text-sm font-bold text-white">hermes/skills/contribscout-agent</p>
          <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            <p><span className="text-slate-500">Endpoint:</span> /api/agent/run</p>
            <p><span className="text-slate-500">API URL:</span> defaults to the deployed ContribScout app and can be overridden for local testing.</p>
            <p><span className="text-slate-500">Stripe:</span> not required by the skill script</p>
          </div>
        </div>
        <div className="min-w-0 rounded-[1.5rem] border border-cream/10 bg-black/28 p-4 sm:p-5">
          <p className="text-sm font-bold text-white">Command</p>
          <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre rounded-2xl border border-cream/10 bg-black/45 p-3 text-xs leading-6 text-slate-300 sm:p-4">
            {`python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Grow visibility for an AI agent tooling project through useful open-source contributions."`}
          </pre>
        </div>
      </div>
    </ViewFrame>
  );
}

function AboutView() {
  const capabilities = [
    ["Live GitHub scan", "Finds current open-source projects when GitHub access is configured, with honest sample fallback otherwise."],
    ["Ranking + filters", "Scores Role Opportunity fit and lets builders narrow by issue signals, docs gaps, source, and presets."],
    ["Agent run workflow", "Turns a business goal into a selected opportunity, business rationale, and next contribution path."],
    ["Contribution brief", "Builds a repo-specific Markdown plan before the builder starts work."],
    ["PR readiness kit", "Creates duplicate guards, branch naming, PR copy, validation notes, and maintainer-safe language."],
    ["Proof Vault", "Prepares and saves local proof candidates without accounts, auth, or a database."],
    ["Stripe provisioning", "Offers an optional real test-mode checkout step when test-mode provisioning is configured, never a fake payment."],
    ["Hermes skill layer", "Includes a Hermes-compatible package that calls the Agent API and formats operational reports."],
    ["Judge package", "Exports a concise demo narrative, integration status, Hermes command, and judge-ready summary."],
  ];
  const faq = [
    [
      "What is ContribScout?",
      "ContribScout is an open-source growth operations agent that turns a growth goal into a GitHub contribution workflow.",
    ],
    [
      "Is this a generic chatbot?",
      "No. The Agent Console is a goal-driven workflow runner. It uses the growth goal to scan GitHub, choose a contribution target, and prepare PR-ready artifacts.",
    ],
    [
      "How does the agent choose a repository?",
      "It ranks available GitHub opportunities using source status, freshness, issue paths, docs/contribution signals, saturation, and goal fit.",
    ],
    [
      "Does the browser UI run Hermes directly?",
      "No. The browser UI calls the ContribScout Agent API. The included Hermes Skill Layer can run the same workflow separately through the skill script.",
    ],
    [
      "What does Stripe provisioning mean?",
      "Stripe is used in test mode to demonstrate how an agent workflow can move from recommendation to provisioning/payment for an OSS Growth Workspace.",
    ],
    [
      "Is the payment real?",
      "In this demo, Stripe runs in test mode. A real product would need live billing, delivery logic, and fulfillment around the workspace.",
    ],
    [
      "Where is proof stored?",
      "Proof candidates are saved locally in this browser for the prototype.",
    ],
    [
      "Can ContribScout be wrong?",
      "Yes. It uses GitHub signals and deterministic scoring, so users should review the repository, issue context, and duplicate PR risk before opening a real PR.",
    ],
  ];

  return (
    <ViewFrame>
      <ShellIntro
        eyebrow="About"
        title="Open-source growth operations for AI teams"
        body="ContribScout helps small AI, Web3, and developer-tooling teams turn open-source discovery into a concrete contribution workflow."
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-cream/10 bg-black/24 p-5 text-sm leading-7 text-slate-300">
          <p>
            It is for builders and lean teams who want useful public contribution paths without turning repo discovery
            into a vague issue hunt. The agent scans opportunities, ranks them, selects a high-leverage target, and
            produces a PR-ready plan that can become public proof.
          </p>
          <p className="mt-4">
            The workflow stays honest and local-first: live GitHub data is preferred when configured, fallback data is
            labeled, proof data stays in the browser, and Stripe/Hermes are optional integration layers rather than a
            hidden backend. This hackathon prototype demonstrates the agent workflow end to end without adding accounts
            or a database.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-cyan-100/10 bg-cyan-100/[0.035] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Workflow</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            {["Set growth goal", "Run live/source-aware scan", "Automatically choose contribution target", "Generate brief + PR kit", "Save proof or export judge package"].map((step, index) => (
              <div key={`about-workflow-${step}`} className="flex items-center gap-3 rounded-2xl bg-black/24 px-3 py-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mint/30 bg-mint/10 text-xs font-black text-mint">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map(([title, body]) => (
          <article key={`about-${title}`} className="rounded-[1.5rem] border border-cream/10 bg-white/[0.025] p-5">
            <h3 className="font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </article>
        ))}
      </div>
      <div className="rounded-[1.5rem] border border-cream/10 bg-black/24 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">FAQ</p>
        <h2 className="mt-2 text-xl font-black text-white">Trust and demo boundaries</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faq.map(([question, answer]) => (
            <article key={`about-faq-${question}`} className="rounded-2xl border border-cream/[0.07] bg-white/[0.025] p-4">
              <h3 className="text-sm font-black text-cream">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
            </article>
          ))}
        </div>
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
  return <div className="mx-auto w-full max-w-6xl space-y-4 overflow-x-clip sm:space-y-5">{children}</div>;
}

function WorkspaceFocusNotes({ activeTab }: { activeTab: WorkspaceTab }) {
  const note =
    activeTab === "scanner"
      ? "Scanner mode focuses the existing dashboard on ranked GitHub opportunities, filters, and repo actions."
      : activeTab === "proof"
        ? "Proof mode keeps saved contribution evidence close without turning the vault into a separate duplicate page."
        : "Mission Control mode keeps the full operational overview available in the same workspace.";

  return (
    <div className="rounded-[1.25rem] border border-cyan-100/10 bg-cyan-100/[0.035] px-4 py-3 text-sm leading-6 text-slate-300">
      {note}
    </div>
  );
}

function ProofCandidateSummary({ count }: { count: number }) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-cream/10 bg-black/24 px-4 py-3 text-sm text-slate-300 lg:min-w-72">
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
        body="Review what is live, what is local, what is test-mode, and export a concise hackathon submission package."
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
