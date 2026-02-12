// Bootstrap Static response (from /api/bootstrap-static/)
export interface BootstrapEvent {
  id: number;
  name: string;
  deadline_time: string;
  average_entry_score: number;
  highest_score: number;
  highest_scoring_entry: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked: boolean;
  most_selected: number | null;
  most_transferred_in: number | null;
  most_captained: number | null;
  most_vice_captained: number | null;
}

export interface BootstrapTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

export interface BootstrapResponse {
  events: BootstrapEvent[];
  teams: BootstrapTeam[];
  total_players: number;
}

// League Standings response (from /api/leagues-classic/{id}/standings/)
export interface LeagueInfo {
  id: number;
  name: string;
  created: string;
  closed: boolean;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  start_event: number;
}

export interface LeagueStandingResult {
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

export interface LeagueStandings {
  has_next: boolean;
  page: number;
  results: LeagueStandingResult[];
}

export interface LeagueResponse {
  league: LeagueInfo;
  standings: LeagueStandings;
  new_entries: { has_next: boolean; page: number; results: unknown[] };
}

// Manager History response (from /api/entry/{id}/history/)
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

export interface PastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

export interface ChipUsage {
  name: string;
  time: string;
  event: number;
}

export interface ManagerHistoryResponse {
  current: GameweekHistory[];
  past: PastSeason[];
  chips: ChipUsage[];
}

// Manager Entry response (from /api/entry/{id}/)
export interface ManagerEntryResponse {
  id: number;
  joined_time: string;
  started_event: number;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
}
