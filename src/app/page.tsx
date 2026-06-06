import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function Home() {
  return <Dashboard />;
}
