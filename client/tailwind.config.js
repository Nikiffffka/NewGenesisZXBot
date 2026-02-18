/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          primary: '#5865F2',
          dark: '#23272A',
          darker: '#1E2124',
          light: '#2C2F33',
        }
      }
    },
  },
  plugins: [],
}
