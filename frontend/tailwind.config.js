/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        accent: '#1DB954',
        dark: '#0f1724'
      }
    },
  },
  plugins: [],
}
