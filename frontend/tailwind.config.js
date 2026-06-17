/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccafd',
          400: '#38acf9',
          500: '#0e91eb',
          600: '#0273ca',
          700: '#035ca3',
          800: '#074e87',
          900: '#0c4270',
          950: '#082a4a',
        },
        dark: {
          50: '#f6f6f7',
          100: '#eef0f2',
          200: '#d9dde3',
          300: '#b7c0cc',
          400: '#8e9bb0',
          550: '#485569',
          700: '#273142',
          800: '#1a202c',
          900: '#11151d',
          950: '#0a0d12',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
