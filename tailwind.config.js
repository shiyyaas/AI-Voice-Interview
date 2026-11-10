/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ecto-green': '#58cc02',
        'lingot-lime': '#a5ed6e',
        'eel-light': '#d7ffb8',
        'macaw-blue': '#1cb0f6',
        'eel-dark-blue': '#042c60',
        'midnight': '#000437',
        'graphite': '#3c3c3c',
        'ash': '#777777',
        'charcoal': '#4b4b4b',
        'paper': '#ffffff',
        'ink': '#000000',
      },
      fontFamily: {
        ui: ['var(--font-din-round)', 'Nunito', 'Quicksand', 'sans-serif'],
        display: ['var(--font-feather)', 'DIN Next', 'Roboto', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        'duo-wide': '0.053em',
        'duo-tight': '-0.02em',
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '12px',
        xl: '12px',
        '2xl': '12px',
        full: '12px', // strictly 12px everywhere per design.md ("Set border-radius to 12px on all buttons, links, and pills — this is the only radius in the system")
      },
      boxShadow: {
        'btn-green': '0 3px 0 #46a302',
        'btn-green-active': '0 1px 0 #46a302',
        'btn-blue': '0 3px 0 #1899d6',
        'btn-blue-active': '0 1px 0 #1899d6',
        'btn-gray': '0 3px 0 #282828',
      },
    },
  },
  plugins: [],
};
