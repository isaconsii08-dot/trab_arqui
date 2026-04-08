import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Terracota/parchment theme – aligned with patron portal
        surface: {
          base:    '#EDE5CC',  // parchment-dark – main bg
          card:    '#FAF7F2',  // parchment-light – cards, sidebar
          raised:  '#F0EAD6',  // medium parchment – hover states
          overlay: '#E4D5B0',  // deeper parchment – modals
          border:  '#D4C4A0',  // warm tan border
        },
        accent: {
          green:  '#1D5E4A',  // emerald-library
          amber:  '#C8860A',  // amber-book
          red:    '#8B3A3A',  // rust
          blue:   '#1D4ED8',
          purple: '#6D28D9',
        },
        text: {
          primary:   '#1C1B29',  // ink
          secondary: '#5C5B6E',  // medium ink
          muted:     '#6B6A7D',  // ink-muted
          inverse:   '#FAF7F2',  // parchment-light
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(28,27,41,0.07), 0 1px 2px rgba(28,27,41,0.04)',
        glow:  '0 0 20px rgba(29, 94, 74, 0.15)',
        'glow-amber': '0 0 20px rgba(200, 134, 10, 0.20)',
      },
      opacity: {
        '3': '0.03',
        '8': '0.08',
        '15': '0.15',
      },
    },
  },
  plugins: [],
};

export default config;
