import {
  getProcessedManagers,
  getCurrentGameweek,
  getBootstrapData,
  getFixtureData,
} from "@/lib/data";
import { getSeasonConfig, type SeasonKey } from "@/lib/seasons";
import StandingsTable from "@/components/StandingsTable";
import PointsLeagueChart from "@/components/PointsLeagueChart";
import WeeklyPointsLeagueChart from "@/components/WeeklyPointsLeagueChart";
import GlobalRankChart from "@/components/GlobalRankChart";
import { computeSeasonAnomalies } from "@/lib/anomalies";
import { computeLeagueInsights } from "@/lib/league-insights";
import LeagueInsightsTables from "@/components/LeagueInsightsTables";
import { getGuaranteedAutoSubPoints } from "@/lib/realtime-auto-subs";
import type { BootstrapData, FixtureData, ProcessedManager } from "@/lib/types";

export default async function SeasonDashboard({ season }: { season: SeasonKey }) {
  const [rawManagers, currentGw, bootstrap, fixtures] = await Promise.all([
    getProcessedManagers(season),
    getCurrentGameweek(season),
    getBootstrapData(season),
    getFixtureData(season),
  ]);
  const managers = applyGuaranteedAutoSubs(
    rawManagers,
    currentGw,
    bootstrap,
    fixtures ?? []
  );
  const config = getSeasonConfig(season);
  const finishedGameweeks = bootstrap?.events.filter((event) => event.finished).length ?? 0;
  const totalGameweeks = Math.max(finishedGameweeks, currentGw, 1);
  const anomalies = computeSeasonAnomalies(managers, bootstrap, currentGw);
  const leagueInsights = computeLeagueInsights(managers, bootstrap, currentGw);
  const managerPathPrefix = `${config.routePrefix}/manager`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Let&apos;s Keep Trying Our Best!</h1>
        <div className="h-1 w-24 bg-fpl-green rounded-full" />
        <p className="text-gray-400 mt-3">
          League #{config.leagueId} &middot; {config.label} Season{config.isArchived ? " Archive" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard value={managers.length} label="Managers" color="text-fpl-green" />
        <SummaryCard value={currentGw} label={config.isArchived ? "Final GW" : "Current GW"} color="text-fpl-cyan" />
        <SummaryCard value={managers[0]?.total ?? 0} label="Leader Points" />
        <SummaryCard value={managers[0]?.entry_name ?? managers[0]?.player_name ?? "—"} label="Leading Team" />
      </div>

      {managers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Season Anomalies</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Biggest Gameweek Score</div>
              {anomalies.bestGameweekScore ? <>
                <div className="text-3xl font-bold text-fpl-green">{anomalies.bestGameweekScore.points}</div>
                <div className="text-sm text-white mt-2">{anomalies.bestGameweekScore.teamName}</div>
                <div className="text-xs text-gray-400">{anomalies.bestGameweekScore.managerName} &middot; GW{anomalies.bestGameweekScore.event}</div>
              </> : <div className="text-sm text-gray-400">No data available</div>}
            </div>
            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Most Points Left on Bench</div>
              {anomalies.biggestBenchWaste ? <>
                <div className="text-3xl font-bold text-fpl-pink">{anomalies.biggestBenchWaste.points}</div>
                <div className="text-sm text-white mt-2">{anomalies.biggestBenchWaste.teamName}</div>
                <div className="text-xs text-gray-400">{anomalies.biggestBenchWaste.managerName} &middot; GW{anomalies.biggestBenchWaste.event}</div>
              </> : <div className="text-sm text-gray-400">No data available</div>}
            </div>
            <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Differential Score (Top 5)</div>
              {anomalies.differentialTopFive.length > 0 ? <ol className="space-y-2">
                {anomalies.differentialTopFive.map((player) => <li key={player.element} className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><div className="text-sm text-white truncate">{player.playerName}</div><div className="text-xs text-gray-400">{player.teamShortName}</div></div>
                  <div className="text-sm font-semibold text-fpl-cyan">{player.points}</div>
                </li>)}
              </ol> : <div className="text-sm text-gray-400">No picks data available</div>}
              <div className="text-xs text-gray-500 mt-3">Sum of points in gameweeks where a player was owned by 2 or fewer teams.</div>
            </div>
          </div>
        </div>
      )}

      {managers.length > 0 && <LeagueInsightsTables insights={leagueInsights} />}
      {managers.length > 0 && <DashboardChart title="Points Over Time"><PointsLeagueChart managers={managers} totalGameweeks={totalGameweeks} managerPathPrefix={managerPathPrefix} /></DashboardChart>}
      {managers.length > 0 && <DashboardChart title="Points Per Gameweek (vs League Mean)"><WeeklyPointsLeagueChart managers={managers} totalGameweeks={totalGameweeks} managerPathPrefix={managerPathPrefix} /></DashboardChart>}
      {managers.length > 0 && <DashboardChart title="Global Rank Over Time"><GlobalRankChart managers={managers} totalGameweeks={totalGameweeks} managerPathPrefix={managerPathPrefix} /></DashboardChart>}
      {managers.length > 0 ? <StandingsTable managers={managers} currentGameweek={currentGw} totalGameweeks={totalGameweeks} managerPathPrefix={managerPathPrefix} /> : (
        <div className="bg-fpl-purple/50 rounded-xl p-12 text-center border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
          <p className="text-gray-400">{config.isArchived ? "No archived season data is available." : "Run the data fetch script to populate league data."}</p>
          {!config.isArchived && <code className="block mt-4 text-fpl-green text-sm bg-black/30 rounded-lg p-3 inline-block">npm run fetch-data</code>}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ value, label, color = "text-white" }: { value: React.ReactNode; label: string; color?: string }) {
  return <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-xs text-gray-400 mt-1">{label}</div></div>;
}

function DashboardChart({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-8"><h2 className="text-xl font-bold text-white mb-4">{title}</h2>{children}</div>;
}

function applyGuaranteedAutoSubs(
  managers: ProcessedManager[],
  currentGameweek: number,
  bootstrap: BootstrapData | null,
  fixtures: FixtureData[]
): ProcessedManager[] {
  if (!bootstrap || fixtures.length === 0) return managers;

  return managers
    .map((manager) => {
      const addedPoints = getGuaranteedAutoSubPoints(
        manager.picks_by_event?.[currentGameweek],
        bootstrap.elements,
        fixtures,
        currentGameweek
      );
      if (addedPoints === 0) return manager;

      return {
        ...manager,
        total: manager.total + addedPoints,
        event_total: manager.event_total + addedPoints,
        history: manager.history.map((gameweek) =>
          gameweek.event === currentGameweek
            ? {
                ...gameweek,
                points: gameweek.points + addedPoints,
                total_points: gameweek.total_points + addedPoints,
              }
            : gameweek
        ),
      };
    })
    .sort((left, right) => right.total - left.total);
}
