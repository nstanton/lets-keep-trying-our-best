"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProcessedManager } from "@/lib/types";
import ChipBadge from "./ChipBadge";

interface StandingsTableProps {
  managers: ProcessedManager[];
  currentGameweek: number;
  totalGameweeks: number;
}

function getGameweekChip(
  chips: { name: string; event: number }[],
  gameweek: number
): string | null {
  const chip = chips.find((c) => c.event === gameweek);
  return chip ? chip.name : null;
}

export default function StandingsTable({
  managers,
  currentGameweek,
  totalGameweeks,
}: StandingsTableProps) {
  const [selectedGw, setSelectedGw] = useState(currentGameweek);

  // Build standings for selected GW
  const gwStandings = managers
    .map((m) => {
      const gwData = m.history.find((h) => h.event === selectedGw);
      const chip = getGameweekChip(m.chips, selectedGw);

      return {
        entry: m.entry,
        player_name: m.player_name,
        entry_name: m.entry_name,
        points: gwData?.points ?? 0,
        total_points: gwData?.total_points ?? 0,
        transfers: gwData?.event_transfers ?? 0,
        transfer_cost: gwData?.event_transfers_cost ?? 0,
        chip,
        points_on_bench: gwData?.points_on_bench ?? 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  // Calculate ranks
  const withRanks = gwStandings.map((s, i) => ({ ...s, rank: i + 1 }));

  // Calculate previous GW ranks for movement arrows
  const prevGwStandings = managers
    .map((m) => {
      const prevGwData = m.history.find((h) => h.event === selectedGw - 1);
      return {
        entry: m.entry,
        total_points: prevGwData?.total_points ?? 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  const prevRankMap = new Map(prevGwStandings.map((s, i) => [s.entry, i + 1]));

  return (
    <div>
      {/* GW Selector */}
      <div className="flex items-center gap-4 mb-6">
        <label
          htmlFor="gw-select"
          className="text-sm font-medium text-gray-300"
        >
          Gameweek
        </label>
        <select
          id="gw-select"
          value={selectedGw}
          onChange={(e) => setSelectedGw(Number(e.target.value))}
          className="bg-fpl-purple border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fpl-green focus:border-fpl-green"
        >
          {Array.from({ length: totalGameweeks }, (_, i) => i + 1).map(
            (gw) => (
              <option key={gw} value={gw}>
                Gameweek {gw}
              </option>
            )
          )}
        </select>
      </div>

      {/* Table */}
      <div className="bg-fpl-purple/50 rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  GW Pts
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Transfers
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Chip
                </th>
              </tr>
            </thead>
            <tbody>
              {withRanks.map((standing, index) => {
                const prevRank =
                  prevRankMap.get(standing.entry) ?? standing.rank;
                const movement =
                  selectedGw > 1 ? prevRank - standing.rank : 0;

                return (
                  <tr
                    key={standing.entry}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      index % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-white">
                      {standing.rank}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {movement > 0 && (
                        <span className="text-fpl-green text-xs">
                          ▲ {movement}
                        </span>
                      )}
                      {movement < 0 && (
                        <span className="text-fpl-pink text-xs">
                          ▼ {Math.abs(movement)}
                        </span>
                      )}
                      {movement === 0 && (
                        <span className="text-gray-500 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/manager/${standing.entry}`}
                        className="hover:text-fpl-green transition-colors"
                      >
                        <div className="font-medium text-white">
                          {standing.entry_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {standing.player_name}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-fpl-green">
                      {standing.points}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {standing.total_points}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {standing.transfers}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {standing.transfer_cost > 0 ? (
                        <span className="text-fpl-pink font-medium">
                          -{standing.transfer_cost}
                        </span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {standing.chip && <ChipBadge chipName={standing.chip} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {withRanks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No data available for this gameweek</p>
          <p className="text-sm mt-2">
            Data will appear once the season starts and the fetch script has run.
          </p>
        </div>
      )}
    </div>
  );
}
