/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        'brand-primary': 'rgb(var(--brand-primary) / <alpha-value>)',
        'brand-secondary': 'rgb(var(--brand-secondary) / <alpha-value>)',
        'brand-light': 'rgb(var(--brand-light) / <alpha-value>)',
        'cyan-500': '#06b6d4',
        'background-dark': '#0b1116',
        'background-light': '#121c24',
        'card-dark': '#1a2832',
        'text-primary': '#f9fafb',
        'text-secondary': '#9cafbc',
        'border-color': '#2c3d49',
      },
    },
  },
};
