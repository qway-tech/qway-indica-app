/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        yellow: "#eabd51",
        red: {
          1: "#c53030",
          2: "#a20000",
        },
        grey: {
          0: "#e0e0e0",
          1: "#d7d8da",
          2: "#b4b4b4",
          3: "#4f515a",
          4: "#272a33",
          5: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};