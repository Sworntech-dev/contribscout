import type { Opportunity } from "@/lib/types";

export function OpportunityCard({
  opportunity,
  isSampleFallback,
}: {
  opportunity: Opportunity;
  isSampleFallback: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-md border border-white/10 bg-panel/75 p-5 transition hover:border-mint/40">
      <div className="flex min-h-40 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm capitalize text-skyglass">{opportunity.category}</p>
          <h3 className="mt-1 break-words text-2xl font-black text-white">{opportunity.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{opportunity.description}</p>
        </div>
        <div className="min-w-24 rounded-md border border-mint/30 bg-mint/10 p-3 text-center">
          <p className="text-xs text-mint">Score</p>
          <p className="text-3xl font-black text-white">{opportunity.roleOpportunityScore}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {opportunity.signalBadges.map((badge) => (
          <span
            key={`${opportunity.fullName}-badge-${badge}`}
            className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggested action</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white">{opportunity.suggestedAction}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reason</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{opportunity.scoreReason}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 sm:grid-cols-4">
        <Stat label="Stars" value={opportunity.stars.toLocaleString()} />
        <Stat label="Forks" value={opportunity.forks.toLocaleString()} />
        <Stat label="Issues" value={opportunity.openIssues.toLocaleString()} />
        <Stat label="Lang" value={opportunity.language ?? "Mixed"} />
      </div>

      <div className="mt-auto pt-5">
        {isSampleFallback || !opportunity.url ? (
          <span className="inline-flex rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-400">
            Sample project
          </span>
        ) : (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-mint/50 hover:bg-mint/10"
          >
            Open repository
          </a>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-200">{value}</p>
    </div>
  );
}
