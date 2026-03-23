import ConcentrationBarChart from "@/components/ConcentrationBarChart";
import TopPointsScatterPanel from "@/components/TopPointsScatterPanel";
import {
  getHistoricalPlayersData,
} from "@/lib/distribution";
import {
  computeConcentrationBuckets,
  POSITIONS,
  SEASONS,
  TOP_PLAYER_LIMIT,
  type PositionKey,
} from "@/lib/distribution-shared";

export default async function DistributionPage() {
  const data = await getHistoricalPlayersData();

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-fpl-purple/50 rounded-xl p-12 text-center border border-white/10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Distribution Data Missing
          </h1>
          <p className="text-gray-400">
            Generate the historical player dataset before opening this page.
          </p>
          <code className="block mt-4 text-fpl-green text-sm bg-black/30 rounded-lg p-3 inline-block">
            npm run fetch-historical
          </code>
        </div>
      </div>
    );
  }

  const barChartData = POSITIONS.flatMap((position) =>
    SEASONS.map((season) => ({
      label: `${position} ${season}`,
      position,
      season,
      ...computeConcentrationBuckets(
        data.seasons[season][position]
          .slice(0, TOP_PLAYER_LIMIT)
          .map((player) => player.total_points)
      ),
    }))
  );

  const topPointsByPosition = Object.fromEntries(
    POSITIONS.map((position) => [
      position,
      Object.fromEntries(
        SEASONS.map((season) => [
          season,
          data.seasons[season][position]
            .slice(0, TOP_PLAYER_LIMIT)
            .map((player, index) => ({
              rank: index + 1,
              total_points: player.total_points,
              points_per_game: player.points_per_game,
              web_name: player.web_name,
            })),
        ])
      ),
    ])
  ) as Record<
    PositionKey,
    Record<
      (typeof SEASONS)[number],
      {
        rank: number;
        total_points: number;
        points_per_game: number;
        web_name: string;
      }[]
    >
  >;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          FPL Point Distribution
        </h1>
        <div className="h-1 w-24 bg-fpl-cyan rounded-full"></div>
        <p className="text-gray-400 mt-3 max-w-3xl">
          These charts compare the top {TOP_PLAYER_LIMIT} scorers at each position
          across the last four seasons. The dot plots show raw player point totals
          by rank, with 2025/26 on a separate right axis so the current season does
          not flatten the completed years.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">
          Top 20 Player Points By Rank
        </h2>
        <p className="text-gray-400 mb-4 max-w-3xl">
          This view keeps the same top {TOP_PLAYER_LIMIT} players by season total,
          but plots their average FPL points per game instead of raw totals. Hover
          any dot to see the player name and both season-level metrics.
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {POSITIONS.map((position) => (
            <TopPointsScatterPanel
              key={position}
              position={position}
              data={topPointsByPosition[position]}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Top-End Concentration Breakdown
        </h2>
        <ConcentrationBarChart data={barChartData} />
      </div>
    </div>
  );
}
