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
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
