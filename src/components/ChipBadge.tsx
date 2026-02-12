import { CHIP_DISPLAY_NAMES, CHIP_COLORS } from "@/lib/types";

interface ChipBadgeProps {
  chipName: string;
}

export default function ChipBadge({ chipName }: ChipBadgeProps) {
  const displayName = CHIP_DISPLAY_NAMES[chipName] || chipName;
  const colorClass = CHIP_COLORS[chipName] || "bg-gray-600";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {displayName}
    </span>
  );
}
