import { NextResponse } from "next/server";
import { getOpportunityPayload } from "@/app/api/opportunities/route";
import type { AgentOpportunityPayload, AgentRunRequest } from "@/lib/agent-run-types";
import { runContribScoutAgent } from "@/lib/contribscout-agent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  let body: Partial<AgentRunRequest>;

  try {
    body = (await request.json()) as Partial<AgentRunRequest>;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const businessGoal = body.businessGoal?.trim();

  if (!businessGoal) {
    return NextResponse.json(
      { error: "businessGoal is required." },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  if (!isMeaningfulGrowthGoal(businessGoal)) {
    return NextResponse.json(
      { error: "Enter a meaningful open-source growth goal before running the agent." },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  try {
    const payload = (await getOpportunityPayload({ resultLimit: 40 })) as AgentOpportunityPayload;

    if (!payload.opportunities?.length) {
      return NextResponse.json(
        { error: "No opportunities were available for this agent run." },
        { status: 503, headers: noStoreHeaders() },
      );
    }

    const result = runContribScoutAgent({
      request: {
        businessGoal,
        teamContext: body.teamContext,
        maxOpportunities: body.maxOpportunities,
      },
      opportunities: payload.opportunities,
      source: payload.source,
      notice: payload.notice,
      scannedCount: payload.opportunities.length,
      tokenConfigured: Boolean(process.env.GITHUB_TOKEN),
    });

    return NextResponse.json(result, { headers: noStoreHeaders() });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "ContribScout Agent run failed.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

function isMeaningfulGrowthGoal(goal: string) {
  const normalized = goal.toLowerCase().replace(/[^a-z0-9+#\-\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.match(/[a-z0-9+#-]+/g) ?? [];
  const meaningfulWords = words.filter((word) => !["a", "an", "the", "to", "for", "and", "or", "of", "in", "on"].includes(word));
  const domainTerms = [
    "grow",
    "growth",
    "visibility",
    "contribution",
    "open-source",
    "opensource",
    "github",
    "developer",
    "docs",
    "documentation",
    "devrel",
    "web3",
    "wallet",
    "ai",
    "agent",
    "llm",
    "tooling",
    "maintenance",
    "security",
    "config",
    "configuration",
    "ci",
    "dependency",
    "dependencies",
    "cleanup",
    "bugfix",
    "troubleshooting",
    "reliability",
    "onboarding",
    "proof",
    "workflow",
    "community",
    "repo",
    "pr",
  ];
  const hasDomainTerm = domainTerms.some((term) => normalized.includes(term));
  const hasUsefulLength = normalized.length >= 35 || meaningfulWords.length >= 5;
  const mostlyNoise = meaningfulWords.length <= 2 || /^[a-z]{1,5}$/.test(normalized) || /^\d+$/.test(normalized);

  return hasDomainTerm && hasUsefulLength && !mostlyNoise;
}
