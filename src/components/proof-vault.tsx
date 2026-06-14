"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Opportunity, ProofEntry } from "@/lib/types";

const STORAGE_KEY = "contribscout-proof-vault";
const statuses: ProofEntry["status"][] = ["Planned", "In progress", "Submitted", "Merged", "Archived"];

type ProofForm = Omit<ProofEntry, "id">;

const emptyEntry: ProofForm = {
  projectName: "",
  actionTaken: "",
  proofLink: "",
  status: "Planned" as const,
  notes: "",
  date: new Date().toISOString().slice(0, 10),
};

export function ProofVault({
  opportunities,
  onEntryCountChange,
}: {
  opportunities: Opportunity[];
  onEntryCountChange?: (count: number) => void;
}) {
  const [entries, setEntries] = useState<ProofEntry[]>([]);
  const [form, setForm] = useState(emptyEntry);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      queueMicrotask(() => setEntries(JSON.parse(saved) as ProofEntry[]));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    onEntryCountChange?.(entries.length);
  }, [entries, onEntryCountChange]);

  const suggestedActions = useMemo(
    () =>
      opportunities.map((opportunity) => ({
        key: `${opportunity.fullName}-suggested-action`,
        value: opportunity.suggestedAction,
      })),
    [opportunities],
  );

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.projectName.trim() || !form.actionTaken.trim()) {
      return;
    }

    setEntries((current) => [
      {
        id: crypto.randomUUID(),
        ...form,
      },
      ...current,
    ]);
    setForm(emptyEntry);
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function exportMarkdown() {
    if (!entries.length) return;
    downloadText("contribscout-proof-vault.md", buildMarkdownReport(entries), "text/markdown");
  }

  function exportJson() {
    if (!entries.length) return;
    downloadText(
      "contribscout-proof-vault.json",
      JSON.stringify(buildJsonReport(entries), null, 2),
      "application/json",
    );
  }

  async function copyMarkdown() {
    if (!entries.length) return;

    try {
      await navigator.clipboard.writeText(buildMarkdownReport(entries));
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    }
  }

  return (
    <section id="proof-vault" className="space-y-4">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose">Proof Vault</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Archive contribution proof</h2>
        <p className="mt-2 leading-7 text-slate-400">
          Keep submitted work, links, notes, and outcomes in a local vault. No account, database, or backend state required.
        </p>
      </div>

      <div className="premium-panel rounded-md p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Export proof report</p>
            <p className="mt-1 text-sm text-slate-400">
              {entries.length
                ? `${entries.length} saved ${entries.length === 1 ? "entry" : "entries"} ready to export.`
                : "Nothing to export yet. Save a proof entry first."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <ExportButton disabled={!entries.length} onClick={exportMarkdown}>
              Export as Markdown
            </ExportButton>
            <ExportButton disabled={!entries.length} onClick={exportJson}>
              Export as JSON
            </ExportButton>
            <ExportButton disabled={!entries.length} onClick={copyMarkdown}>
              {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy Markdown Report"}
            </ExportButton>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submitEntry} className="premium-panel rounded-md p-5">
          <div className="grid gap-4">
            <Field label="Project name">
              <input
                list="project-options"
                value={form.projectName}
                onChange={(event) => setForm({ ...form, projectName: event.target.value })}
                className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                placeholder="agent-mesh-kit"
              />
              <datalist id="project-options">
                {opportunities.map((opportunity) => (
                  <option key={opportunity.fullName} value={opportunity.name} />
                ))}
              </datalist>
            </Field>

            <Field label="Action taken">
              <input
                list="action-options"
                value={form.actionTaken}
                onChange={(event) => setForm({ ...form, actionTaken: event.target.value })}
                className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                placeholder="Write a beginner setup guide"
              />
              <datalist id="action-options">
                {suggestedActions.map((action) => (
                  <option key={action.key} value={action.value} />
                ))}
              </datalist>
            </Field>

            <Field label="Proof link">
              <input
                value={form.proofLink}
                onChange={(event) => setForm({ ...form, proofLink: event.target.value })}
                className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                placeholder="https://github.com/.../pull/1"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ProofEntry["status"] })}
                  className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                >
                  {statuses.map((status) => (
                    <option key={`proof-status-${status}`}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="min-h-24 w-full resize-y rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                placeholder="What changed, who reviewed it, or what you learned."
              />
            </Field>

            <button className="rounded-md bg-mint px-4 py-2 text-sm font-black text-ink transition hover:bg-white">
              Save proof
            </button>
          </div>
        </form>

        <div className="premium-panel rounded-md p-5">
          {entries.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <p className="text-lg font-bold text-white">Proof vault is empty</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  When a PR, issue, or discussion is submitted, store the evidence link here so the contribution trail stays tidy.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-md border border-cream/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white">{entry.projectName}</h3>
                      <p className="mt-1 text-sm text-slate-300">{entry.actionTaken}</p>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400 transition hover:border-rose/50 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-md bg-white/[0.05] px-2 py-1">{entry.status}</span>
                    <span className="rounded-md bg-white/[0.05] px-2 py-1">{entry.date}</span>
                    {entry.proofLink ? (
                      <a
                        href={entry.proofLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-white/[0.05] px-2 py-1 text-mint"
                      >
                        Proof link
                      </a>
                    ) : null}
                  </div>
                  {entry.notes ? <p className="mt-3 text-sm leading-6 text-slate-400">{entry.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
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

function ExportButton({
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

function buildStatusSummary(entries: ProofEntry[]) {
  const summary = statuses.reduce(
    (counts, status) => ({ ...counts, [status]: 0 }),
    {} as Record<ProofEntry["status"], number>,
  );

  entries.forEach((entry) => {
    summary[entry.status] += 1;
  });

  return summary;
}

function buildMarkdownReport(entries: ProofEntry[]) {
  const generatedAt = new Date().toISOString();
  const summary = buildStatusSummary(entries);
  const statusLines = statuses.map((status) => `- ${status}: ${summary[status]}`);
  const entryLines = entries.flatMap((entry, index) => [
    `## ${index + 1}. ${entry.projectName || "Untitled project"}`,
    "",
    `- Action taken: ${entry.actionTaken || "n/a"}`,
    `- Proof link: ${entry.proofLink || "n/a"}`,
    `- Status: ${entry.status}`,
    `- Date: ${entry.date || "n/a"}`,
    `- Notes: ${entry.notes || "n/a"}`,
    "",
  ]);

  return [
    "# ContribScout Proof Vault Report",
    "",
    `Generated: ${generatedAt}`,
    `Total entries: ${entries.length}`,
    "",
    "## Status Summary",
    "",
    ...statusLines,
    "",
    "## Proof Entries",
    "",
    ...entryLines,
  ].join("\n").trim();
}

function buildJsonReport(entries: ProofEntry[]) {
  return {
    exportedAt: new Date().toISOString(),
    app: "ContribScout",
    version: "0.3",
    entries,
    summary: buildStatusSummary(entries),
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
