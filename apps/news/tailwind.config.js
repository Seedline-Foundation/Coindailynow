/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7e6',
          100: '#fcefc0',
          200: '#fae099',
          300: '#f7c94d',
          400: '#f4b71f',
          500: '#e69c0e',
          600: '#ca7a0a',
          700: '#a85b0c',
          800: '#8a4810',
          900: '#733c12',
        },
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b9c1',
          400: '#91939f',
          500: '#747684',
          600: '#5d5f6c',
          700: '#4c4d58',
          800: '#42434b',
          900: '#1a1b23',
          950: '#0d0d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
