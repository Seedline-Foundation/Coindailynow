/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // African-inspired primary colors (sunset and earth tones)
        primary: {
          50: '#fff7ed',   // Light orange (sunrise)
          100: '#ffedd5',  // Soft orange
          200: '#fed7aa',  // Light orange
          300: '#fdba74',  // Medium orange
          400: '#fb923c',  // Orange
          500: '#f97316',  // Primary orange (African sunset)
          600: '#ea580c',  // Dark orange
          700: '#c2410c',  // Deeper orange
          800: '#9a3412',  // Dark brown-orange
          900: '#7c2d12',  // Deep brown
          950: '#431407',  // Deepest brown
        },
        
        // African gold and earth tones
        secondary: {
          50: '#fefce8',   // Light yellow
          100: '#fef9c3',  // Soft yellow
          200: '#fef08a',  // Light yellow
          300: '#fde047',  // Medium yellow
          400: '#facc15',  // Yellow
          500: '#eab308',  // Primary gold (African gold)
          600: '#ca8a04',  // Dark gold
          700: '#a16207',  // Deep gold
          800: '#854d0e',  // Earth gold
          900: '#713f12',  // Deep earth
          950: '#422006',  // Deepest earth
        },
        
        // African savanna and nature greens
        accent: {
          50: '#f0fdf4',   // Light green
          100: '#dcfce7',  // Soft green
          200: '#bbf7d0',  // Light green
          300: '#86efac',  // Medium green
          400: '#4ade80',  // Green
          500: '#22c55e',  // Primary green (African savanna)
          600: '#16a34a',  // Dark green
          700: '#15803d',  // Deep green
          800: '#166534',  // Forest green
          900: '#14532d',  // Deep forest
          950: '#052e16',  // Deepest forest
        },
        
        // Neutral colors inspired by African earth and sky
        neutral: {
          50: '#fafaf9',   // Light neutral
          100: '#f5f5f4',  // Soft neutral
          200: '#e7e5e4',  // Light neutral
          300: '#d6d3d1',  // Medium neutral
          400: '#a8a29e',  // Neutral
          500: '#78716c',  // Primary neutral (African earth)
          600: '#57534e',  // Dark neutral
          700: '#44403c',  // Deep neutral
          800: '#292524',  // Dark earth
          900: '#1c1917',  // Deep earth
          950: '#0c0a09',  // Deepest earth
        },
        
        // Status colors with African inspiration
        success: {
          DEFAULT: '#22c55e',  // Savanna green
          light: '#86efac',
          dark: '#15803d',
        },
        warning: {
          DEFAULT: '#f59e0b',  // African gold
          light: '#fde047',
          dark: '#a16207',
        },
        error: {
          DEFAULT: '#ef4444',  // Red earth
          light: '#fca5a5',
          dark: '#b91c1c',
        },
        info: {
          DEFAULT: '#3b82f6',  // Sky blue
          light: '#93c5fd',
          dark: '#1d4ed8',
        },
        
        // Background and surface colors
        background: '#fafaf9',
        surface: '#ffffff',
        'surface-variant': '#f5f5f4',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'loading-bar': 'loadingBar 1.5s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        loadingBar: {
          '0%': { left: '-40%' },
          '100%': { left: '100%' },
        },
      },
      
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
      },
      
      backdropBlur: {
        xs: '2px',
      },
      
      // Responsive breakpoints for African mobile devices
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};