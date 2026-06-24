import { SelectionToggle } from "./SelectionToggle";

interface SectionSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
  disabled?: boolean;
  accent?: "cyan" | "pink" | "purple" | "amber";
}

export function SectionSelectionBar({
  selectedCount,
  totalCount,
  onToggle,
  disabled = false,
  accent = "cyan",
}: SectionSelectionBarProps) {
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center justify-end gap-3">
      <p className="text-xs text-white/40">
        {selectedCount} of {totalCount} selected
      </p>
      <SelectionToggle
        accent={accent}
        anySelected={selectedCount > 0}
        onToggle={onToggle}
        disabled={disabled}
      />
    </div>
  );
}
