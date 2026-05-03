/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: '#020203',
        darker: '#000000',
        surface: 'rgba(20, 20, 25, 0.7)',
        primary: {
          DEFAULT: '#8b5cf6', // Violet-500
          glow: 'rgba(139, 92, 246, 0.5)',
        },
        secondary: {
          DEFAULT: '#ec4899', // Pink-500
          glow: 'rgba(236, 72, 153, 0.5)',
        },
        accent: '#06b6d4', // Cyan-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        vazir: ['Vazirmatn', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-secondary': '0 0 20px rgba(236, 72, 153, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, boxShadow: '0 0 20px var(--color-primary-glow)' },
          '50%': { opacity: 0.3, boxShadow: '0 0 10px var(--color-primary-glow)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
