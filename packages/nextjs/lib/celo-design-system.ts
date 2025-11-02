// Celo Design System Colors and Utilities

export const celoColors = {
  // Primary Colors
  prosperityYellow: '#FCFF52',
  forest: '#476520',
  
  // Base Colors
  gypsum: '#FCF6F1',
  sand: '#E7E3D4',
  wood: '#655947',
  fig: '#1E002B',
  
  // Functional Colors
  snow: '#FFFFFF',
  onyx: '#000000',
  success: '#329F3B',
  error: '#E70532',
  disabled: '#9B9B9B',
  
  // Accent Colors
  sky: '#7CC0FF',
  citrus: '#FF9A51',
  jade: '#56DF7C',
  lavender: '#B490FF',
  lotus: '#FFA3EB',
} as const;

export const celoShadows = {
  sm: 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
  default: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
  lg: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
} as const;

export const celoBorders = {
  thin: 'border-2 border-black',
  thick: 'border-4 border-black',
} as const;

export const celoStyles = {
  // Common card style
  card: `bg-white ${celoBorders.thick} ${celoShadows.default} rounded-none`,
  
  // Button styles
  primaryButton: `bg-black text-[${celoColors.prosperityYellow}] hover:bg-gray-800 ${celoBorders.thin} rounded-none font-bold`,
  secondaryButton: `bg-white text-black hover:bg-black hover:text-[${celoColors.prosperityYellow}] ${celoBorders.thin} rounded-none font-bold`,
  
  // Input styles
  input: `bg-white ${celoBorders.thin} focus:ring-0 focus:border-black rounded-none`,
  
  // Typography
  heading: 'font-gt-alpina font-bold text-black',
  body: 'font-gt-alpina text-black',
} as const;

export const celoTypography = {
  fontFamily: {
    primary: 'GT Alpina', // Primary serif font
    fallback: 'Inter, system-ui, sans-serif', // Fallback system fonts
  },
  weights: {
    thin: 100,
    normal: 400,
    bold: 700,
  },
} as const;

// Color palette as Tailwind-compatible object
export const tailwindCeloColors = {
  'prosperity-yellow': celoColors.prosperityYellow,
  'forest': celoColors.forest,
  'gypsum': celoColors.gypsum,
  'sand': celoColors.sand,
  'wood': celoColors.wood,
  'fig': celoColors.fig,
  'snow': celoColors.snow,
  'onyx': celoColors.onyx,
  'success': celoColors.success,
  'error': celoColors.error,
  'disabled': celoColors.disabled,
  'sky': celoColors.sky,
  'citrus': celoColors.citrus,
  'jade': celoColors.jade,
  'lavender': celoColors.lavender,
  'lotus': celoColors.lotus,
} as const;