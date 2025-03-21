import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Elegant color palette
        elegant: {
          navy: "#0F1C2E",
          blue: {
            DEFAULT: "#1E3A5F",
            light: "#2C5282",
            dark: "#0A1929",
          },
          gold: {
            DEFAULT: "#D4AF37",
            light: "#F0D78C",
            dark: "#9D7E2A",
          },
          cream: "#F8F5E6",
          gray: {
            DEFAULT: "#6E7A8A",
            light: "#A0AEC0",
            dark: "#4A5568",
          },
          accent1: "#7D5A50", // Warm brown
          accent2: "#4A6670", // Slate blue
          accent3: "#8C7355", // Taupe
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        default: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern": "url('/grid-pattern.svg')",
        "noise-pattern": "url('/noise.png')",
        "marble-pattern": "url('/marble-texture.png')",
      },
      boxShadow: {
        elegant: "0 4px 20px rgba(15, 28, 46, 0.1)",
        "elegant-lg": "0 10px 30px rgba(15, 28, 46, 0.15)",
        gold: "0 0 15px rgba(212, 175, 55, 0.3)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gold": {
          "0%, 100%": {
            boxShadow: "0 0 10px rgba(212, 175, 55, 0.3)",
            borderColor: "rgba(212, 175, 55, 0.7)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.5)",
            borderColor: "rgba(212, 175, 55, 0.9)",
          },
        },
        "rotate-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "scale-up": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-left": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-right": {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 3s ease-in-out infinite",
        "rotate-slow": "rotate-slow 20s linear infinite",
        "gradient-shift": "gradient-shift 15s ease infinite",
        shimmer: "shimmer 2s infinite linear",
        "scale-up": "scale-up 0.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "slide-down": "slide-down 0.5s ease-out forwards",
        "slide-left": "slide-left 0.5s ease-out forwards",
        "slide-right": "slide-right 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config

