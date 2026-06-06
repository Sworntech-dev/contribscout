import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08090f",
        panel: "#10131d",
        line: "#252a38",
        mint: "#53f2b8",
        amber: "#f6c765",
        rose: "#ff7a9a",
        skyglass: "#7dd3fc",
      },
      boxShadow: {
        glow: "0 0 60px rgba(83, 242, 184, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
