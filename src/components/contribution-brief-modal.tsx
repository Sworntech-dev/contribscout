"use client";

import { useMemo, useState } from "react";
import {
  buildContributionBriefMarkdown,
  getContributionBriefFilename,
} from "@/lib/contribution-brief";
import type { ContributionBriefTarget } from "@/lib/types";

export function ContributionBriefModal({
  target,
  canSaveToWatchlist,
  onClose,
  onSaveToWatchlist,
}: {
  target: ContributionBriefTarget | null;
  canSaveToWatchlist: boolean;
  onClose: () => void;
  onSaveToWatchlist: (target: ContributionBriefTarget, markdown: string) => void;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const markdown = useMemo(() => (target ? buildContributionBriefMarkdown(target) : ""), [target]);

  if (!target) return null;
  const activeTarget = target;

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    }
  }

  function downloadBrief() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getContributionBriefFilename(activeTarget);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function saveBrief() {
    if (!canSaveToWatchlist) return;

    try {
      onSaveToWatchlist(activeTarget, markdown);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setSaveStatus("error");
      window.setTimeout(() => setSaveStatus("idle"), 2200);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 px-4 py-6 backdrop-blur-md">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(8,9,15,0.96))] p-5 shadow-glow">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">Contribution Brief</p>
            <h2 className="mt-2 break-words text-2xl font-black text-white">{activeTarget.projectName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A copy-ready Markdown plan for starting a focused contribution.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-mint/50 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <BriefMetric label="Score" value={typeof activeTarget.score === "number" ? activeTarget.score.toString() : "n/a"} />
          <BriefMetric label="Category" value={activeTarget.category || "open source"} />
          <BriefMetric label="Repo" value={activeTarget.repoUrl ? "Available" : "n/a"} />
        </div>

        {activeTarget.watchlistStatus || activeTarget.watchlistNote ? (
          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">
            <p>
              <span className="font-semibold text-white">Watchlist status:</span>{" "}
              {activeTarget.watchlistStatus || "n/a"}
            </p>
            {activeTarget.watchlistNote ? (
              <p className="mt-1">
                <span className="font-semibold text-white">Note:</span> {activeTarget.watchlistNote}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap">
          <BriefButton onClick={copyBrief}>
            {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy Brief Markdown"}
          </BriefButton>
          <BriefButton onClick={downloadBrief}>Download Brief Markdown</BriefButton>
          {canSaveToWatchlist ? (
            <BriefButton onClick={saveBrief}>
              {saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Save Brief to Watchlist"}
            </BriefButton>
          ) : null}
        </div>

        {!canSaveToWatchlist ? (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Save this repo to Watchlist first if you want to attach the generated brief locally.
          </p>
        ) : null}

        <details className="mt-5 rounded-md border border-white/10 bg-ink/75 p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-white marker:text-mint">
            Markdown preview
          </summary>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
            {markdown}
          </pre>
        </details>
      </div>
    </div>
  );
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function BriefButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-white"
    >
      {children}
    </button>
  );
}
