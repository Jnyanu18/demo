import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6C63FF", light: "#8B85FF", dark: "#5248D6", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#FF6584", light: "#FF8BA0", dark: "#E54D6B", foreground: "#FFFFFF" },
        brand: {
          bg: "#F8F9FC",
          card: "#FFFFFF",
          border: "#E5E7EB",
          "text-primary": "#1A1A2E",
          "text-secondary": "#6B7280",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        // Keep legacy colors for any existing references
        burgundy: { DEFAULT: "#6C63FF", dark: "#5248D6", deep: "#3D35B8" },
        cream: { DEFAULT: "#F8F9FC", dark: "#EEF0F6", card: "#FFFFFF" },
        gold: { DEFAULT: "#F59E0B", dark: "#D97706", light: "#FCD34D" },
        charcoal: { DEFAULT: "#1A1A2E", soft: "#6B7280" },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(108,99,255,0.08)",
        "card-hover": "0 4px 16px rgba(108,99,255,0.18), 0 1px 4px rgba(0,0,0,0.08)",
        navbar: "0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        textile: "0 18px 45px -22px rgba(108, 99, 255, 0.28)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        pulse: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        ticker: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease both",
        "slide-in-right": "slide-in-right 0.3s ease",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 28s linear infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
