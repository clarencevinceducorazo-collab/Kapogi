'use server';

/**
 * @fileOverview Provides functions to map color hex codes to human-readable descriptions.
 * This helps the AI model better understand color context for image generation.
 */

// --- SKIN TONE MAPPING ---

const SKIN_TONE_MAP: { [key: string]: string } = {
  '#FFF5E1': 'very light, fair skin',
  '#F7E2C4': 'light, pale skin',
  '#F1C27D': 'fair skin',
  '#E0AC69': 'light tan skin',
  '#D2B48C': 'tan, classic kayumanggi skin',
  '#BB8353': 'medium brown skin',
  '#8D5524': 'deep brown skin',
  '#634439': 'dark brown skin',
  '#4A2C2A': 'very dark brown skin',
  '#2E1D1A': 'deep, dark brown skin',
};

/**
 * Returns a human-readable description for a given skin tone hex code.
 * @param hex - The hex color string for the skin tone.
 * @returns A descriptive string for the AI prompt.
 */
export const getSkinToneDescription = (hex: string): string => {
  return SKIN_TONE_MAP[hex] || 'kayumanggi skin';
};


// --- HAIR COLOR MAPPING ---

// A curated list of common and distinct hair colors with descriptive names.
const HAIR_COLOR_MAP: { [name: string]: string } = {
  'black': '#000000',
  'dark brown': '#4A2C2A',
  'chocolate brown': '#7B3F00',
  'chestnut': '#954535',
  'light brown': '#C4A484',
  'blonde': '#FAF0BE',
  'strawberry blonde': '#A5594F',
  'fiery red': '#FF0000',
  'ginger': '#B87333',
  'silver gray': '#C0C0C0',
  'pure white': '#FFFFFF',
  'ocean blue': '#0000FF',
  'forest green': '#228B22',
  'bubblegum pink': '#FFC0CB',
  'lavender purple': '#E6E6FA',
};

// Helper function to convert a hex color string to an [R, G, B] array.
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

// Helper function to calculate the "distance" between two RGB colors.
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Finds the closest descriptive hair color name for a given hex code.
 * This allows us to provide more natural language to the AI model
 * instead of just a hex code it may not understand.
 *
 * @param hex - The hex color string selected by the user.
 * @returns The name of the closest matching hair color (e.g., "dark brown").
 */
export function getHairColorDescription(hex: string): string {
  const inputRgb = hexToRgb(hex);
  if (!inputRgb) {
    return 'brown'; // Fallback for invalid hex
  }

  let closestColorName = 'brown';
  let minDistance = Infinity;

  for (const [name, colorHex] of Object.entries(HAIR_COLOR_MAP)) {
    const mapRgb = hexToRgb(colorHex);
    if (mapRgb) {
      const distance = colorDistance(inputRgb, mapRgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestColorName = name;
      }
    }
  }

  return closestColorName;
}
