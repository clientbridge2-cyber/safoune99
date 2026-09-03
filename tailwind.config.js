/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#1a1a1f',
        'charcoal-light': '#26262c',
        'charcoal-dark': '#0f0f12',
        gold: {
          DEFAULT: '#c9a227',
          light: '#e6c34a',
          dark: '#a07f1c',
        },
        cream: '#f5f1e6',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['"Segoe UI"', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 30px rgba(201,162,39,0.4)',
      },
    },
  },
  plugins: [],
};
