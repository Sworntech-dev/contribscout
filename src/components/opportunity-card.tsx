import type { Opportunity } from "@/lib/types";

export function OpportunityCard({
  opportunity,
  isSampleFallback,
  isInWatchlist,
  onSaveToWatchlist,
  onCreateBrief,
  onCreatePrKit,
}: {
  opportunity: Opportunity;
  isSampleFallback: boolean;
  isInWatchlist: boolean;
  onSaveToWatchlist: (opportunity: Opportunity) => void;
  onCreateBrief: (opportunity: Opportunity) => void;
  onCreatePrKit: (opportunity: Opportunity) => void;
}) {
  const issueLinks = getIssueLinks(opportunity);
  const showIssueLinks = !isSampleFallback && isGithubRepoUrl(opportunity.url);
  const saturationLabel = opportunity.stars < 500 ? "Low saturation" : "Moderate saturation";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,13,22,0.9))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)] transition hover:border-mint/40">
      <div className="flex min-h-40 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-skyglass/25 bg-skyglass/10 px-2.5 py-1 text-xs font-semibold capitalize text-skyglass">
              {opportunity.category}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
              {isSampleFallback ? "Sample fallback" : "GitHub live"}
            </span>
          </div>
          <h3 className="mt-3 break-words text-2xl font-black text-white">{opportunity.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{opportunity.description}</p>
        </div>
        <div className="min-w-28 rounded-md border border-mint/35 bg-mint/10 p-3 text-center shadow-[0_0_34px_rgba(83,242,184,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint">Role Score</p>
          <p className="mt-1 text-4xl font-black text-white">{opportunity.roleOpportunityScore}</p>
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

      <details className="mt-5 rounded-md border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white marker:text-mint">
          Contribution Fit
        </summary>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <FitItem label="Open issues" value={opportunity.openIssues.toLocaleString()} />
          <FitItem label="Good first" value={opportunity.signals.goodFirstIssueCount.toLocaleString()} />
          <FitItem label="Help wanted" value={opportunity.signals.helpWantedCount.toLocaleString()} />
          <FitItem label="README" value={labelForReadme(opportunity.signals.readmeQuality)} />
          <FitItem label="Docs folder" value={opportunity.signals.hasDocsFolder ? "Present" : "Missing"} />
          <FitItem label="CONTRIBUTING" value={opportunity.signals.hasContributing ? "Present" : "Missing"} />
          <FitItem label="Issue activity" value={labelForActivity(opportunity.signals.issueActivity)} />
          <FitItem label="Saturation" value={saturationLabel} />
        </div>
        {showIssueLinks ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <IssueLink href={issueLinks.openIssues}>Open issues</IssueLink>
            <IssueLink href={issueLinks.goodFirstIssues}>Good first issues</IssueLink>
            <IssueLink href={issueLinks.helpWanted}>Help wanted</IssueLink>
          </div>
        ) : null}
      </details>

      <div className="mt-auto pt-5">
        <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</p>
          <div className="flex flex-wrap gap-2">
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
          <button
            type="button"
            onClick={() => onSaveToWatchlist(opportunity)}
            disabled={isInWatchlist}
            className="inline-flex rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-mint/50 hover:text-white disabled:cursor-default disabled:border-mint/25 disabled:bg-mint/10 disabled:text-mint"
          >
            {isInWatchlist ? "In Watchlist" : "Save to Watchlist"}
          </button>
          <button
            type="button"
            onClick={() => onCreateBrief(opportunity)}
            className="inline-flex rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-skyglass/50 hover:text-white"
          >
            Brief
          </button>
          <button
            type="button"
            onClick={() => onCreatePrKit(opportunity)}
            className="inline-flex rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber/50 hover:text-white"
          >
            PR Kit
          </button>
          </div>
        </div>
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

function FitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.035] px-3 py-2">
      <span className="truncate text-slate-500">{label}</span>
      <span className="shrink-0 font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function IssueLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-mint/50 hover:text-white"
    >
      {children}
    </a>
  );
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

function labelForReadme(quality: Opportunity["signals"]["readmeQuality"]) {
  return quality === "missing" ? "Missing" : quality === "thin" ? "Thin" : quality === "basic" ? "Basic" : "Strong";
}

function labelForActivity(activity: Opportunity["signals"]["issueActivity"]) {
  return activity === "active" ? "Active" : activity === "warming" ? "Warming" : "Quiet";
}
