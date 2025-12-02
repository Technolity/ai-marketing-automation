/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0b', // Deep rich black
        grayDark: '#161618', // Slightly lighter for cards
        accentRed: '#e11d48', // Rose-600, slightly more vibrant
        richBlack: '#050505',
        charcoal: '#121214',
        crimson: '#be123c', // Rose-700
      },
      boxShadow: {
        'glow': '0 0 20px rgba(225, 29, 72, 0.5)',
        'glow-sm': '0 0 10px rgba(225, 29, 72, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #1a1a1a 0deg, #0a0a0b 180deg, #1a1a1a 360deg)',
      },
    },
  },
  plugins: [],
}
