export interface LeagueStanding {
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
}

export interface GameweekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface ChipUsage {
  name: string;
  time: string;
  event: number;
}

export interface PastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

export interface ManagerData {
  current: GameweekHistory[];
  past: PastSeason[];
  chips: ChipUsage[];
}

export interface LeagueInfo {
  id: number;
  name: string;
}

export interface LeagueData {
  league: LeagueInfo;
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueStanding[];
  };
}

export interface BootstrapEvent {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  highest_score: number;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked: boolean;
}

export interface BootstrapTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

export interface BootstrapData {
  events: BootstrapEvent[];
  teams: BootstrapTeam[];
}

export interface ProcessedManager {
  entry: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  total: number;
  event_total: number;
  history: GameweekHistory[];
  chips: ChipUsage[];
}

export type ChipName = 'wildcard' | '3xc' | 'bboost' | 'freehit';

export const CHIP_DISPLAY_NAMES: Record<string, string> = {
  wildcard: 'Wildcard',
  '3xc': 'Triple Captain',
  bboost: 'Bench Boost',
  freehit: 'Free Hit',
};

export const CHIP_COLORS: Record<string, string> = {
  wildcard: 'bg-fpl-pink',
  '3xc': 'bg-fpl-cyan text-fpl-purple',
  bboost: 'bg-fpl-green text-fpl-purple',
  freehit: 'bg-fpl-light-purple',
};
