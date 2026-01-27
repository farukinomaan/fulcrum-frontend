import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // <--- This covers everything in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;