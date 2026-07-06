import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bunny: {
          ink: "#0f172a",
          muted: "#64748b",
          accent: "#f97316",
          surface: "#ffffff",
          soft: "#fff7ed",
          line: "#e5e7eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "var(--font-noto-sc)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
