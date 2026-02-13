import { useMemo } from "react";
import { EASTER_EGG_SECRETS, EasterEggReveal } from "@/lib/easterEggSecrets";

interface SliderValues {
  cuteness: number;
  confidence: number;
  tiliFactor: number;
  luzon: number;
  visayas: number;
  mindanao: number;
  hairAmount: number;
  facialHair: number;
  clothingStyle: number;
  hairColor: number;
  eyewear: number;
  skinColor: number;
  // bodyFat, posture are intentionally excluded from matching
  bodyFat?: number;
  posture?: number;
}

/**
 * Returns the matching EasterEggReveal if the current slider values
 * exactly match one of the configured secrets, otherwise returns null.
 *
 * Only the 12 core sliders are checked — bodyFat and posture are ignored.
 */
export function useEasterEgg(sliders: SliderValues): EasterEggReveal | null {
  return useMemo(() => {
    for (const secret of EASTER_EGG_SECRETS) {
      const s = secret.sliders;
      if (
        sliders.cuteness      === s.cuteness      &&
        sliders.confidence    === s.confidence    &&
        sliders.tiliFactor    === s.tiliFactor    &&
        sliders.luzon         === s.luzon         &&
        sliders.visayas       === s.visayas       &&
        sliders.mindanao      === s.mindanao      &&
        sliders.hairAmount    === s.hairAmount    &&
        sliders.facialHair    === s.facialHair    &&
        sliders.clothingStyle === s.clothingStyle &&
        sliders.hairColor     === s.hairColor     &&
        sliders.eyewear       === s.eyewear       &&
        sliders.skinColor     === s.skinColor
      ) {
        return secret.reveal;
      }
    }
    return null;
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