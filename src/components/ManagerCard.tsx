import Link from "next/link";

interface ManagerCardProps {
  entry: number;
  playerName: string;
  entryName: string;
  rank: number;
  lastRank: number;
  total: number;
  eventTotal: number;
}

export default function ManagerCard({
  entry,
  playerName,
  entryName,
  rank,
  lastRank,
  total,
  eventTotal,
}: ManagerCardProps) {
  const movement = lastRank === 0 ? 0 : lastRank - rank;

  return (
    <Link href={`/manager/${entry}`}>
      <div className="bg-fpl-purple/50 rounded-xl border border-white/10 p-4 hover:bg-fpl-purple/70 hover:border-fpl-green/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="flex flex-col items-center min-w-[3rem]">
            <span className="text-2xl font-bold text-white">{rank}</span>
            <span className="text-xs mt-0.5">
              {movement > 0 && <span className="text-fpl-green">▲ {movement}</span>}
              {movement < 0 && <span className="text-fpl-pink">▼ {Math.abs(movement)}</span>}
              {movement === 0 && <span className="text-gray-500">–</span>}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/10"></div>

          {/* Manager Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate group-hover:text-fpl-green transition-colors">
              {playerName}
            </div>
            <div className="text-sm text-gray-400 truncate">{entryName}</div>
          </div>

          {/* Points */}
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-fpl-green">{eventTotal}</div>
            <div className="text-xs text-gray-400">{total} pts</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
