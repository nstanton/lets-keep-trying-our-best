import type { Metadata } from "next";
import { getAllManagerIds, getLeagueData } from "@/lib/data";
import { ARCHIVE_SEASON } from "@/lib/seasons";
import { ManagerPageContent } from "@/app/manager/[id]/page";

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
    title: standing ? `${standing.entry_name} - 2025/26 Archive - FPL Stats` : "2025/26 Archive Manager - FPL Stats",
    description: standing ? `2025/26 FPL stats for ${standing.entry_name} (${standing.player_name})` : "Archived manager stats",
  };
}

export default async function ArchiveManagerPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerPageContent managerId={parseInt(id, 10)} season={ARCHIVE_SEASON} />;
}
