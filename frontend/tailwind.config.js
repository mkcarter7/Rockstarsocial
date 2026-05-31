/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#fab3c2',
        'brand-dark': '#f89fb5',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #000000 0%, #fab3c2 100%)',
      },
    },
  },
  plugins: [],
}
