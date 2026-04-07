import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // BiblioFlow brand palette – editorial bibliofílico
        ink: {
          DEFAULT: '#1C1B29',
          light: '#2E2D42',
          muted: '#6B6A7D',
        },
        parchment: {
          DEFAULT: '#F5EFE0',
          dark: '#EDE5CC',
          light: '#FAF7F2',
        },
        amber: {
          book: '#C8860A',
          warm: '#E09B2A',
          pale: '#F5D88A',
        },
        emerald: {
          library: '#1D5E4A',
          light: '#2D7A62',
          pale: '#C4DDD6',
        },
        rust: {
          DEFAULT: '#8B3A3A',
          light: '#A84D4D',
        },
        terracotta: {
          DEFAULT: '#C1614A',
          dark: '#8B3A27',
          deep: '#6B2A1A',
          light: '#D4845A',
          pale: '#EDCFC4',
          warm: '#E8A882',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'paper-texture': "url('/images/paper-texture.png')",
        'hero-gradient': 'linear-gradient(135deg, #1C1B29 0%, #2E2D42 50%, #1D5E4A 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
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
