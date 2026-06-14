"use client";

import type { WatchlistItem, WatchlistStatus } from "@/lib/types";

const watchlistStatuses: WatchlistStatus[] = ["Watching", "Planned", "In Progress", "Submitted", "Skipped"];

export function RepoWatchlist({
  items,
  onUpdate,
  onRemove,
  onCreateBrief,
  onCreatePrKit,
}: {
  items: WatchlistItem[];
  onUpdate: (id: string, updates: Partial<Pick<WatchlistItem, "note" | "status">>) => void;
  onRemove: (id: string) => void;
  onCreateBrief: (item: WatchlistItem) => void;
  onCreatePrKit: (item: WatchlistItem) => void;
}) {
  const hasItems = items.length > 0;

  function copyMarkdown() {
    if (!hasItems) return;
    navigator.clipboard.writeText(buildWatchlistMarkdown(items)).catch(() => undefined);
  }

  function downloadMarkdown() {
    if (!hasItems) return;
    downloadText("contribscout-watchlist.md", buildWatchlistMarkdown(items), "text/markdown");
  }

  function downloadJson() {
    if (!hasItems) return;
    downloadText(
      "contribscout-watchlist.json",
      JSON.stringify(buildWatchlistJson(items), null, 2),
      "application/json",
    );
  }

  return (
    <section className="space-y-4">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint">Repo Watchlist</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Contribution pipeline</h2>
        <p className="mt-2 leading-7 text-slate-400">
          Save promising repos, track intent, write notes, and move completed work into Proof Vault later.
        </p>
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-400">
            {hasItems
              ? `${items.length} saved ${items.length === 1 ? "repo" : "repos"} in your local pipeline.`
              : "No saved repos yet. Save a project card to start a local contribution pipeline."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <WatchlistButton disabled={!hasItems} onClick={copyMarkdown}>
              Copy Watchlist Markdown
            </WatchlistButton>
            <WatchlistButton disabled={!hasItems} onClick={downloadMarkdown}>
              Download Watchlist Markdown
            </WatchlistButton>
            <WatchlistButton disabled={!hasItems} onClick={downloadJson}>
              Download Watchlist JSON
            </WatchlistButton>
          </div>
        </div>
      </div>

      {!hasItems ? (
        <div className="grid min-h-56 place-items-center rounded-md border border-white/10 bg-panel/75 p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
          <div>
            <p className="text-lg font-bold text-white">Watchlist is ready</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Save a project card when it looks worth tracking, then add status, notes, briefs, and PR prep.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 bg-panel/75 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs capitalize text-skyglass">{item.category || "open source"}</p>
                  <h3 className="mt-1 break-words text-lg font-black text-white">{item.projectName}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.suggestedAction}</p>
                </div>
                <div className="shrink-0 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-center">
                  <p className="text-xs text-mint">Score</p>
                  <p className="text-xl font-black text-white">{item.score}</p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{item.scoreReason}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Status</span>
                  <select
                    value={item.status}
                    onChange={(event) => onUpdate(item.id, { status: event.target.value as WatchlistStatus })}
                    className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                  >
                    {watchlistStatuses.map((status) => (
                      <option key={`watchlist-status-${status}`}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Saved</span>
                  <input
                    readOnly
                    value={new Date(item.savedAt).toLocaleDateString()}
                    className="w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-slate-400 outline-none"
                  />
                </label>
              </div>

              <label className="mt-3 grid gap-2 text-sm text-slate-300">
                <span>Note</span>
                <textarea
                  value={item.note}
                  onChange={(event) => onUpdate(item.id, { note: event.target.value })}
                  className="min-h-20 w-full resize-y rounded-md border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none transition focus:border-mint/60"
                  placeholder="Why this repo matters, what you plan to try, or who to contact."
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {isGithubRepoUrl(item.repoUrl) ? (
                  <>
                    <IssueLink href={item.repoUrl}>Repo</IssueLink>
                    <IssueLink href={`${item.repoUrl.replace(/\/$/, "")}/issues`}>Open issues</IssueLink>
                    <IssueLink
                      href={`${item.repoUrl.replace(/\/$/, "")}/issues?q=${encodeURIComponent('is:issue is:open label:"good first issue"')}`}
                    >
                      Good first
                    </IssueLink>
                    <IssueLink
                      href={`${item.repoUrl.replace(/\/$/, "")}/issues?q=${encodeURIComponent('is:issue is:open label:"help wanted"')}`}
                    >
                      Help wanted
                    </IssueLink>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(item.repoUrl).catch(() => undefined)}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-mint/50 hover:text-white"
                    >
                      Copy repo link
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => onCreateBrief(item)}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-skyglass/50 hover:text-white"
                >
                  Brief
                </button>
                <button
                  type="button"
                  onClick={() => onCreatePrKit(item)}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber/50 hover:text-white"
                >
                  PR Kit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-rose/50 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WatchlistButton({
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

function buildWatchlistMarkdown(items: WatchlistItem[]) {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# ContribScout Repo Watchlist",
    "",
    `Generated: ${generatedAt}`,
    `Total saved items: ${items.length}`,
    "",
  ];

  items.forEach((item, index) => {
    const issueLinks = getIssueLinks(item.repoUrl);
    lines.push(
      `## ${index + 1}. ${item.projectName}`,
      "",
      `- Status: ${item.status}`,
      `- Role Opportunity Score: ${item.score}/100`,
      `- Category: ${item.category || "open source"}`,
      `- Suggested action: ${item.suggestedAction}`,
      `- Reason: ${item.scoreReason}`,
      `- Note: ${item.note || "n/a"}`,
      `- Repository: ${item.repoUrl || "n/a"}`,
    );

    if (isGithubRepoUrl(item.repoUrl)) {
      lines.push(
        `- Open issues: ${issueLinks.openIssues}`,
        `- Good first issues: ${issueLinks.goodFirstIssues}`,
        `- Help wanted: ${issueLinks.helpWanted}`,
      );
    }

    lines.push("");
  });

  return lines.join("\n").trim();
}

function buildWatchlistJson(items: WatchlistItem[]) {
  return {
    exportedAt: new Date().toISOString(),
    app: "ContribScout",
    version: "0.6",
    items,
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

function getIssueLinks(repoUrl: string) {
  const baseUrl = repoUrl.replace(/\/$/, "");
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
