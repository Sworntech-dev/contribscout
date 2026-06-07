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
  const suspiciousForkPressure = repo.forks > 20 && repo.forks > Math.max(3, repo.stars * 4) ? 16 : 0;
  return starPressure + forkPressure + suspiciousForkPressure;
}

function hasVisibleContributionPath(repo: ScoutRepository) {
  const signals = repo.signals;
  return (
    repo.openIssues > 0 ||
    signals.goodFirstIssueCount > 0 ||
    signals.helpWantedCount > 0 ||
    signals.hasContributing
  );
}

function actionFor(repo: ScoutRepository) {
  const signals = repo.signals;
  const language = repo.language?.toLowerCase() ?? "";
  const isTooling =
    repo.topics.some((topic) => ["developer-tools", "sdk", "cli", "llm-tools"].includes(topic)) ||
    ["typescript", "javascript", "python"].includes(language);
  const hasIssueLabels = signals.goodFirstIssueCount + signals.helpWantedCount > 0;
  const strongLocalizationFit =
    signals.localizationOpportunity &&
    signals.hasDocsFolder &&
    signals.hasContributing &&
    signals.readmeQuality === "strong" &&
    repo.openIssues > 0 &&
    !hasIssueLabels;

  if (signals.goodFirstIssueCount > 0 && !signals.hasContributing) {
    return "Check whether the project has a CONTRIBUTING guide.";
  }

  if (signals.goodFirstIssueCount > 0) {
    if (signals.readmeQuality === "thin") {
      return "Submit a first-run feedback issue.";
    }

    if (signals.helpWantedCount > 2 && isTooling) {
      return "Test the quickstart and report friction.";
    }

    if (!signals.hasDocsFolder) {
      return "Improve installation docs.";
    }

    return "Add reproduction notes to an open issue.";
  }

  if (strongLocalizationFit) {
    return "Create a Turkish onboarding note.";
  }

  if (!hasVisibleContributionPath(repo)) {
    if (signals.readmeQuality === "missing" || signals.readmeQuality === "thin") {
      return "Write a beginner setup checklist.";
    }

    if (!signals.hasDocsFolder) {
      return "Improve installation docs.";
    }

    return "Open a README clarity issue.";
  }

  if (!signals.hasDocsFolder && isTooling) {
    return "Create a small example workflow.";
  }

  if (!signals.hasDocsFolder) {
    return "Improve installation docs.";
  }

  if (signals.readmeQuality === "missing" || signals.readmeQuality === "thin") {
    return "Write a beginner setup checklist.";
  }

  if (!signals.hasContributing) {
    return "Check whether the project has a CONTRIBUTING guide.";
  }

  if (signals.helpWantedCount > 0 && isTooling) {
    return "Test the quickstart and report friction.";
  }

  if (signals.helpWantedCount > 0) {
    return "Review docs for missing environment variables.";
  }

  if (signals.readmeQuality === "basic") {
    return "Open a README clarity issue.";
  }

  return "Test the quickstart and report friction.";
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
  if (repo.signals.localizationOpportunity && repo.signals.hasDocsFolder) reasons.push("localized onboarding space");
  if (repo.stars < 500) reasons.push("not crowded yet");
  if (!hasVisibleContributionPath(repo)) reasons.push("limited visible contribution path");

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

function keywordStuffingPenalty(repo: ScoutRepository) {
  const words = repo.description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const counts = words.reduce((terms, word) => terms.set(word, (terms.get(word) ?? 0) + 1), new Map<string, number>());
  const maxRepeats = Math.max(0, ...Array.from(counts.values()));

  return Math.max(0, maxRepeats - 3) * 3;
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
  const localization = signals.localizationOpportunity && signals.hasDocsFolder ? 2 : 0;
  const earlyActivity = repoAgeDays(repo.createdAt) <= 365 ? 8 : 3;
  const freshness = freshnessPoints(repo);
  const saturation = saturationPenalty(repo);
  const signalCount = contributionSignalCount(repo);
  const noPathPenalty = hasVisibleContributionPath(repo) ? 0 : 18;
  const quietNoIssuePenalty =
    repo.openIssues === 0 && signals.goodFirstIssueCount === 0 && signals.helpWantedCount === 0 ? 10 : 0;
  const noisePenalty = keywordStuffingPenalty(repo);

  const rawScore = clamp(
    18 +
      contributionPath +
      issueQuality +
      documentationGap +
      localization +
      earlyActivity +
      freshness -
      saturation -
      noPathPenalty -
      quietNoIssuePenalty -
      noisePenalty,
    1,
    100,
  );
  const score = clamp(
    Math.min(
      rawScore,
      !hasVisibleContributionPath(repo)
        ? 58
        : signalCount >= 5
          ? 92
          : signalCount >= 4
            ? 84
            : signalCount >= 3
              ? 76
              : signalCount >= 2
                ? 68
                : 60,
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
