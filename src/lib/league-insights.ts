import type {
  BootstrapData,
  ChipName,
  ManagerPick,
  ManagerTransfer,
  ProcessedManager,
} from "./types";

const STARTER_COUNT = 11;
const TEMPLATE_SQUAD_SIZE = 15;

function isKnownChipName(chipName: string): chipName is ChipName {
  return (
    chipName === "wildcard" ||
    chipName === "3xc" ||
    chipName === "bboost" ||
    chipName === "freehit"
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return sum(values) / values.length;
}

function standardDeviation(values: number[]): number | null {
  if (values.length === 0) return null;
  const mean = average(values);
  if (mean === null) return null;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function deriveGameweekPointsFromPicks(picks: ManagerPick[] | undefined): number | null {
  if (!picks || picks.length === 0) return null;
  return picks.reduce(
    (total, pick) => total + (pick.points ?? 0) * Math.max(0, pick.multiplier),
    0
  );
}

function getPickPoints(picks: ManagerPick[] | undefined, elementId: number): number {
  if (!picks || picks.length === 0) return 0;
  const pick = picks.find((entry) => entry.element === elementId);
  return pick?.points ?? 0;
}

function getOptimalStarterBasePoints(
  picks: ManagerPick[],
  elementTypeById: Map<number, number>
): number | null {
  const gkPoints: number[] = [];
  const defPoints: number[] = [];
  const midPoints: number[] = [];
  const fwdPoints: number[] = [];

  for (const pick of picks) {
    const points = pick.points ?? 0;
    const elementType = elementTypeById.get(pick.element);

    if (elementType === 1) gkPoints.push(points);
    if (elementType === 2) defPoints.push(points);
    if (elementType === 3) midPoints.push(points);
    if (elementType === 4) fwdPoints.push(points);
  }

  gkPoints.sort((a, b) => b - a);
  defPoints.sort((a, b) => b - a);
  midPoints.sort((a, b) => b - a);
  fwdPoints.sort((a, b) => b - a);

  if (gkPoints.length === 0) {
    return null;
  }

  let best: number | null = null;

  for (let defCount = 3; defCount <= 5; defCount += 1) {
    for (let midCount = 2; midCount <= 5; midCount += 1) {
      for (let fwdCount = 1; fwdCount <= 3; fwdCount += 1) {
        if (defCount + midCount + fwdCount !== STARTER_COUNT - 1) {
          continue;
        }

        if (
          defPoints.length < defCount ||
          midPoints.length < midCount ||
          fwdPoints.length < fwdCount
        ) {
          continue;
        }

        const total =
          gkPoints[0] +
          sum(defPoints.slice(0, defCount)) +
          sum(midPoints.slice(0, midCount)) +
          sum(fwdPoints.slice(0, fwdCount));

        if (best === null || total > best) {
          best = total;
        }
      }
    }
  }

  return best;
}

function toPercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function jaccardSimilarity(a: Set<number>, b: Set<number>): number | null {
  if (a.size === 0 && b.size === 0) return null;

  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  if (union === 0) return null;
  return intersection / union;
}

function groupTransfersByEvent(transfers: ManagerTransfer[]): Map<number, ManagerTransfer[]> {
  const grouped = new Map<number, ManagerTransfer[]>();

  for (const transfer of transfers) {
    const rows = grouped.get(transfer.event) ?? [];
    rows.push(transfer);
    grouped.set(transfer.event, rows);
  }

  return grouped;
}

function averageFromLookback(
  sortedEvents: number[],
  eventPoints: Map<number, number>,
  targetEvent: number,
  lookbackSize: number
): number | null {
  const priorEvents = sortedEvents.filter((event) => event < targetEvent);
  const lookbackEvents = priorEvents.slice(Math.max(0, priorEvents.length - lookbackSize));
  const values = lookbackEvents
    .map((event) => eventPoints.get(event))
    .filter((value): value is number => value !== undefined);

  return average(values);
}

export interface ChipRoiByType {
  wildcard: number;
  "3xc": number;
  bboost: number;
  freehit: number;
}

export interface PositionContribution {
  gk: number;
  def: number;
  mid: number;
  fwd: number;
  captainBonus: number;
  total: number;
}

export interface ChipRoiEventInsight {
  entry: number;
  teamName: string;
  managerName: string;
  chip: string;
  event: number;
  estimatedGain: number;
  versusLeagueMean: number | null;
  baseline: number | null;
  windowSize: number;
}

export interface ManagerLeagueInsight {
  entry: number;
  teamName: string;
  managerName: string;
  leagueRank: number;

  allPlayPoints: number;
  allPlayPossiblePoints: number;
  allPlayWins: number;
  allPlayDraws: number;
  allPlayLosses: number;
  allPlayWinRatePct: number | null;
  allPlayPointRatePct: number | null;

  captaincyEfficiencyPct: number | null;
  captaincyActualPoints: number;
  captaincyOptimalPoints: number;
  captaincyMissedPoints: number;

  benchOptimizationLoss: number;

  transferRoi: number | null;
  transferInPoints: number;
  transferHitCost: number;
  transferCount: number;

  chipRoiTotal: number;
  chipRoiByType: ChipRoiByType;

  consistencyStdDev: number | null;
  consistencyIndex: number | null;
  topThreeGameweeks: number;
  bottomThreeGameweeks: number;

  templateSimilarityPct: number | null;
  differentialPoints: number;
  differentialPointsPct: number | null;

  positionContribution: PositionContribution;
}

export interface LeagueInsightsResult {
  managers: ManagerLeagueInsight[];
  chipEvents: ChipRoiEventInsight[];
}

export function computeLeagueInsights(
  managers: ProcessedManager[],
  bootstrap: BootstrapData | null,
  currentGameweek: number
): LeagueInsightsResult {
  const elementTypeById = new Map<number, number>();
  if (bootstrap) {
    for (const element of bootstrap.elements) {
      elementTypeById.set(element.id, element.element_type);
    }
  }

  const historyByManager = new Map(
    managers.map((manager) => [
      manager.entry,
      new Map(manager.history.map((gw) => [gw.event, gw])),
    ])
  );

  const analysisEvents = (() => {
    if (bootstrap) {
      const finished = bootstrap.events
        .filter((event) => event.finished)
        .map((event) => event.id)
        .sort((a, b) => a - b);
      if (finished.length > 0) return finished;
    }

    const historyEvents = new Set<number>();
    for (const manager of managers) {
      for (const gw of manager.history) {
        if (gw.event <= currentGameweek) {
          historyEvents.add(gw.event);
        }
      }
    }
    return Array.from(historyEvents).sort((a, b) => a - b);
  })();

  const analysisEventSet = new Set(analysisEvents);

  const insightsByEntry = new Map<number, ManagerLeagueInsight>();
  const gwPointsForConsistency = new Map<number, number[]>();
  const captainActualByEntry = new Map<number, number>();
  const captainOptimalByEntry = new Map<number, number>();
  const templateScoresByEntry = new Map<number, number[]>();

  for (const manager of managers) {
    insightsByEntry.set(manager.entry, {
      entry: manager.entry,
      teamName: manager.entry_name,
      managerName: manager.player_name,
      leagueRank: manager.rank,

      allPlayPoints: 0,
      allPlayPossiblePoints: 0,
      allPlayWins: 0,
      allPlayDraws: 0,
      allPlayLosses: 0,
      allPlayWinRatePct: null,
      allPlayPointRatePct: null,

      captaincyEfficiencyPct: null,
      captaincyActualPoints: 0,
      captaincyOptimalPoints: 0,
      captaincyMissedPoints: 0,

      benchOptimizationLoss: 0,

      transferRoi: null,
      transferInPoints: 0,
      transferHitCost: 0,
      transferCount: 0,

      chipRoiTotal: 0,
      chipRoiByType: {
        wildcard: 0,
        "3xc": 0,
        bboost: 0,
        freehit: 0,
      },

      consistencyStdDev: null,
      consistencyIndex: null,
      topThreeGameweeks: 0,
      bottomThreeGameweeks: 0,

      templateSimilarityPct: null,
      differentialPoints: 0,
      differentialPointsPct: null,

      positionContribution: {
        gk: 0,
        def: 0,
        mid: 0,
        fwd: 0,
        captainBonus: 0,
        total: 0,
      },
    });

    gwPointsForConsistency.set(manager.entry, []);
    captainActualByEntry.set(manager.entry, 0);
    captainOptimalByEntry.set(manager.entry, 0);
    templateScoresByEntry.set(manager.entry, []);
  }

  const ownershipByEvent = new Map<number, Map<number, number>>();
  const participantsByEventWithPicks = new Map<number, number>();
  const leagueMeanByEvent = new Map<number, number>();
  const templateSetByEvent = new Map<number, Set<number>>();

  for (const event of analysisEvents) {
    const eventPointsRows: { entry: number; points: number }[] = [];
    const eventOwnership = new Map<number, number>();
    let picksParticipants = 0;

    for (const manager of managers) {
      const history = historyByManager.get(manager.entry)?.get(event);
      const picks = manager.picks_by_event?.[event];
      const derivedPoints = deriveGameweekPointsFromPicks(picks);
      const points = history?.points ?? derivedPoints;

      if (points !== null && points !== undefined) {
        eventPointsRows.push({ entry: manager.entry, points });
      }

      if (picks && picks.length > 0) {
        picksParticipants += 1;
        const uniqueElements = new Set<number>();

        for (const pick of picks) {
          if (uniqueElements.has(pick.element)) continue;
          uniqueElements.add(pick.element);
          const currentOwnership = eventOwnership.get(pick.element) ?? 0;
          eventOwnership.set(pick.element, currentOwnership + 1);
        }
      }
    }

    if (eventPointsRows.length > 0) {
      leagueMeanByEvent.set(
        event,
        eventPointsRows.reduce((total, row) => total + row.points, 0) /
          eventPointsRows.length
      );

      eventPointsRows.sort((a, b) => b.points - a.points);

      for (let index = 0; index < eventPointsRows.length; index += 1) {
        const row = eventPointsRows[index];
        const insight = insightsByEntry.get(row.entry);
        if (!insight) continue;

        if (index < 3) {
          insight.topThreeGameweeks += 1;
        }

        if (index >= Math.max(0, eventPointsRows.length - 3)) {
          insight.bottomThreeGameweeks += 1;
        }
      }

      for (let i = 0; i < eventPointsRows.length; i += 1) {
        for (let j = i + 1; j < eventPointsRows.length; j += 1) {
          const left = eventPointsRows[i];
          const right = eventPointsRows[j];
          const leftInsight = insightsByEntry.get(left.entry);
          const rightInsight = insightsByEntry.get(right.entry);

          if (!leftInsight || !rightInsight) continue;

          leftInsight.allPlayPossiblePoints += 3;
          rightInsight.allPlayPossiblePoints += 3;

          if (left.points > right.points) {
            leftInsight.allPlayPoints += 3;
            leftInsight.allPlayWins += 1;
            rightInsight.allPlayLosses += 1;
          } else if (left.points < right.points) {
            rightInsight.allPlayPoints += 3;
            rightInsight.allPlayWins += 1;
            leftInsight.allPlayLosses += 1;
          } else {
            leftInsight.allPlayPoints += 1;
            rightInsight.allPlayPoints += 1;
            leftInsight.allPlayDraws += 1;
            rightInsight.allPlayDraws += 1;
          }
        }
      }
    }

    if (eventOwnership.size > 0) {
      ownershipByEvent.set(event, eventOwnership);
      participantsByEventWithPicks.set(event, picksParticipants);

      const templateElements = Array.from(eventOwnership.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return a[0] - b[0];
        })
        .slice(0, TEMPLATE_SQUAD_SIZE)
        .map(([elementId]) => elementId);

      templateSetByEvent.set(event, new Set(templateElements));
    }
  }

  const chipEvents: ChipRoiEventInsight[] = [];

  for (const manager of managers) {
    const insight = insightsByEntry.get(manager.entry);
    if (!insight) continue;

    const historyMap = historyByManager.get(manager.entry) ?? new Map();
    const managerPointsByEvent = new Map<number, number>();

    for (const event of analysisEvents) {
      const history = historyMap.get(event);
      const picks = manager.picks_by_event?.[event];
      const derivedPoints = deriveGameweekPointsFromPicks(picks);
      const points = history?.points ?? derivedPoints;

      if (points !== null && points !== undefined) {
        managerPointsByEvent.set(event, points);
        gwPointsForConsistency.get(manager.entry)?.push(points);
      }

      if (picks && picks.length > 0) {
        const captainPick = picks.find((pick) => pick.is_captain);
        if (captainPick && captainPick.points !== null) {
          const multiplier = Math.max(1, captainPick.multiplier);
          const bestRawPoints = picks.reduce(
            (best, pick) => Math.max(best, pick.points ?? 0),
            0
          );
          const actualCaptainPoints = captainPick.points * multiplier;
          const optimalCaptainPoints = bestRawPoints * multiplier;

          captainActualByEntry.set(
            manager.entry,
            (captainActualByEntry.get(manager.entry) ?? 0) + actualCaptainPoints
          );
          captainOptimalByEntry.set(
            manager.entry,
            (captainOptimalByEntry.get(manager.entry) ?? 0) + optimalCaptainPoints
          );
        }

        const actualStarterBasePoints = picks
          .filter((pick) => pick.position <= STARTER_COUNT)
          .reduce((total, pick) => total + (pick.points ?? 0), 0);

        const optimalStarterBasePoints = getOptimalStarterBasePoints(
          picks,
          elementTypeById
        );

        if (optimalStarterBasePoints !== null) {
          insight.benchOptimizationLoss += Math.max(
            0,
            optimalStarterBasePoints - actualStarterBasePoints
          );
        }

        const templateSet = templateSetByEvent.get(event);
        if (templateSet) {
          const managerSet = new Set(picks.map((pick) => pick.element));
          const score = jaccardSimilarity(managerSet, templateSet);
          if (score !== null) {
            templateScoresByEntry.get(manager.entry)?.push(score);
          }
        }

        const ownershipForEvent = ownershipByEvent.get(event);
        const participants = participantsByEventWithPicks.get(event) ?? managers.length;
        const lowOwnershipThreshold = Math.max(2, Math.floor(participants * 0.2));

        if (ownershipForEvent) {
          for (const pick of picks) {
            if (pick.multiplier <= 0) continue;

            const weightedPoints = (pick.points ?? 0) * pick.multiplier;
            insight.positionContribution.total += weightedPoints;

            const elementType = elementTypeById.get(pick.element);
            if (elementType === 1) insight.positionContribution.gk += weightedPoints;
            if (elementType === 2) insight.positionContribution.def += weightedPoints;
            if (elementType === 3) insight.positionContribution.mid += weightedPoints;
            if (elementType === 4) insight.positionContribution.fwd += weightedPoints;

            if (pick.is_captain && pick.points !== null) {
              insight.positionContribution.captainBonus +=
                Math.max(0, pick.multiplier - 1) * pick.points;
            }

            const ownership = ownershipForEvent.get(pick.element) ?? 0;
            if (ownership > 0 && ownership <= lowOwnershipThreshold) {
              insight.differentialPoints += weightedPoints;
            }
          }
        }
      }
    }

    const transfers = manager.transfers ?? [];
    if (transfers.length > 0) {
      const transfersByEvent = groupTransfersByEvent(transfers);
      insight.transferRoi = 0;

      for (const [event, transferRows] of transfersByEvent) {
        const picks = manager.picks_by_event?.[event];
        const inPoints = transferRows.reduce(
          (total, transfer) => total + getPickPoints(picks, transfer.element_in),
          0
        );
        const hitCost = historyMap.get(event)?.event_transfers_cost ?? 0;
        const net = inPoints - hitCost;

        insight.transferInPoints += inPoints;
        insight.transferHitCost += hitCost;
        insight.transferCount += transferRows.length;
        insight.transferRoi += net;
      }
    }

    for (const chip of manager.chips) {
      if (!analysisEventSet.has(chip.event)) continue;

      const picks = manager.picks_by_event?.[chip.event];
      const eventPoints = managerPointsByEvent.get(chip.event) ?? null;
      const baseline = averageFromLookback(
        analysisEvents,
        managerPointsByEvent,
        chip.event,
        3
      );
      const leagueMean = leagueMeanByEvent.get(chip.event) ?? null;
      let estimatedGain = 0;
      let versusLeagueMean: number | null = null;
      let windowSize = 1;

      if (chip.name === "3xc") {
        const captain = picks?.find((pick) => pick.is_captain);
        estimatedGain = captain?.points ?? 0;
        if (eventPoints !== null && leagueMean !== null) {
          versusLeagueMean = eventPoints - leagueMean;
        }
      }

      if (chip.name === "bboost") {
        estimatedGain =
          picks
            ?.filter((pick) => pick.position > STARTER_COUNT && pick.multiplier === 0)
            .reduce((total, pick) => total + (pick.points ?? 0), 0) ?? 0;
        if (eventPoints !== null && leagueMean !== null) {
          versusLeagueMean = eventPoints - leagueMean;
        }
      }

      if (chip.name === "freehit") {
        if (baseline !== null && eventPoints !== null) {
          estimatedGain = eventPoints - baseline;
        }
        if (eventPoints !== null && leagueMean !== null) {
          versusLeagueMean = eventPoints - leagueMean;
        }
      }

      if (chip.name === "wildcard") {
        const windowEvents = analysisEvents.filter(
          (event) => event >= chip.event && event <= chip.event + 2
        );
        const pointsInWindow = windowEvents
          .map((event) => managerPointsByEvent.get(event))
          .filter((value): value is number => value !== undefined);

        windowSize = pointsInWindow.length;
        const actualWindowTotal = sum(pointsInWindow);

        if (baseline !== null && windowSize > 0) {
          estimatedGain = actualWindowTotal - baseline * windowSize;
        }

        if (windowSize > 0) {
          versusLeagueMean = windowEvents.reduce((total, event) => {
            const managerPoints = managerPointsByEvent.get(event);
            const mean = leagueMeanByEvent.get(event);
            if (managerPoints === undefined || mean === undefined) {
              return total;
            }
            return total + (managerPoints - mean);
          }, 0);
        }
      }

      insight.chipRoiTotal += estimatedGain;
      if (isKnownChipName(chip.name)) {
        insight.chipRoiByType[chip.name] += estimatedGain;
      }

      chipEvents.push({
        entry: manager.entry,
        teamName: manager.entry_name,
        managerName: manager.player_name,
        chip: chip.name,
        event: chip.event,
        estimatedGain,
        versusLeagueMean,
        baseline,
        windowSize,
      });
    }
  }

  let maxStdDev = 0;
  for (const manager of managers) {
    const insight = insightsByEntry.get(manager.entry);
    if (!insight) continue;

    const allPlayMatches =
      insight.allPlayWins + insight.allPlayDraws + insight.allPlayLosses;
    insight.allPlayWinRatePct = toPercent(
      insight.allPlayWins + insight.allPlayDraws * 0.5,
      allPlayMatches
    );
    insight.allPlayPointRatePct = toPercent(
      insight.allPlayPoints,
      insight.allPlayPossiblePoints
    );

    const captainActual = captainActualByEntry.get(manager.entry) ?? 0;
    const captainOptimal = captainOptimalByEntry.get(manager.entry) ?? 0;
    insight.captaincyActualPoints = captainActual;
    insight.captaincyOptimalPoints = captainOptimal;
    insight.captaincyMissedPoints = Math.max(0, captainOptimal - captainActual);
    insight.captaincyEfficiencyPct = toPercent(captainActual, captainOptimal);

    const templateScores = templateScoresByEntry.get(manager.entry) ?? [];
    const templateAverage = average(templateScores);
    insight.templateSimilarityPct =
      templateAverage === null ? null : templateAverage * 100;

    insight.differentialPointsPct = toPercent(
      insight.differentialPoints,
      insight.positionContribution.total
    );

    const pointsForStd = gwPointsForConsistency.get(manager.entry) ?? [];
    insight.consistencyStdDev = standardDeviation(pointsForStd);

    if (
      insight.consistencyStdDev !== null &&
      insight.consistencyStdDev > maxStdDev
    ) {
      maxStdDev = insight.consistencyStdDev;
    }
  }

  for (const manager of managers) {
    const insight = insightsByEntry.get(manager.entry);
    if (!insight) continue;

    if (insight.consistencyStdDev === null) {
      insight.consistencyIndex = null;
      continue;
    }

    if (maxStdDev <= 0) {
      insight.consistencyIndex = 100;
      continue;
    }

    insight.consistencyIndex =
      (1 - insight.consistencyStdDev / maxStdDev) * 100;
  }

  const managerInsights = managers
    .map((manager) => insightsByEntry.get(manager.entry))
    .filter((insight): insight is ManagerLeagueInsight => insight !== undefined)
    .sort((a, b) => a.leagueRank - b.leagueRank);

  chipEvents.sort((a, b) => b.estimatedGain - a.estimatedGain);

  return {
    managers: managerInsights,
    chipEvents,
  };
}
