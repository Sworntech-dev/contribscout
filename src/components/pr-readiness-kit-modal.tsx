"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  buildDeveloperUpdateMessage,
  buildPrDescriptionTemplate,
  buildPrReadinessKitMarkdown,
  getPrReadinessKitFilename,
} from "@/lib/pr-readiness-kit";
import { Motion } from "@/components/motion-shell";
import type { ContributionBriefTarget } from "@/lib/types";

type CopyTarget = "kit" | "description" | "update";

export function PrReadinessKitModal({
  target,
  onClose,
}: {
  target: ContributionBriefTarget | null;
  onClose: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyTarget | "error" | "idle">("idle");
  const reduceMotion = useReducedMotion();
  const markdown = useMemo(() => (target ? buildPrReadinessKitMarkdown(target) : ""), [target]);
  const description = useMemo(() => (target ? buildPrDescriptionTemplate(target) : ""), [target]);
  const update = useMemo(() => (target ? buildDeveloperUpdateMessage(target) : ""), [target]);

  if (!target) return null;
  const activeTarget = target;

  async function copyText(kind: CopyTarget, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(kind);
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    }
  }

  function downloadKit() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getPrReadinessKitFilename(activeTarget);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 px-4 py-6 backdrop-blur-md"
    >
      <Motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-md border border-cream/10 bg-[linear-gradient(180deg,rgba(243,234,215,0.08),rgba(8,12,11,0.96))] p-5 shadow-[0_40px_130px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warm/70 to-transparent" />
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warm">PR Readiness Kit</p>
            <h2 className="mt-2 break-words text-2xl font-black text-cream">{activeTarget.projectName}</h2>
            <p className="mt-2 text-sm leading-6 text-cream/58">
              Prepare duplicate checks, branch naming, PR copy, and a maintainer-friendly submission plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-md border border-cream/10 bg-cream/[0.045] px-3 py-2 text-sm font-semibold text-cream/70 transition hover:border-moss/50 hover:text-cream"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <KitMetric label="Score" value={typeof activeTarget.score === "number" ? activeTarget.score.toString() : "n/a"} />
          <KitMetric label="Repo" value={activeTarget.repoUrl ? "Available" : "Manual check"} />
          <KitMetric label="Source" value={activeTarget.isSample ? "Sample" : "Opportunity"} />
        </div>

        {activeTarget.watchlistStatus || activeTarget.watchlistNote ? (
          <div className="mt-4 rounded-md border border-cream/10 bg-cream/[0.04] p-3 text-sm leading-6 text-cream/70">
            <p>
              <span className="font-semibold text-cream">Watchlist status:</span>{" "}
              {activeTarget.watchlistStatus || "n/a"}
            </p>
            {activeTarget.watchlistNote ? (
              <p className="mt-1">
                <span className="font-semibold text-cream">Note:</span> {activeTarget.watchlistNote}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap">
          <KitButton onClick={() => copyText("kit", markdown)}>
            {copyStatus === "kit" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy PR Kit Markdown"}
          </KitButton>
          <KitButton onClick={downloadKit}>Download PR Kit Markdown</KitButton>
          <KitButton onClick={() => copyText("description", description)}>
            {copyStatus === "description" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy PR Description"}
          </KitButton>
          <KitButton onClick={() => copyText("update", update)}>
            {copyStatus === "update" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy Developer Update"}
          </KitButton>
        </div>

        <details className="mt-5 rounded-md border border-cream/10 bg-ink/75 p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-cream marker:text-moss">
            Markdown preview
          </summary>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-cream/70">
            {markdown}
          </pre>
        </details>
      </Motion.div>
    </Motion.div>
  );
}

function KitMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cream/10 bg-cream/[0.045] p-3">
      <p className="text-xs text-cream/42">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-cream">{value}</p>
    </div>
  );
}

function KitButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="rounded-md border border-cream/10 bg-cream/[0.045] px-3 py-2 text-sm font-semibold text-cream/78 transition hover:border-warm/50 hover:text-cream"
    >
      {children}
    </Motion.button>
  );
}
