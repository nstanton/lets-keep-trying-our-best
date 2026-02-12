"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell,
  Bar,
} from "recharts";

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

interface WeeklyChartProps {
  history: GameweekHistory[];
  chips: ChipUsage[];
}

const CHIP_DISPLAY: Record<string, string> = {
  wildcard: "Wildcard",
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
};

export default function WeeklyChart({ history, chips }: WeeklyChartProps) {
  const chipEvents = new Set(chips.map((c) => c.event));

  const data = history.map((h) => ({
    gw: `GW${h.event}`,
    points: h.points,
    total: h.total_points,
    transfers: h.event_transfers,
    cost: h.event_transfers_cost,
    bench: h.points_on_bench,
    isChip: chipEvents.has(h.event),
    chipName: chips.find((c) => c.event === h.event)?.name,
  }));

  // Custom tooltip with proper typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-fpl-purple border border-white/20 rounded-lg p-3 text-sm shadow-xl">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-fpl-green">Points: {d.points}</p>
        <p className="text-gray-300">Total: {d.total}</p>
        <p className="text-gray-300">
          Transfers: {d.transfers}
          {d.cost > 0 ? ` (-${d.cost})` : ""}
        </p>
        <p className="text-gray-300">Bench: {d.bench}</p>
        {d.chipName && (
          <p className="text-fpl-pink mt-1 font-semibold">
            {CHIP_DISPLAY[d.chipName] || d.chipName}
          </p>
        )}
      </div>
    );
  };

  if (history.length === 0) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center text-gray-400 border border-white/10">
        No gameweek data available yet
      </div>
    );
  }

  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
          />
          <XAxis
            dataKey="gw"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <YAxis
            yAxisId="points"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <YAxis
            yAxisId="total"
            orientation="right"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="points" dataKey="points" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isChip ? "#e90052" : "#00ff87"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
          <Line
            yAxisId="total"
            type="monotone"
            dataKey="total"
            stroke="#963cff"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
