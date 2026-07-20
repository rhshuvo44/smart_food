/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        'primary-dark': '#E55A2B',
        'primary-light': '#FF8F5E',
        secondary: '#1A1A2E',
        'secondary-light': '#2D2D44',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        'surface-variant': '#F0F0F5',
        text: '#1A1A2E',
        'text-secondary': '#6C757D',
        'text-tertiary': '#ADB5BD',
        error: '#DC3545',
        success: '#28A745',
        'success-light': '#E8F5E9',
        warning: '#FFC107',
        'warning-light': '#FFF8E1',
        info: '#17A2B8',
        border: '#E8E8ED',
        'border-light': '#F0F0F5',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
