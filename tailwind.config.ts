import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Fredoka', 'sans-serif'],
        headline: ['"Luckiest Guy"', 'cursive'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      transitionTimingFunction: {
        'premium-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'slide-down-fade': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(-4px)' },
          '50%': { transform: 'translateY(4px)' },
        },
        'soft-pulse': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.03)', filter: 'brightness(1.1)' },
        },
        'spin-subtle': {
            '0%, 100%': { transform: 'rotate(-3deg)' },
            '50%': { transform: 'rotate(3deg)' },
        },
        'shine-sweep': {
            '0%': { transform: 'translateX(-100%) skewX(-15deg)', opacity: 0.4 },
            '40%': { transform: 'translateX(200%) skewX(-15deg)', opacity: 0.1 },
            '100%': { transform: 'translateX(200%) skewX(-15deg)', opacity: 0.1 },
        },
        'draw-line': {
            '0%': { transform: 'scaleY(0)' },
            '100%': { transform: 'scaleY(1)' },
        },
        'breathe': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
        },
        'bg-scroll': {
          '0%': { 'background-position': '0 0' },
          '100%': { 'background-position': '-20px -20px' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px) rotate(-4deg)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0) rotate(0)' },
        },
        'icon-bounce': {
            '0%': { opacity: '0', transform: 'scale(0.3) '},
            '60%': { opacity: '1', transform: 'scale(1.1)'},
            '80%': { transform: 'scale(0.95)'},
            '100%': { opacity: '1', transform: 'scale(1)'},
        },
        drive: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(110vw)' },
        },
        'drive-reverse': {
          '0%': { transform: 'translateX(110vw) scaleX(-1)' },
          '100%': { transform: 'translateX(-100%) scaleX(-1)' },
        },
        'blink': {
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.4s ease-out',
        'accordion-up': 'accordion-up 0.4s ease-out',
        'marquee': 'marquee 25s linear infinite',
        'slide-down-fade': 'slide-down-fade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'float-y': 'float-y 4s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 6s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'spin-subtle': 'spin-subtle 3s ease-in-out infinite',
        'shine-sweep': 'shine-sweep 8s ease-in-out infinite',
        'draw-line': 'draw-line 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
        'bg-scroll': 'bg-scroll 1s linear infinite',
        'pop-in': 'pop-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'icon-bounce': 'icon-bounce 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        drive: 'drive 15s linear infinite',
        'drive-reverse': 'drive-reverse 20s linear infinite',
        'blink': 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
