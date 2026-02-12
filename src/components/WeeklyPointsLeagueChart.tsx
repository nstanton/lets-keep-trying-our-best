"use client";

import Link from "next/link";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
} from "recharts";
import type { ProcessedManager } from "@/lib/types";
import { CHIP_DISPLAY_NAMES, CHIP_CHART_COLORS } from "@/lib/types";

const CHIP_ORDER = ["wildcard", "3xc", "bboost", "freehit"] as const;

const CHART_COLORS = [
  "#00ff87", // fpl-green
  "#e90052", // fpl-pink
  "#963cff", // fpl-light-purple
  "#05f0ff", // fpl-cyan
  "#ff6b35",
  "#ffd93d",
  "#6bcb77",
  "#4d96ff",
  "#c44569",
  "#a8e6cf",
];

interface WeeklyPointsLeagueChartProps {
  managers: ProcessedManager[];
  totalGameweeks: number;
}

export default function WeeklyPointsLeagueChart({
  managers,
  totalGameweeks,
}: WeeklyPointsLeagueChartProps) {
  const entryToName = new Map<number, string>();
  managers.forEach((m) => {
    entryToName.set(m.entry, m.player_name || m.entry_name);
  });

  const data = Array.from({ length: totalGameweeks }, (_, i) => {
    const gw = i + 1;
    const pointsByEntry: Record<string, number> = {};
    managers.forEach((m) => {
      const gwData = m.history.find((h) => h.event === gw);
      if (gwData?.points !== undefined) {
        pointsByEntry[String(m.entry)] = gwData.points;
      }
    });
    const entriesWithData = Object.values(pointsByEntry);
    const mean =
      entriesWithData.length > 0
        ? entriesWithData.reduce((a, b) => a + b, 0) / entriesWithData.length
        : 0;
    const row: Record<string, number | string | undefined> = {
      gw,
      gwLabel: `GW${gw}`,
      mean,
    };
    managers.forEach((m) => {
      const pts = pointsByEntry[String(m.entry)];
      row[String(m.entry)] =
        pts !== undefined ? Math.round((pts - mean) * 10) / 10 : undefined;
    });
    return row;
  });

  const getChipAtGw = (entry: number, gw: number) =>
    managers.find((m) => m.entry === entry)?.chips.find((c) => c.event === gw);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChipDot = (props: any, chips: { event: number; name: string }[]) => {
    const { cx, cy, payload, value } = props;
    if (value === undefined || value === null) return null;
    const chip = chips.find((c) => c.event === payload.gw);
    if (!chip) return null;
    const fill = CHIP_CHART_COLORS[chip.name] ?? "#e90052";
    return (
      <g>
        <polygon
          points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
          fill={fill}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;

    const mean = (d.mean as number) ?? 0;
    const entries = managers
      .map((m) => {
        const diff = d[String(m.entry)];
        const chip = getChipAtGw(m.entry, d.gw);
        const rawPts =
          diff !== undefined ? Math.round((diff + mean) * 10) / 10 : undefined;
        return {
          name: entryToName.get(m.entry) ?? m.entry_name,
          diff,
          rawPts,
          chip,
        };
      })
      .filter((e) => e.diff !== undefined)
      .sort((a, b) => (b.diff as number) - (a.diff as number));

    return (
      <div className="bg-fpl-purple border border-white/20 rounded-lg p-3 text-sm shadow-xl min-w-[160px]">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-xs text-gray-500 mb-2">Mean: {mean.toFixed(1)} pts</p>
        <div className="space-y-1">
          {entries.map(({ name, diff, rawPts, chip }) => (
            <div key={name} className="flex justify-between items-center gap-4 text-gray-300">
              <span className="truncate max-w-[100px] flex items-center gap-1">
                {chip && (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: CHIP_CHART_COLORS[chip.name] ?? "#e90052" }}
                    title={CHIP_DISPLAY_NAMES[chip.name] || chip.name}
                  >
                    ◆
                  </span>
                )}
                {name}
              </span>
              <span
                className={`font-medium ${
                  (diff as number) >= 0 ? "text-fpl-green" : "text-fpl-pink"
                }`}
              >
                {(diff as number) >= 0 ? "+" : ""}
                {diff}
                {rawPts !== undefined && (
                  <span className="text-gray-500 text-xs ml-1">({rawPts})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLegend = () => (
    <div className="mt-4 space-y-3">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {managers.map((m, i) => (
          <li key={m.entry} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <Link
              href={`/manager/${m.entry}`}
              className="text-xs text-gray-300 hover:text-fpl-green transition-colors"
            >
              {m.player_name || m.entry_name}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-3">
        {CHIP_ORDER.map((chipName) => (
          <li key={chipName} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 flex-shrink-0 rotate-45 rounded-sm border border-white/30"
              style={{ backgroundColor: CHIP_CHART_COLORS[chipName] }}
              aria-hidden
            />
            <span className="text-xs text-gray-400">
              {CHIP_DISPLAY_NAMES[chipName]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (managers.length === 0 || totalGameweeks === 0) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center text-gray-400 border border-white/10">
        No gameweek data available yet
      </div>
    );
  }

  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
          />
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.3)"
            strokeDasharray="2 2"
          />
          <XAxis
            dataKey="gwLabel"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
          {managers.map((m, i) => (
            <Line
              key={m.entry}
              type="monotone"
              dataKey={String(m.entry)}
              name={m.player_name || m.entry_name}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={(props) => ChipDot(props, m.chips)}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">
        Y-axis: points above (+) or below (−) the league average that gameweek
      </p>
    </div>
  );
}
