import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.7s ease-out both",
        "fade-in-up": "fadeInUp 0.7s ease-out both",
        "fade-in-down": "fadeInDown 0.5s ease-out both",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
        "line-grow": "lineGrow 0.8s ease-out both",
        "scale-in": "scaleIn 0.5s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(14,165,233,0.3), 0 0 60px rgba(14,165,233,0.1)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(14,165,233,0.6), 0 0 80px rgba(14,165,233,0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        lineGrow: {
          "0%": { width: "0px", opacity: "0" },
          "100%": { width: "120px", opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-medical":
          "linear-gradient(135deg, #020c1b 0%, #0a192f 50%, #020c1b 100%)",
        "gradient-blue": "linear-gradient(135deg, #0ea5e9, #06b6d4)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      transitionDelay: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
    },
  },
  plugins: [],
};

export default config;
