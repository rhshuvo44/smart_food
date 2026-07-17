/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#1A1A2E',
        'text-secondary': '#6C757D',
        error: '#DC3545',
        success: '#28A745',
        warning: '#FFC107',
        border: '#DEE2E6',
      },
    },
  },
  plugins: [],
};
