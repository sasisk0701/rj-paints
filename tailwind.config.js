/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1D5BBF',
          700: '#0F3D87',
          800: '#0A2656',
          900: '#071A3E',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'rainbow': 'linear-gradient(90deg, #FF0055 0%, #FFB800 25%, #00E676 50%, #00B0FF 75%, #7C4DFF 100%)',
        'blue-grad': 'linear-gradient(135deg, #0F3D87 0%, #1D5BBF 100%)',
      },
    },
  },
  plugins: [],
}
