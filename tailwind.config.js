/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-orange': '#FF5630',
        'orange-hover': '#E64620',
        'light-bg': '#FAFAFA',
        'light-card': '#FFFFFF',
        'light-sidebar': '#F3F4F6',
        'light-hover': '#FEF2EE',
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'border-light': '#E5E7EB',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
