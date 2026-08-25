import type { Metadata } from "next";
import SeasonDashboard from "@/components/SeasonDashboard";
import { ARCHIVE_SEASON } from "@/lib/seasons";

export const metadata: Metadata = {
  title: "2025/26 Archive - FPL Stats",
  description: "Final 2025/26 Fantasy Premier League mini-league statistics.",
};

export default function ArchivePage() {
  return <SeasonDashboard season={ARCHIVE_SEASON} />;
}
