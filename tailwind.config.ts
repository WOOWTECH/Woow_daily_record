import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Woowtech Brand Colors
        brand: {
          blue: "#6184FD",
          black: "#212121", // Dark gray, not pure black
          "deep-gray": "#646262",
          gray: "#EFF1F5",
          white: "#FFFFFF",
        },
        // Accent Colors for Activities
        accent: {
          cyan: "#65C1E0",
          green: "#8CD37F",
          yellow: "#F2D06D",
          orange: "#E66D3E",
          pink: "#F45D6D",
          purple: "#C09FE0",
        },
      },
      borderRadius: {
        brand: "20px",
      },
      fontSize: {
        base: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
