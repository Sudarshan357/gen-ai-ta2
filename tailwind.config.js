/** @type {import('tailwindcss').Config} */
// Runtime-console tokens. This is an engineering tool, not a marketing
// site: the surface is near-black and quiet, and colour is reserved for
// *state* (success / routed / warning / danger) rather than branding.
// Values live as CSS variables in index.css so the light/dark toggle flips
// every token in one place.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces & text
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        "surface-card": "rgb(var(--color-surface-card) / <alpha-value>)",
        "surface-bone": "rgb(var(--color-surface-bone) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        body: "rgb(var(--color-body) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
        mute: "rgb(var(--color-mute) / <alpha-value>)",
        ash: "rgb(var(--color-ash) / <alpha-value>)",
        stone: "rgb(var(--color-stone) / <alpha-value>)",
        hairline: "var(--color-hairline)",
        "hairline-strong": "rgb(var(--color-hairline-strong) / <alpha-value>)",

        // Single restrained accent for the primary action / active node.
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-deep": "rgb(var(--color-primary-deep) / <alpha-value>)",
        "on-primary": "#ffffff",

        // Status — the only other colour in the system. Each one means a
        // specific run state and is always paired with an icon or label,
        // never used decoratively.
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",

        // Fixed inversion surfaces (same in both themes).
        "surface-dark": "#121417",
        "surface-deep": "#08090b",
        "on-dark": "#e6e8eb",
        "on-dark-mute": "rgba(230,232,235,0.64)",
        "divider-dark": "rgba(255,255,255,0.1)",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.25)",
        raised: "0 8px 24px rgba(0,0,0,0.28)",
        "glow-sm": "0 0 0 1px rgb(var(--color-primary) / 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-node": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease forwards",
        "pulse-node": "pulse-node 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
