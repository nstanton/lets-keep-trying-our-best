import Link from "next/link";
import type { Metadata } from "next";
import { getManagerData, getAllManagerIds, getLeagueData } from "@/lib/data";
import WeeklyChart from "@/components/WeeklyChart";
import TransferLog from "@/components/TransferLog";

export async function generateStaticParams() {
  const ids = await getAllManagerIds();
  // Next.js static export requires at least one param for dynamic routes.
  // Return a placeholder when no data exists yet (page handles unknown IDs gracefully).
  if (ids.length === 0) {
    return [{ id: "0" }];
  }
  return ids.map((id) => ({ id: String(id) }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const managerId = parseInt(id, 10);
  const leagueData = await getLeagueData();
  const standing = leagueData?.standings.results.find(
    (r) => r.entry === managerId
  );

  return {
    title: standing
      ? `${standing.entry_name} - FPL Stats`
      : "Manager - FPL Stats",
    description: standing
      ? `FPL stats for ${standing.entry_name} (${standing.player_name})`
      : "Manager stats",
  };
}

export default async function ManagerPage({ params }: PageProps) {
  const { id } = await params;
  const managerId = parseInt(id, 10);
  const [managerData, leagueData] = await Promise.all([
    getManagerData(managerId),
    getLeagueData(),
  ]);

  const standing = leagueData?.standings.results.find(
    (r) => r.entry === managerId
  );

  if (!managerData || !standing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="text-fpl-green hover:underline text-sm mb-4 inline-block"
        >
          &larr; Back to Standings
        </Link>
        <div className="bg-fpl-purple/50 rounded-xl p-12 text-center border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">
            Manager Not Found
          </h2>
          <p className="text-gray-400">
            No data available for this manager.
          </p>
        </div>
      </div>
    );
  }

  const history = managerData.current;
  const chips = managerData.chips;
  const latestGw = history.length > 0 ? history[history.length - 1] : null;

  const bestGw =
    history.length > 0
      ? history.reduce((best, h) => (h.points > best.points ? h : best))
      : null;
  const worstGw =
    history.length > 0
      ? history.reduce((worst, h) => (h.points < worst.points ? h : worst))
      : null;
  const avgPoints =
    history.length > 0
      ? Math.round(
          history.reduce((sum, h) => sum + h.points, 0) / history.length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="text-fpl-green hover:underline text-sm mb-6 inline-block"
      >
        &larr; Back to Standings
      </Link>

      {/* Manager Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
          {standing.entry_name}
        </h1>
        <p className="text-lg text-gray-400">{standing.player_name}</p>
        <div className="h-1 w-24 bg-fpl-green rounded-full mt-3"></div>
        <div className="mt-4">
          <Link
            href={`/manager/${managerId}/picks`}
            className="inline-flex items-center rounded-lg border border-fpl-cyan/40 bg-fpl-cyan/10 px-3 py-2 text-sm text-fpl-cyan hover:bg-fpl-cyan/20 transition-colors"
          >
            View Team Picks by Position
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-green">
            {standing.total}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total Points</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">
            #{standing.rank}
          </div>
          <div className="text-xs text-gray-400 mt-1">League Rank</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-cyan">
            {latestGw?.overall_rank?.toLocaleString() ?? "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Overall Rank</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{avgPoints}</div>
          <div className="text-xs text-gray-400 mt-1">Avg Points/GW</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-green">
            {bestGw?.points ?? "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Best GW ({bestGw ? `GW${bestGw.event}` : "—"})
          </div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-pink">
            {worstGw?.points ?? "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Worst GW ({worstGw ? `GW${worstGw.event}` : "—"})
          </div>
        </div>
      </div>

      {/* Weekly Points Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Weekly Points</h2>
        <WeeklyChart history={history} chips={chips} />
        <p className="text-xs text-gray-500 mt-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-fpl-green mr-1 align-middle"></span>{" "}
          Points
          <span className="inline-block w-3 h-3 rounded-sm bg-fpl-pink mr-1 ml-3 align-middle"></span>{" "}
          Chip Played
          <span className="inline-block w-3 h-3 rounded-sm bg-fpl-light-purple mr-1 ml-3 align-middle"></span>{" "}
          Total (line)
        </p>
      </div>

      {/* Gameweek History Table */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">
          Gameweek History
        </h2>
        <TransferLog history={history} chips={chips} />
      </div>

      {/* Chips Used */}
      {chips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Chips Used</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {chips.map((chip) => (
              <div
                key={`${chip.name}-${chip.event}`}
                className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10 text-center"
              >
                <div className="text-sm font-semibold text-white capitalize">
                  {chip.name === "3xc"
                    ? "Triple Captain"
                    : chip.name === "bboost"
                      ? "Bench Boost"
                      : chip.name === "freehit"
                        ? "Free Hit"
                        : chip.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Gameweek {chip.event}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
