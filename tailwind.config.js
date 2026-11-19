/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EEF1F7',
        sheet: '#FAFBFE',
        ink: '#0D1526',
        soft: '#4A5670',
        line: '#D3D9E6',
        hl: '#FFD84A',
        pen: '#E4484F',
        azure: '#2D55E8',
        leaf: '#157A52',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
