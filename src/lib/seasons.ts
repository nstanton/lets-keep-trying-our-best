export const LIVE_SEASON = "2026-27" as const;
export const ARCHIVE_SEASON = "2025-26" as const;

export type SeasonKey = typeof LIVE_SEASON | typeof ARCHIVE_SEASON;

export interface SeasonConfig {
  key: SeasonKey;
  label: string;
  leagueId: number;
  dataDirectory: string;
  routePrefix: string;
  isArchived: boolean;
}

export const SEASON_CONFIG: Record<SeasonKey, SeasonConfig> = {
  [LIVE_SEASON]: {
    key: LIVE_SEASON,
    label: "2026/27",
    leagueId: 103278,
    dataDirectory: "current",
    routePrefix: "",
    isArchived: false,
  },
  [ARCHIVE_SEASON]: {
    key: ARCHIVE_SEASON,
    label: "2025/26",
    leagueId: 79657,
    dataDirectory: "archives/2025-26",
    routePrefix: "/archive/2025-26",
    isArchived: true,
  },
};

export function getSeasonConfig(season: SeasonKey = LIVE_SEASON): SeasonConfig {
  return SEASON_CONFIG[season];
}

export function managerPath(season: SeasonKey, managerId: number): string {
  return `${getSeasonConfig(season).routePrefix}/manager/${managerId}`;
}
