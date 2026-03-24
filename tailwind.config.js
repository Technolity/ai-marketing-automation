/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        sans   : ['var(--font-sans)',    'sans-serif'],
      },
      colors: {
        // ── Brand tokens ──
        dark: '#0a0a0b',       // App background (keep for dashboard etc.)
        navy: '#00031C',       // Landing page background (deep navy)
        'navy-card': '#020D1F', // Landing card background
        grayDark: '#161618',   // Card/panel background
        richBlack: '#050505',  // Deepest background
        charcoal: '#121214',   // Elevated background
        surface: '#0e0e0f',    // Primary surface — form inputs, panels
        elevated: '#1b1b1d',   // Slightly raised surface — tooltips, dropdowns
        subtle: '#2a2a2d',     // Border / divider color (dense contexts)
        subtleAlt: '#3a3a3d',  // Border / divider color (editor/expanded contexts)
        overlay: '#151517',    // Floating element background
        cyan: '#00E5FF',       // Electric cyan — sole color accent

        // ── shadcn/ui semantic tokens (CSS variable bridge) ──
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(0, 229, 255, 0.3)', // Cyan glow
        'glow-sm': '0 0 10px rgba(0, 229, 255, 0.2)',
        'glow-md': '0 0 15px rgba(0, 229, 255, 0.3)',
        'glow-lg': '0 0 25px rgba(0, 229, 255, 0.4)',
        'glow-xl': '0 0 35px rgba(0, 229, 255, 0.5)',
        'glow-intense': '0 0 30px rgba(0, 229, 255, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #1a1a1a 0deg, #0a0a0b 180deg, #1a1a1a 360deg)',
        'cyber-grid': 'linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.text-glow': {
          'text-shadow': '0 0 10px rgba(0, 229, 255, 0.5)',
        },
        '.text-glow-sm': {
          'text-shadow': '0 0 5px rgba(0, 229, 255, 0.3)',
        },
        '.text-glow-lg': {
          'text-shadow': '0 0 20px rgba(0, 229, 255, 0.6)',
        },
      });
    },
  ],
}
