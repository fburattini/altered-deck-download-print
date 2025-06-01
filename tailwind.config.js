/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./webapp/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'altered-red': '#c32637',
        'altered-blue': '#2563eb',
        'altered-green': '#16a34a',
        'altered-purple': '#9333ea',
        'altered-orange': '#ea580c',
        'altered-yellow': '#eab308',
      }
    },
  },
  plugins: [],
}
