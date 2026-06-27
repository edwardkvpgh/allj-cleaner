interface DetoxIconProps {
  size?: number;
  className?: string;
}

/** Four-quadrant color wheel — theme picker symbol. */
export function ThemeColorWheelIcon({ size = 24, className = "" }: DetoxIconProps) {
  const clipId = `theme-wheel-clip-${size}`;
  const centerGradId = `theme-wheel-center-grad-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`detox-theme-wheel-icon ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
        <radialGradient
          id={centerGradId}
          cx="38%"
          cy="32%"
          r="68%"
          fx="38%"
          fy="32%"
        >
          <stop offset="0%" stopColor="var(--theme-wheel-center-hi)" />
          <stop offset="55%" stopColor="var(--theme-wheel-center-mid)" />
          <stop offset="100%" stopColor="var(--theme-wheel-center-lo)" />
        </radialGradient>
        <filter id={`theme-wheel-shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.22" />
        </filter>
        <filter id={`theme-wheel-center-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="0.5"
            stdDeviation="0.6"
            floodColor="var(--theme-wheel-center-shadow)"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <circle
        cx="12"
        cy="12"
        r="10"
        fill="rgb(var(--color-surface) / 0.5)"
        filter={`url(#theme-wheel-shadow-${size})`}
      />

      <g clipPath={`url(#${clipId})`} filter={`url(#theme-wheel-shadow-${size})`}>
        <rect x="2" y="2" width="10" height="10" fill="#F28B82" />
        <rect x="12" y="2" width="10" height="10" fill="#F7DC6F" />
        <rect x="2" y="12" width="10" height="10" fill="#82E0AA" />
        <rect x="12" y="12" width="10" height="10" fill="#BB8FCE" />
      </g>

      <circle
        cx="12"
        cy="12"
        r="3.25"
        fill={`url(#${centerGradId})`}
        filter={`url(#theme-wheel-center-${size})`}
      />
    </svg>
  );
}

/** @deprecated Use ThemeColorWheelIcon */
export const ThemeSwatchIcon = ThemeColorWheelIcon;

/** Smart info badge — theme-tinted sphere with contrasting “i” (about symbol). */
export function DetoxInfoIcon({ size = 24, className = "" }: DetoxIconProps) {
  const gradId = `info-sphere-${size}`;
  const shadowId = `info-shadow-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`detox-info-icon ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <radialGradient
          id={gradId}
          cx="38%"
          cy="32%"
          r="68%"
          fx="38%"
          fy="32%"
        >
          <stop offset="0%" stopColor="var(--info-sphere-hi)" />
          <stop offset="45%" stopColor="var(--info-sphere-mid)" />
          <stop offset="100%" stopColor="var(--info-sphere-lo)" />
        </radialGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.1"
            floodColor="var(--info-shadow)"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      <circle
        cx="12"
        cy="12"
        r="10"
        fill={`url(#${gradId})`}
        filter={`url(#${shadowId})`}
      />

      <circle cx="12" cy="8.15" r="1.7" fill="var(--info-glyph)" />
      <rect x="10.25" y="10.55" width="3.5" height="5.15" rx="0.35" fill="var(--info-glyph)" />
      <path
        d="M9.75 15.7h4.5c.4 0 .65.3.6.65l-.2.7c-.08.35-.4.55-.75.55h-3.2c-.35 0-.65-.2-.75-.55l-.2-.7c-.05-.35.2-.65.6-.65z"
        fill="var(--info-glyph)"
      />
    </svg>
  );
}
