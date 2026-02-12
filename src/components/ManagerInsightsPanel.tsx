import { CHIP_DISPLAY_NAMES } from "@/lib/types";
import type {
  ChipRoiEventInsight,
  ManagerLeagueInsight,
} from "@/lib/league-insights";

interface ManagerInsightsPanelProps {
  insight: ManagerLeagueInsight;
  chipEvents: ChipRoiEventInsight[];
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

function positionShare(value: number, total: number): string {
  if (total <= 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export default function ManagerInsightsPanel({
  insight,
  chipEvents,
}: ManagerInsightsPanelProps) {
  const chipEventsByGw = [...chipEvents].sort((a, b) => b.event - a.event);

  return (
    <div className="mb-8 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Advanced Analytics</h2>
        <p className="text-sm text-gray-400">
          League-relative view of all-play strength, decision quality, ROI, consistency,
          template overlap, and position contribution.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">All-Play</div>
          <div className="text-xl font-bold text-fpl-cyan">{insight.allPlayPoints}</div>
          <div className="text-xs text-gray-300 mt-1">
            {insight.allPlayWins}-{insight.allPlayDraws}-{insight.allPlayLosses} ({formatPercent(insight.allPlayPointRatePct)})
          </div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Captain Efficiency</div>
          <div className="text-xl font-bold text-fpl-green">
            {formatPercent(insight.captaincyEfficiencyPct)}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Missed {formatNumber(insight.captaincyMissedPoints, 0)} pts
          </div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bench Optimization Loss</div>
          <div className="text-xl font-bold text-fpl-pink">
            {formatNumber(insight.benchOptimizationLoss, 0)}
          </div>
          <div className="text-xs text-gray-300 mt-1">Best legal XI vs actual XI</div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Consistency Index</div>
          <div className="text-xl font-bold text-white">{formatNumber(insight.consistencyIndex)}</div>
          <div className="text-xs text-gray-300 mt-1">GW stdev: {formatNumber(insight.consistencyStdDev)}</div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Transfer ROI</div>
          <div className="text-xl font-bold text-white">{formatSigned(insight.transferRoi)}</div>
          <div className="text-xs text-gray-300 mt-1">
            In: {formatNumber(insight.transferInPoints, 0)} | Hits: {formatNumber(insight.transferHitCost, 0)}
          </div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Chip ROI</div>
          <div className="text-xl font-bold text-fpl-cyan">{formatSigned(insight.chipRoiTotal)}</div>
          <div className="text-xs text-gray-300 mt-1">
            TC {formatSigned(insight.chipRoiByType["3xc"], 0)} | BB {formatSigned(insight.chipRoiByType.bboost, 0)}
          </div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Template Similarity</div>
          <div className="text-xl font-bold text-white">{formatPercent(insight.templateSimilarityPct)}</div>
          <div className="text-xs text-gray-300 mt-1">
            Differential %: {formatPercent(insight.differentialPointsPct)}
          </div>
        </div>

        <div className="bg-fpl-purple/50 rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">GW Finish Split</div>
          <div className="text-xl font-bold text-white">
            {insight.topThreeGameweeks} / {insight.bottomThreeGameweeks}
          </div>
          <div className="text-xs text-gray-300 mt-1">Top3 vs Bottom3 GWs</div>
        </div>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Position Contribution and Style
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                <th className="px-3 py-2 text-right">GK Share</th>
                <th className="px-3 py-2 text-right">DEF Share</th>
                <th className="px-3 py-2 text-right">MID Share</th>
                <th className="px-3 py-2 text-right">FWD Share</th>
                <th className="px-3 py-2 text-right">Captain Bonus</th>
                <th className="px-3 py-2 text-right">Differential Pts</th>
                <th className="px-3 py-2 text-right">Differential %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 text-right text-gray-200">
                  {positionShare(insight.positionContribution.gk, insight.positionContribution.total)}
                </td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {positionShare(insight.positionContribution.def, insight.positionContribution.total)}
                </td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {positionShare(insight.positionContribution.mid, insight.positionContribution.total)}
                </td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {positionShare(insight.positionContribution.fwd, insight.positionContribution.total)}
                </td>
                <td className="px-3 py-2 text-right text-fpl-green">
                  {formatNumber(insight.positionContribution.captainBonus, 0)}
                </td>
                <td className="px-3 py-2 text-right text-fpl-cyan">
                  {formatNumber(insight.differentialPoints, 0)}
                </td>
                <td className="px-3 py-2 text-right text-gray-200">
                  {formatPercent(insight.differentialPointsPct)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Chip ROI Events
        </h3>
        {chipEventsByGw.length === 0 ? (
          <p className="text-sm text-gray-400">No chip events available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-2 text-left">Chip</th>
                  <th className="px-3 py-2 text-right">GW</th>
                  <th className="px-3 py-2 text-right">Estimated Gain</th>
                  <th className="px-3 py-2 text-right">Vs League Mean</th>
                  <th className="px-3 py-2 text-right">Baseline</th>
                </tr>
              </thead>
              <tbody>
                {chipEventsByGw.map((chipEvent, index) => (
                  <tr
                    key={`${chipEvent.entry}-${chipEvent.chip}-${chipEvent.event}-${index}`}
                    className={`border-b border-white/5 ${index % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="px-3 py-2 text-gray-200">
                      {CHIP_DISPLAY_NAMES[chipEvent.chip] || chipEvent.chip}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">{chipEvent.event}</td>
                    <td className="px-3 py-2 text-right text-fpl-cyan">
                      {formatSigned(chipEvent.estimatedGain)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">
                      {formatSigned(chipEvent.versusLeagueMean)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-200">
                      {formatNumber(chipEvent.baseline)}
                    </td>
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
