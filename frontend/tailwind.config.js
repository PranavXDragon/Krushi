/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          dark: "#0F1E2E",
          cardDark: "#132338",
          teal: "#0D9488",
          tealLight: "#14B8A6",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          bgLight: "#F8FAFC",
          cardLight: "#FFFFFF",
          borderLight: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
