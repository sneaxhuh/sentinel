import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Celo Primary Colors
        prosperity: {
          yellow: '#FCFF52',
        },
        forest: '#476520',
        
        // Celo Base Colors
        gypsum: '#FCF6F1',
        sand: '#E7E3D4',
        wood: '#655947',
        fig: '#1E002B',
        
        // Celo Functional Colors
        snow: '#FFFFFF',
        onyx: '#000000',
        success: '#329F3B',
        error: '#E70532',
        disabled: '#9B9B9B',
        
        // Celo Accent Colors
        sky: '#7CC0FF',
        citrus: '#FF9A51',
        jade: '#56DF7C',
        lavender: '#B490FF',
        lotus: '#FFA3EB',
        
        // Map to standard Tailwind color names for easy usage
        primary: '#FCFF52', // Prosperity Yellow
        secondary: '#476520', // Forest
        background: '#FCF6F1', // Gypsum
        foreground: '#000000', // Onyx
        muted: '#E7E3D4', // Sand
        accent: '#7CC0FF', // Sky
      },
      fontFamily: {
        // UpheavalPro as primary cyberpunk font
        'upheaval': ['UpheavalPro', 'monospace'],
        // GT Alpina as primary serif (Celo's official font)
        'gt-alpina': ['GT Alpina', 'serif'],
        // Inter as fallback system font
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        // Default sans fallback
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        // Serif stack with GT Alpina first
        'serif': ['GT Alpina', 'serif'],
        // Monospace with UpheavalPro first
        'mono': ['UpheavalPro', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontWeight: {
        'thin': '100',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'bold': '700',
      },
      fontSize: {
        // Celo Typography Scale
        'celo-display': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'celo-h1': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'celo-h2': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'celo-h3': ['2.25rem', { lineHeight: '1.3' }],
        'celo-h4': ['1.875rem', { lineHeight: '1.3' }],
        'celo-h5': ['1.5rem', { lineHeight: '1.4' }],
        'celo-body-lg': ['1.25rem', { lineHeight: '1.6' }],
        'celo-body': ['1rem', { lineHeight: '1.6' }],
        'celo-body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'celo-caption': ['0.75rem', { lineHeight: '1.4' }],
        'celo-label': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'celo': '6px 6px 0px 0px rgba(0,0,0,1)',
        'celo-sm': '3px 3px 0px 0px rgba(0,0,0,1)',
        'celo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
      },
      borderRadius: {
        'none': '0px', // Emphasized for brutalist design
      }
    },
  },
  plugins: [],
}

export default config