import { useMemo } from 'react';
import { EASTER_EGG_SECRETS, EasterEggSliders, EasterEggReveal } from '@/lib/easterEggSecrets';

/**
 * ============================================================
 * useEasterEgg — Detection Hook
 * ============================================================
 * Pass in all 12 current slider values. It returns the matching
 * secret's reveal data if a combo is hit, or null if none match.
 * 
 * Usage in your component:
 *   const activeEgg = useEasterEgg({ cuteness, confidence, ... });
 *   if (activeEgg) { ... use activeEgg.name, .lore, .imagePath }
 * ============================================================
 */

export function useEasterEgg(sliders: EasterEggSliders): EasterEggReveal | null {
  return useMemo(() => {
    const match = EASTER_EGG_SECRETS.find((secret) =>
      secret.sliders.cuteness === sliders.cuteness &&
      secret.sliders.confidence === sliders.confidence &&
      secret.sliders.tiliFactor === sliders.tiliFactor &&
      secret.sliders.luzon === sliders.luzon &&
      secret.sliders.visayas === sliders.visayas &&
      secret.sliders.mindanao === sliders.mindanao &&
      secret.sliders.hairAmount === sliders.hairAmount &&
      secret.sliders.facialHair === sliders.facialHair &&
      secret.sliders.clothingStyle === sliders.clothingStyle &&
      secret.sliders.hairColor === sliders.hairColor &&
      secret.sliders.eyewear === sliders.eyewear &&
      secret.sliders.skinColor === sliders.skinColor
    );

    return match ? match.reveal : null;
  }, [
    sliders.cuteness,
    sliders.confidence,
    sliders.tiliFactor,
    sliders.luzon,
    sliders.visayas,
    sliders.mindanao,
    sliders.hairAmount,
    sliders.facialHair,
    sliders.clothingStyle,
    sliders.hairColor,
    sliders.eyewear,
    sliders.skinColor,
  ]);
}