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
        void: "#12121f",
        surface: "#1c1d2e",
        glass: "rgba(255,255,255,0.04)",
        neon: {
          pink: "#ff2d95",
          purple: "#a855f7",
          cyan: "#22d3ee",
          lime: "#a3e635",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(168, 85, 247, 0.25)",
        "glow-cyan": "0 0 30px rgba(34, 211, 238, 0.2)",
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
