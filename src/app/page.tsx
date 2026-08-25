import SeasonDashboard from "@/components/SeasonDashboard";
import { LIVE_SEASON } from "@/lib/seasons";

export default function Home() {
  return <SeasonDashboard season={LIVE_SEASON} />;
}
