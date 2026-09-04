/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        navy: {
          800: "#0f172a",
          900: "#0a0f1d",
          950: "#060913",
        },
        patient: {
          light: "#e0f2fe",
          DEFAULT: "#0284c7",
          dark: "#0369a1",
        },
        doctor: {
          light: "#ccfbf1",
          DEFAULT: "#0d9488",
          dark: "#0f766e",
        },
        pharmacy: {
          light: "#ede9fe",
          DEFAULT: "#7c3aed",
          dark: "#6d28d9",
        },
        admin: {
          light: "#f1f5f9",
          DEFAULT: "#475569",
          dark: "#334155",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(13, 148, 136, 0.1), 0 8px 10px -6px rgba(13, 148, 136, 0.1)',
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};