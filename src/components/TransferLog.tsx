import { CHIP_DISPLAY_NAMES, CHIP_COLORS } from "@/lib/types";

interface GameweekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

interface ChipUsage {
  name: string;
  time: string;
  event: number;
}

interface TransferLogProps {
  history: GameweekHistory[];
  chips: ChipUsage[];
}

export default function TransferLog({ history, chips }: TransferLogProps) {
  const chipMap = new Map(chips.map((c) => [c.event, c.name]));
  const sorted = [...history].sort((a, b) => b.event - a.event);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No gameweek history available
      </div>
    );
  }

  // Summary stats
  const totalTransfers = history.reduce(
    (sum, h) => sum + h.event_transfers,
    0
  );
  const totalCost = history.reduce(
    (sum, h) => sum + h.event_transfers_cost,
    0
  );
  const totalBenchPts = history.reduce(
    (sum, h) => sum + h.points_on_bench,
    0
  );

  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-fpl-purple/30 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-lg font-bold text-white">{totalTransfers}</div>
          <div className="text-xs text-gray-400">Total Transfers</div>
        </div>
        <div className="bg-fpl-purple/30 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-lg font-bold text-fpl-pink">
            {totalCost > 0 ? `-${totalCost}` : "0"}
          </div>
          <div className="text-xs text-gray-400">Total Hit Cost</div>
        </div>
        <div className="bg-fpl-purple/30 rounded-lg p-3 border border-white/10 text-center">
          <div className="text-lg font-bold text-gray-300">{totalBenchPts}</div>
          <div className="text-xs text-gray-400">Points on Bench</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-fpl-purple/50 rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                  GW
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                  Points
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                  Overall Rank
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                  Transfers
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                  Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                  Bench
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                  Chip
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((gw, index) => {
                const chipName = chipMap.get(gw.event);
                return (
                  <tr
                    key={gw.event}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      index % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      GW{gw.event}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-fpl-green">
                      {gw.points}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {gw.total_points}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {gw.overall_rank.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {gw.event_transfers}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {gw.event_transfers_cost > 0 ? (
                        <span className="text-fpl-pink font-medium">
                          -{gw.event_transfers_cost}
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {gw.points_on_bench}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {chipName && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            CHIP_COLORS[chipName] || "bg-gray-600"
                          }`}
                        >
                          {CHIP_DISPLAY_NAMES[chipName] || chipName}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
