/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bigola Display"', '"Freight-Text-Pro"', 'serif'],
        body: ['"Freight-Text-Pro"', 'sans-serif'],
      },
      colors: {
        base: 'var(--base)',
        panel: 'var(--panel)',
        panelSoft: 'var(--panel-soft)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        accentSoft: 'var(--accent-soft)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      boxShadow: {
        glow: '0 24px 40px -30px rgba(71, 31, 24, 0.45)',
        lift: '0 18px 30px -26px rgba(71, 31, 24, 0.5)',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}

