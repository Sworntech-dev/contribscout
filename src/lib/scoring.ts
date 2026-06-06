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
  if (updatedDays <= 7) return 12;
  if (updatedDays <= 14) return 10;
  if (updatedDays <= 45) return 6;
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

function contributionSignalCount(repo: ScoutRepository) {
  const signals = repo.signals;
  return [
    repo.openIssues > 0,
    signals.goodFirstIssueCount > 0,
    signals.helpWantedCount > 0,
    signals.hasContributing,
    signals.hasDocsFolder,
    signals.readmeQuality === "basic" || signals.readmeQuality === "strong",
  ].filter(Boolean).length;
}

export function scoreOpportunity(repo: ScoutRepository): Opportunity {
  const signals = repo.signals;
  const contributionPath =
    clamp(signals.goodFirstIssueCount, 0, 4) * 3 +
    clamp(signals.helpWantedCount, 0, 4) * 2 +
    (signals.hasContributing ? 5 : 0);
  const issueQuality =
    signals.issueActivity === "active" ? 10 : signals.issueActivity === "warming" ? 7 : 2;
  const documentationGap =
    signals.readmeQuality === "missing"
      ? 6
      : signals.readmeQuality === "thin"
        ? 10
        : signals.readmeQuality === "basic"
          ? 6
          : 2;
  const localization = signals.localizationOpportunity ? 6 : 0;
  const earlyActivity = repoAgeDays(repo.createdAt) <= 365 ? 8 : 3;
  const freshness = freshnessPoints(repo);
  const saturation = saturationPenalty(repo);
  const signalCount = contributionSignalCount(repo);

  const rawScore = clamp(
    18 + contributionPath + issueQuality + documentationGap + localization + earlyActivity + freshness - saturation,
    1,
    100,
  );
  const score = clamp(
    Math.min(
      rawScore,
      signalCount >= 5 ? 100 : signalCount >= 4 ? 89 : signalCount >= 3 ? 82 : signalCount >= 2 ? 74 : 66,
    ),
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
