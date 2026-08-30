/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Primary (blue) ──────────────────────────────────────────────
        primary: {
          DEFAULT: '#1D5BBF',
          ink:     '#0F3D87',
          soft:    '#EFF6FF',
        },

        // ── Surface / Background ─────────────────────────────────────────
        surface: {
          DEFAULT: '#FFFFFF',
          2:       '#F8FAFC',
        },

        // ── Border ───────────────────────────────────────────────────────
        border: {
          DEFAULT: '#E2E8F0',
          strong:  '#CBD5E1',
        },

        // ── Ink / Text ───────────────────────────────────────────────────
        ink: {
          DEFAULT: '#0F172A',
          2:       '#475569',
          3:       '#94A3B8',
        },

        // ── Semantic: Success ─────────────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          soft:    '#DCFCE7',
        },

        // ── Semantic: Warning ─────────────────────────────────────────────
        warn: {
          DEFAULT: '#D97706',
          soft:    '#FEF3C7',
        },

        // ── Semantic: Danger / Error ──────────────────────────────────────
        danger: {
          DEFAULT: '#DC2626',
          ink:     '#B91C1C',
          soft:    '#FEE2E2',
        },

        // ── Business: Paints (green) ──────────────────────────────────────
        paints: {
          DEFAULT: '#0E8A6D',
          soft:    '#D1FAE5',
          ink:     '#065F46',
        },

        // ── Business: Interiors (amber) ───────────────────────────────────
        interiors: {
          DEFAULT: '#C4762E',
          soft:    '#FEF3C7',
          ink:     '#92400E',
        },
      },

      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },

      backgroundImage: {
        'rainbow':   'linear-gradient(90deg, #FF0055 0%, #FFB800 25%, #00E676 50%, #00B0FF 75%, #7C4DFF 100%)',
        'blue-grad': 'linear-gradient(135deg, #0F3D87 0%, #1D5BBF 100%)',
      },
    },
  },
  plugins: [],
}
