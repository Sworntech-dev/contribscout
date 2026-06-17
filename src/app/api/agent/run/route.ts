import { NextResponse } from "next/server";
import { GET as getOpportunities } from "@/app/api/opportunities/route";
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

  try {
    const opportunitiesResponse = await getOpportunities();
    const payload = (await opportunitiesResponse.json()) as AgentOpportunityPayload;

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
