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
    <article className="premium-panel premium-lift flex h-full flex-col overflow-hidden rounded-md p-5">
      <div className="flex min-h-40 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-moss/25 bg-moss/10 px-2.5 py-1 text-xs font-semibold capitalize text-moss">
              {opportunity.category}
            </span>
            <span className="rounded-md border border-cream/10 bg-cream/[0.055] px-2.5 py-1 text-xs font-semibold text-cream/70">
              {isSampleFallback ? "Sample fallback" : "GitHub live"}
            </span>
          </div>
          <h3 className="mt-3 break-words text-2xl font-black text-cream">{opportunity.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-cream/58">{opportunity.description}</p>
        </div>
        <div className="min-w-28 rounded-md border border-warm/35 bg-warm/10 p-3 text-center shadow-[0_0_34px_rgba(217,168,95,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warm">Role Score</p>
          <p className="mt-1 text-4xl font-black text-cream">{opportunity.roleOpportunityScore}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {opportunity.signalBadges.map((badge) => (
          <span
            key={`${opportunity.fullName}-badge-${badge}`}
            className="rounded-md border border-cream/10 bg-cream/[0.045] px-2.5 py-1 text-xs text-cream/68"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">Suggested action</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-cream">{opportunity.suggestedAction}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">Reason</p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-cream/68">{opportunity.scoreReason}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 sm:grid-cols-4">
        <Stat label="Stars" value={opportunity.stars.toLocaleString()} />
        <Stat label="Forks" value={opportunity.forks.toLocaleString()} />
        <Stat label="Issues" value={opportunity.openIssues.toLocaleString()} />
        <Stat label="Lang" value={opportunity.language ?? "Mixed"} />
      </div>

      <details className="mt-5 rounded-md border border-cream/10 bg-cream/[0.04] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-cream marker:text-moss">
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
        <div className="rounded-md border border-cream/10 bg-black/15 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cream/42">Actions</p>
          <div className="flex flex-wrap gap-2">
            {isSampleFallback || !opportunity.url ? (
              <span className="inline-flex rounded-md border border-cream/10 bg-cream/[0.04] px-3 py-2 text-sm font-semibold text-cream/50">
                Sample project
              </span>
            ) : (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noreferrer"
                className="premium-action inline-flex rounded-md border border-cream/10 bg-cream/[0.07] px-3 py-2 text-sm font-semibold text-cream transition hover:border-moss/50 hover:bg-moss/10"
              >
                Open repository
              </a>
            )}
            <button
              type="button"
              onClick={() => onSaveToWatchlist(opportunity)}
              disabled={isInWatchlist}
              className="premium-action inline-flex rounded-md border border-cream/10 bg-cream/[0.045] px-3 py-2 text-sm font-semibold text-cream/78 transition hover:border-moss/50 hover:text-cream disabled:cursor-default disabled:border-moss/25 disabled:bg-moss/10 disabled:text-moss"
            >
              {isInWatchlist ? "In Watchlist" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => onCreateBrief(opportunity)}
              className="premium-action inline-flex rounded-md border border-cream/10 bg-cream/[0.045] px-3 py-2 text-sm font-semibold text-cream/78 transition hover:border-moss/50 hover:text-cream"
            >
              Brief
            </button>
            <button
              type="button"
              onClick={() => onCreatePrKit(opportunity)}
              className="premium-action inline-flex rounded-md border border-warm/25 bg-warm/10 px-3 py-2 text-sm font-semibold text-cream transition hover:border-warm/60 hover:bg-warm/15"
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
    <div className="rounded-md bg-cream/[0.04] p-3">
      <p className="text-xs text-cream/38">{label}</p>
      <p className="mt-1 truncate font-semibold text-cream/82">{value}</p>
    </div>
  );
}

function FitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-black/15 px-3 py-2">
      <span className="truncate text-cream/42">{label}</span>
      <span className="shrink-0 font-semibold text-cream/78">{value}</span>
    </div>
  );
}

function IssueLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-cream/10 bg-cream/[0.045] px-2.5 py-1.5 text-xs font-semibold text-cream/70 transition hover:border-moss/50 hover:text-cream"
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
