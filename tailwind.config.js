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
          background: '#090805',
          backgroundAlt: '#120c08',
          card: '#15100b',
          cardElevated: '#21160d',
          border: '#3a2413',
          borderHover: '#6a3917',
          primary: '#ff6b00',
          secondary: '#ff3d00',
          success: '#ffd089',
          motherlode: '#ffb15c',
          text: '#fff3e8',
          textMuted: '#d7b9a1',
          textSubtle: '#8e725f',
        },
      },
      boxShadow: {
        rore: '0 18px 50px rgba(0, 0, 0, 0.35)',
        glow: '0 0 0 1px rgba(255, 107, 0, 0.1), 0 20px 60px rgba(255, 107, 0, 0.18)',
      },
    },
  },
  plugins: [],
}
