/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--color-border-default, #e5e7eb)",
        input: "var(--color-bg-input, #ffffff)",
        ring: "var(--color-primary, #3b82f6)",
        background: "var(--color-bg-primary, #ffffff)",
        foreground: "var(--color-text-primary, #0f172a)",
        primary: {
          DEFAULT: "var(--color-primary, #3b82f6)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--color-bg-secondary, #f1f5f9)",
          foreground: "var(--color-text-primary, #0f172a)",
        },
        destructive: {
          DEFAULT: "var(--color-error-main, #ef4444)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--color-bg-tertiary, #f8fafc)",
          foreground: "var(--color-text-secondary, #64748b)",
        },
        accent: {
          DEFAULT: "var(--color-bg-tertiary, #f8fafc)",
          foreground: "var(--color-text-primary, #0f172a)",
        },
        popover: {
          DEFAULT: "var(--color-bg-elevated, #ffffff)",
          foreground: "var(--color-text-primary, #0f172a)",
        },
        card: {
          DEFAULT: "var(--color-bg-secondary, #f1f5f9)",
          foreground: "var(--color-text-primary, #0f172a)",
        },
      },
      borderRadius: {
        lg: "var(--primitive-radius-lg, 0.5rem)",
        md: "var(--primitive-radius-md, 0.375rem)",
        sm: "var(--primitive-radius-sm, 0.25rem)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
