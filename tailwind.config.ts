import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fpl: {
          purple: '#37003c',
          'dark-purple': '#2c003e',
          green: '#00ff87',
          pink: '#e90052',
          'light-purple': '#963cff',
          cyan: '#05f0ff',
        },
      },
      fontFamily: {
        sans: ['PremierSans', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
