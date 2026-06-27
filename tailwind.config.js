/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        dark: {
          50: '#f0f1f3',
          100: '#d1d4da',
          200: '#a3a8b4',
          300: '#757c8e',
          400: '#475068',
          500: '#2a3346',
          600: '#1e2636',
          700: '#141b28',
          800: '#0b0f17',
          900: '#06090f',
          950: '#030509',
        },
        brand: {
          50: '#eef2ff',
          100: '#d9e2fc',
          200: '#b9c8fa',
          300: '#8da8f5',
          400: '#5e7eef',
          500: '#3a5ce5',
          600: '#2d47b9',
          700: '#253a97',
          800: '#1f2f79',
          900: '#1a2760',
        },
        accent: {
          green: '#22c55e',
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
