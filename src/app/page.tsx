import { CinematicLanding } from "@/components/cinematic-landing";
import { MissionControlDashboard } from "@/components/mission-control-dashboard";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function Home() {
  return (
    <SmoothScrollProvider>
      <CinematicLanding />
      <MissionControlDashboard />
    </SmoothScrollProvider>
  );
}
