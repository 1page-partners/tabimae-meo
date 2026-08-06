/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#2383E2',
        canvas: '#FAFAF9',
        ink: '#1A1A1A',
      },
      fontFamily: { sans: ['Inter', 'Noto Sans JP', 'sans-serif'] },
    },
  },
  plugins: [],
}
