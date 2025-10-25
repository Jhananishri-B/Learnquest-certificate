module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'dark-bg': '#0a0a0a',        // Very dark background
        'dark-card': '#1a1a1a',      // Card background
        'dark-surface': '#2a2a2a',   // Surface elements
        'dark-border': '#3a3a3a',    // Border color
        'dark-text': '#e5e5e5',     // Primary text
        'dark-text-muted': '#a0a0a0', // Muted text
        'dark-text-secondary': '#808080', // Secondary text
        
        // Blue theme colors
        'blue-primary': '#2563eb',   // Primary blue
        'blue-secondary': '#1d4ed8', // Secondary blue
        'blue-accent': '#3b82f6',    // Accent blue
        'blue-light': '#60a5fa',     // Light blue
        'blue-dark': '#1e40af',      // Dark blue
        
        // Status colors (adjusted for dark theme)
        'success': '#10b981',        // Green
        'warning': '#f59e0b',        // Yellow/Orange
        'error': '#ef4444',          // Red
        'info': '#06b6d4',           // Cyan
        
        // Legacy colors (keeping for compatibility)
        'proctoring-blue': '#3b82f6',
        'proctoring-green': '#10b981',
        'proctoring-red': '#ef4444',
        'proctoring-yellow': '#f59e0b',
        'proctoring-purple': '#8b5cf6',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
