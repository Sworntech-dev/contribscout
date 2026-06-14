"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/types";

type ReportSource = "github" | "sample" | null;

export function DailyOpportunityReport({
  opportunities,
  source,
  notice,
  loading,
  usesFilteredResults = false,
}: {
  opportunities: Opportunity[];
  source: ReportSource;
  notice: string | null;
  loading: boolean;
  usesFilteredResults?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const generatedAt = new Date().toISOString();
  const sourceLabel = loading && !source ? "scanning" : source ?? "scanning";
  const markdownReport = useMemo(
    () =>
      buildDailyMarkdownReport({
        opportunities,
        source: sourceLabel,
        notice,
        generatedAt,
      }),
    [generatedAt, notice, opportunities, sourceLabel],
  );
  const hasReport = opportunities.length > 0;

  async function copyReport() {
    if (!hasReport) return;

    try {
      await navigator.clipboard.writeText(markdownReport);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    }
  }

  function downloadReport() {
    if (!hasReport) return;

    const blob = new Blob([markdownReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contribscout-daily-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="daily-report" className="space-y-4">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber">Daily Opportunity Report</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Export the current mission brief</h2>
        <p className="mt-2 leading-7 text-slate-400">
          Convert the visible opportunity list into Markdown for planning, updates, or a Hermes-ready daily workflow.
        </p>
      </div>

      <div className="rounded-md border border-white/10 bg-panel/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <ReportMetric label="Generated" value={new Date(generatedAt).toLocaleString()} />
          <ReportMetric label="Source" value={sourceLabel} />
          <ReportMetric label="Top projects" value={Math.min(opportunities.length, 5).toString()} />
        </div>

        {notice ? <p className="mt-4 text-sm leading-6 text-slate-400">{notice}</p> : null}
        {usesFilteredResults ? (
          <p className="mt-4 text-sm font-semibold text-mint">Report uses current filtered results.</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap">
          <ReportButton disabled={!hasReport} onClick={copyReport}>
            {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy Markdown Report"}
          </ReportButton>
          <ReportButton disabled={!hasReport} onClick={downloadReport}>
            Download Markdown
          </ReportButton>
        </div>

        {!hasReport ? (
          <p className="mt-4 text-sm text-slate-500">
            {loading ? "Running live GitHub scan..." : "No visible opportunities are available for a report yet."}
          </p>
        ) : (
          <details className="mt-5 rounded-md border border-white/10 bg-ink/60 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white marker:text-mint">
              Markdown preview
            </summary>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
              {markdownReport}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function ReportButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-200"
    >
      {children}
    </button>
  );
}

function buildDailyMarkdownReport({
  opportunities,
  source,
  notice,
  generatedAt,
}: {
  opportunities: Opportunity[];
  source: string;
  notice: string | null;
  generatedAt: string;
}) {
  const topOpportunities = opportunities.slice(0, 5);
  const lines = [
    "# ContribScout Daily Opportunity Report",
    "",
    `Generated: ${generatedAt}`,
    `Source: ${source}`,
    `Notice: ${notice || "No notice."}`,
    `Total opportunities: ${opportunities.length}`,
    "",
    "## Top 5 Opportunities",
    "",
  ];

  topOpportunities.forEach((opportunity, index) => {
    const links = getIssueLinks(opportunity);

    lines.push(
      `### ${index + 1}. ${opportunity.name}`,
      "",
      `- Role Opportunity Score: ${opportunity.roleOpportunityScore}/100`,
      `- Category: ${opportunity.category || "open source"}`,
      `- Suggested action: ${opportunity.suggestedAction}`,
      `- Reason: ${opportunity.scoreReason}`,
      `- Repository: ${opportunity.url || "n/a"}`,
    );

    if (isGithubRepoUrl(opportunity.url)) {
      lines.push(
        `- Open issues: ${links.openIssues}`,
        `- Good first issues: ${links.goodFirstIssues}`,
        `- Help wanted: ${links.helpWanted}`,
      );
    }

    lines.push("");
  });

  return lines.join("\n").trim();
}

function getIssueLinks(opportunity: Opportunity) {
  const baseUrl = opportunity.url.replace(/\/$/, "");
  const goodFirstQuery = encodeURIComponent('is:issue is:open label:"good first issue"');
  const helpWantedQuery = encodeURIComponent('is:issue is:open label:"help wanted"');

  return {
    openIssues: `${baseUrl}/issues`,
    goodFirstIssues: `${baseUrl}/issues?q=${goodFirstQuery}`,
    helpWanted: `${baseUrl}/issues?q=${helpWantedQuery}`,
  };
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
