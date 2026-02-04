/**
 * ============================================================
 * EASTER EGG SECRETS CONFIG
 * ============================================================
 * Each secret requires ALL 12 slider values to match EXACTLY.
 * 
 * To add a new secret, just add a new object to the EASTER_EGG_SECRETS array.
 * To edit an existing one, just change the values or the reveal data.
 * 
 * Sliders and their ranges for reference:
 *   cuteness        → 0–100
 *   confidence      → 0–100
 *   tiliFactor      → 0–100
 *   luzon           → 0–50
 *   visayas         → 0–50
 *   mindanao        → 0–50
 *   hairAmount      → 0–50
 *   facialHair      → 0–50
 *   clothingStyle   → 0–50
 *   hairColor       → 0–50
 *   eyewear         → 0–50
 *   skinColor       → 0–50
 * 
 * Note: bodyFat, posture, and holdingItem are NOT part of the combo check.
 * ============================================================
 */

export interface EasterEggSliders {
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
  }
  
  export interface EasterEggReveal {
    name: string;
    lore: string;
    imagePath: string; // path to local image, e.g. "/images/easter-eggs/secret1.png"
  }
  
  export interface EasterEggSecret {
    id: string;                // unique identifier for debugging / logging
    sliders: EasterEggSliders; // the exact combo that must be matched
    reveal: EasterEggReveal;   // what gets displayed when triggered
  }
  
  // ─────────────────────────────────────────────────────────
  // 🔐 ADD / EDIT YOUR SECRETS HERE
  // ─────────────────────────────────────────────────────────
  export const EASTER_EGG_SECRETS: EasterEggSecret[] = [
    {
      id: 'secret_01',
      sliders: {
        cuteness: 100, confidence: 100, tiliFactor: 100,
        luzon: 50, visayas: 0, mindanao: 0,
        hairAmount: 50, facialHair: 0, clothingStyle: 50,
        hairColor: 0, eyewear: 0, skinColor: 0,
      },
      reveal: {
        name: 'Dito Man',
        lore: '**Dito Man** is the legendary guardian of the Kapogian realm — the one who was always there, even before the others knew. Born under the golden light of Luzon\'s peak, he carries an aura so pure that even the stars tilt toward him.\n\nHe never sought fame, yet fame found him at every corner. His smile disarms enemies, and his presence alone turns chaos into calm. They say if you set the stars just right, he will appear — not because he wants to be found, but because *you finally looked.*',
        imagePath: '/images/easter-eggs/secret_1.png',
      },
    },
    {
      id: 'secret_02',
      sliders: {
        cuteness: 0, confidence: 0, tiliFactor: 0,
        luzon: 0, visayas: 50, mindanao: 0,
        hairAmount: 0, facialHair: 50, clothingStyle: 0,
        hairColor: 50, eyewear: 50, skinColor: 50,
      },
      reveal: {
        name: 'Ang Hanon',
        lore: '**Ang Hanon** — *The Wind* — is a phantom wanderer from the deep forests of Visayas. No one has ever seen him stand still. He drifts between islands like a whisper, leaving behind only the faint scent of salt and old wood.\n\nThey say he was once a sailor who lost his ship to a storm and was reborn by the sea itself. Now he roams, chill and untouchable, a living legend wrapped in mist. Those who catch a glimpse of him in the dead of night know one thing: *the wind chose you.*',
        imagePath: '/images/easter-eggs/secret_02.png',
      },
    },
    {
      id: 'secret_03',
      sliders: {
        cuteness: 50, confidence: 50, tiliFactor: 50,
        luzon: 25, visayas: 25, mindanao: 25,
        hairAmount: 25, facialHair: 25, clothingStyle: 25,
        hairColor: 25, eyewear: 25, skinColor: 25,
      },
      reveal: {
        name: 'Kuntiman',
        lore: '**Kuntiman** is the perfectly balanced soul of the Kapogian universe — born from the exact center of every force that exists. Where others tip toward extremes, he sits in the eye of the storm, unbothered and unmatched.\n\nHe is the master of equilibrium: half shadow, half light, all charm. Legends speak of him as the one who *chose the middle path* not out of indecision, but because only he understood that true power lives in balance. Finding him means you, too, have found the center.',
        imagePath: '/images/easter-eggs/secret_03.png',
      },
    },
    {
      id: 'secret_04',
      sliders: {
        cuteness: 77, confidence: 33, tiliFactor: 88,
        luzon: 10, visayas: 40, mindanao: 20,
        hairAmount: 45, facialHair: 5, clothingStyle: 12,
        hairColor: 30, eyewear: 15, skinColor: 10,
      },
      reveal: {
        name: 'Nene Boy',
        lore: '**Nene Boy** is the heartbreaker nobody saw coming. With an almost comically cute face hiding a wildly magnetic presence, he slips through crowds like sugar dissolving in coffee — smooth, sweet, and completely unresistable.\n\nFrom the shores of Visayas, he learned charm the way fishermen learn the tides: instinctively, naturally, *perfectly*. His secret? He never tries. And that\'s exactly why everyone remembers him long after he\'s gone.',
        imagePath: '/images/easter-eggs/secret_04.png',
      },
    },
    {
      id: 'secret_05',
      sliders: {
        cuteness: 15, confidence: 90, tiliFactor: 60,
        luzon: 0, visayas: 0, mindanao: 50,
        hairAmount: 10, facialHair: 40, clothingStyle: 45,
        hairColor: 5, eyewear: 40, skinColor: 45,
      },
      reveal: {
        name: 'Tigre Gundo',
        lore: '**Tigre Gundo** is the silent storm of Mindanao — a man who commands rooms without saying a word. Dark, sharp, and radiating raw power, he is the kind of presence that makes even the bravest warriors lower their eyes.\n\nRaised in the highlands, he earned his name not by hunting tigers, but by possessing the same quiet, unshakeable fearlessness. He speaks rarely. When he does, people listen — not because he demands it, but because instinct tells them *this one matters.*',
        imagePath: '/images/easter-eggs/secret_05.png',
      },
    },
    {
      id: 'secret_06',
      sliders: {
        cuteness: 88, confidence: 72, tiliFactor: 95,
        luzon: 48, visayas: 2, mindanao: 0,
        hairAmount: 50, facialHair: 0, clothingStyle: 50,
        hairColor: 45, eyewear: 20, skinColor: 5,
      },
      reveal: {
        name: 'Liwayway',
        lore: '**Liwayway** — *Dawn* — is the most radiant Kapogian to ever grace the collection. Blonde, flawless, and dripping in elegance, he is the living embodiment of a Luzon sunrise: golden, warm, and impossible to look away from.\n\nBorn in the halls of old Manila, he was gifted charm the way the sun gifts warmth — without effort, without condition. He doesn\'t just light up a room. He *is* the light. Those who unlock him know they\'ve found the rarest sunrise in the Kapogian sky.',
        imagePath: '/images/easter-eggs/secret_06.png',
      },
    },
    {
      id: 'secret_07',
      sliders: {
        cuteness: 42, confidence: 58, tiliFactor: 30,
        luzon: 20, visayas: 10, mindanao: 40,
        hairAmount: 30, facialHair: 20, clothingStyle: 35,
        hairColor: 15, eyewear: 35, skinColor: 30,
      },
      reveal: {
        name: 'Kape Maestro',
        lore: '**Kape Maestro** is the mythical brewer of the finest coffee in all of Kapogian — a man part barista, part legend. With calm eyes behind sharp frames and a beard that\'s been aged like his finest roasts, he is the quiet soul everyone gravitates toward.\n\nFrom the misty mountains of Mindanao, he mastered the art of patience long before he mastered the art of the brew. They say his coffee has the power to make you stay — not because it\'s addictive, but because his presence makes you forget you ever wanted to leave.',
        imagePath: '/images/easter-eggs/secret_07.png',
      },
    },
    {
      id: 'secret_08',
      sliders: {
        cuteness: 100, confidence: 0, tiliFactor: 100,
        luzon: 0, visayas: 50, mindanao: 50,
        hairAmount: 50, facialHair: 0, clothingStyle: 0,
        hairColor: 50, eyewear: 0, skinColor: 0,
      },
      reveal: {
        name: 'Tsiksi',
        lore: '**Tsiksi** is the ultimate contradiction of the Kapogian world: devastatingly cute, yet utterly unaware of his own power. With wide, innocent eyes and hair that catches every light, he looks like a painting that escaped its frame.\n\nA child of both Visayas and Mindanao, he inherited the softness of one and the mystery of the other. He doesn\'t chase attention — it chases him. Shy, sweet, and impossibly magnetic, Tsiksi is proof that the quietest souls often hold the loudest magic.',
        imagePath: '/images/easter-eggs/secret_08.png',
      },
    },
    {
      id: 'secret_09',
      sliders: {
        cuteness: 60, confidence: 85, tiliFactor: 70,
        luzon: 35, visayas: 15, mindanao: 5,
        hairAmount: 15, facialHair: 10, clothingStyle: 40,
        hairColor: 8, eyewear: 10, skinColor: 20,
      },
      reveal: {
        name: 'Mestizo Lansang',
        lore: '**Mestizo Lansang** is the polished prince of the Kapogian elite — a Luzon-born aristocrat who wears confidence the way others wear plain clothes. Sharp jaw, clean cut, and dressed to the nines, he is the definition of *pogi na pogi*.\n\nRaised among Manila\'s finest, he learned early that presence is everything. But beneath the pressed polo and the perfect posture lives a man who genuinely cares — quietly, consistently, without fanfare. He\'s not just handsome. He\'s *unforgettable.*',
        imagePath: '/images/easter-eggs/secret_09.png',
      },
    },
    {
      id: 'secret_10',
      sliders: {
        cuteness: 30, confidence: 45, tiliFactor: 10,
        luzon: 5, visayas: 5, mindanao: 48,
        hairAmount: 5, facialHair: 45, clothingStyle: 8,
        hairColor: 2, eyewear: 5, skinColor: 48,
      },
      reveal: {
        name: 'Mang Kaloy',
        lore: '**Mang Kaloy** is the rugged soul of the deep Mindanao wilderness — bald, bearded, dark-skinned, and built by decades of surviving the harshest terrain the Philippines has to offer. He doesn\'t impress people. He *outlasts* them.\n\nA quiet fisherman turned wanderer, Kaloy needs no mirrors and no crowd. The jungle shaped him, and he wears that story on every line of his face. To find him in the sliders is to stumble upon one of the most *raw and honest* characters in the entire collection.',
        imagePath: '/images/easter-eggs/secret_10.png',
      },
    },
    {
      id: 'secret_11',
      sliders: {
        cuteness: 75, confidence: 75, tiliFactor: 75,
        luzon: 40, visayas: 40, mindanao: 0,
        hairAmount: 40, facialHair: 0, clothingStyle: 30,
        hairColor: 35, eyewear: 30, skinColor: 15,
      },
      reveal: {
        name: 'Tatay Swabe',
        lore: '**Tatay Swabe** is the golden child of the Kapogian universe — the one who somehow got *everything right*. Cute, confident, magnetic, and effortlessly stylish, he moves through life like the plot was written in his favor.\n\nA son of both Luzon and Visayas, he blends warmth and charm into something almost supernatural. Light brown hair, easy smile, dressed like he just stepped out of a lookbook — Tatay Swabe is the character the whole collection was built around. Finding him means you\'ve unlocked the *golden ratio of pogi.*',
        imagePath: '/images/easter-eggs/secret_11.png',
      },
    },
    {
      id: 'secret_12',
      sliders: {
        cuteness: 1, confidence: 99, tiliFactor: 1,
        
        luzon: 1, visayas: 1, mindanao: 49,
        hairAmount: 1, facialHair: 49, clothingStyle: 1,
        hairColor: 1, eyewear: 49, skinColor: 49,
      },
      reveal: {
        name: 'Ang Huling Hari',
        lore: '**Ang Huling Hari** — *The Last King* — is the final secret of the Kapogian collection, and the hardest to find. Stripped of softness, dripping in raw authority, and cloaked in the shadows of Mindanao\'s deepest forests, he is the ultimate dark-horse king.\n\nHe was never crowned. He never needed to be. With barely a word and nothing but sheer, unyielding presence, Ang Huling Hari commands the silence around him. This is the easter egg that was designed to feel *almost impossible* to stumble upon — because some kings are only found by those who truly look.',
        imagePath: '/images/easter-eggs/secret_12.png',
      },
    },
  ];