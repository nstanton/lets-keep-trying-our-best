import { CHIP_DISPLAY_NAMES } from "@/lib/types";
import type { LeagueInsightsResult, ManagerLeagueInsight } from "@/lib/league-insights";

interface LeagueInsightsTablesProps {
  insights: LeagueInsightsResult;
}

function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return value.toFixed(digits);
}

function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatSigned(value: number | null, digits = 1): string {
  if (value === null) return "—";
  if (value > 0) return `+${value.toFixed(digits)}`;
  return value.toFixed(digits);
}

function formatPositionShare(value: number, total: number): string {
  if (total <= 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function chipBreakdown(manager: ManagerLeagueInsight): string {
  return [
    `TC ${formatSigned(manager.chipRoiByType["3xc"])}`,
    `BB ${formatSigned(manager.chipRoiByType.bboost)}`,
    `FH ${formatSigned(manager.chipRoiByType.freehit)}`,
    `WC ${formatSigned(manager.chipRoiByType.wildcard)}`,
  ].join(" | ");
}

export default function LeagueInsightsTables({ insights }: LeagueInsightsTablesProps) {
  if (insights.managers.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Advanced League Analytics</h2>
        <p className="text-sm text-gray-400">
          Added metrics: all-play standings, captaincy and bench decision quality,
          transfer/chip ROI, consistency profile, template overlap, differential scoring,
          and position contribution split.
        </p>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          All-Play and Consistency
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-right">All-Play Pts</th>
                <th className="px-3 py-2 text-right">W-D-L</th>
                <th className="px-3 py-2 text-right">All-Play %</th>
                <th className="px-3 py-2 text-right">Top3 GWs</th>
                <th className="px-3 py-2 text-right">Bottom3 GWs</th>
                <th className="px-3 py-2 text-right">Consistency Index</th>
                <th className="px-3 py-2 text-right">GW Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {insights.managers.map((manager, index) => (
                <tr
                  key={manager.entry}
                  className={`border-b border-white/5 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{manager.teamName}</div>
                    <div className="text-xs text-gray-400">{manager.managerName}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-fpl-cyan">
                    {manager.allPlayPoints}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {manager.allPlayWins}-{manager.allPlayDraws}-{manager.allPlayLosses}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPercent(manager.allPlayPointRatePct)}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-green">
                    {manager.topThreeGameweeks}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-pink">
                    {manager.bottomThreeGameweeks}
                  </td>
                  <td className="px-3 py-2 text-right text-white">
                    {formatNumber(manager.consistencyIndex)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatNumber(manager.consistencyStdDev)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Decision Quality and ROI
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-right">Captain Eff</th>
                <th className="px-3 py-2 text-right">Missed Captain Pts</th>
                <th className="px-3 py-2 text-right">Bench Opt Loss</th>
                <th className="px-3 py-2 text-right">Transfer ROI</th>
                <th className="px-3 py-2 text-right">Transfer In Pts</th>
                <th className="px-3 py-2 text-right">Hit Cost</th>
                <th className="px-3 py-2 text-right">Chip ROI (Total)</th>
                <th className="px-3 py-2 text-left">Chip Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {insights.managers.map((manager, index) => (
                <tr
                  key={manager.entry}
                  className={`border-b border-white/5 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{manager.teamName}</div>
                    <div className="text-xs text-gray-400">{manager.managerName}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-green">
                    {formatPercent(manager.captaincyEfficiencyPct)}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-pink">
                    {formatNumber(manager.captaincyMissedPoints, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-pink">
                    {formatNumber(manager.benchOptimizationLoss, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-white">
                    {formatSigned(manager.transferRoi)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatNumber(manager.transferInPoints, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatNumber(manager.transferHitCost, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-cyan">
                    {formatSigned(manager.chipRoiTotal)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 font-mono">
                    {chipBreakdown(manager)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Template, Differential, and Position Profile
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-right">Template Similarity</th>
                <th className="px-3 py-2 text-right">Differential Pts</th>
                <th className="px-3 py-2 text-right">Differential %</th>
                <th className="px-3 py-2 text-right">GK Share</th>
                <th className="px-3 py-2 text-right">DEF Share</th>
                <th className="px-3 py-2 text-right">MID Share</th>
                <th className="px-3 py-2 text-right">FWD Share</th>
                <th className="px-3 py-2 text-right">Captain Bonus</th>
              </tr>
            </thead>
            <tbody>
              {insights.managers.map((manager, index) => (
                <tr
                  key={manager.entry}
                  className={`border-b border-white/5 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white">{manager.teamName}</div>
                    <div className="text-xs text-gray-400">{manager.managerName}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPercent(manager.templateSimilarityPct)}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-cyan">
                    {formatNumber(manager.differentialPoints, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPercent(manager.differentialPointsPct)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPositionShare(
                      manager.positionContribution.gk,
                      manager.positionContribution.total
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPositionShare(
                      manager.positionContribution.def,
                      manager.positionContribution.total
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPositionShare(
                      manager.positionContribution.mid,
                      manager.positionContribution.total
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-200">
                    {formatPositionShare(
                      manager.positionContribution.fwd,
                      manager.positionContribution.total
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-fpl-green">
                    {formatNumber(manager.positionContribution.captainBonus, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Chip ROI Events
        </h3>
        {insights.chipEvents.length === 0 ? (
          <p className="text-sm text-gray-400">No chip events available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-left">Chip</th>
                  <th className="px-3 py-2 text-right">GW</th>
                  <th className="px-3 py-2 text-right">Est Gain</th>
                  <th className="px-3 py-2 text-right">Vs League Mean</th>
                  <th className="px-3 py-2 text-right">Baseline</th>
                  <th className="px-3 py-2 text-right">Window</th>
                </tr>
              </thead>
              <tbody>
                {insights.chipEvents.map((event, index) => (
                  <tr
                    key={`${event.entry}-${event.chip}-${event.event}-${index}`}
                    className={`border-b border-white/5 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{event.teamName}</div>
                      <div className="text-xs text-gray-400">{event.managerName}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-200">
                      {CHIP_DISPLAY_NAMES[event.chip] || event.chip}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">{event.event}</td>
                    <td className="px-3 py-2 text-right text-fpl-cyan">
                      {formatSigned(event.estimatedGain)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">
                      {formatSigned(event.versusLeagueMean)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">
                      {formatNumber(event.baseline)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">{event.windowSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
