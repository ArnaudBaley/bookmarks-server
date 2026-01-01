import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,vue}',
  ],
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {
      colors: {
        // Vue theme colors
        'vt-white': '#ffffff',
        'vt-white-soft': '#f8f8f8',
        'vt-white-mute': '#f2f2f2',
        'vt-black': '#181818',
        'vt-black-soft': '#222222',
        'vt-black-mute': '#282828',
        'vt-indigo': '#2c3e50',
        // Semantic colors for light mode
        background: {
          DEFAULT: 'var(--color-background)',
          soft: 'var(--color-background-soft)',
          mute: 'var(--color-background-mute)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          heading: 'var(--color-heading)',
        },
        // Green accent color
        accent: {
          DEFAULT: 'hsla(160, 100%, 37%, 1)',
          hover: 'hsla(160, 100%, 37%, 0.8)',
          light: 'hsla(160, 100%, 37%, 0.2)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      fontSize: {
        base: '15px',
      },
      lineHeight: {
        base: '1.6',
      },
      spacing: {
        'section-gap': '160px',
      },
    },
  },
  plugins: [],
} satisfies Config

