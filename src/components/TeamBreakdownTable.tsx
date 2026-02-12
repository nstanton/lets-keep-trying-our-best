"use client";

import { Fragment, useState } from "react";
import type {
  OtherManagerPlayerBreakdownRow,
  TeamBreakdownRow,
} from "@/lib/team-breakdown";
import { getAvgPointsWhenNotBenched } from "@/lib/team-breakdown";

interface TeamBreakdownTableProps {
  rows: TeamBreakdownRow[];
  otherManagersByElementId: Record<number, OtherManagerPlayerBreakdownRow[]>;
}

function InfoTooltip({ text, label }: { text: string; label: string }) {
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="peer inline-flex h-4 w-4 items-center justify-center rounded-full border border-fpl-cyan/60 text-[10px] text-fpl-cyan"
        aria-label={label}
        title={text}
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-40 w-56 -translate-x-1/2 rounded-md border border-white/20 bg-fpl-dark-purple/95 p-2 text-[11px] font-normal leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
        {text}
      </span>
    </span>
  );
}

function formatValue(value: number | null, precision = 0): string {
  if (value === null) return "—";
  return value.toFixed(precision);
}

export default function TeamBreakdownTable({
  rows,
  otherManagersByElementId,
}: TeamBreakdownTableProps) {
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">No picks data available</h3>
        <p className="text-gray-400 text-sm">
          Run <code className="text-fpl-green">npm run fetch-data</code> to populate picks per
          gameweek.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-[1320px] w-full border-collapse">
          <thead>
            <tr className="bg-fpl-dark-purple">
              <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                Player
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                <span className="inline-flex items-center justify-end gap-1">
                  <span>Earned Points (Ignore Captaincy)</span>
                  <InfoTooltip
                    label="Earned points ignoring captaincy information"
                    text="Points received from this player only in starting XI weeks, excluding captaincy bonus."
                  />
                </span>
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                <span className="inline-flex items-center justify-end gap-1">
                  <span>Total Points Earned</span>
                  <InfoTooltip
                    label="Total points earned information"
                    text="Points received from this player in starting XI weeks plus captaincy bonus."
                  />
                </span>
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                <span className="inline-flex items-center justify-end gap-1">
                  <span>Total Player Points</span>
                  <InfoTooltip
                    label="Total player points information"
                    text="Total player points for the season, including weeks this manager did not own the player."
                  />
                </span>
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                Avg Points/Game (Not Benched)
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                Total Weeks Owned
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                Total Weeks Played
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-r border-white/10">
                Total Times Captained
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide text-gray-300 border-b border-white/10">
                Captain Bonus Points
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedElementId === row.elementId;
              const otherManagerRows = otherManagersByElementId[row.elementId] ?? [];

              return (
                <Fragment key={row.elementId}>
                  <tr
                    className={`border-t border-white/10 transition-colors ${
                      isSelected ? "bg-fpl-dark-purple/40" : "hover:bg-fpl-dark-purple/20"
                    }`}
                  >
                    <td className="px-3 py-2 border-r border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedElementId((current) =>
                            current === row.elementId ? null : row.elementId
                          )
                        }
                        className="text-left group"
                      >
                        <div className="text-sm font-semibold text-white group-hover:text-fpl-cyan transition-colors">
                          {row.playerName}
                        </div>
                        <div className="text-xs text-gray-400">{row.teamShortName}</div>
                        <div className="text-[11px] text-fpl-cyan mt-0.5">
                          {isSelected
                            ? "Hide league comparison"
                            : "Click for other managers"}
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-fpl-green font-semibold border-r border-white/10">
                      {row.earnedPointsIgnoreCaptaincy}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-fpl-green font-semibold border-r border-white/10">
                      {row.totalPointsEarned}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-white border-r border-white/10">
                      {row.totalPlayerPoints}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-white border-r border-white/10">
                      {formatValue(getAvgPointsWhenNotBenched(row), 2)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-white border-r border-white/10">
                      {row.totalWeeksOwned}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-white border-r border-white/10">
                      {row.totalWeeksPlayed}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-white border-r border-white/10">
                      {row.totalTimesCaptained}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-fpl-cyan font-semibold">
                      {row.captainBonusPoints}
                    </td>
                  </tr>
                  {isSelected && (
                    <tr className="border-t border-white/10 bg-fpl-dark-purple/60">
                      <td colSpan={9} className="px-3 py-3">
                        {otherManagerRows.length === 0 ? (
                          <p className="text-xs text-gray-400">
                            No other manager in this league has owned this player.
                          </p>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-300 mb-2">
                              {otherManagerRows.length} other manager
                              {otherManagerRows.length === 1 ? "" : "s"} in this league owned this
                              player.
                            </p>
                            <div className="overflow-x-auto rounded-md border border-white/10">
                              <table className="min-w-[1120px] w-full border-collapse">
                                <thead>
                                  <tr className="bg-fpl-purple/70">
                                    <th className="px-2 py-1.5 text-left text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Manager
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Earned Points (Ignore Captaincy)
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Total Points Earned
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Total Player Points
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Avg Points/Game (Not Benched)
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Total Weeks Owned
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Total Weeks Played
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-r border-white/10">
                                      Total Times Captained
                                    </th>
                                    <th className="px-2 py-1.5 text-right text-[11px] text-gray-300 border-b border-white/10">
                                      Captain Bonus Points
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {otherManagerRows.map((comparisonRow) => (
                                    <tr key={comparisonRow.managerId} className="border-t border-white/10">
                                      <td className="px-2 py-1.5 text-xs text-gray-200 border-r border-white/10">
                                        <div className="font-semibold text-white">
                                          {comparisonRow.managerEntryName}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                          {comparisonRow.managerPlayerName}
                                        </div>
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-fpl-green border-r border-white/10">
                                        {comparisonRow.row.earnedPointsIgnoreCaptaincy}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-fpl-green border-r border-white/10">
                                        {comparisonRow.row.totalPointsEarned}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-white border-r border-white/10">
                                        {comparisonRow.row.totalPlayerPoints}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-gray-200 border-r border-white/10">
                                        {formatValue(getAvgPointsWhenNotBenched(comparisonRow.row), 2)}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-gray-200 border-r border-white/10">
                                        {comparisonRow.row.totalWeeksOwned}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-gray-200 border-r border-white/10">
                                        {comparisonRow.row.totalWeeksPlayed}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-gray-200 border-r border-white/10">
                                        {comparisonRow.row.totalTimesCaptained}
                                      </td>
                                      <td className="px-2 py-1.5 text-xs text-right text-fpl-cyan">
                                        {comparisonRow.row.captainBonusPoints}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
