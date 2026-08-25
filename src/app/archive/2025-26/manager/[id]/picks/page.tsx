import type { Metadata } from "next";
import { getAllManagerIds, getLeagueData } from "@/lib/data";
import { ARCHIVE_SEASON } from "@/lib/seasons";
import { ManagerPicksPageContent } from "@/app/manager/[id]/picks/page";

export async function generateStaticParams() {
  const ids = await getAllManagerIds(ARCHIVE_SEASON);
  return ids.length > 0 ? ids.map((id) => ({ id: String(id) })) : [{ id: "0" }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const managerId = parseInt(id, 10);
  const league = await getLeagueData(ARCHIVE_SEASON);
  const standing = league?.standings.results.find((result) => result.entry === managerId);
  return {
    title: standing ? `${standing.entry_name} Picks - 2025/26 Archive - FPL Stats` : "2025/26 Archive Picks - FPL Stats",
    description: standing ? `2025/26 team picks for ${standing.entry_name}` : "Archived manager picks",
  };
}

export default async function ArchiveManagerPicksPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerPicksPageContent managerId={parseInt(id, 10)} season={ARCHIVE_SEASON} />;
}
