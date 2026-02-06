/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './public/**/*.html',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        neutral: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a',
          800: '#18181b',
          900: '#0f0f11',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-1': ['clamp(2.5rem, 3vw + 1rem, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-2': ['clamp(2rem, 2vw + 1rem, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.8' }],
      },
      maxWidth: { prose: '72ch' },
      boxShadow: {
        glow: '0 24px 72px -40px rgba(0,0,0,0.75)',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.100'),
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.neutral.200'),
            '--tw-prose-headings': theme('colors.neutral.50'),
            '--tw-prose-links': theme('colors.neutral.50'),
            '--tw-prose-bold': theme('colors.neutral.50'),
            '--tw-prose-quotes': theme('colors.neutral.300'),
            '--tw-prose-quote-borders': theme('colors.neutral.700'),
            '--tw-prose-code': theme('colors.neutral.100'),
            '--tw-prose-pre-bg': theme('colors.neutral.900'),
            '--tw-prose-hr': theme('colors.neutral.800'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
