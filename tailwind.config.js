/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        strava: {
          orange: "#FC4C02",
          darkOrange: "#E34402",
        },
        brand: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          primary: "#10b981", // emerald green speed
          accent: "#38bdf8", // electric cyan
          flame: "#f97316", // vivid running orange
          purple: "#a855f7",
        },
      },
    },
  },
  plugins: [],
};
