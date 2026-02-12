import type { BootstrapData, ProcessedManager } from "./types";

export interface SeasonHighScore {
  points: number;
  event: number;
  managerEntry: number;
  managerName: string;
  teamName: string;
}

export interface DifferentialPlayerScore {
  element: number;
  playerName: string;
  teamShortName: string;
  points: number;
}

export interface SeasonAnomalies {
  bestGameweekScore: SeasonHighScore | null;
  biggestBenchWaste: SeasonHighScore | null;
  differentialTopFive: DifferentialPlayerScore[];
}

export function computeSeasonAnomalies(
  managers: ProcessedManager[],
  bootstrap: BootstrapData | null,
  currentGameweek: number
): SeasonAnomalies {
  let bestGameweekScore: SeasonHighScore | null = null;
  let biggestBenchWaste: SeasonHighScore | null = null;

  for (const manager of managers) {
    const historyByEvent = new Map(manager.history.map((gw) => [gw.event, gw]));
    const events = new Set<number>([
      ...manager.history.map((gw) => gw.event),
      ...Object.keys(manager.picks_by_event ?? {}).map((event) => Number(event)),
    ]);

    if (currentGameweek > 0) {
      events.add(currentGameweek);
    }

    for (const event of events) {
      const history = historyByEvent.get(event);
      const picks = manager.picks_by_event?.[event];

      const derivedPoints =
        picks && picks.length > 0
          ? picks.reduce(
              (sum, pick) => sum + (pick.points ?? 0) * Math.max(pick.multiplier, 0),
              0
            )
          : null;

      const derivedBenchWaste =
        picks && picks.length > 0
          ? picks
              .filter((pick) => pick.position > 11 && pick.multiplier === 0)
              .reduce((sum, pick) => sum + (pick.points ?? 0), 0)
          : null;

      const gameweekPoints = history?.points ?? derivedPoints;
      const benchWaste = derivedBenchWaste ?? history?.points_on_bench ?? null;

      if (gameweekPoints !== null && gameweekPoints !== undefined) {
        if (!bestGameweekScore || gameweekPoints > bestGameweekScore.points) {
          bestGameweekScore = {
            points: gameweekPoints,
            event,
            managerEntry: manager.entry,
            managerName: manager.player_name,
            teamName: manager.entry_name,
          };
        }
      }

      if (benchWaste !== null && benchWaste !== undefined) {
        if (!biggestBenchWaste || benchWaste > biggestBenchWaste.points) {
          biggestBenchWaste = {
            points: benchWaste,
            event,
            managerEntry: manager.entry,
            managerName: manager.player_name,
            teamName: manager.entry_name,
          };
        }
      }
    }
  }

  const elementMeta = new Map<number, { name: string; teamShortName: string }>();
  if (bootstrap) {
    const teamShortById = new Map<number, string>(
      bootstrap.teams.map((team) => [team.id, team.short_name])
    );
    for (const element of bootstrap.elements) {
      elementMeta.set(element.id, {
        name: element.web_name,
        teamShortName: teamShortById.get(element.team) ?? "UNK",
      });
    }
  }

  const ownershipByEvent = new Map<number, Map<number, number>>();
  const pointsByEventElement = new Map<string, number>();

  for (const manager of managers) {
    const picksByEvent = manager.picks_by_event;
    if (!picksByEvent) continue;

    for (const [eventKey, picks] of Object.entries(picksByEvent)) {
      const event = Number(eventKey);
      if (!Number.isFinite(event)) continue;

      const ownershipForEvent =
        ownershipByEvent.get(event) ?? new Map<number, number>();
      ownershipByEvent.set(event, ownershipForEvent);

      for (const pick of picks) {
        const current = ownershipForEvent.get(pick.element) ?? 0;
        ownershipForEvent.set(pick.element, current + 1);

        if (pick.points !== null && pick.points !== undefined) {
          const key = `${event}:${pick.element}`;
          if (!pointsByEventElement.has(key)) {
            pointsByEventElement.set(key, pick.points);
          }
        }
      }
    }
  }

  const differentialTotals = new Map<number, number>();
  for (const [event, ownership] of ownershipByEvent) {
    for (const [elementId, count] of ownership) {
      if (count > 2) continue;
      const points = pointsByEventElement.get(`${event}:${elementId}`) ?? 0;
      differentialTotals.set(
        elementId,
        (differentialTotals.get(elementId) ?? 0) + points
      );
    }
  }

  const differentialTopFive = Array.from(differentialTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([elementId, points]) => ({
      element: elementId,
      playerName: elementMeta.get(elementId)?.name ?? `Player #${elementId}`,
      teamShortName: elementMeta.get(elementId)?.teamShortName ?? "UNK",
      points,
    }));

  return {
    bestGameweekScore,
    biggestBenchWaste,
    differentialTopFive,
  };
}
