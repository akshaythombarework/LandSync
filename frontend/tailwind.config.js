/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Government Navy — structural backgrounds, sidebar, header
        navy: {
          50:  '#EEF2F7',
          100: '#D5DEE9',
          200: '#ABBDDA',
          300: '#7993C0',
          400: '#4D6B9F',
          500: '#2A4D7F',
          600: '#16324F',
          700: '#0B1F33',
          800: '#071627',
          900: '#040E1A',
        },
        // Government Teal — primary actions, links, active states
        teal: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Action Green — approved, verified, success states
        gov: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Amber — warnings, attention, pending states
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B7791F',
          800: '#92400E',
          900: '#78350F',
        },
        // Legacy aliases for backward compat (maps to teal/gov)
        primary: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        admin: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        paper: {
          50:  '#F6F8FA',
          100: '#F1F5F9',
          200: '#E9EFF5',
          300: '#D9E0E7',
        },
        earth: {
          100: '#FEF3C7',
          500: '#D97706',
          700: '#B7791F',
          800: '#92400E',
        },
      },
    },
  },
  plugins: [],
}
