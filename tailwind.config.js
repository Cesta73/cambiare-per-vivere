/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f8f6',
          100: '#e6f0ec',
          200: '#c8dfd5',
          300: '#a1c7b7',
          400: '#74aa95',
          500: '#5B8B76',
          600: '#4a7363',
          700: '#3b5c50',
          800: '#2f4940',
          900: '#263d35',
        },
        petrol: {
          50: '#f0f7f8',
          100: '#d9ecee',
          200: '#b3d8db',
          300: '#7dbec3',
          400: '#43a0a6',
          500: '#2d848b',
          600: '#236874',
          700: '#1e5560',
          800: '#1c454f',
          900: '#1a3c44',
        },
        cream: {
          50: '#faf9f5',
          100: '#f5f3ec',
          200: '#ede9da',
          300: '#e0dac4',
          400: '#cfc7a8',
          500: '#b8ae8a',
        },
        'warm-gray': {
          50: '#f9f8f7',
          100: '#f0eeec',
          200: '#e3e0db',
          300: '#ccc8c1',
          400: '#b0ab9f',
          500: '#8d877a',
          600: '#716b5e',
          700: '#5a554a',
          800: '#3f3c35',
          900: '#2d2d2d',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Marcellus', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
