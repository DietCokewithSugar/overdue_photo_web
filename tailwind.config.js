/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6F3C',
          50: '#FFF1EC',
          100: '#FFD9C9',
          200: '#FFB399',
          300: '#FF8C68',
          400: '#FF6F3C',
          500: '#EE4F19',
          600: '#C93C11',
          700: '#A32B0C',
          800: '#7C1C06',
          900: '#550F03'
        }
      }
    }
  },
  plugins: []
};
