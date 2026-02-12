import fs from "node:fs/promises";
import path from "node:path";

import type {
  BootstrapResponse,
  EventLiveResponse,
  EventPicksResponse,
  LeagueResponse,
  LeagueStandingResult,
  ManagerHistoryResponse,
  ManagerHistoryWithPicks,
  ManagerPickWithPoints,
  ManagerTransfersResponse,
} from "./types.js";

// Constants
const API_BASE = "https://fantasy.premierleague.com/api";
const LEAGUE_ID = 79657;
const DATA_DIR = path.join(process.cwd(), "data");
const MANAGERS_DIR = path.join(DATA_DIR, "managers");
const DELAY_MS = 250;

// Helper: fetch with retry
async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url);
    if (response.ok) {
      return (await response.json()) as T;
    }
    if (attempt < retries) {
      console.log(
        `Request failed (${response.status}), retrying in 1s... (attempt ${attempt}/${retries})`
      );
      await delay(1000);
    } else {
      throw new Error(
        `Failed to fetch ${url} after ${retries} attempts: ${response.status} ${response.statusText}`
      );
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error("Unexpected error in fetchWithRetry");
}

// Helper: delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: ensure directory exists
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function getLivePointsMapForEvent(
  event: number,
  cache: Map<number, Map<number, number>>
): Promise<Map<number, number>> {
  const cached = cache.get(event);
  if (cached) return cached;

  try {
    const liveData = await fetchWithRetry<EventLiveResponse>(
      `${API_BASE}/event/${event}/live/`
    );
    const pointsMap = new Map<number, number>();
    for (const element of liveData.elements) {
      pointsMap.set(element.id, element.stats.total_points);
    }
    cache.set(event, pointsMap);
    return pointsMap;
  } catch (error) {
    console.warn(
      `Could not fetch live points for GW${event}. Continuing with null points.`,
      error
    );
    const emptyMap = new Map<number, number>();
    cache.set(event, emptyMap);
    return emptyMap;
  }
}

// Main data fetching function
async function fetchData(): Promise<void> {
  // Ensure output directories exist
  await ensureDir(DATA_DIR);
  await ensureDir(MANAGERS_DIR);

  // 1. Fetch bootstrap-static data
  const bootstrap = await fetchWithRetry<BootstrapResponse>(
    `${API_BASE}/bootstrap-static/`
  );
  await fs.writeFile(
    path.join(DATA_DIR, "bootstrap.json"),
    JSON.stringify(bootstrap, null, 2)
  );
  console.log("Fetched bootstrap data");

  const currentEvent = bootstrap.events.find((e) => e.is_current);
  if (currentEvent) {
    console.log(`Current gameweek: ${currentEvent.name} (id: ${currentEvent.id})`);
  }

  // 2. Fetch league standings with pagination
  let allResults: LeagueStandingResult[] = [];
  let page = 1;
  let hasNext = true;
  let leagueData: LeagueResponse | null = null;

  while (hasNext) {
    const url =
      page === 1
        ? `${API_BASE}/leagues-classic/${LEAGUE_ID}/standings/`
        : `${API_BASE}/leagues-classic/${LEAGUE_ID}/standings/?page_standings=${page}`;

    const pageData = await fetchWithRetry<LeagueResponse>(url);

    if (page === 1) {
      leagueData = pageData;
    }

    allResults = allResults.concat(pageData.standings.results);
    hasNext = pageData.standings.has_next;
    page++;
  }

  // Merge all results into the league data
  if (leagueData) {
    leagueData.standings.results = allResults;
    leagueData.standings.has_next = false;
    await fs.writeFile(
      path.join(DATA_DIR, "league.json"),
      JSON.stringify(leagueData, null, 2)
    );
  }

  console.log(`Fetched league standings: ${allResults.length} managers`);

  // 3. Fetch history for each manager
  const livePointsCache = new Map<number, Map<number, number>>();

  for (const manager of allResults) {
    await delay(DELAY_MS);

    const historyPromise = fetchWithRetry<ManagerHistoryResponse>(
      `${API_BASE}/entry/${manager.entry}/history/`
    );
    const transfersPromise = fetchWithRetry<ManagerTransfersResponse>(
      `${API_BASE}/entry/${manager.entry}/transfers/`
    ).catch((error) => {
      console.warn(
        `Could not fetch transfers for manager ${manager.entry}. Continuing with empty transfers.`,
        error
      );
      return [] as ManagerTransfersResponse;
    });
    const [history, transfers] = await Promise.all([
      historyPromise,
      transfersPromise,
    ]);

    const picksByEvent: Record<number, ManagerPickWithPoints[]> = {};
    const managerGameweeks = new Set(history.current.map((gw) => gw.event));
    if (currentEvent) {
      managerGameweeks.add(currentEvent.id);
    }

    for (const gameweek of managerGameweeks) {
      await delay(DELAY_MS);

      try {
        const [picksResponse, livePointsMap] = await Promise.all([
          fetchWithRetry<EventPicksResponse>(
            `${API_BASE}/entry/${manager.entry}/event/${gameweek}/picks/`
          ),
          getLivePointsMapForEvent(gameweek, livePointsCache),
        ]);

        picksByEvent[gameweek] = picksResponse.picks.map((pick) => ({
          element: pick.element,
          position: pick.position,
          multiplier: pick.multiplier,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
          points: livePointsMap.get(pick.element) ?? null,
        }));
      } catch (error) {
        console.warn(
          `Could not fetch picks for manager ${manager.entry} in GW${gameweek}.`,
          error
        );
      }
    }

    const managerData: ManagerHistoryWithPicks = {
      ...history,
      picks_by_event: picksByEvent,
      transfers,
    };

    await fs.writeFile(
      path.join(MANAGERS_DIR, `${manager.entry}.json`),
      JSON.stringify(managerData, null, 2)
    );
    console.log(
      `Fetched history and picks for ${manager.player_name} (${manager.entry})`
    );
  }

  console.log("Done! Data saved to data/");
}

// Run
fetchData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
