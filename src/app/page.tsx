import {
  getProcessedManagers,
  getCurrentGameweek,
  getBootstrapData,
} from "@/lib/data";
import StandingsTable from "@/components/StandingsTable";
import PointsLeagueChart from "@/components/PointsLeagueChart";
import WeeklyPointsLeagueChart from "@/components/WeeklyPointsLeagueChart";
import GlobalRankChart from "@/components/GlobalRankChart";
import { computeSeasonAnomalies } from "@/lib/anomalies";

export default async function Home() {
  const [managers, currentGw, bootstrap] = await Promise.all([
    getProcessedManagers(),
    getCurrentGameweek(),
    getBootstrapData(),
  ]);

  const finishedGameweeks = bootstrap?.events.filter((e) => e.finished).length ?? 0;
  const totalGameweeks = Math.max(finishedGameweeks, currentGw, 1);
  const totalManagers = managers.length;
  const anomalies = computeSeasonAnomalies(managers, bootstrap, currentGw);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* League Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Let&apos;s Keep Trying Our Best!
        </h1>
        <div className="h-1 w-24 bg-fpl-green rounded-full"></div>
        <p className="text-gray-400 mt-3">
          League #79657 &middot; 2025/26 Season
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-green">
            {totalManagers}
          </div>
          <div className="text-xs text-gray-400 mt-1">Managers</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-fpl-cyan">{currentGw}</div>
          <div className="text-xs text-gray-400 mt-1">Current GW</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">
            {managers[0]?.total ?? 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Leader Points</div>
        </div>
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">
            {managers[0]?.entry_name ?? managers[0]?.player_name ?? "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Leading Team</div>
        </div>
      </div>

      {/* Season Anomalies */}
      {managers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Season Anomalies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Biggest Gameweek Score
              </div>
              {anomalies.bestGameweekScore ? (
                <>
                  <div className="text-3xl font-bold text-fpl-green">
                    {anomalies.bestGameweekScore.points}
                  </div>
                  <div className="text-sm text-white mt-2">
                    {anomalies.bestGameweekScore.teamName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {anomalies.bestGameweekScore.managerName} &middot; GW
                    {anomalies.bestGameweekScore.event}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">No data available</div>
              )}
            </div>

            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Most Points Left on Bench
              </div>
              {anomalies.biggestBenchWaste ? (
                <>
                  <div className="text-3xl font-bold text-fpl-pink">
                    {anomalies.biggestBenchWaste.points}
                  </div>
                  <div className="text-sm text-white mt-2">
                    {anomalies.biggestBenchWaste.teamName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {anomalies.biggestBenchWaste.managerName} &middot; GW
                    {anomalies.biggestBenchWaste.event}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">No data available</div>
              )}
            </div>

            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Differential Score (Top 5)
              </div>
              {anomalies.differentialTopFive.length > 0 ? (
                <ol className="space-y-2">
                  {anomalies.differentialTopFive.map((player) => (
                    <li
                      key={player.element}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">
                          {player.playerName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {player.teamShortName}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-fpl-cyan">
                        {player.points}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm text-gray-400">No picks data available</div>
              )}
              <div className="text-xs text-gray-500 mt-3">
                Sum of points in gameweeks where a player was owned by 2 or fewer teams.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Points Over Time Chart */}
      {managers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Points Over Time</h2>
          <PointsLeagueChart
            managers={managers}
            totalGameweeks={Math.max(totalGameweeks, 1)}
          />
        </div>
      )}

      {/* Points Per Gameweek (Diff from Mean) Chart */}
      {managers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Points Per Gameweek (vs League Mean)
          </h2>
          <WeeklyPointsLeagueChart
            managers={managers}
            totalGameweeks={Math.max(totalGameweeks, 1)}
          />
        </div>
      )}

      {/* Global Rank Over Time Chart */}
      {managers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Global Rank Over Time
          </h2>
          <GlobalRankChart
            managers={managers}
            totalGameweeks={Math.max(totalGameweeks, 1)}
          />
        </div>
      )}

      {/* Standings Table */}
      {managers.length > 0 ? (
        <StandingsTable
          managers={managers}
          currentGameweek={currentGw}
          totalGameweeks={Math.max(totalGameweeks, 1)}
        />
      ) : (
        <div className="bg-fpl-purple/50 rounded-xl p-12 text-center border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">
            No Data Available
          </h2>
          <p className="text-gray-400">
            Run the data fetch script to populate league data:
          </p>
          <code className="block mt-4 text-fpl-green text-sm bg-black/30 rounded-lg p-3 inline-block">
            npx tsx scripts/fetch-data.ts
          </code>
        </div>
      )}
    </div>
  );
}
