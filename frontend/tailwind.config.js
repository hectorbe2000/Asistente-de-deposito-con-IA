/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:            '#EDF8F5',
        surface:       '#FFFFFF',
        surface2:      '#F2FBF8',
        surface3:      '#E0F5F0',
        border:        '#B8DDD8',
        primary:       '#0AADA0',
        'primary-dim': '#088F84',
        accent:        '#7DC422',
        'accent-dim':  '#65A21C',
        success:       '#16A34A',
        danger:        '#DC2626',
        text:          '#0B1F1D',
        muted:         '#4A7570',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(10,173,160,0.10), 0 1px 2px -1px rgba(10,173,160,0.06)',
        'card-md': '0 4px 16px 0 rgba(10,173,160,0.12), 0 2px 6px -1px rgba(10,173,160,0.07)',
        'btn':     '0 2px 8px 0 rgba(10,173,160,0.32)',
        'btn-lg':  '0 4px 16px 0 rgba(10,173,160,0.38)',
      },
    },
  },
  plugins: [],
};
