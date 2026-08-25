import type { BootstrapElement, FixtureData, ManagerPick } from "./types";

const MINIMUM_OUTFIELD_BY_TYPE: Record<number, number> = {
  2: 3,
  3: 2,
  4: 1,
};

interface Candidate {
  pick: ManagerPick;
  elementType: number;
}

function isFixtureComplete(fixture: FixtureData): boolean {
  return fixture.finished || fixture.finished_provisional;
}

function hasCompletedAllFixtures(
  teamId: number,
  fixtures: FixtureData[],
  event: number
): boolean {
  const teamFixtures = fixtures.filter(
    (fixture) =>
      fixture.event === event &&
      (fixture.team_a === teamId || fixture.team_h === teamId)
  );
  return teamFixtures.length > 0 && teamFixtures.every(isFixtureComplete);
}

function isLegalFormation(counts: Map<number, number>): boolean {
  return Object.entries(MINIMUM_OUTFIELD_BY_TYPE).every(
    ([type, minimum]) => (counts.get(Number(type)) ?? 0) >= minimum
  );
}

function chooseBenchPlayers(
  candidates: Candidate[],
  maximum: number,
  starterCounts: Map<number, number>
): Candidate[] {
  let best: Candidate[] = [];

  const visit = (index: number, selected: Candidate[]) => {
    if (selected.length > maximum) return;
    if (index === candidates.length) {
      const counts = new Map(starterCounts);
      for (const candidate of selected) {
        counts.set(candidate.elementType, (counts.get(candidate.elementType) ?? 0) + 1);
      }
      if (!isLegalFormation(counts)) return;

      if (selected.length > best.length) {
        best = selected;
      }
      return;
    }

    // Visit inclusion first so ties preserve FPL bench priority.
    visit(index + 1, [...selected, candidates[index]]);
    visit(index + 1, selected);
  };

  visit(0, []);
  return best;
}

/**
 * Returns only points from substitutions that are already inevitable: a starting
 * player has not appeared and their team has completed every fixture in the GW.
 */
export function getGuaranteedAutoSubPoints(
  picks: ManagerPick[] | undefined,
  elements: BootstrapElement[],
  fixtures: FixtureData[] | undefined,
  event: number
): number {
  if (!picks || !fixtures || fixtures.length === 0) return 0;

  const elementById = new Map(elements.map((element) => [element.id, element]));
  const starters = picks.filter((pick) => pick.position <= 11 && pick.multiplier > 0);
  const bench = picks
    .filter((pick) => pick.position > 11 && pick.multiplier === 0 && (pick.minutes ?? 0) > 0)
    .sort((a, b) => a.position - b.position);

  const absentStarters = starters.filter((pick) => {
    const element = elementById.get(pick.element);
    return (
      pick.minutes === 0 &&
      element !== undefined &&
      hasCompletedAllFixtures(element.team, fixtures, event)
    );
  });

  if (absentStarters.length === 0) return 0;

  const typeForPick = (pick: ManagerPick) => elementById.get(pick.element)?.element_type;
  const missingGoalkeepers = absentStarters.filter((pick) => typeForPick(pick) === 1).length;
  const missingOutfield = absentStarters.filter((pick) => typeForPick(pick) !== 1).length;

  const selected: Candidate[] = [];
  if (missingGoalkeepers > 0) {
    const goalkeeper = bench.find((pick) => typeForPick(pick) === 1);
    if (goalkeeper) selected.push({ pick: goalkeeper, elementType: 1 });
  }

  if (missingOutfield > 0) {
    const starterCounts = new Map<number, number>();
    for (const starter of starters) {
      const type = typeForPick(starter);
      if (type !== undefined && type !== 1 && !absentStarters.includes(starter)) {
        starterCounts.set(type, (starterCounts.get(type) ?? 0) + 1);
      }
    }
    const candidates = bench
      .map((pick) => ({ pick, elementType: typeForPick(pick) }))
      .filter((candidate): candidate is Candidate => candidate.elementType !== undefined && candidate.elementType !== 1);
    selected.push(...chooseBenchPlayers(candidates, missingOutfield, starterCounts));
  }

  return selected.reduce((total, candidate) => total + (candidate.pick.points ?? 0), 0);
}
