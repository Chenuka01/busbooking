/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60:30:10 Color Strategy
        // 60% - Primary (Neutral/Background)
        'ceramic': '#F9FAFB', // Ceramic White/Soft Light Gray
        'soft-gray': '#F3F4F6', // Alternative soft gray

        // 30% - Secondary (Brand/Structure)
        'slate-blue': '#1E293B', // Deep Slate Blue
        'navy-dark': '#0F172A', // Navy alternative

        // 10% - Accent (Action/Status)
        'coral': '#F97316', // Vibrant Coral (Action/CTA)
        'signal-green': '#22C55E', // Signal Green (Available)
        'signal-red': '#EF4444', // Signal Red (Booked)

        // Legacy colors (keeping for compatibility)
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      backgroundSize: {
        'size-200': '200% 200%',
      },
      backgroundPosition: {
        'pos-0': '0% 0%',
        'pos-100': '100% 100%',
      },
    },
  },
  plugins: [],
}
