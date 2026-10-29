/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        green: '#78c24e',
        blue: '#1db8ee',
        red: '#cc0000',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Syne', '"DM Sans"', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
