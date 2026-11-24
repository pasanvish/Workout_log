/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        'brand-primary': '#14b8a6',
        'brand-secondary': '#0f766e',
        'brand-light': '#5eead4',
        'cyan-500': '#06b6d4',
        'background-dark': '#111827',
        'background-light': '#1f2937',
        'card-dark': '#374151',
        'text-primary': '#f9fafb',
        'text-secondary': '#9ca3af',
        'border-color': '#4b5563',
      },
    },
  },
};
