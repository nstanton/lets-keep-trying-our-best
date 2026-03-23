export const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export const SEASONS = ["2022/23", "2023/24", "2024/25", "2025/26"] as const;
export const TOP_PLAYER_LIMIT = 20;
export const SEASON_COLORS: Record<SeasonKey, string> = {
  "2022/23": "#00ff87",
  "2023/24": "#e90052",
  "2024/25": "#963cff",
  "2025/26": "#05f0ff",
};

export type PositionKey = (typeof POSITIONS)[number];
export type SeasonKey = (typeof SEASONS)[number];

export interface HistoricalPlayer {
  web_name: string;
  total_points: number;
  points_per_game: number;
}

export type HistoricalPlayersByPosition = Record<PositionKey, HistoricalPlayer[]>;
export type HistoricalPlayersBySeason = Record<SeasonKey, HistoricalPlayersByPosition>;

export interface HistoricalPlayersData {
  seasons: HistoricalPlayersBySeason;
}

export interface ConcentrationBuckets {
  top3: number;
  next2: number;
  next5: number;
  rest: number;
}

export function limitToTopPlayers(points: number[], limit = TOP_PLAYER_LIMIT): number[] {
  return points.slice(0, limit);
}

export function computeConcentrationBuckets(points: number[]): ConcentrationBuckets {
  if (points.length === 0) {
    return {
      top3: 0,
      next2: 0,
      next5: 0,
      rest: 0,
    };
  }

  const total = points.reduce((sum, point) => sum + point, 0);
  const share = (start: number, end: number) =>
    Number(
      (
        (points.slice(start, end).reduce((sum, point) => sum + point, 0) / total) *
        100
      ).toFixed(1)
    );

  const top3 = share(0, 3);
  const next2 = share(3, 5);
  const next5 = share(5, 10);

  return {
    top3,
    next2,
    next5,
    rest: Number((100 - top3 - next2 - next5).toFixed(1)),
  };
}
