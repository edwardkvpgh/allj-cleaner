/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        body: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        void: "rgb(var(--color-void) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--color-fg-muted) / <alpha-value>)",
        "fg-subtle": "rgb(var(--color-fg-subtle) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        overlay: "rgb(var(--color-overlay) / <alpha-value>)",
        glass: "rgb(var(--color-glass) / <alpha-value>)",
        neon: {
          pink: "rgb(var(--color-neon-pink) / <alpha-value>)",
          purple: "rgb(var(--color-neon-purple) / <alpha-value>)",
          cyan: "rgb(var(--color-neon-cyan) / <alpha-value>)",
          lime: "rgb(var(--color-neon-lime) / <alpha-value>)",
        },
        section: {
          cyan: "rgb(var(--color-section-cyan) / <alpha-value>)",
          purple: "rgb(var(--color-section-purple) / <alpha-value>)",
          amber: "rgb(var(--color-section-amber) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--color-warn-fg) / <alpha-value>)",
          bg: "rgb(var(--color-warn-bg) / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-cyan": "var(--shadow-glow-cyan)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulse_slow: "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
