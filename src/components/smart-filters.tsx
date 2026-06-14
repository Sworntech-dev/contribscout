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
    <section className="premium-panel rounded-md p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">Smart Filters</p>
          <h2 className="mt-2 text-xl font-bold text-cream">Narrow by role and repo signal</h2>
          <p className="mt-2 text-sm leading-6 text-cream/58">
            {filteredCount} of {totalCount} opportunities shown. {activeSummary}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm text-slate-400">
            <span className="sr-only">Sort opportunities</span>
            <select
              value={state.sort}
              onChange={(event) => onSortChange(event.target.value as OpportunitySort)}
              className="w-full rounded-md border border-cream/10 bg-ink/80 px-3 py-2 text-sm font-semibold text-cream/82 outline-none transition focus:border-moss/60 sm:w-56"
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
            className="rounded-md border border-cream/10 bg-cream/[0.045] px-3 py-2 text-sm font-semibold text-cream/78 transition hover:border-moss/50 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-cream/10 disabled:hover:text-cream/78"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">Role presets</p>
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
                    ? "border-moss/50 bg-moss/10 text-moss"
                    : "border-cream/10 bg-cream/[0.04] text-cream/68 hover:border-moss/40 hover:text-cream"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">Signals</p>
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
                    ? "border-warm/50 bg-warm/10 text-warm"
                    : "border-cream/10 bg-cream/[0.04] text-cream/68 hover:border-warm/40 hover:text-cream"
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
