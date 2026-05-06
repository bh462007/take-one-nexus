/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{js,ts,jsx,tsx,mdx,css}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#06080A',
        machine: '#0E1218',
        panel: '#13181F',
        rail: '#1C2330',
        neon: '#FF4D1A',
        neon2: '#FF7A1A',
        amber: '#FFA620',
        cyan: '#00D4FF',
        cream: '#E8DFC8',
        silver: '#6B7A8D',
        dim: '#3A4556',
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        bebas: ['Bebas Neue', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
