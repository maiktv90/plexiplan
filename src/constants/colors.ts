export const PlexifyColor = {
  // Brand colors
  primaryBrand: "#493ed4",
  backgroundLight: "#fafafa",
  plexifyBlue: "#00023b",
  plexifyPurple: "#a8a1ff",
  
  // Semantic colors
  error: "#d32f2f",
  warning: "#ed6c02",
  success: "#2e7d32",
  info: "#0288d1",
  
  // Text colors
  textPrimary: "#00023b",    // plexifyBlue for primary text
  textSecondary: "#616161",  // gray for secondary text
  textDisabled: "#9e9e9e",   // lighter gray for disabled text
  
  // Additional colors
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type PlexifyColorType = keyof typeof PlexifyColor;
