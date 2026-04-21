import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ryobi: {
          yellow:  "#E1E723",
          black:   "#000000",
          gray:    "#77787B",
          offwhite: "#F5F5F5",
          dark:    "#1A1A1A",
          muted:   "#2E2E2E",
        },
      },
      fontFamily: {
        display: ["var(--font-barlow)", "Arial", "sans-serif"],
        body:    ["var(--font-barlow)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
