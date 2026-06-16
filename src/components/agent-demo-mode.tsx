"use client";

import { useMemo, useState } from "react";
import type { AgentRunResult, ProofVaultCandidate } from "@/lib/agent-run-types";

const AGENT_PROOF_STORAGE_KEY = "contribscout.agentProof.v1";
const DEFAULT_GOAL = "Grow visibility for an AI agent tooling project through useful open-source contributions.";
const DEFAULT_TEAM_CONTEXT = "Small AI tooling team";
const GOAL_PRESETS = [
  {
    label: "AI agent tooling visibility",
    businessGoal: "Grow visibility for an AI agent tooling project through useful open-source contributions.",
    teamContext: "Small AI tooling team",
  },
  {
    label: "Web3 developer tooling growth",
    businessGoal: "Find high-leverage Web3 developer tooling contributions that can create public proof for a small infrastructure team.",
    teamContext: "Small Web3 developer tools team",
  },
  {
    label: "Open-source DevRel pipeline",
    businessGoal: "Build an open-source DevRel pipeline by contributing useful docs, examples, and issue notes to active developer projects.",
    teamContext: "DevRel and growth team",
  },
];

type RunState = "idle" | "running" | "success" | "error";
type CopyState = "idle" | "copied" | "error";
type ProvisionState = "idle" | "loading" | "ready" | "not_configured" | "error";
export type ProvisionResponse = {
  configured: boolean;
  status: string;
  message: string;
  checkoutUrl?: string | null;
  sessionId?: string;
  livemode?: boolean;
};

export function AgentDemoMode({
  onRunResultChange,
  onProvisionResultChange,
  onProofSavedChange,
}: {
  onRunResultChange?: (result: AgentRunResult | null) => void;
  onProvisionResultChange?: (result: ProvisionResponse | null) => void;
  onProofSavedChange?: (saved: boolean) => void;
}) {
  const [businessGoal, setBusinessGoal] = useState(DEFAULT_GOAL);
  const [teamContext, setTeamContext] = useState(DEFAULT_TEAM_CONTEXT);
  const [runState, setRunState] = useState<RunState>("idle");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [provisionState, setProvisionState] = useState<ProvisionState>("idle");
  const [provisionResult, setProvisionResult] = useState<ProvisionResponse | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentRunResult | null>(null);

  const prDetails = useMemo(() => (result ? extractPrDetails(result.prReadinessKit.markdown) : null), [result]);
  const briefDetails = useMemo(() => (result ? extractBriefDetails(result.contributionBrief.markdown) : null), [result]);

  async function runAgent() {
    const goal = businessGoal.trim();

    if (!goal) {
      setError("Add a business goal before running the agent.");
      setRunState("error");
      return;
    }

    setRunState("running");
    setError("");
    setCopyState("idle");
    setSaveState("idle");
    setProvisionState("idle");
    setProvisionResult(null);
    onProvisionResultChange?.(null);
    onProofSavedChange?.(false);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessGoal: goal,
          teamContext: teamContext.trim() || DEFAULT_TEAM_CONTEXT,
          maxOpportunities: 8,
        }),
      });

      const payload = (await response.json()) as AgentRunResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Agent run failed.");
      }

      setResult(payload as AgentRunResult);
      onRunResultChange?.(payload as AgentRunResult);
      setRunState("success");
    } catch (agentError) {
      setError(agentError instanceof Error ? agentError.message : "Agent run failed.");
      setRunState("error");
    }
  }

  async function copyMarkdown() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.markdownSummary);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  function downloadMarkdown() {
    if (!result) return;
    downloadText("contribscout-agent-run.md", result.markdownSummary, "text/markdown");
  }

  function saveProofCandidate() {
    if (!result) return;

    try {
      const saved = window.localStorage.getItem(AGENT_PROOF_STORAGE_KEY);
      const existing = saved ? (JSON.parse(saved) as SavedAgentProofCandidate[]) : [];
      const candidate = toSavedAgentProof(result.proofVaultCandidate, result.runId);
      const next = [
        candidate,
        ...existing.filter((entry) => entry.id !== candidate.id),
      ];

      window.localStorage.setItem(AGENT_PROOF_STORAGE_KEY, JSON.stringify(next));
      setSaveState("saved");
      onProofSavedChange?.(true);
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2400);
    }
  }

  async function provisionWorkspace() {
    if (!result) return;

    setProvisionState("loading");
    setProvisionResult(null);

    try {
      const response = await fetch("/api/ops/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: result.runId,
          businessGoal: result.businessGoal,
          selectedOpportunity: result.selectedOpportunity.fullName,
          plan: "ContribScout OSS Growth Workspace",
        }),
      });
      const payload = (await response.json()) as ProvisionResponse;

      setProvisionResult(payload);
      onProvisionResultChange?.(payload);

      if (!payload.configured) {
        setProvisionState("not_configured");
        return;
      }

      if (!response.ok || !payload.checkoutUrl) {
        setProvisionState("error");
        return;
      }

      setProvisionState("ready");
    } catch {
      setProvisionResult({
        configured: false,
        status: "request_failed",
        message: "Provisioning request failed. Check the local server or deployment logs.",
      });
      setProvisionState("error");
    }
  }

  return (
    <section id="agent-console-home" className="scroll-mt-24 space-y-7">
      <div className="relative overflow-hidden rounded-[2rem] px-2 py-8 sm:px-6 lg:px-10">
        <div className="absolute left-1/2 top-8 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-mint/20 blur-3xl" />
        <div className="absolute right-12 top-14 -z-10 h-40 w-40 rounded-full border border-mint/20 bg-[radial-gradient(circle,rgba(128,185,154,0.28),rgba(128,185,154,0.04)_58%,transparent_70%)] shadow-[0_0_80px_rgba(128,185,154,0.18)]" />

        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-mint">Hackathon agent workflow</p>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-cream sm:text-6xl">
            Hey! What should ContribScout Agent run?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Turn an open-source growth goal into a live GitHub scan, contribution brief, PR kit, Stripe provisioning
            step, and judge-ready report.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
          {GOAL_PRESETS.map((preset) => (
            <button
              key={`agent-preset-${preset.label}`}
              type="button"
              onClick={() => {
                setBusinessGoal(preset.businessGoal);
                setTeamContext(preset.teamContext);
              }}
              className="rounded-2xl border border-cream/10 bg-white/[0.045] p-4 text-left transition hover:-translate-y-0.5 hover:border-mint/50 hover:bg-mint/10"
            >
              <p className="text-sm font-black text-white">{preset.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{preset.teamContext}</p>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-4xl rounded-[1.5rem] border border-mint/20 bg-[#07110e]/90 p-4 shadow-[0_0_70px_rgba(128,185,154,0.12)] backdrop-blur">
          <div className="grid gap-4">
            <Field label="Business goal">
              <textarea
                value={businessGoal}
                onChange={(event) => setBusinessGoal(event.target.value)}
                className="min-h-28 w-full resize-y rounded-2xl border border-cream/10 bg-black/35 px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-mint/60"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Team context">
                <input
                  value={teamContext}
                  onChange={(event) => setTeamContext(event.target.value)}
                  className="w-full rounded-2xl border border-cream/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition focus:border-mint/60"
                />
              </Field>
              <button
                type="button"
                onClick={runAgent}
                disabled={runState === "running"}
                className="rounded-2xl bg-warm px-6 py-3 text-sm font-black text-ink shadow-[0_0_34px_rgba(244,181,98,0.28)] transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runState === "running" ? "Running agent..." : "Run Agent"}
              </button>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              The run calls `/api/agent/run`, uses the current GitHub scanner source honestly, prepares PR workflow
              artifacts, and keeps provisioning separate until Stripe is configured.
            </p>
            {runState === "error" ? (
              <p className="rounded-2xl border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">{error}</p>
            ) : null}
          </div>
        </div>

        {runState === "running" ? <AgentLoadingState /> : null}

        {result ? (
          <div className="grid gap-8">
            <section id="agent-run-results" className="scroll-mt-24 space-y-4">
              <SectionHeading
                eyebrow="Section A"
                title="Agent Run"
                description="The live run log, selected opportunity, and source status stay together for a clean judge walkthrough."
              />
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <ActionLog result={result} />
              <SelectedOpportunityPanel result={result} />
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeading
                eyebrow="Section B"
                title="Contribution Plan"
                description="Business rationale, contribution brief, and PR readiness kit are grouped as one practical plan."
              />
              <div className="grid gap-5 xl:grid-cols-3">
              <Panel eyebrow="Business rationale" title="Why this matters">
                <div className="space-y-3 text-sm leading-6 text-slate-300">
                  <p>{result.businessRationale.summary}</p>
                  <p>
                    <span className="font-semibold text-white">Growth angle:</span>{" "}
                    {result.businessRationale.growthAngle}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Why now:</span> {result.businessRationale.whyNow}
                  </p>
                  <p>
                    <span className="font-semibold text-white">High leverage:</span>{" "}
                    {result.businessRationale.highLeverageReason}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Next action:</span>{" "}
                    {result.businessRationale.immediateNextAction}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Risk to check:</span>{" "}
                    {result.businessRationale.riskToCheck}
                  </p>
                </div>
              </Panel>

              <Panel eyebrow="Contribution brief" title="Starting plan">
                <div className="space-y-4">
                  <KeyValue label="Problem" value={result.selectedOpportunity.scoreReason} />
                  <KeyValue label="Suggested fix" value={result.selectedOpportunity.suggestedAction} />
                  <KeyValue
                    label="Signals"
                    value={briefDetails?.signals || result.selectedOpportunity.signalBadges.join(", ") || "No extra signals available."}
                  />
                  <KeyValue
                    label="Risk notes"
                    value="Keep the first contribution narrow, cite the issue with References, and avoid unrelated files."
                  />
                </div>
              </Panel>

              <Panel eyebrow="PR readiness kit" title="Submission prep">
                <div className="space-y-4 text-sm text-slate-300">
                  <KeyValue label="Branch" value={prDetails?.branchName || "docs/first-contribution"} code />
                  <KeyValue label="PR title" value={prDetails?.prTitle || result.selectedOpportunity.suggestedAction} />
                  <KeyValue
                    label="Validation"
                    value={prDetails?.validation || "Run the relevant setup, docs preview, tests, or manual checks you can run."}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Duplicate guard</p>
                    <ul className="mt-2 space-y-2">
                      {result.prReadinessKit.duplicateGuard.slice(0, 4).map((item, index) => (
                        <li key={`agent-duplicate-guard-${index}-${item.slice(0, 18)}`} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="rounded-md border border-warm/20 bg-warm/10 px-3 py-2 text-xs leading-5 text-warm">
                    Use `References #issue` by default. Use `Closes #issue` only when the PR fully resolves the issue.
                  </p>
                </div>
              </Panel>
              </div>
            </section>

            <section id="ops-provisioning" className="scroll-mt-24 space-y-4">
              <SectionHeading
                eyebrow="Section C"
                title="Operations"
                description="Stripe and Proof Vault are operational steps, separated from the agent decision and kept honest."
              />
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel eyebrow="Proof Vault candidate" title="Evidence plan">
                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    <KeyValue label="Project" value={result.proofVaultCandidate.projectName} />
                    <KeyValue label="Action" value={result.proofVaultCandidate.actionTaken} />
                    <KeyValue label="Proof link" value={result.proofVaultCandidate.proofLink || "n/a"} />
                    <KeyValue label="Status" value={result.proofVaultCandidate.status} />
                    <KeyValue label="Notes" value={result.proofVaultCandidate.notes} />
                    <button
                      type="button"
                      onClick={saveProofCandidate}
                      className="mt-2 rounded-md border border-mint/40 bg-mint/10 px-4 py-2 text-sm font-bold text-mint transition hover:border-mint hover:bg-mint hover:text-ink"
                    >
                      {saveState === "saved"
                        ? "Saved"
                        : saveState === "error"
                          ? "Save failed"
                          : "Save to Proof Vault"}
                    </button>
                    <p className="text-xs leading-5 text-slate-500">
                      Saved agent proof candidates use `contribscout.agentProof.v1` and do not overwrite the existing Proof Vault.
                    </p>
                  </div>
                </Panel>

                <Panel eyebrow="Ops provisioning" title="Stripe workspace step">
                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    <p>
                      The agent recommends provisioning an OSS growth workspace for this run. This is the spending and
                      provisioning step, backed by Stripe Checkout in test mode when configured.
                    </p>
                    <KeyValue label="Plan" value="ContribScout OSS Growth Workspace" />
                    <KeyValue label="Amount" value="$5.00 USD test-mode payment" />
                    <KeyValue label="Selected opportunity" value={result.selectedOpportunity.fullName} />
                    <button
                      type="button"
                      onClick={provisionWorkspace}
                      disabled={provisionState === "loading"}
                      className="mt-2 rounded-md border border-warm/40 bg-warm/10 px-4 py-2 text-sm font-bold text-warm transition hover:border-warm hover:bg-warm hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {provisionState === "loading" ? "Creating session..." : "Provision with Stripe"}
                    </button>
                    {provisionResult ? (
                      <div
                        className={`rounded-md border px-3 py-2 text-xs leading-5 ${
                          provisionState === "ready"
                            ? "border-mint/30 bg-mint/10 text-mint"
                            : "border-warm/30 bg-warm/10 text-warm"
                        }`}
                      >
                        <p className="font-bold">{labelForProvisionStatus(provisionResult.status)}</p>
                        <p className="mt-1">{provisionResult.message}</p>
                        {provisionResult.sessionId ? <p className="mt-1">Session: {provisionResult.sessionId}</p> : null}
                        {provisionResult.livemode === false ? <p className="mt-1">Mode: Stripe test mode</p> : null}
                        {provisionResult.checkoutUrl ? (
                          <a
                            href={provisionResult.checkoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-md border border-mint/40 px-3 py-2 font-bold text-mint transition hover:bg-mint hover:text-ink"
                          >
                            Open Stripe Checkout
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="text-xs leading-5 text-slate-500">
                      If `STRIPE_SECRET_KEY` is missing or not a test key, this card shows setup guidance and does not
                      create a fake checkout URL.
                    </p>
                  </div>
                </Panel>
              </div>
            </section>

            <div className="grid gap-5">
              <Panel eyebrow="Markdown summary" title="Reusable report">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <SecondaryButton onClick={copyMarkdown}>
                    {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy Markdown"}
                  </SecondaryButton>
                  <SecondaryButton onClick={downloadMarkdown}>Download Markdown</SecondaryButton>
                </div>
                <details className="mt-4 rounded-md border border-cream/10 bg-black/30">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-200">
                    Preview Markdown summary
                  </summary>
                  <pre className="max-h-80 overflow-auto border-t border-cream/10 p-4 text-xs leading-5 text-slate-300">
                    {result.markdownSummary}
                  </pre>
                </details>
              </Panel>
            </div>
          </div>
        ) : (
          <div className="premium-panel rounded-md p-6 text-center">
            <p className="text-lg font-bold text-white">Ready to run a real agent workflow</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Run Agent will call `/api/agent/run`, use the current ContribScout scanner result, and render the returned workflow here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ActionLog({ result }: { result: AgentRunResult }) {
  return (
    <Panel eyebrow="Hermes-style action log" title="Agent run steps">
      <div className="space-y-3">
        {result.steps.map((step, index) => (
          <article key={`${step.id}-${step.completedAt}-${index}`} className="rounded-md border border-cream/10 bg-black/20 p-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-mint/40 bg-mint/10 text-xs font-black text-mint">
                {index + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{step.label}</h3>
                  <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-mint">
                    {step.status}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-400">{step.detail}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function SelectedOpportunityPanel({ result }: { result: AgentRunResult }) {
  const isSample = result.source === "sample";
  const sourceStatus = getSourceStatus(result);

  return (
    <Panel eyebrow="Selected opportunity" title={result.selectedOpportunity.fullName}>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="grid h-28 w-28 place-items-center rounded-md border border-mint/30 bg-mint/10 text-center">
          <div>
            <p className="text-4xl font-black text-mint">{result.selectedOpportunity.roleOpportunityScore}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Role score</p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-6 text-slate-300">
          <p>{result.selectedOpportunity.description}</p>
          <div
            className={`rounded-md border px-3 py-2 text-xs leading-5 ${
              isSample ? "border-warm/35 bg-warm/10 text-warm" : "border-mint/35 bg-mint/10 text-mint"
            }`}
          >
            <p className="font-black uppercase tracking-[0.18em]">{sourceStatus.label}</p>
            <p className="mt-1">{sourceStatus.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{result.selectedOpportunity.category}</Badge>
            <Badge>{isSample ? "sample" : "github"}</Badge>
            {isSample ? <Badge tone="warm">Sample fallback</Badge> : null}
            {result.tokenConfigured ? <Badge>Token configured</Badge> : <Badge tone="warm">No token</Badge>}
          </div>
          <p>
            <span className="font-semibold text-white">Why selected:</span>{" "}
            {result.selectedReason || result.businessRationale.evidence[0] || result.selectedOpportunity.scoreReason}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-md bg-white/[0.05] px-2 py-1">
              Scanned: {result.scannedCount ?? "n/a"}
            </span>
            <span className="rounded-md bg-white/[0.05] px-2 py-1">
              Considered: {result.consideredCount ?? "n/a"}
            </span>
          </div>
          {result.notice ? (
            <p className={`rounded-md border px-3 py-2 text-xs leading-5 ${isSample ? "border-warm/30 bg-warm/10 text-warm" : "border-mint/30 bg-mint/10 text-mint"}`}>
              {result.notice}
            </p>
          ) : null}
          {result.selectedOpportunity.url ? (
            <a
              href={result.selectedOpportunity.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md border border-cream/10 px-3 py-2 text-sm font-semibold text-cream transition hover:border-mint/50 hover:text-mint"
            >
              Open repository
            </a>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function AgentLoadingState() {
  return (
    <div className="premium-panel rounded-md p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-12 w-12 animate-pulse rounded-md border border-mint/30 bg-mint/10" />
        <div className="space-y-2">
          <p className="font-bold text-white">Running ContribScout Agent...</p>
          <p className="text-sm text-slate-400">Calling `/api/agent/run`, selecting an opportunity, and building workflow artifacts.</p>
        </div>
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="premium-panel rounded-md p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function KeyValue({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      {code ? (
        <code className="mt-1 block rounded-md border border-cream/10 bg-black/30 px-3 py-2 text-xs text-mint">{value}</code>
      ) : (
        <p className="mt-1 text-sm leading-6 text-slate-300">{value}</p>
      )}
    </div>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-cream/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-white"
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "mint" }: { children: React.ReactNode; tone?: "mint" | "warm" }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
        tone === "warm"
          ? "border-warm/30 bg-warm/10 text-warm"
          : "border-mint/30 bg-mint/10 text-mint"
      }`}
    >
      {children}
    </span>
  );
}

type SavedAgentProofCandidate = ProofVaultCandidate & {
  id: string;
  savedAt: string;
  runId: string;
};

function toSavedAgentProof(candidate: ProofVaultCandidate, runId: string): SavedAgentProofCandidate {
  return {
    ...candidate,
    id: `${runId}-${candidate.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    runId,
    savedAt: new Date().toISOString(),
  };
}

function extractPrDetails(markdown: string) {
  return {
    branchName: findMarkdownValue(markdown, "- Branch name:"),
    prTitle: findMarkdownValue(markdown, "- PR title:"),
    validation: "Run relevant local checks or document why they were not run.",
  };
}

function extractBriefDetails(markdown: string) {
  const signalLines = markdown
    .split("\n")
    .filter((line) =>
      /^- (Open issues|Good first issues|Help wanted|README quality|Docs folder|CONTRIBUTING guide|Issue activity|Saturation):/.test(line),
    )
    .slice(0, 4)
    .map((line) => line.replace(/^- /, ""));

  return {
    signals: signalLines.join("; "),
  };
}

function findMarkdownValue(markdown: string, label: string) {
  const line = markdown.split("\n").find((item) => item.startsWith(label));
  return line?.replace(label, "").replace(/`/g, "").trim() ?? "";
}

function labelForProvisionStatus(status: string) {
  if (status === "checkout_created") return "Checkout session created";
  if (status === "not_configured") return "Stripe not configured";
  if (status === "test_key_required") return "Stripe test key required";
  if (status === "stripe_error") return "Stripe error";
  return "Provisioning status";
}

function getSourceStatus(result: AgentRunResult) {
  if (result.source === "github") {
    return {
      label: "Live GitHub scan",
      detail: result.notice?.toLowerCase().includes("limited")
        ? "Live GitHub data is being used, with a limited-results notice from the scanner."
        : "The agent selected from live GitHub scanner results.",
    };
  }

  if (!result.tokenConfigured) {
    return {
      label: "GITHUB_TOKEN is not configured",
      detail: "The agent is using sample fallback data. Add GITHUB_TOKEN for stronger live demo quality.",
    };
  }

  return {
    label: "Sample fallback",
    detail: result.notice || "The live scan did not provide usable results, so sample fallback data is shown honestly.",
  };
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
