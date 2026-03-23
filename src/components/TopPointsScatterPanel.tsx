"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SEASON_COLORS,
  SEASONS,
  TOP_PLAYER_LIMIT,
  type PositionKey,
  type SeasonKey,
} from "@/lib/distribution-shared";

interface TopPointsScatterDatum {
  rank: number;
  total_points: number;
  points_per_game: number;
  web_name: string;
}

interface TopPointsScatterPanelProps {
  position: PositionKey;
  data: Record<SeasonKey, TopPointsScatterDatum[]>;
}

interface TooltipPayloadItem {
  color?: string;
  payload?: TopPointsScatterDatum;
  value?: number;
  name?: string;
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const season = payload[0]?.name;
  if (!point || !season) return null;

  return (
    <div className="bg-fpl-purple border border-white/20 rounded-lg p-3 text-sm shadow-xl min-w-[150px]">
      <p className="font-bold text-white mb-1">{point.web_name}</p>
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between gap-4">
          <span>Season</span>
          <span className="text-white">{season}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Rank</span>
          <span className="text-white">{point.rank}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Season Points</span>
          <span className="text-white">{point.total_points}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Pts/Game</span>
          <span className="text-white">{point.points_per_game.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TopPointsScatterPanel({
  position,
  data,
}: TopPointsScatterPanelProps) {
  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{position}</h3>
        <p className="text-xs text-gray-400">
          Each dot is one of the top {TOP_PLAYER_LIMIT} scorers in rank order,
          plotted by average FPL points per game.
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 12, left: -8, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            type="number"
            dataKey="rank"
            domain={[1, TOP_PLAYER_LIMIT]}
            tickCount={10}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => `#${value}`}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <YAxis
            type="number"
            dataKey="points_per_game"
            orientation="left"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(1)}
            axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Tooltip cursor={{ strokeDasharray: "4 4" }} content={<ScatterTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#d1d5db" }}
            formatter={(value: string) => value}
          />
          {SEASONS.map((season) => (
            <Scatter
              key={season}
              name={season}
              data={data[season]}
              fill={SEASON_COLORS[season]}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
