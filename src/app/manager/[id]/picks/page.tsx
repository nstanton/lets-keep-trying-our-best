import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllManagerIds,
  getBootstrapData,
  getLeagueData,
  getManagerData,
} from "@/lib/data";
import TeamPicksMatrix from "@/components/TeamPicksMatrix";

export async function generateStaticParams() {
  const ids = await getAllManagerIds();
  if (ids.length === 0) {
    return [{ id: "0" }];
  }
  return ids.map((id) => ({ id: String(id) }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const managerId = parseInt(id, 10);
  const leagueData = await getLeagueData();
  const standing = leagueData?.standings.results.find((result) => result.entry === managerId);

  return {
    title: standing ? `${standing.entry_name} Picks - FPL Stats` : "Manager Picks - FPL Stats",
    description: standing
      ? `Team picks by position for ${standing.entry_name}`
      : "Manager team picks by position",
  };
}

export default async function ManagerPicksPage({ params }: PageProps) {
  const { id } = await params;
  const managerId = parseInt(id, 10);

  const [managerData, leagueData, bootstrap] = await Promise.all([
    getManagerData(managerId),
    getLeagueData(),
    getBootstrapData(),
  ]);

  const standing = leagueData?.standings.results.find((result) => result.entry === managerId);

  if (!managerData || !standing || !bootstrap) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="text-fpl-green hover:underline text-sm mb-4 inline-block">
          &larr; Back to Standings
        </Link>
        <div className="bg-fpl-purple/50 rounded-xl p-12 text-center border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">Manager Picks Not Found</h2>
          <p className="text-gray-400">No picks data is available for this manager yet.</p>
        </div>
      </div>
    );
  }

  const history = managerData.current;
  const latestGameweek = history.length > 0 ? history[history.length - 1].event : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <Link href="/" className="text-fpl-green hover:underline text-sm">
          &larr; Back to Standings
        </Link>
        <Link href={`/manager/${managerId}`} className="text-fpl-cyan hover:underline text-sm">
          &larr; Back to Manager Summary
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{standing.entry_name}</h1>
        <p className="text-lg text-gray-400">{standing.player_name}</p>
        <div className="h-1 w-24 bg-fpl-green rounded-full mt-3"></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-green">{standing.total}</div>
          <div className="text-xs text-gray-400 mt-1">Total Points</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">#{standing.rank}</div>
          <div className="text-xs text-gray-400 mt-1">League Rank</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-cyan">{history.length}</div>
          <div className="text-xs text-gray-400 mt-1">Tracked GWs</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{latestGameweek ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">Latest GW</div>
        </div>
      </div>

      <div className="mb-3">
        <h2 className="text-xl font-bold text-white mb-2">Team Picks by Position</h2>
        <p className="text-sm text-gray-400">
          Each cell uses the player&apos;s Premier League team color. Hover a player block to see
          gameweek points and role details.
        </p>
      </div>

      <TeamPicksMatrix
        history={history}
        picksByEvent={managerData.picks_by_event}
        elements={bootstrap.elements ?? []}
        teams={bootstrap.teams ?? []}
      />
    </div>
  );
}
