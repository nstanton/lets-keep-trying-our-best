import fs from "node:fs/promises";
import path from "node:path";

import type { BootstrapResponse } from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_PATH = path.join(DATA_DIR, "historical-players.json");
const GITHUB_BASE =
  "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data";

const POSITION_MAP = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
} as const;

const HISTORICAL_SEASONS = [
  { label: "2022/23", slug: "2022-23" },
  { label: "2023/24", slug: "2023-24" },
  { label: "2024/25", slug: "2024-25" },
] as const;

interface HistoricalPlayer {
  web_name: string;
  total_points: number;
  points_per_game: number;
}

interface HistoricalPlayersByPosition {
  GK: HistoricalPlayer[];
  DEF: HistoricalPlayer[];
  MID: HistoricalPlayer[];
  FWD: HistoricalPlayer[];
}

interface HistoricalPlayersOutput {
  seasons: Record<string, HistoricalPlayersByPosition>;
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) {
      return response.text();
    }

    if (attempt < retries) {
      console.log(
        `Request failed (${response.status}), retrying in 1s... (attempt ${attempt}/${retries})`
      );
      await delay(1000);
      continue;
    }

    throw new Error(
      `Failed to fetch ${url} after ${retries} attempts: ${response.status} ${response.statusText}`
    );
  }

  throw new Error("Unexpected error in fetchWithRetry");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function createEmptyPositions(): HistoricalPlayersByPosition {
  return {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
}

function sortPlayers(players: HistoricalPlayer[]): HistoricalPlayer[] {
  return players.toSorted((a, b) => b.total_points - a.total_points);
}

function finalizePositions(
  positions: HistoricalPlayersByPosition
): HistoricalPlayersByPosition {
  return {
    GK: sortPlayers(positions.GK),
    DEF: sortPlayers(positions.DEF),
    MID: sortPlayers(positions.MID),
    FWD: sortPlayers(positions.FWD),
  };
}

function parseHistoricalCsv(csv: string): HistoricalPlayersByPosition {
  const lines = csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return createEmptyPositions();
  }

  const headers = lines[0].split(",");
  const webNameIndex = headers.indexOf("web_name");
  const positionIndex = headers.indexOf("element_type");
  const pointsIndex = headers.indexOf("total_points");
  const pointsPerGameIndex = headers.indexOf("points_per_game");

  if (
    webNameIndex === -1 ||
    positionIndex === -1 ||
    pointsIndex === -1 ||
    pointsPerGameIndex === -1
  ) {
    throw new Error("Historical CSV is missing required columns");
  }

  const positions = createEmptyPositions();

  for (const line of lines.slice(1)) {
    const columns = line.split(",");
    const position = POSITION_MAP[Number(columns[positionIndex]) as keyof typeof POSITION_MAP];
    const totalPoints = Number(columns[pointsIndex]);
    const pointsPerGame = Number(columns[pointsPerGameIndex]);

    if (!position || !Number.isFinite(totalPoints) || totalPoints <= 0) {
      continue;
    }

    positions[position].push({
      web_name: columns[webNameIndex],
      total_points: totalPoints,
      points_per_game: Number.isFinite(pointsPerGame) ? pointsPerGame : 0,
    });
  }

  return finalizePositions(positions);
}

function extractCurrentSeasonPlayers(
  bootstrap: BootstrapResponse
): HistoricalPlayersByPosition {
  const positions = createEmptyPositions();

  for (const player of bootstrap.elements) {
    const position =
      POSITION_MAP[player.element_type as keyof typeof POSITION_MAP];

    if (!position || player.total_points <= 0) {
      continue;
    }

    positions[position].push({
      web_name: player.web_name,
      total_points: player.total_points,
      points_per_game: Number(player.points_per_game),
    });
  }

  return finalizePositions(positions);
}

async function fetchHistoricalPlayers(): Promise<void> {
  await ensureDir(DATA_DIR);

  const output: HistoricalPlayersOutput = { seasons: {} };

  for (const season of HISTORICAL_SEASONS) {
    const csv = await fetchWithRetry(
      `${GITHUB_BASE}/${season.slug}/players_raw.csv`
    );
    output.seasons[season.label] = parseHistoricalCsv(csv);
    console.log(`Fetched historical players for ${season.label}`);
  }

  const bootstrap = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "bootstrap.json"), "utf-8")
  ) as BootstrapResponse;

  output.seasons["2025/26"] = extractCurrentSeasonPlayers(bootstrap);

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Saved historical players to ${OUTPUT_PATH}`);
}

fetchHistoricalPlayers().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
