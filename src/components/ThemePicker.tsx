import { useEffect, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { ThemeColorWheelIcon } from "./icons/DetoxIcons";
import { useTheme } from "../context/ThemeContext";
import {
  DEFAULT_THEME_ID,
  THEMES,
  THEME_SWATCH_COLORS,
  getThemeOption,
  type ThemeGroup,
  type ThemeId,
} from "../constants/themes";

function ThemePreviewStrip({ id }: { id: ThemeId }) {
  const [a, b, c, d] = THEME_SWATCH_COLORS[id];
  return (
    <div
      className="h-9 w-full overflow-hidden rounded-lg border border-fg/10 shadow-inner"
      aria-hidden
    >
      <div
        className="grid h-full w-full grid-cols-4"
        style={{
          background: `linear-gradient(90deg, ${a} 0%, ${b} 28%, ${d} 58%, ${c} 100%)`,
        }}
      />
    </div>
  );
}

function ThemeCard({
  themeId,
  selected,
  onSelect,
}: {
  themeId: ThemeId;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = getThemeOption(themeId);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${theme.label} theme`}
      className={`group relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all ${
        selected
          ? "border-neon-cyan/50 bg-neon-purple/12 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_8px_24px_rgba(168,85,247,0.15)]"
          : "border-fg/12 bg-panel/60 hover:border-fg/22 hover:bg-panel/80"
      }`}
    >
      <ThemePreviewStrip id={themeId} />
      <span className="flex items-center justify-between gap-2 px-0.5">
        <span className="min-w-0">
          <span className="block truncate font-display text-[13px] font-semibold leading-tight text-fg">
            {theme.label}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-fg-muted">
            {theme.tag}
            {themeId === DEFAULT_THEME_ID ? " · default" : ""}
          </span>
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-neon-cyan/50 bg-neon-cyan/20 text-neon-cyan"
              : "border-fg/15 bg-fg/5 text-transparent group-hover:border-fg/25"
          }`}
          aria-hidden
        >
          <Check size={11} strokeWidth={3} />
        </span>
      </span>
    </button>
  );
}

export function ThemePicker({ embedded = false }: { embedded?: boolean }) {
  const { themeId, setThemeId } = useTheme();
  const activeTheme = getThemeOption(themeId);
  const [tab, setTab] = useState<ThemeGroup>(activeTheme.group);

  useEffect(() => {
    setTab(activeTheme.group);
  }, [activeTheme.group]);

  const visibleThemes = THEMES.filter((theme) => theme.group === tab);

  return (
    <section
      aria-labelledby="theme-picker-title"
      className={embedded ? "space-y-3" : "theme-panel p-4"}
    >
      {!embedded && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-purple/15 text-neon-purple">
                <ThemeColorWheelIcon size={16} />
              </span>
              <h3
                id="theme-picker-title"
                className="font-display text-base font-semibold tracking-tight text-fg"
              >
                Color theme
              </h3>
            </div>
            <p className="text-[13px] leading-snug text-fg-muted">
              Curated professional palettes. Detox Original stays the default.
            </p>
          </div>
        </div>
      )}

      {embedded && (
        <h3 id="theme-picker-title" className="sr-only">
          Color theme picker
        </h3>
      )}

      <div
        role="tablist"
        aria-label="Theme brightness"
        className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-fg/10 bg-void/40 p-1"
      >
        {(
          [
            { id: "dark" as const, label: "Dark", icon: Moon },
            { id: "light" as const, label: "Light", icon: Sun },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-display text-sm font-medium transition-colors ${
                active
                  ? "bg-neon-purple/20 text-fg shadow-sm"
                  : "text-fg-muted hover:bg-fg/5 hover:text-fg"
              }`}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="grid grid-cols-2 gap-2.5"
        aria-label={`${tab === "dark" ? "Dark" : "Light"} themes`}
      >
        {visibleThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            themeId={theme.id}
            selected={themeId === theme.id}
            onSelect={() => setThemeId(theme.id)}
          />
        ))}
      </div>

      <p className="mt-3 rounded-lg border border-fg/8 bg-void/35 px-3 py-2 text-[13px] leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">{activeTheme.label}</span>
        {" — "}
        {activeTheme.description}
      </p>
    </section>
  );
}
