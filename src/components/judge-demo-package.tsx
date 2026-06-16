"use client";

import { useMemo, useState } from "react";
import type { AgentRunResult } from "@/lib/agent-run-types";
import type { ProvisionResponse } from "@/components/agent-demo-mode";

const HERMES_COMMAND =
  'python hermes/skills/contribscout-agent/scripts/run_contribscout_agent.py "Grow visibility for an AI agent tooling project through useful open-source contributions."';
const LIVE_APP_URL = "https://contribscout.vercel.app";
const REPO_URL_PLACEHOLDER = "https://github.com/OWNER/REPO";

type CopyState = "idle" | "copied" | "error";

export function JudgeDemoPackage({
  agentRun,
  provisioningResult,
  proofCandidateSaved,
}: {
  agentRun: AgentRunResult | null;
  provisioningResult: ProvisionResponse | null;
  proofCandidateSaved: boolean;
}) {
  const [commandCopyState, setCommandCopyState] = useState<CopyState>("idle");
  const [summaryCopyState, setSummaryCopyState] = useState<CopyState>("idle");
  const [scriptCopyState, setScriptCopyState] = useState<CopyState>("idle");
  const judgeSummary = useMemo(
    () => (agentRun ? buildJudgeSummary(agentRun, provisioningResult, proofCandidateSaved) : ""),
    [agentRun, provisioningResult, proofCandidateSaved],
  );
  const demoScript = useMemo(
    () => (agentRun ? buildDemoScript(agentRun, provisioningResult, proofCandidateSaved) : ""),
    [agentRun, provisioningResult, proofCandidateSaved],
  );

  async function copyText(value: string, setState: (state: CopyState) => void) {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2200);
    }
  }

  function downloadSummary() {
    if (!judgeSummary) return;
    downloadText("contribscout-judge-summary.md", judgeSummary, "text/markdown");
  }

  return (
    <section id="judge-demo-package" className="scroll-mt-24 space-y-6">
      <div className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-warm">Section D · Judge-ready packet</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-cream sm:text-4xl">
            Hackathon Demo Package
          </h2>
          <p className="mt-3 text-lg font-semibold text-white">
            Everything needed to evaluate the ContribScout Agent run.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            This section packages the latest real agent run into integration statuses, a Hermes command, a demo
            timeline, a judge summary, and a concise presentation script.
          </p>
        </div>

        {!agentRun ? (
          <div className="premium-panel rounded-md p-6 text-center">
            <p className="text-lg font-bold text-white">Run the agent first</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Use Agent Demo Mode above to call `/api/agent/run`. Once a real run exists, this package will fill in
              with source status, selected opportunity, Stripe status, Proof Vault status, and exportable judge copy.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <StatusCard title="Hermes Skill" status="Available" detail="hermes/skills/contribscout-agent" tone="mint" />
              <StatusCard title="Agent API" status="Available" detail="/api/agent/run" tone="mint" />
              <StatusCard
                title="GitHub Source"
                status={agentRun.source === "github" ? "Live GitHub scan" : "Sample fallback"}
                detail={`tokenConfigured: ${agentRun.tokenConfigured ? "true" : "false"}`}
                tone={agentRun.source === "github" ? "mint" : "warm"}
              />
              <StatusCard
                title="Stripe Provisioning"
                status={labelForProvisionStatus(provisioningResult)}
                detail={provisioningResult?.message || "Provisioning has not been requested yet."}
                tone={provisioningResult?.status === "checkout_created" ? "mint" : "warm"}
              />
              <StatusCard
                title="Proof Vault"
                status={proofCandidateSaved ? "Saved" : "Ready to save"}
                detail={proofCandidateSaved ? "Agent proof candidate saved locally." : "Proof candidate is prepared but not saved."}
                tone={proofCandidateSaved ? "mint" : "warm"}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <Panel eyebrow="Hermes command" title="Run the skill layer">
                <pre className="overflow-auto rounded-md border border-cream/10 bg-black/40 p-4 text-xs leading-5 text-slate-300">
                  {HERMES_COMMAND}
                </pre>
                <div className="mt-3">
                  <SecondaryButton onClick={() => copyText(HERMES_COMMAND, setCommandCopyState)}>
                    {commandCopyState === "copied" ? "Copied" : commandCopyState === "error" ? "Copy failed" : "Copy command"}
                  </SecondaryButton>
                </div>
              </Panel>

              <Panel eyebrow="Demo flow timeline" title="Six-step run">
                <ol className="space-y-3">
                  {buildTimeline(agentRun, provisioningResult, proofCandidateSaved).map((step, index) => (
                    <li key={`judge-timeline-${index}-${step.title}`} className="flex gap-3 rounded-md border border-cream/10 bg-black/20 p-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mint/40 bg-mint/10 text-xs font-black text-mint">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel eyebrow="Submission summary" title="Judge markdown">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <SecondaryButton onClick={() => copyText(judgeSummary, setSummaryCopyState)}>
                    {summaryCopyState === "copied"
                      ? "Copied"
                      : summaryCopyState === "error"
                        ? "Copy failed"
                        : "Copy Judge Summary"}
                  </SecondaryButton>
                  <SecondaryButton onClick={downloadSummary}>Download Judge Summary</SecondaryButton>
                </div>
                <details className="mt-4 rounded-md border border-cream/10 bg-black/30">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-200">
                    Preview judge summary
                  </summary>
                  <pre className="max-h-96 overflow-auto border-t border-cream/10 p-4 text-xs leading-5 text-slate-300">
                    {judgeSummary}
                  </pre>
                </details>
              </Panel>

              <Panel eyebrow="Demo script" title="1-3 minute walkthrough">
                <SecondaryButton onClick={() => copyText(demoScript, setScriptCopyState)}>
                  {scriptCopyState === "copied" ? "Copied" : scriptCopyState === "error" ? "Copy failed" : "Copy Demo Script"}
                </SecondaryButton>
                <div className="mt-4 rounded-md border border-cream/10 bg-black/30 p-4 text-sm leading-7 text-slate-300">
                  {demoScript.split("\n\n").map((paragraph, index) => (
                    <p key={`demo-script-${index}-${paragraph.slice(0, 18)}`} className={index > 0 ? "mt-3" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusCard({
  title,
  status,
  detail,
  tone,
}: {
  title: string;
  status: string;
  detail: string;
  tone: "mint" | "warm";
}) {
  return (
    <article className="premium-panel rounded-md p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className={`mt-2 text-lg font-black ${tone === "mint" ? "text-mint" : "text-warm"}`}>{status}</p>
      <p className="mt-2 break-words text-xs leading-5 text-slate-400">{detail}</p>
    </article>
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

function buildTimeline(
  agentRun: AgentRunResult,
  provisioningResult: ProvisionResponse | null,
  proofCandidateSaved: boolean,
) {
  return [
    {
      title: "Business goal received",
      detail: agentRun.businessGoal,
    },
    {
      title: "GitHub opportunities scanned",
      detail:
        agentRun.source === "github"
          ? `Live GitHub scan used. Scanned ${agentRun.scannedCount ?? "n/a"} opportunities.`
          : `Sample fallback used. tokenConfigured: ${agentRun.tokenConfigured ? "true" : "false"}.`,
    },
    {
      title: "Highest-leverage contribution selected",
      detail: agentRun.selectedReason || agentRun.selectedOpportunity.fullName,
    },
    {
      title: "Contribution brief generated",
      detail: agentRun.selectedOpportunity.suggestedAction,
    },
    {
      title: "PR readiness kit prepared",
      detail: "Duplicate guard, branch suggestion, PR copy, and validation checklist are ready.",
    },
    {
      title: "Stripe provisioning / Proof Vault evidence prepared",
      detail: `${labelForProvisionStatus(provisioningResult)}. Proof Vault: ${proofCandidateSaved ? "Saved" : "Ready to save"}.`,
    },
  ];
}

function buildJudgeSummary(
  agentRun: AgentRunResult,
  provisioningResult: ProvisionResponse | null,
  proofCandidateSaved: boolean,
) {
  return [
    "# ContribScout Hackathon Demo Package",
    "",
    "## Project",
    "",
    "ContribScout Agent - open-source growth operations for AI teams.",
    "",
    "## Business Goal",
    "",
    agentRun.businessGoal,
    "",
    "## Source Status",
    "",
    `- Source: ${agentRun.source === "github" ? "Live GitHub scan" : "Sample fallback"}`,
    `- tokenConfigured: ${agentRun.tokenConfigured ? "true" : "false"}`,
    `- Notice: ${agentRun.notice || "n/a"}`,
    `- Scanned: ${agentRun.scannedCount ?? "n/a"}`,
    `- Considered: ${agentRun.consideredCount ?? "n/a"}`,
    "",
    "## Selected Opportunity",
    "",
    `- Repo: ${agentRun.selectedOpportunity.fullName}`,
    `- URL: ${agentRun.selectedOpportunity.url || "n/a"}`,
    `- Role Opportunity Score: ${agentRun.selectedOpportunity.roleOpportunityScore}/100`,
    `- Selected reason: ${agentRun.selectedReason || "Selected by deterministic agent ranking."}`,
    "",
    "## Rationale",
    "",
    agentRun.businessRationale.summary,
    "",
    `High leverage: ${agentRun.businessRationale.highLeverageReason}`,
    `Immediate next action: ${agentRun.businessRationale.immediateNextAction}`,
    `Risk to check: ${agentRun.businessRationale.riskToCheck}`,
    "",
    "## Contribution Brief Summary",
    "",
    `- Suggested action: ${agentRun.selectedOpportunity.suggestedAction}`,
    `- Score reason: ${agentRun.selectedOpportunity.scoreReason}`,
    "",
    "## PR Kit Summary",
    "",
    "- Duplicate guard checklist generated.",
    "- Branch, PR title, PR description, validation notes, and developer update copy generated.",
    "",
    "## Stripe Provisioning Status",
    "",
    `- Status: ${labelForProvisionStatus(provisioningResult)}`,
    `- Detail: ${provisioningResult?.message || "Provisioning has not been requested yet."}`,
    `- Session: ${provisioningResult?.sessionId || "n/a"}`,
    "",
    "## Proof Vault Status",
    "",
    proofCandidateSaved ? "Proof candidate saved locally." : "Proof candidate prepared and ready to save.",
    "",
    "## Hermes Skill Command",
    "",
    "```bash",
    HERMES_COMMAND,
    "```",
    "",
    "## Links",
    "",
    `- Live app: ${LIVE_APP_URL}`,
    `- Repository: ${REPO_URL_PLACEHOLDER}`,
  ].join("\n").trim();
}

function buildDemoScript(
  agentRun: AgentRunResult,
  provisioningResult: ProvisionResponse | null,
  proofCandidateSaved: boolean,
) {
  const sourceLine =
    agentRun.source === "github"
      ? "This run is using live GitHub scanner data."
      : `This run is clearly marked as sample fallback, with tokenConfigured set to ${agentRun.tokenConfigured ? "true" : "false"}.`;

  return [
    "ContribScout Agent turns a business goal into a concrete open-source growth operation. I start by entering a goal for an AI or developer tooling team, then the app calls the real `/api/agent/run` endpoint.",
    `${sourceLine} The agent selects ${agentRun.selectedOpportunity.fullName} because ${agentRun.selectedReason || "it ranks highest across score, signals, and business fit."}`,
    `The output is not a generic issue list. It includes the business rationale, high-leverage reason, immediate next action, risk to check, a contribution brief, and a PR readiness kit with duplicate checks and submission copy.`,
    `For operations, the demo also shows Stripe provisioning honestly: ${labelForProvisionStatus(provisioningResult)}. Proof Vault is ${proofCandidateSaved ? "saved locally" : "prepared and ready to save"}, so evidence can be tracked without auth or a database.`,
    "Finally, the Hermes-compatible command shows how this workflow can run from the skill layer. The judge summary packages the whole run for review without claiming fake live data or fake provisioning.",
  ].join("\n\n");
}

function labelForProvisionStatus(result: ProvisionResponse | null) {
  if (!result) return "Not configured";
  if (result.status === "checkout_created") return "Checkout created";
  if (result.status === "not_configured") return "Not configured";
  if (result.status === "test_key_required") return "Test key required";
  if (result.status === "stripe_error") return "Error";
  if (result.status === "request_failed") return "Error";
  return result.status || "Not configured";
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
