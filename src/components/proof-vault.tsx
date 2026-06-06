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

export function ProofVault({ opportunities }: { opportunities: Opportunity[] }) {
  const [entries, setEntries] = useState<ProofEntry[]>([]);
  const [form, setForm] = useState(emptyEntry);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      queueMicrotask(() => setEntries(JSON.parse(saved) as ProofEntry[]));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

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

  return (
    <section id="proof-vault" className="space-y-4">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose">Proof Vault</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Save contribution evidence locally</h2>
        <p className="mt-2 leading-7 text-slate-400">
          Store planned or completed actions in localStorage for the MVP demo. No account, database, or backend state required.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submitEntry} className="rounded-md border border-white/10 bg-panel/75 p-5">
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

        <div className="rounded-md border border-white/10 bg-white/[0.03] p-5">
          {entries.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <p className="text-lg font-bold text-white">No saved proof yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Add your first planned contribution or submitted proof when you pick an opportunity.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-md border border-white/10 bg-panel p-4">
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
