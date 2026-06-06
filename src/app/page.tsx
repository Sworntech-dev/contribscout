import { Dashboard } from "@/components/dashboard";
import { scoreOpportunity } from "@/lib/scoring";
import { sampleRepositories } from "@/lib/sample-data";

export default function Home() {
  const initialOpportunities = sampleRepositories
    .map(scoreOpportunity)
    .sort((a, b) => b.roleOpportunityScore - a.roleOpportunityScore);

  return <Dashboard initialOpportunities={initialOpportunities} />;
}
