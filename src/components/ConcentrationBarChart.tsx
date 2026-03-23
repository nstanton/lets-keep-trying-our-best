"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TOP_PLAYER_LIMIT } from "@/lib/distribution-shared";

interface ConcentrationBarRow {
  label: string;
  position: string;
  season: string;
  top3: number;
  next2: number;
  next5: number;
  rest: number;
}

interface ConcentrationBarChartProps {
  data: ConcentrationBarRow[];
}

interface TooltipPayloadItem {
  color?: string;
  dataKey?: string;
  value?: number;
  payload?: ConcentrationBarRow;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const SEGMENT_LABELS: Record<string, string> = {
  top3: "Top 3",
  next2: "Next 2",
  next5: "Next 5",
  rest: "Rest of Top 20",
};

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="bg-fpl-purple border border-white/20 rounded-lg p-3 text-sm shadow-xl min-w-[150px]">
      <p className="font-bold text-white mb-1">
        {row.position} · {row.season}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-gray-300"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {SEGMENT_LABELS[entry.dataKey ?? ""] ?? entry.dataKey}
            </span>
            <span className="font-medium text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConcentrationBarChart({
  data,
}: ConcentrationBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center text-gray-400 border border-white/10">
        No distribution data available yet
      </div>
    );
  }

  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="label"
            angle={-35}
            textAnchor="end"
            height={70}
            interval={0}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Tooltip content={<BarTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#d1d5db" }} />
          <Bar dataKey="top3" stackId="points" fill="#00ff87" name="Top 3" />
          <Bar dataKey="next2" stackId="points" fill="#05f0ff" name="Next 2" />
          <Bar dataKey="next5" stackId="points" fill="#963cff" name="Next 5" />
          <Bar dataKey="rest" stackId="points" fill="#4b5563" name="Rest" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">
        Each bar shows how much of a position&apos;s top {TOP_PLAYER_LIMIT} scoring
        came from its top 3 players, ranks 4-5, ranks 6-10, and ranks 11-20.
      </p>
    </div>
  );
}
