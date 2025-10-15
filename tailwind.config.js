/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
// tailwind.config.js

module.exports = {
  content: [
    // ... your existing content paths
  ],
  theme: {
    extend: {
      // 🛑 CRITICAL FIX: Define custom background images here
      backgroundImage: {
        // Use the root-relative path (starting with /)
        'office-bg': 'url("/OfficeImage.jpeg")', 
        'living-room-bg': 'url("/livingRoom.jpeg")',
      }
    },
  },
  plugins: [],
}