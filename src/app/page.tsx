import { AppShell } from "@/components/app-shell";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function Home() {
  return (
    <SmoothScrollProvider>
      <AppShell />
    </SmoothScrollProvider>
  );
}
