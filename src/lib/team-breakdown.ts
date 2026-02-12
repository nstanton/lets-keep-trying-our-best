import type {
  BootstrapElement,
  BootstrapTeam,
  ManagerPick,
  ManagerPicksByEvent,
} from "@/lib/types";

export interface TeamBreakdownRow {
  elementId: number;
  playerName: string;
  teamShortName: string;
  earnedPointsIgnoreCaptaincy: number;
  totalPlayerPoints: number;
  totalPointsEarned: number;
  totalWeeksOwned: number;
  totalWeeksPlayed: number;
  totalTimesCaptained: number;
  captainBonusPoints: number;
  starterPointsTotal: number;
  starterPointsCount: number;
}

export interface OtherManagerPlayerBreakdownRow {
  managerId: number;
  managerEntryName: string;
  managerPlayerName: string;
  row: TeamBreakdownRow;
}

function isStarter(pick: ManagerPick): boolean {
  return pick.position <= 11;
}

export function getAvgPointsWhenNotBenched(row: TeamBreakdownRow): number | null {
  if (row.starterPointsCount === 0) return null;
  return row.starterPointsTotal / row.starterPointsCount;
}

export function buildManagerTeamBreakdownRows(
  picksByEvent: ManagerPicksByEvent | undefined,
  elements: BootstrapElement[],
  teams: BootstrapTeam[]
): TeamBreakdownRow[] {
  if (!picksByEvent) return [];

  const elementById = Object.fromEntries(elements.map((element) => [element.id, element]));
  const teamById = Object.fromEntries(teams.map((team) => [team.id, team]));
  const breakdownByElement = new Map<number, TeamBreakdownRow>();

  for (const picks of Object.values(picksByEvent)) {
    for (const pick of picks) {
      const player = elementById[pick.element];
      const team = player ? teamById[player.team] : undefined;

      if (!breakdownByElement.has(pick.element)) {
        breakdownByElement.set(pick.element, {
          elementId: pick.element,
          playerName: player?.web_name ?? `Player #${pick.element}`,
          teamShortName: team?.short_name ?? "—",
          earnedPointsIgnoreCaptaincy: 0,
          totalPlayerPoints: player?.total_points ?? 0,
          totalPointsEarned: 0,
          totalWeeksOwned: 0,
          totalWeeksPlayed: 0,
          totalTimesCaptained: 0,
          captainBonusPoints: 0,
          starterPointsTotal: 0,
          starterPointsCount: 0,
        });
      }

      const row = breakdownByElement.get(pick.element);
      if (!row) continue;

      row.totalWeeksOwned += 1;

      if (isStarter(pick)) {
        row.totalWeeksPlayed += 1;
        if (pick.points !== null) {
          row.earnedPointsIgnoreCaptaincy += pick.points;
          row.totalPointsEarned += pick.points;
          row.starterPointsTotal += pick.points;
          row.starterPointsCount += 1;
        }
      }

      if (pick.is_captain) {
        row.totalTimesCaptained += 1;
        if (pick.points !== null && isStarter(pick)) {
          const captainBonus = Math.max(0, pick.multiplier - 1) * pick.points;
          row.captainBonusPoints += captainBonus;
          row.totalPointsEarned += captainBonus;
        }
      }
    }
  }

  return Array.from(breakdownByElement.values()).sort((a, b) => {
    if (b.totalPointsEarned !== a.totalPointsEarned) {
      return b.totalPointsEarned - a.totalPointsEarned;
    }
    if (b.totalWeeksOwned !== a.totalWeeksOwned) {
      return b.totalWeeksOwned - a.totalWeeksOwned;
    }
    return a.playerName.localeCompare(b.playerName);
  });
}

export function buildOtherManagerRowsForManager(
  managerRows: Array<{ managerId: number; rows: TeamBreakdownRow[] }>,
  currentManagerId: number,
  managerMetaById: Record<number, { entryName: string; playerName: string }>
): Record<number, OtherManagerPlayerBreakdownRow[]> {
  const playerRowsMap = new Map<number, Array<{ managerId: number; row: TeamBreakdownRow }>>();
  const currentRows = managerRows.find((item) => item.managerId === currentManagerId)?.rows ?? [];

  for (const manager of managerRows) {
    for (const row of manager.rows) {
      const list = playerRowsMap.get(row.elementId) ?? [];
      list.push({ managerId: manager.managerId, row });
      playerRowsMap.set(row.elementId, list);
    }
  }

  const otherManagersByElement: Record<number, OtherManagerPlayerBreakdownRow[]> = {};

  for (const row of currentRows) {
    const otherRows = (playerRowsMap.get(row.elementId) ?? [])
      .filter((peer) => peer.managerId !== currentManagerId)
      .map((peer) => {
        const managerMeta = managerMetaById[peer.managerId];
        return {
          managerId: peer.managerId,
          managerEntryName: managerMeta?.entryName ?? `Manager ${peer.managerId}`,
          managerPlayerName: managerMeta?.playerName ?? "",
          row: peer.row,
        };
      })
      .sort((a, b) => {
        if (b.row.totalPointsEarned !== a.row.totalPointsEarned) {
          return b.row.totalPointsEarned - a.row.totalPointsEarned;
        }
        if (b.row.totalWeeksOwned !== a.row.totalWeeksOwned) {
          return b.row.totalWeeksOwned - a.row.totalWeeksOwned;
        }
        return a.managerEntryName.localeCompare(b.managerEntryName);
      });

    otherManagersByElement[row.elementId] = otherRows;
  }

  return otherManagersByElement;
}
