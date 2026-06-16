"use client";

import { useState } from "react";
import { AgentDemoMode, type ProvisionResponse } from "@/components/agent-demo-mode";
import { JudgeDemoPackage } from "@/components/judge-demo-package";
import type { AgentRunResult } from "@/lib/agent-run-types";

export function HackathonDemoStack() {
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);
  const [provisioningResult, setProvisioningResult] = useState<ProvisionResponse | null>(null);
  const [proofCandidateSaved, setProofCandidateSaved] = useState(false);

  return (
    <>
      <AgentDemoMode
        onRunResultChange={setAgentRun}
        onProvisionResultChange={setProvisioningResult}
        onProofSavedChange={setProofCandidateSaved}
      />
      <JudgeDemoPackage
        agentRun={agentRun}
        provisioningResult={provisioningResult}
        proofCandidateSaved={proofCandidateSaved}
      />
    </>
  );
}
