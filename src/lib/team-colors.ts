export interface TeamColor {
  bg: string;
  text: string;
}

const TEAM_COLOR_MAP: Record<string, TeamColor> = {
  ARS: { bg: "#EF0107", text: "#ffffff" },
  AVL: { bg: "#95BFE5", text: "#111827" },
  BOU: { bg: "#DA291C", text: "#ffffff" },
  BRE: { bg: "#E30613", text: "#ffffff" },
  BHA: { bg: "#0057B8", text: "#ffffff" },
  BUR: { bg: "#6C1D45", text: "#ffffff" },
  CHE: { bg: "#034694", text: "#ffffff" },
  CRY: { bg: "#1B458F", text: "#ffffff" },
  EVE: { bg: "#003399", text: "#ffffff" },
  FUL: { bg: "#111111", text: "#ffffff" },
  LEE: { bg: "#FFCD00", text: "#111827" },
  LIV: { bg: "#C8102E", text: "#ffffff" },
  MCI: { bg: "#6CABDD", text: "#111827" },
  MUN: { bg: "#DA291C", text: "#ffffff" },
  NEW: { bg: "#241F20", text: "#ffffff" },
  NFO: { bg: "#DD0000", text: "#ffffff" },
  SUN: { bg: "#EB172B", text: "#ffffff" },
  TOT: { bg: "#132257", text: "#ffffff" },
  WHU: { bg: "#7A263A", text: "#ffffff" },
  WOL: { bg: "#FDB913", text: "#111827" },
};

const FALLBACK_COLORS: TeamColor[] = [
  { bg: "#4d96ff", text: "#ffffff" },
  { bg: "#963cff", text: "#ffffff" },
  { bg: "#ff6b35", text: "#ffffff" },
  { bg: "#2d6a4f", text: "#ffffff" },
  { bg: "#4361ee", text: "#ffffff" },
  { bg: "#c44569", text: "#ffffff" },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTeamColor(teamShortName?: string | null): TeamColor {
  if (!teamShortName) {
    return { bg: "#4b5563", text: "#ffffff" };
  }

  const normalized = teamShortName.toUpperCase();
  const exact = TEAM_COLOR_MAP[normalized];
  if (exact) return exact;

  const fallback = FALLBACK_COLORS[hashString(normalized) % FALLBACK_COLORS.length];
  return fallback;
}
