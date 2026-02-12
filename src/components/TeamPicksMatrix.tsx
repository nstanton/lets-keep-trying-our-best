import type {
  BootstrapElement,
  BootstrapTeam,
  GameweekHistory,
  ManagerPick,
  ManagerPicksByEvent,
} from "@/lib/types";
import { getTeamColor } from "@/lib/team-colors";

interface TeamPicksMatrixProps {
  history: GameweekHistory[];
  picksByEvent?: ManagerPicksByEvent;
  elements: BootstrapElement[];
  teams: BootstrapTeam[];
}

interface EnrichedPick {
  pick: ManagerPick;
  player: BootstrapElement | null;
  team: BootstrapTeam | null;
}

const POSITION_GROUPS = [
  { elementType: 1, label: "GK", slots: 2 },
  { elementType: 2, label: "DEF", slots: 5 },
  { elementType: 3, label: "MID", slots: 5 },
  { elementType: 4, label: "FWD", slots: 3 },
] as const;

function buildEventSlots(
  picks: ManagerPick[] | undefined,
  elementById: Record<number, BootstrapElement>,
  teamById: Record<number, BootstrapTeam>
): (EnrichedPick | null)[] {
  const grouped: Record<number, EnrichedPick[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  for (const pick of picks ?? []) {
    const player = elementById[pick.element] ?? null;
    const team = player ? (teamById[player.team] ?? null) : null;
    const elementType = player?.element_type;

    if (!elementType || !grouped[elementType]) continue;
    grouped[elementType].push({ pick, player, team });
  }

  for (const key of Object.keys(grouped)) {
    const elementType = Number(key);
    grouped[elementType].sort((a, b) => a.pick.position - b.pick.position);
  }

  const slots: (EnrichedPick | null)[] = [];
  for (const group of POSITION_GROUPS) {
    const groupPicks = grouped[group.elementType].slice(0, group.slots);
    const padded = Array.from({ length: group.slots }, (_, index) => {
      return groupPicks[index] ?? null;
    });
    slots.push(...padded);
  }

  return slots;
}

function getCellDetails(enrichedPick: EnrichedPick | null) {
  if (!enrichedPick) {
    return null;
  }

  const { pick, player, team } = enrichedPick;
  const fullName =
    player?.first_name && player?.second_name
      ? `${player.first_name} ${player.second_name}`
      : player?.web_name ?? "Unknown Player";
  const role = pick.position <= 11 ? "Starter" : "Bench";

  return {
    fullName,
    teamName: team?.name ?? "Unknown Team",
    points: pick.points ?? "—",
    role,
    multiplier: pick.multiplier,
    isCaptain: pick.is_captain,
    isViceCaptain: pick.is_vice_captain,
  };
}

export default function TeamPicksMatrix({
  history,
  picksByEvent,
  elements,
  teams,
}: TeamPicksMatrixProps) {
  const elementById = Object.fromEntries(elements.map((element) => [element.id, element]));
  const teamById = Object.fromEntries(teams.map((team) => [team.id, team]));

  const hasPicksData =
    !!picksByEvent && Object.values(picksByEvent).some((eventPicks) => eventPicks.length > 0);

  if (history.length === 0) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center text-gray-400 border border-white/10">
        No gameweek data available yet.
      </div>
    );
  }

  if (!hasPicksData) {
    return (
      <div className="bg-fpl-purple/30 rounded-xl p-8 text-center border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">No picks data available</h3>
        <p className="text-gray-400 text-sm">
          Run <code className="text-fpl-green">npm run fetch-data</code> to populate picks per
          gameweek.
        </p>
      </div>
    );
  }

  const rows = history.map((gw) => {
    const slots = buildEventSlots(picksByEvent?.[gw.event], elementById, teamById);
    return { event: gw.event, slots, points: gw.points, total_points: gw.total_points };
  });

  const legendTeams = Array.from(
    new Set(
      rows
        .flatMap((row) => row.slots)
        .flatMap((slot) => (slot?.team?.short_name ? [slot.team.short_name] : []))
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="bg-fpl-purple/30 rounded-xl p-4 border border-white/10">
      <div className="relative overflow-visible rounded-lg border border-white/10">
        <div className="overflow-x-auto">
        <table className="min-w-[1480px] w-full border-collapse">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 top-0 z-40 px-3 py-2 bg-fpl-dark-purple text-xs font-semibold tracking-wide text-gray-300 border-r border-white/10"
              >
                GW
              </th>
              {POSITION_GROUPS.map((group) => (
                <th
                  key={group.label}
                  colSpan={group.slots}
                  className="sticky top-0 z-30 px-3 py-2 bg-fpl-dark-purple text-xs font-semibold tracking-wide text-gray-300 border-r border-white/10"
                >
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {POSITION_GROUPS.flatMap((group) =>
                Array.from({ length: group.slots }, (_, index) => (
                  <th
                    key={`${group.label}-${index + 1}`}
                    className="sticky top-0 z-30 px-2 py-2 bg-fpl-purple text-[11px] font-medium text-gray-400 border-r border-white/10"
                  >
                    {group.label}
                    {index + 1}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.event} className="border-t border-white/10">
                <td className="sticky left-0 z-20 px-3 py-2 bg-fpl-dark-purple text-sm font-semibold text-white border-r border-white/10">
                  <div>{row.event}</div>
                  <div className="text-xs font-normal text-fpl-green mt-0.5">{row.points} pts</div>
                </td>
                {row.slots.map((slot, slotIndex) => {
                  const teamShortName = slot?.team?.short_name ?? null;
                  const colors = slot ? getTeamColor(teamShortName) : { bg: "#374151", text: "#d1d5db" };
                  const details = getCellDetails(slot);
                  const isBench = !!slot && slot.pick.position > 11;
                  const cellStyle = isBench
                    ? {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        boxShadow:
                          "inset 0 0 0 2px rgba(55, 0, 60, 0.92), inset 0 0 0 999px rgba(55, 0, 60, 0.28)",
                      }
                    : { backgroundColor: colors.bg, color: colors.text };
                  const tooltipPositionClass =
                    rowIndex < 2
                      ? "top-[calc(100%+6px)]"
                      : "bottom-[calc(100%+6px)]";
                  return (
                    <td key={`${row.event}-${slotIndex}`} className="border-r border-white/10 p-0">
                      <div
                        className="group relative h-16 px-2 py-1 flex flex-col justify-center"
                        style={cellStyle}
                      >
                        {isBench && (
                          <span className="absolute right-1 top-1 rounded border border-white/20 bg-fpl-purple/90 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-200">
                            Bench
                          </span>
                        )}
                        <span className="text-xs font-semibold leading-tight truncate">
                          {slot?.player?.web_name ?? "Unknown"}
                        </span>
                        <span className="text-[10px] opacity-90 leading-tight truncate">
                          {slot?.team?.short_name ?? "—"}
                        </span>
                        {details && details.points !== "—" && (
                          <span className="text-[10px] font-semibold text-fpl-green mt-0.5" title="GW points">
                            {details.points} pts
                          </span>
                        )}
                        {details && (
                          <div
                            className={`pointer-events-none absolute left-1/2 z-[70] w-56 -translate-x-1/2 rounded-md border border-white/20 bg-fpl-dark-purple/95 p-2 text-xs text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${tooltipPositionClass}`}
                          >
                            <div className="font-semibold text-fpl-green">{details.fullName}</div>
                            <div className="text-gray-300 mt-1">{details.teamName}</div>
                            <div className="mt-2 space-y-0.5 text-gray-200">
                              <div>GW Points: {details.points}</div>
                              <div>Role: {details.role}</div>
                              <div>Multiplier: {details.multiplier}</div>
                              <div>Captain: {details.isCaptain ? "Yes" : "No"}</div>
                              <div>Vice: {details.isViceCaptain ? "Yes" : "No"}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {legendTeams.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">
            Bench picks are marked with a subtle purple outline and a muted <span className="text-fpl-light-purple font-semibold">Bench</span> label.
          </p>
          <p className="text-xs text-gray-400 mb-2">Teams in this view</p>
          <div className="flex flex-wrap gap-2">
            {legendTeams.map((teamShortName) => {
              const colors = getTeamColor(teamShortName);
              return (
                <span
                  key={teamShortName}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium border border-white/10"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-white/80" />
                  {teamShortName}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
