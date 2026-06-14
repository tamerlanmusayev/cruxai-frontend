import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#08080f', // near-black background
        ink: '#e7e7f0', // primary text on dark
        brand: '#818cf8', // indigo-400
        accent: '#c084fc', // violet-400
        paper: '#fffdf5', // notebook paper (light card on dark)
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(129, 140, 248, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
