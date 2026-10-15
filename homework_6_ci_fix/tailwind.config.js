/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50: "#eef2f8",
          100: "#d9e2f0",
          200: "#b3c5e0",
          300: "#7d99c4",
          400: "#4f6fa3",
          500: "#345287",
          600: "#243d6b",
          700: "#1a2f54",
          800: "#142644",
          900: "#0f1d36",
          950: "#0a1428",
        },
        steel: {
          50: "#f6f7f9",
          100: "#ebeef3",
          200: "#d4dae3",
          300: "#a8b3c4",
          400: "#7b8aa1",
          500: "#5a6b85",
          600: "#46566e",
          700: "#394659",
          800: "#2f3a4a",
          900: "#283140",
        },
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rowIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        modalIn: "modalIn 0.2s ease-out",
        rowIn: "rowIn 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
