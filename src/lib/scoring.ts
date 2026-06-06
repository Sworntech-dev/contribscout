import type { Opportunity, ScoutRepository } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function daysSince(value: string) {
  return Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000));
}

function repoAgeDays(value: string) {
  return Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000));
}

function freshnessPoints(repo: ScoutRepository) {
  const updatedDays = daysSince(repo.updatedAt);
  if (updatedDays <= 7) return 18;
  if (updatedDays <= 21) return 14;
  if (updatedDays <= 45) return 9;
  return 3;
}

function saturationPenalty(repo: ScoutRepository) {
  const starPressure = repo.stars > 2000 ? 14 : repo.stars > 1000 ? 9 : repo.stars > 500 ? 5 : 0;
  const forkPressure = repo.forks > 250 ? 8 : repo.forks > 100 ? 4 : 0;
  return starPressure + forkPressure;
}

function actionFor(repo: ScoutRepository) {
  const signals = repo.signals;

  if (signals.goodFirstIssueCount > 0) {
    return "Help with a good first issue and leave clear reproduction notes.";
  }

  if (!signals.hasDocsFolder || signals.readmeQuality === "thin") {
    return "Write a beginner setup guide that turns the first run into a short checklist.";
  }

  if (signals.localizationOpportunity) {
    return "Create a Turkish onboarding note for new builders entering the project.";
  }

  if (!signals.hasContributing) {
    return "Open a docs improvement issue proposing a lightweight contribution guide.";
  }

  if (signals.helpWantedCount > 0) {
    return "Pick a help wanted issue and contribute a small, reviewable bugfix.";
  }

  return "Review README clarity and suggest one concrete improvement.";
}

function badgesFor(repo: ScoutRepository) {
  const badges = new Set<string>();
  const signals = repo.signals;

  if (signals.hasDocsFolder || signals.readmeQuality === "strong") badges.add("Docs");
  if (signals.goodFirstIssueCount + signals.helpWantedCount > 0) badges.add("Issue");
  if (signals.localizationOpportunity) badges.add("Localization");
  if (repoAgeDays(repo.createdAt) <= 365 || signals.isFresh) badges.add("Early Repo");
  if (signals.issueActivity !== "quiet") badges.add("Community");
  if (!signals.hasContributing) badges.add("Guide Gap");
  if (repo.stars < 500) badges.add("Low Saturation");

  return Array.from(badges).slice(0, 5);
}

function reasonFor(repo: ScoutRepository, score: number) {
  const reasons = [];

  if (repo.signals.isFresh) reasons.push("fresh commits");
  if (repo.signals.goodFirstIssueCount > 0) reasons.push("open beginner path");
  if (repo.signals.helpWantedCount > 0) reasons.push("maintainers asking for help");
  if (!repo.signals.hasContributing) reasons.push("contribution guide gap");
  if (!repo.signals.hasDocsFolder || repo.signals.readmeQuality === "thin") reasons.push("docs can improve");
  if (repo.signals.localizationOpportunity) reasons.push("localization space");
  if (repo.stars < 500) reasons.push("not crowded yet");

  const sentence = reasons.slice(0, 4).join(", ");
  return `${score}/100 because it shows ${sentence || "a balanced mix of activity and contribution space"}.`;
}

export function scoreOpportunity(repo: ScoutRepository): Opportunity {
  const signals = repo.signals;
  const contributionPath =
    clamp(signals.goodFirstIssueCount, 0, 5) * 4 +
    clamp(signals.helpWantedCount, 0, 5) * 3 +
    (signals.hasContributing ? 6 : 0);
  const issueQuality =
    signals.issueActivity === "active" ? 14 : signals.issueActivity === "warming" ? 9 : 3;
  const documentationGap =
    signals.readmeQuality === "missing"
      ? 10
      : signals.readmeQuality === "thin"
        ? 14
        : signals.readmeQuality === "basic"
          ? 8
          : 2;
  const localization = signals.localizationOpportunity ? 10 : 0;
  const earlyActivity = repoAgeDays(repo.createdAt) <= 365 ? 10 : 4;
  const freshness = freshnessPoints(repo);
  const saturation = saturationPenalty(repo);

  const score = clamp(
    22 + contributionPath + issueQuality + documentationGap + localization + earlyActivity + freshness - saturation,
    1,
    100,
  );

  return {
    ...repo,
    roleOpportunityScore: score,
    suggestedAction: actionFor(repo),
    signalBadges: badgesFor(repo),
    scoreReason: reasonFor(repo, score),
  };
}
