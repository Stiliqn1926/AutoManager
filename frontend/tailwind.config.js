/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* =========================
           BRAND / PRIMARY (ORANGE)
        ========================= */
        primary: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          DEFAULT: '#F97316', // main orange
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },

        /* =========================
           BACKGROUNDS
        ========================= */
        sidebar: {
          DEFAULT: '#0B1220',   // по-дълбок, по-малко син
          hover: '#111827',
          active: '#1F2937',
        },

        mainBg: '#F9FAFB',       // по-чисто от F8FAFC
        cardBg: '#FFFFFF',

        /* =========================
           TEXT COLORS
        ========================= */
        textPrimary: '#0F172A',  // почти черно, силен контраст
        textSecondary: '#475569',
        textMuted: '#94A3B8',

        /* =========================
           BORDERS / DIVIDERS
        ========================= */
        borderSubtle: '#E5E7EB',
        borderStrong: '#CBD5E1',

        /* =========================
           STATUS COLORS
        ========================= */
        success: {
          light: '#DCFCE7',
          DEFAULT: '#16A34A',
          dark: '#166534',
        },
        warning: {
          light: '#FEF3C7',
          DEFAULT: '#F59E0B',
          dark: '#92400E',
        },
        error: {
          light: '#FEE2E2',
          DEFAULT: '#DC2626',
          dark: '#7F1D1D',
        },
      },

      /* =========================
         UI POLISH
      ========================= */
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        sidebar: '2px 0 8px rgba(0,0,0,0.08)',
      },

      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
