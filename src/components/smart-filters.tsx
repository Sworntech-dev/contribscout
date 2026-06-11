"use client";

import type { OpportunitySort, RolePreset, SmartFilterKey, SmartFilterState } from "@/lib/types";

const filterOptions: { key: SmartFilterKey; label: string }[] = [
  { key: "score70", label: "Score 70+" },
  { key: "goodFirst", label: "Has good first issues" },
  { key: "helpWanted", label: "Has help wanted" },
  { key: "missingDocs", label: "Missing docs" },
  { key: "missingContributing", label: "Missing CONTRIBUTING" },
  { key: "lowSaturation", label: "Low saturation" },
  { key: "openIssues", label: "Has open issues" },
  { key: "githubOnly", label: "GitHub source only" },
];

const presetOptions: { key: RolePreset; label: string }[] = [
  { key: "first-pr", label: "First PR" },
  { key: "docs-fix", label: "Docs Fix" },
  { key: "good-first", label: "Good First Issues" },
  { key: "low-competition", label: "Low Competition" },
  { key: "high-score", label: "High Score" },
  { key: "ai-agent-tools", label: "AI / Agent Tools" },
  { key: "needs-contributing", label: "Needs CONTRIBUTING" },
];

const sortOptions: { value: OpportunitySort; label: string }[] = [
  { value: "best-match", label: "Best match" },
  { value: "highest-score", label: "Highest score" },
  { value: "good-first", label: "Most good first issues" },
  { value: "open-issues", label: "Most open issues" },
  { value: "low-saturation", label: "Lowest saturation" },
];

export function SmartFilters({
  state,
  totalCount,
  filteredCount,
  activeSummary,
  onToggleFilter,
  onSelectPreset,
  onSortChange,
  onClear,
}: {
  state: SmartFilterState;
  totalCount: number;
  filteredCount: number;
  activeSummary: string;
  onToggleFilter: (key: SmartFilterKey) => void;
  onSelectPreset: (preset: RolePreset) => void;
  onSortChange: (sort: OpportunitySort) => void;
  onClear: () => void;
}) {
  const hasActiveFilters = state.activePreset || Object.values(state.filters).some(Boolean) || state.sort !== "best-match";

  return (
    <section className="rounded-md border border-white/10 bg-panel/75 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">Smart Filters</p>
          <h2 className="mt-2 text-xl font-bold text-white">Narrow by role and repo signal</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {filteredCount} of {totalCount} opportunities shown. {activeSummary}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm text-slate-400">
            <span className="sr-only">Sort opportunities</span>
            <select
              value={state.sort}
              onChange={(event) => onSortChange(event.target.value as OpportunitySort)}
              className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm font-semibold text-slate-200 outline-none transition focus:border-mint/60 sm:w-56"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={onClear}
            className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-slate-200"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role presets</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {presetOptions.map((preset) => {
            const active = state.activePreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onSelectPreset(preset.key)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-mint/50 bg-mint/10 text-mint"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-mint/40 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signals</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            const active = state.filters[filter.key];
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onToggleFilter(filter.key)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-skyglass/50 bg-skyglass/10 text-skyglass"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-skyglass/40 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
