import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme palette for staff intranet
        surface: {
          base:    '#0B0E14',
          card:    '#111620',
          raised:  '#161C2D',
          overlay: '#1C2438',
          border:  '#1E2A42',
        },
        accent: {
          green:  '#1FB870',
          amber:  '#F59E0B',
          red:    '#EF4444',
          blue:   '#3B82F6',
          purple: '#8B5CF6',
        },
        text: {
          primary:   '#E8ECF0',
          secondary: '#8896A8',
          muted:     '#4A5568',
          inverse:   '#0B0E14',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      boxShadow: {
        card:  '0 0 0 1px rgba(30, 42, 66, 0.8), 0 4px 16px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(31, 184, 112, 0.15)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
