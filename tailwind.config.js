/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rore: {
          background: '#0a0a0b',
          card: '#111113',
          border: '#1a1a1f',
          borderHover: '#27272a',
          primary: '#3b82f6',
          secondary: '#fbbf24',
          success: '#22c55e',
          motherlode: '#a855f7',
          text: '#fafafa',
          textMuted: '#a1a1aa',
          textSubtle: '#71717a',
        },
      },
    },
  },
  plugins: [],
}