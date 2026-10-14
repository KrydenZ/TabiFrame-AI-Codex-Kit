import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1e2c26',
        muted: '#69796f',
        card: '#fffefa',
        canvas: '#f4f4ec',
        accent: '#4f765e',
        line: '#dce3d8',
        warm: '#a67650',
        forest: '#223a2e'
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Noto Sans SC', 'PingFang SC', 'Microsoft Yahei', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
