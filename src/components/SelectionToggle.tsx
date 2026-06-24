interface SelectionToggleProps {
  anySelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accent?: "cyan" | "pink" | "purple" | "amber";
}

export function SelectionToggle({
  anySelected,
  onToggle,
  disabled = false,
  accent = "cyan",
}: SelectionToggleProps) {
  const accentClass =
    accent === "pink"
      ? "text-neon-pink/80 hover:text-neon-pink"
      : accent === "purple"
        ? "text-neon-purple/80 hover:text-neon-purple"
        : accent === "amber"
          ? "text-amber-300/80 hover:text-amber-200"
          : "text-neon-cyan/80 hover:text-neon-cyan";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`shrink-0 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${accentClass}`}
    >
      {anySelected ? "deselect all" : "select all"}
    </button>
  );
}
