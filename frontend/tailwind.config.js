/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef3ff',
          100: '#dce6ff',
          500: '#2f5fd0',
          600: '#234aa8',
          700: '#1c3a86',
          800: '#162e69',
        },
      },
    },
  },
  plugins: [],
};
