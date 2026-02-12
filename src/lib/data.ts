import fs from "fs/promises";
import path from "path";
import type {
  BootstrapData,
  LeagueData,
  ManagerData,
  ProcessedManager,
  GameweekHistory,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function getBootstrapData(): Promise<BootstrapData | null> {
  return readJsonFile<BootstrapData>(path.join(DATA_DIR, "bootstrap.json"));
}

export async function getLeagueData(): Promise<LeagueData | null> {
  return readJsonFile<LeagueData>(path.join(DATA_DIR, "league.json"));
}

export async function getManagerData(
  managerId: number
): Promise<ManagerData | null> {
  return readJsonFile<ManagerData>(
    path.join(DATA_DIR, "managers", `${managerId}.json`)
  );
}

export async function getAllManagerIds(): Promise<number[]> {
  const league = await getLeagueData();
  if (!league) return [];
  return league.standings.results.map((r) => r.entry);
}

export async function getCurrentGameweek(): Promise<number> {
  const bootstrap = await getBootstrapData();
  if (!bootstrap || bootstrap.events.length === 0) return 1;

  // Find the current gameweek
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return current.id;

  // Fall back to the most recent finished gameweek
  const finished = bootstrap.events.filter((e) => e.finished);
  if (finished.length > 0) return finished[finished.length - 1].id;

  return 1;
}

export async function getProcessedManagers(): Promise<ProcessedManager[]> {
  const league = await getLeagueData();
  if (!league) return [];

  const managers: ProcessedManager[] = [];

  for (const standing of league.standings.results) {
    const managerData = await getManagerData(standing.entry);

    managers.push({
      entry: standing.entry,
      player_name: standing.player_name,
      entry_name: standing.entry_name,
      rank: standing.rank,
      last_rank: standing.last_rank,
      total: standing.total,
      event_total: standing.event_total,
      history: managerData?.current ?? [],
      chips: managerData?.chips ?? [],
      picks_by_event: managerData?.picks_by_event,
      transfers: managerData?.transfers,
    });
  }

  // Sort by rank
  managers.sort((a, b) => a.rank - b.rank);

  return managers;
}

export function getRankChange(rank: number, lastRank: number): number {
  if (lastRank === 0) return 0; // New entry
  return lastRank - rank; // Positive = moved up, negative = moved down
}

export function getGameweekChip(
  chips: { name: string; event: number }[],
  gameweek: number
): string | null {
  const chip = chips.find((c) => c.event === gameweek);
  return chip ? chip.name : null;
}

export function getPointsChange(
  history: GameweekHistory[],
  gameweek: number
): number | null {
  const current = history.find((h) => h.event === gameweek);
  const previous = history.find((h) => h.event === gameweek - 1);

  if (!current) return null;
  if (!previous) return current.points;

  // This returns the GW points, not the change in total
  return current.points;
}
