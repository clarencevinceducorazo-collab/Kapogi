"use client";

import { useState, useEffect, useRef } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import {
  Package,
  Sparkles,
  Ghost,
  Shirt,
  Coffee,
  MousePointer2,
  ArrowRight,
  Truck,
  ArrowLeft,
  LoaderCircle,
  Check,
  Shuffle,
  Mouse,
  User,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { uploadCharacterToIPFS, unpinFromIPFS } from "@/lib/pinata";
import { mintCharacterNFT } from "@/lib/sui";
import { ENCRYPTION_CONFIG } from "@/lib/constants";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import {
  encryptShippingInfo,
  validateShippingInfo,
  ShippingInfo,
} from "@/lib/encryption";
import { generateImage } from "@/ai/flows/generate-image-flow";
import { generateText } from "@/ai/flows/generate-text-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useEasterEgg } from "@/hooks/useEasterEgg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";

interface CharacterData {
  imageBlob: Blob;
  name: string;
  description: string;
  attributes: any;
  lore: string;
  imageUrl?: string;
  previewUrl?: string;
}

// PSGC API data types
interface Province {
  code: string;
  name: string;
}
interface City {
  code: string;
  name: string;
  provinceCode: string;
}
interface Barangay {
  code: string;
  name: string;
  cityCode: string;
}

const merchProducts = {
  tee: {
    name: "Tee",
    icon: Shirt,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      {
        name: "Blue",
        value: "#3b82f6",
        image: "/images/merch-selection/shirts/blueshirt.gif",
      },
      {
        name: "Red",
        value: "#ef4444",
        image: "/images/merch-selection/shirts/redshirt.gif",
      },
      {
        name: "Black",
        value: "#171717",
        image: "/images/merch-selection/shirts/blackshirt.gif",
      },
    ],
  },
  mug: {
    name: "Mug",
    icon: Coffee,
    sizes: [],
    colors: [
      {
        name: "White",
        value: "#f3f4f6",
        image: "/images/merch-selection/mug/gifWhiteMug.gif",
      },
      {
        name: "Red",
        value: "#ef4444",
        image: "/images/merch-selection/mug/gifRedMug.gif",
      },
      {
        name: "Blue",
        value: "#3b82f6",
        image: "/images/merch-selection/mug/gifBlueMug.gif",
      },
      {
        name: "Black",
        value: "#171717",
        image: "/images/merch-selection/mug/gifBlackMug.gif",
      },
    ],
  },
  pad: {
    name: "Pad",
    icon: Mouse,
    sizes: [],
    colors: [],
  },
  hoodie: {
    name: "Hoodie",
    icon: User,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      {
        name: "Black",
        value: "#171717",
        image: "/images/merch-selection/hoodies/blackhoodie.gif",
      },
      {
        name: "Red",
        value: "#ef4444",
        image: "/images/merch-selection/hoodies/redhoodie.gif",
      },
      {
        name: "Blue",
        value: "#3b82f6",
        image: "/images/merch-selection/hoodies/bluehoodie.gif",
      },
      {
        name: "Grey",
        value: "#d6d3d1",
        image: "/images/merch-selection/hoodies/greyhoodie.gif",
      },
      {
        name: "Beige",
        value: "#f5f5dc",
        image: "/images/merch-selection/hoodies/biegehoodie.gif",
      },
      {
        name: "Cyan",
        value: "#22d3ee",
        image: "/images/merch-selection/hoodies/cyanhoodie.gif",
      },
    ],
  },
};

export default function GeneratorPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [page, setPage] = useState("generator");

  // Generation State
  const [loading, setLoading] = useState(false);
  const [showExitLoader, setShowExitLoader] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Form State
  const [characterName, setCharacterName] = useState("");
  const [gender, setGender] = useState("Malakas"); // Malakas, Maganda, Mahawari, Maharaba
  const [cuteness, setCuteness] = useState(50);
  const [confidence, setConfidence] = useState(50);
  const [tiliFactor, setTiliFactor] = useState(50);
  const [luzon, setLuzon] = useState(0);
  const [visayas, setVisayas] = useState(0);
  const [mindanao, setMindanao] = useState(0);
  const [hairAmount, setHairAmount] = useState(25);
  const [facialHair, setFacialHair] = useState(0);
  const [clothingStyle, setClothingStyle] = useState(25);
  const [hairColor, setHairColor] = useState(0);
  const [eyewear, setEyewear] = useState(0);
  const [skinColor, setSkinColor] = useState(0);
  const [bodyFat, setBodyFat] = useState(25);
  const [posture, setPosture] = useState(25);
  const [holdingItem, setHoldingItem] = useState("None");

  // Shipping State
  const [shippingName, setShippingName] = useState("");
  const [shippingContact, setShippingContact] = useState("");

  // New PSGC-based address state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null,
  );
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<any | null>(null);
  const [streetAddress, setStreetAddress] = useState("");

  const [provincesLoading, setProvincesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [barangaysLoading, setBarangaysLoading] = useState(false);

  // Merch selection state
  const [selection, setSelection] = useState<string | null>("Tee");
  const [shirtSize, setShirtSize] = useState<string>("M");
  const [teeColor, setTeeColor] = useState<string>("#3b82f6");
  const [mugColor, setMugColor] = useState<string>("#f3f4f6");
  const [hoodieSize, setHoodieSize] = useState<string>("L");
  const [hoodieColor, setHoodieColor] = useState<string>("#171717");

  // Result State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(
    null,
  );
  const [generatedName, setGeneratedName] = useState<string>("");
  const [generatedLore, setGeneratedLore] = useState<string | null>(null);
  const [originDescription, setOriginDescription] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [generatedMmr, setGeneratedMmr] = useState(0);
  const [shufflingMmr, setShufflingMmr] = useState(0);

  // Easter egg override state — stored after reveal so it persists on the preview page
  const [eggRank, setEggRank] = useState<string | null>(null);
  const [eggLineage, setEggLineage] = useState<string | null>(null);

  const [generatedNamesHistory, setGeneratedNamesHistory] = useState<string[]>(
    [],
  );

  const displayedLore = useTypewriter(generatedLore || "", 20);
  const isLoreTyping =
    generatedLore && displayedLore.length < generatedLore.length;

  // ── Easter Egg Detection ──
  // bodyFat and posture are intentionally excluded — they don't affect matching
  const activeEgg = useEasterEgg({
    cuteness,
    confidence,
    tiliFactor,
    luzon,
    visayas,
    mindanao,
    hairAmount,
    facialHair,
    clothingStyle,
    hairColor,
    eyewear,
    skinColor,
  });

  const loadingSteps = [
    "Preparing clothing style",
    "Generating hairstyle",
    "Refining facial features",
    "Adjusting skin tone",
    "Configuring accessories",
    "Balancing body proportions",
    "Finalizing character pose",
  ];

  // MMR Calculation
  const calculateMMR = () => {
    const base = cuteness * 1.5 + confidence * 2.5 + tiliFactor * 2.0;
    const originBonus = (luzon + visayas + mindanao) / 2;
    const styleBonus = clothingStyle * 1.2;
    return Math.floor(base + originBonus + styleBonus);
  };

  useEffect(() => {
    setGeneratedMmr(calculateMMR());
  }, [
    cuteness,
    confidence,
    tiliFactor,
    luzon,
    visayas,
    mindanao,
    clothingStyle,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (loading && !showExitLoader) {
      interval = setInterval(() => {
        setLoadingStepIndex(
          (prevIndex) => (prevIndex + 1) % loadingSteps.length,
        );
      }, 3600);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, showExitLoader, loadingSteps.length]);

  // Load shipping data from localStorage on mount/account change
  useEffect(() => {
    if (!account?.address) return;

    const savedDataRaw = localStorage.getItem(
      `kapogian_shipping_${account.address}`,
    );
    if (savedDataRaw) {
      try {
        const data = JSON.parse(savedDataRaw);
        setShippingName(data.name ?? "");
        setShippingContact(data.contact ?? "");
        setStreetAddress(data.street ?? "");
        if (data.province) setSelectedProvince(data.province);
        if (data.city) setSelectedCity(data.city);
        if (data.barangay) setSelectedBarangay(data.barangay);
      } catch (e) {
        console.error("Failed to parse saved shipping data", e);
      }
    }
  }, [account?.address]);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setProvincesLoading(true);
      try {
        const response = await fetch("https://psgc.gitlab.io/api/provinces/");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces", error);
        setError("Could not load province data. Please try refreshing.");
      } finally {
        setProvincesLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const fetchCities = async () => {
        setCitiesLoading(true);
        try {
          const response = await fetch(
            `https://psgc.gitlab.io/api/provinces/${selectedProvince.code}/cities-municipalities/`,
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setCities(data);
        } catch (error) {
          console.error("Failed to fetch cities", error);
          setError("Could not load city data.");
        } finally {
          setCitiesLoading(false);
        }
      };

      if (selectedCity?.provinceCode === selectedProvince.code) {
        fetchCities();
      } else {
        setCities([]);
        setSelectedCity(null);
        setBarangays([]);
        setSelectedBarangay(null);
        fetchCities();
      }
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedProvince]);

  // Fetch barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      const fetchBarangays = async () => {
        setBarangaysLoading(true);
        try {
          const response = await fetch(
            `https://psgc.gitlab.io/api/cities-municipalities/${selectedCity.code}/barangays/`,
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setBarangays(data);
        } catch (error) {
          console.error("Failed to fetch barangays", error);
          setError("Could not load barangay data.");
        } finally {
          setBarangaysLoading(false);
        }
      };

      if (selectedBarangay?.cityCode === selectedCity.code) {
        fetchBarangays();
      } else {
        setBarangays([]);
        setSelectedBarangay(null);
        fetchBarangays();
      }
    } else {
      setBarangays([]);
      setSelectedBarangay(null);
    }
  }, [selectedCity]);

  const navigate = (targetId: string) => {
    setPage(targetId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderMarkdown = (text: string | null) => {
    if (!text) return null;
    let html = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const getIdentityContext = (id: string) => {
    switch (id) {
      case "Malakas":
        return "Male";
      case "Maganda":
        return "Female";
      case "Mahawari":
        return "Gay";
      case "Maharaba":
        return "Lesbian";
      default:
        return "Male";
    }
  };

  const generateName = async (): Promise<string> => {
    try {
      const context = getIdentityContext(gender);
      const excludeList =
        generatedNamesHistory.length > 0
          ? `Do not use any of these names: ${generatedNamesHistory.join(", ")}.`
          : "";

      const result = await generateText({
        prompt: `Generate a single unique name for a character who belongs to the ${gender} lineage (Identity Context: ${context}). The name can be from ANY country or culture in the world (Filipino, Spanish, Japanese, American, European, etc.). ${excludeList} Make it unique, catchy, and fitting for a heroic Chibi. Only return the name, no extra text.`,
      });

      const newName = result.text?.replace(/["']+/g, "") || "Pogi";
      setGeneratedNamesHistory((prev) => [...prev, newName]);
      return newName;
    } catch (e) {
      console.error("Name generation failed:", e);
      return "Pogi";
    }
  };

  const generateCountry = async (): Promise<string> => {
    try {
      const result = await generateText({
        prompt:
          "Generate a name of a foreign country, do not include any other text.",
      });
      return result.text?.replace(/["']+/g, "") || "a foreign land";
    } catch (e) {
      console.error("Country generation failed:", e);
      return "a foreign land";
    }
  };

  const generateLore = async (
    name: string,
    originDesc: string,
  ): Promise<string> => {
    try {
      const identityContext = getIdentityContext(gender);
      const promptText = `
        You are a lore generator for a fictional universe called "Kapogian Chibis".
        A Kapogian Chibi is a confident, good-looking Filipino character.
        Their stats are: Cuteness is ${cuteness} out of 100, Confidence is ${confidence} out of 100, and Tili Factor is ${tiliFactor} out of 100.
        Create a detailed lore for a Kapogian Chibi named **${name}**, a ${originDesc} of the ${gender} lineage.
        (Note to AI: ${gender} maps to ${identityContext} identity, but NEVER use the word "${identityContext.toLowerCase()}" in your response. Only use the term "${gender}").
        The lore should be about 150 words and include a backstory, personality description influenced by their stats, a heroic anecdote, and a concluding sentence.
        Do not mention the exact stat numbers in the narrative. Focus on the creative description.
        Use markdown formatting like bolding and italics to make the text stylish.`;

      const result = await generateText({
        prompt: promptText,
      });
      return result.text || "Failed to generate lore.";
    } catch (e) {
      console.error("Lore generation failed:", e);
      return "Failed to generate lore.";
    }
  };

  const buildCharacterPrompt = (name: string, originDesc: string): string => {
    const identityContext = getIdentityContext(gender);

    let pose = "standing confidently";
    if (cuteness > 30 && confidence > 30) {
      if (posture === 50) {
        pose =
          gender === "Maganda" || gender === "Mahawari"
            ? "striking a charming finger heart pose with a playful wink and high-fashion poise"
            : "striking a cool finger heart pose with a bold smirk";
      } else if (posture >= 20) {
        pose =
          gender === "Maganda" || gender === "Mahawari"
            ? "posing with high energy and sassy confidence, hand on hip"
            : "flexing heroically in a bodybuilder-inspired stance";
      } else {
        pose = "with a casual, charismatic pose, slightly flexing";
      }
    } else {
      if (posture === 50) {
        pose = "standing very well-postured and proud";
      } else if (posture > 20) {
        pose = "with an upright, well-postured stance";
      } else {
        pose = "with a very casual, relaxed posture";
      }
    }

    let hairDescriptor = "medium length hair";
    if (hairAmount <= 5)
      hairDescriptor =
        identityContext === "Female" || identityContext === "Lesbian"
          ? "stylish pixie cut"
          : "bald";
    else if (hairAmount <= 15) hairDescriptor = "short spiky hair";
    else if (hairAmount <= 35) hairDescriptor = "medium length hair";
    else hairDescriptor = "long, flowing hair";

    let facialHairDescriptor = "clean shaven";
    if (identityContext === "Male" || identityContext === "Gay") {
      if (facialHair > 5) facialHairDescriptor = "light stubble";
      if (facialHair > 20) facialHairDescriptor = "short, neat beard";
      if (facialHair > 40)
        facialHairDescriptor = "long, full beard and a stylish mustache";
    }

    let clothingDescriptor = "casual streetwear";
    if (clothingStyle <= 5)
      clothingDescriptor = "only a Sleeveless colored SHirt and shorts";
    else if (clothingStyle <= 15)
      clothingDescriptor = "simple t-shirt and shorts";
    else if (clothingStyle <= 30)
      clothingDescriptor = "stylish streetwear with a hoodie";
    else if (clothingStyle <= 45)
      clothingDescriptor =
        identityContext === "Female" || identityContext === "Gay"
          ? "fashionable modern attire"
          : "formal attire with a crisp polo";
    else
      clothingDescriptor =
        identityContext === "Female" || identityContext === "Gay"
          ? "elegant colorful Filipiniana attire"
          : "elegant filipino formal attire, like a barong tagalog";

    let hairColorDescriptor = "black hair";
    if (hairColor > 5) hairColorDescriptor = "dark brown hair";
    if (hairColor > 15) hairColorDescriptor = "light brown hair";
    if (hairColor > 30) hairColorDescriptor = "blonde hair";
    if (hairColor > 45) hairColorDescriptor = "white hair";

    let eyewearDescriptor = "no eyewear";
    if (eyewear > 5) eyewearDescriptor = "stylish eyeglasses";
    if (eyewear > 20) eyewearDescriptor = "cool sunglasses";
    if (eyewear > 40) eyewearDescriptor = "futuristic sporty eyewear";

    let skinColorDescriptor = "kayumangi skin";
    if (skinColor > 25)
      skinColorDescriptor = "dark-skinned, Aeta-like skin color";

    let bodyFatDescriptor = "";
    if (bodyFat <= 15) bodyFatDescriptor = "thin and slender body";
    else if (bodyFat <= 35) bodyFatDescriptor = "average body type";
    else bodyFatDescriptor = "chubby and plump body";

    let holdingItemDescriptor = "not holding anything";
    switch (holdingItem) {
      case "Cash":
        holdingItemDescriptor = "holding a wad of cash";
        break;
      case "Random Food":
        holdingItemDescriptor =
          "holding a plate of random Filipino food like Chicken Adobo, Pork BBQ, and Lechon";
        break;
      case "Random Bouquet of Flowers":
        holdingItemDescriptor =
          "holding a random bouquet of flowers, including roses, tulips, and sunflowers";
        break;
      case "Random Home Utensils":
        holdingItemDescriptor =
          "holding a random home utensil, such as a broomstick or a pan";
        break;
    }

    return `full body shot of a cute chubby chibi pinoy character of the ${gender} lineage (${identityContext}), named ${name}, ${originDesc}, with ${skinColorDescriptor}, with ${hairColorDescriptor} and ${hairDescriptor}, ${facialHairDescriptor}, wearing ${clothingDescriptor}, with ${eyewearDescriptor}, ${bodyFatDescriptor}, ${pose}, ${holdingItemDescriptor}, showing confident pose, smiling. Chibi character art, clean vector line art, cel-shaded, sticker style, simple white background.`;
  };

  const handleShuffle = () => {
    setCuteness(Math.floor(Math.random() * 101));
    setConfidence(Math.floor(Math.random() * 101));
    setTiliFactor(Math.floor(Math.random() * 101));
    setLuzon(Math.floor(Math.random() * 51));
    setVisayas(Math.floor(Math.random() * 51));
    setMindanao(Math.floor(Math.random() * 51));
    setHairAmount(Math.floor(Math.random() * 51));
    setFacialHair(Math.floor(Math.random() * 51));
    setClothingStyle(Math.floor(Math.random() * 51));
    setHairColor(Math.floor(Math.random() * 51));
    setEyewear(Math.floor(Math.random() * 51));
    setSkinColor(Math.floor(Math.random() * 51));
    setBodyFat(Math.floor(Math.random() * 51));
    setPosture(Math.floor(Math.random() * 51));
    setGeneratedMmr(Math.floor(Math.random() * 1001));

    const items = [
      "None",
      "Cash",
      "Random Food",
      "Random Bouquet of Flowers",
      "Random Home Utensils",
    ];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setHoldingItem(randomItem);
  };

  const handleGenerate = async () => {
    let shuffleInterval: NodeJS.Timeout | undefined;
    let eggTimer1: NodeJS.Timeout | undefined;
    let eggTimer2: NodeJS.Timeout | undefined;

    try {
      setLoading(true);
      setShowExitLoader(false);
      setError("");
      setGeneratedImage(null);
      setGeneratedLore(null);
      setGeneratedImageBlob(null);
      setGeneratedName("");
      setOriginDescription("");
      setTxHash("");
      setLoadingStepIndex(0);
      setGeneratedMmr(calculateMMR());
      // Clear any previous egg overrides
      setEggRank(null);
      setEggLineage(null);

      shuffleInterval = setInterval(() => {
        setShufflingMmr(Math.floor(Math.random() * 999));
      }, 75);

      navigate("page-preview");

      // ── Easter Egg Short-Circuit ──
      if (activeEgg) {
        // Stage 1: run the normal loading GIF + step text for 8 seconds
        // (the existing loadingStepIndex interval drives the text cycling)

        // Stage 2: swap to exit GIF at 8s
        eggTimer1 = setTimeout(() => {
          setShowExitLoader(true);
        }, 8000);

        // Stage 3: reveal at 10s — same timing feel as normal generation
        eggTimer2 = setTimeout(() => {
          if (shuffleInterval) clearInterval(shuffleInterval);
          setGeneratedName(activeEgg.name);
          setOriginDescription("a legend of the Kapogian realm");
          setGeneratedLore(activeEgg.lore);
          setGeneratedImage(activeEgg.imagePath);
          setGeneratedImageBlob(null);
          // Set the easter egg's custom stats
          setGeneratedMmr(activeEgg.mmr);
          setEggRank(activeEgg.rank);
          setEggLineage(activeEgg.lineage);
          setLoading(false);
          setShowExitLoader(false);
        }, 10000);

        return;
      }

      // Step 1: Generate name and origin description
      const namePromise = characterName
        ? Promise.resolve(characterName)
        : generateName();

      const originPromise = (async () => {
        if (luzon === 0 && visayas === 0 && mindanao === 0) {
          const country = await generateCountry();
          return `a naturalized Filipino from ${country}`;
        } else {
          const origins = [
            { region: "Luzon", value: luzon },
            { region: "Visayas", value: visayas },
            { region: "Mindanao", value: mindanao },
          ];
          origins.sort((a, b) => b.value - a.value);
          return `a native of the ${origins[0].region} region of the Philippines`;
        }
      })();

      const [nameToUse, originDesc] = await Promise.all([
        namePromise,
        originPromise,
      ]);

      // Step 2: Build prompt and run image/lore generation in parallel
      const fullPrompt = buildCharacterPrompt(nameToUse, originDesc);

      const imagePromise = generateImage({ prompt: fullPrompt });
      const lorePromise = generateLore(nameToUse, originDesc);

      const [imageResult, loreResult] = await Promise.all([
        imagePromise,
        lorePromise,
      ]);

      // Step 3: Process image result
      const imageUrl = imageResult?.imageUrl;
      if (!imageUrl) throw new Error("No image data received from the API.");

      const base64Data = imageUrl.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Step 4: Trigger exit animation then update state
      setShowExitLoader(true);
      setTimeout(() => {
        if (shuffleInterval) clearInterval(shuffleInterval);
        setGeneratedName(nameToUse);
        setOriginDescription(originDesc);
        setGeneratedImageBlob(blob);
        setGeneratedImage(imageUrl);
        setGeneratedLore(loreResult);
        setLoading(false);
        setShowExitLoader(false);
      }, 6500);
    } catch (err: any) {
      if (shuffleInterval) clearInterval(shuffleInterval);
      if (eggTimer1) clearTimeout(eggTimer1);
      if (eggTimer2) clearTimeout(eggTimer2);
      console.error("Generation failed:", err);
      setError(
        err.message || "Failed to generate character. Please try again.",
      );
      setLoading(false);
      setShowExitLoader(false);
    }
  };

  const saveShippingToLocal = () => {
    if (!account?.address) return;

    const data = {
      name: shippingName,
      contact: shippingContact,
      province: selectedProvince,
      city: selectedCity,
      barangay: selectedBarangay,
      street: streetAddress,
    };

    localStorage.setItem(
      `kapogian_shipping_${account.address}`,
      JSON.stringify(data),
    );
    console.log("📦 Shipping info saved to local storage.");
  };

  const handleMint = async () => {
    if (!generatedImageBlob && !eggRank) {
      setError("Character data is missing.");
      return;
    }
    if (!account || !account.address) {
      setError("Wallet not connected or address is missing.");
      return;
    }

    setMinting(true);
    setError("");

    let imageHash: string | null = null;

    try {
      const { valid, errors, fullAddress } = validateShippingInfo(
        { full_name: shippingName, contact_number: shippingContact },
        {
          province: selectedProvince,
          city: selectedCity,
          barangay: selectedBarangay,
          street_address: streetAddress,
        },
      );

      if (!valid) {
        setError(errors.join(" "));
        setMinting(false);
        return;
      }

      const encryptedString = await encryptShippingInfo({
        full_name: shippingName,
        contact_number: shippingContact,
        address: fullAddress,
      });

      const hoodieColorObject = merchProducts.hoodie.colors.find(
        (c) => c.value === hoodieColor,
      );
      const hoodieColorName = hoodieColorObject
        ? hoodieColorObject.name
        : "Black";

      let itemsSelected = "";
      switch (selection) {
        case "Tee":
          itemsSelected = `SHIRT-${shirtSize}`;
          break;
        case "Mug":
          itemsSelected = "MUG";
          break;
        case "Pad":
          itemsSelected = "MOUSEPAD";
          break;
        case "Hoodie":
          itemsSelected = `HOODIE-${hoodieColorName.toUpperCase()}-${hoodieSize}`;
          break;
        case "Bundle":
          itemsSelected = `ALL_BUNDLE,SHIRT-${shirtSize},HOODIE-${hoodieColorName.toUpperCase()}-${hoodieSize}`;
          break;
        default:
          setError("Invalid merchandise selection.");
          setMinting(false);
          return;
      }

      let finalImageUrl = generatedImage;
      if (generatedImageBlob) {
        console.log("📤 Uploading to IPFS...");
        const { imageUrl, imageHash: imgHash } = await uploadCharacterToIPFS(
          generatedImageBlob,
          { name: generatedName },
        );
        finalImageUrl = imageUrl;
        imageHash = imgHash;
        console.log("✅ IPFS upload complete:", finalImageUrl);
      }

      console.log("⛓️ Minting on SUI blockchain...");
      const plainTextLore = (
        generatedLore || `A Kapogian character from ${originDescription}`
      ).replace(/\*/g, "");

      const result = await mintCharacterNFT({
        name: generatedName,
        description: plainTextLore,
        imageUrl: finalImageUrl!,
        attributes: JSON.stringify({
          lineage: gender,
          rank: displayRank,
          cuteness,
          confidence,
          tiliFactor,
          luzon,
          visayas,
          mindanao,
          hairAmount,
          facialHair,
          clothingStyle,
          hairColor,
          eyewear,
          skinColor,
          bodyFat,
          posture,
          holdingItem,
        }),
        mmr: generatedMmr,
        itemsSelected: itemsSelected,
        encryptedShippingInfo: encryptedString,
        encryptionPubkey: ENCRYPTION_CONFIG.adminPublicKey,
        walletAddress: account.address,
        signAndExecute,
      });
      console.log("✅ Mint successful!", result);

      if ("digest" in result) {
        setTxHash(result.digest);
        saveShippingToLocal();
        navigate("page-receipt");
      } else {
        throw new Error("Minting did not return a transaction digest.");
      }
    } catch (err: any) {
      console.error("❌ Mint failed:", err);
      setError(err.message || "Failed to mint NFT. Please try again.");
      if (imageHash) {
        await unpinFromIPFS(imageHash);
      }
    } finally {
      setMinting(false);
    }
  };

  const handleContinueToShipping = () => {
    if (!selection) {
      setError("Please select at least one merchandise item or the bundle.");
      return;
    }
    if ((selection === "Tee" || selection === "Bundle") && !shirtSize) {
      setError("Please select a T-shirt size.");
      return;
    }
    if (
      (selection === "Hoodie" || selection === "Bundle") &&
      (!hoodieSize || !hoodieColor)
    ) {
      setError("Please select a hoodie color and size.");
      return;
    }
    setError("");
    navigate("page-shipping");
  };

  const handleProvinceChange = (provinceCode: string) => {
    const province = provinces.find((p) => p.code === provinceCode) || null;
    setSelectedProvince(province);
  };

  const handleCityChange = (cityCode: string) => {
    const city = cities.find((c) => c.code === cityCode) || null;
    setSelectedCity(city);
  };

  const handleBarangayChange = (barangayCode: string) => {
    const barangay = barangays.find((b) => b.code === barangayCode) || null;
    setSelectedBarangay(barangay);
  };

  const lineageColors: { [key: string]: string } = {
    Malakas: "bg-blue-500",
    Maganda: "bg-pink-500",
    Mahawari: "bg-violet-500",
    Maharaba: "bg-rose-700",
  };

  // Derived display values — egg overrides win when set
  const displayRank = eggRank
    ? eggRank
    : generatedMmr > 800
      ? "Mythic"
      : generatedMmr > 500
        ? "Elite"
        : "Adept";

  const displayLineage = eggLineage ? eggLineage : gender || "Ancient";

  const isEggActive = !!eggRank; // true after an egg has been revealed

  if (!account) {
    return (
      <>
        <PageHeader />
        <div className="relative min-h-screen p-4 md:p-8 flex items-center justify-center text-lg text-black antialiased">
          <Image
            src="/images/kapogian_background.png"
            alt="Generate background"
            fill
            className="object-cover -z-10"
            priority
          />
          <main className="relative w-full max-w-md bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col p-8 text-center">
            <h2 className="font-display text-3xl font-semibold mb-4">
              Wallet Required
            </h2>
            <p className="text-stone-600 mb-6">
              Please connect your SUI wallet to generate a Kapogian character.
            </p>
            <div className="flex justify-center">
              <CustomConnectButton className="!bg-accent !hover:bg-blue-500 !text-accent-foreground !comic-border !rounded-full !px-6 !py-2 !font-headline !text-lg !h-auto" />
            </div>
          </main>
        </div>
        <PageFooter />
      </>
    );
  }

  const SIZES = ["S", "M", "L", "XL"];

  const renderMerchControls = () => {
    const activeProductKey = selection?.toLowerCase() as
      | keyof typeof merchProducts
      | null;

    if (selection === "Bundle") {
      const teeColorObject = merchProducts.tee.colors.find(
        (c) => c.value === teeColor,
      );
      const teeImage = teeColorObject
        ? teeColorObject.image
        : merchProducts.tee.colors[0]!.image;
      const mugColorObject = merchProducts.mug.colors.find(
        (c) => c.value === mugColor,
      );
      const mugImage = mugColorObject
        ? mugColorObject.image
        : merchProducts.mug.colors[0]!.image;
      const hoodieColorObject = merchProducts.hoodie.colors.find(
        (c) => c.value === hoodieColor,
      );
      const hoodieImage = hoodieColorObject
        ? hoodieColorObject.image
        : merchProducts.hoodie.colors[0]!.image;

      return (
        <div id="bundle-view" className="transition-opacity duration-300 mb-8">
          <div className="bg-white border-4 border-black rounded-2xl hard-shadow p-6 space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-2">
              <h2
                className="text-2xl font-bold uppercase tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Customize Bundle
              </h2>
              <span className="bg-yellow-300 border-2 border-black px-3 py-1 rounded-md text-xs font-bold uppercase">
                Save 20%
              </span>
            </div>

            {/* Bundle Item: Tee */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border-2 border-black/10">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src={teeImage}
                  alt="Tee"
                  width={64}
                  height={64}
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between mb-2">
                  <span className="font-bold uppercase text-sm">
                    Tee Configuration
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex gap-2">
                    {merchProducts.tee.colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTeeColor(c.value)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black",
                          teeColor === c.value &&
                            "ring-1 ring-offset-1 ring-black scale-110",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <div className="h-6 w-0.5 bg-gray-300 hidden md:block" />
                  <div className="flex gap-1">
                    {merchProducts.tee.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setShirtSize(s)}
                        className={cn(
                          "w-8 h-8 rounded border border-black text-xs font-bold",
                          shirtSize === s
                            ? "bg-black text-white"
                            : "bg-white text-black",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Item: Mug */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border-2 border-black/10">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src={mugImage}
                  alt="Mug"
                  width={64}
                  height={64}
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between mb-2">
                  <span className="font-bold uppercase text-sm">
                    Mug Configuration
                  </span>
                </div>
                <div className="flex gap-2">
                  {merchProducts.mug.colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setMugColor(c.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black",
                        mugColor === c.value &&
                          "ring-1 ring-offset-1 ring-black scale-110",
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bundle Item: Hoodie */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border-2 border-black/10">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src={hoodieImage}
                  alt="Hoodie"
                  width={64}
                  height={64}
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between mb-2">
                  <span className="font-bold uppercase text-sm">
                    Hoodie Configuration
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex gap-2">
                    {merchProducts.hoodie.colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setHoodieColor(c.value)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black",
                          hoodieColor === c.value &&
                            "ring-1 ring-offset-1 ring-black scale-110",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <div className="h-6 w-0.5 bg-gray-300 hidden md:block" />
                  <div className="flex gap-1">
                    {merchProducts.hoodie.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setHoodieSize(s)}
                        className={cn(
                          "w-8 h-8 rounded border border-black text-xs font-bold",
                          hoodieSize === s
                            ? "bg-black text-white"
                            : "bg-white text-black",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!activeProductKey || !merchProducts[activeProductKey]) return null;
    const product =
      merchProducts[activeProductKey as keyof typeof merchProducts];
    const Icon = product.icon;

    let currentImageUrl = "";
    let selectedColorValue: string | undefined = undefined;

    if ("image" in product && typeof product.image === "string") {
      currentImageUrl = product.image;
    } else if (product.colors.length > 0) {
      if (activeProductKey === "tee") selectedColorValue = teeColor;
      else if (activeProductKey === "mug") selectedColorValue = mugColor;
      else if (activeProductKey === "hoodie") selectedColorValue = hoodieColor;

      const selectedColorObject = product.colors.find(
        (c) => c.value === selectedColorValue,
      );
      currentImageUrl = selectedColorObject
        ? selectedColorObject.image
        : product.colors[0]!.image;
    }

    return (
      <div id="single-view" className="transition-opacity duration-300">
        <div className="bg-white border-4 border-black rounded-2xl hard-shadow mb-8 p-6 md:p-8 flex flex-col items-center justify-center relative min-h-[320px]">
          <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center transition-all duration-300 mb-6">
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt={product.name}
                width={224}
                height={224}
                className="object-contain"
                unoptimized
              />
            ) : (
              <Icon className="text-[10rem] drop-shadow-xl" />
            )}
          </div>
          <div className="w-full max-w-md mx-auto space-y-5">
            <div className="flex justify-between items-end border-b-2 border-black pb-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                {product.name}
              </h2>
              <span className="text-lg font-bold">10 SUI</span>
            </div>
            <div className="space-y-4">
              {product.colors.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {product.colors.map((c) => {
                    const isActive = selectedColorValue === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => {
                          if (activeProductKey === "tee") setTeeColor(c.value);
                          if (activeProductKey === "mug") setMugColor(c.value);
                          if (activeProductKey === "hoodie")
                            setHoodieColor(c.value);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 border-black transition-transform hover:scale-110",
                          isActive && "ring-2 ring-offset-2 ring-black",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    );
                  })}
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {product.sizes.map((s) => {
                    const isActive =
                      (activeProductKey === "tee" && shirtSize === s) ||
                      (activeProductKey === "hoodie" && hoodieSize === s);
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          if (activeProductKey === "tee") setShirtSize(s);
                          if (activeProductKey === "hoodie") setHoodieSize(s);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 border-black font-bold text-sm transition-colors",
                          isActive
                            ? "bg-black text-white"
                            : "bg-white hover:bg-gray-100",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader />
      <div className="relative min-h-screen p-4 md:p-8 flex items-center justify-center text-lg text-black antialiased pt-28 md:pt-32">
        <Image
          src="/images/kapogian_background.png"
          alt="Generate background"
          fill
          className="object-cover -z-10"
          priority
        />
        <main className="generate-page relative w-full max-w-4xl bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col">
          <header className="bg-black text-white p-4 border-b-4 border-black flex justify-between items-center">
            <div className="w-1/3" />
            <div className="w-1/3 flex justify-center items-center gap-2">
              <Package className="w-6 h-6 text-yellow-400" />
              <span className="font-display font-semibold tracking-tight text-xl text-yellow-400">
                KAPOGIAN CUSTOMIZATION
              </span>
            </div>
            <div className="w-1/3 flex justify-end gap-2">
              <div
                className="w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse"
                style={{ boxShadow: "0 0 8px #ef4444" }}
              />
              <div
                className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white animate-pulse"
                style={{ animationDelay: "200ms", boxShadow: "0 0 8px #f59e0b" }}
              />
              <div
                className="w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse"
                style={{ animationDelay: "400ms", boxShadow: "0 0 8px #22c55e" }}
              />
            </div>
          </header>

          <div className="bg-stone-50 min-h-[600px] relative">
            {/* ═══════════════════════════════════════════════
                PAGE: GENERATOR
            ═══════════════════════════════════════════════ */}
            <section
              id="page-generator"
              className={cn(
                "page-section p-6 md:p-8 flex flex-col gap-8 h-full",
                { hidden: page !== "generator" },
              )}
            >
              <div className="text-center space-y-2">
                <h1 className="font-display text-4xl font-semibold tracking-tight uppercase">
                  Kapogian Spirit Summoner
                </h1>
                <p className="text-xl text-stone-600 font-medium max-w-lg mx-auto">
                  Summon a unique character image and its corresponding lore for
                  your collection.
                </p>
              </div>

              <div className="border-4 border-black rounded-2xl bg-white hard-shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
                <div className="absolute top-2 right-2 z-50 rotate-12 bg-yellow-400 text-black text-xs font-bold px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_#000]">
                  NEW!
                </div>

                <div className="space-y-6">
                  <div className="p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                    <h3 className="font-display font-semibold text-lg text-stone-500 uppercase mb-4">
                      Character Lineage
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {["Malakas", "Maganda", "Mahawari", "Maharaba"].map(
                        (g) => (
                          <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={cn(
                              "py-3 text-xs font-display font-bold rounded-lg transition-all border-2 border-black hard-shadow-sm active:translate-y-1 active:shadow-none",
                              gender === g
                                ? `${lineageColors[g]} text-white`
                                : "bg-white text-black hover:bg-stone-100",
                            )}
                          >
                            {g.toUpperCase()}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-display font-semibold text-xl uppercase">
                      Character Name
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank for random..."
                      className="w-full border-4 border-black rounded-lg p-3 text-lg font-medium outline-none focus:ring-4 ring-yellow-300 transition-all placeholder:text-stone-400"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                    <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">
                      Enchantments
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Cuteness</span><span>{cuteness}</span>
                      </div>
                      <input type="range" min="0" max="100" value={cuteness}
                        onChange={(e) => setCuteness(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Confidence</span><span>{confidence}</span>
                      </div>
                      <input type="range" min="0" max="100" value={confidence}
                        onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Tili Factor</span><span>{tiliFactor}</span>
                      </div>
                      <input type="range" min="0" max="100" value={tiliFactor}
                        onChange={(e) => setTiliFactor(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                    <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">
                      Origin Stats
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Luzon</span><span>{luzon}</span>
                      </div>
                      <input type="range" min="0" max="50" value={luzon}
                        onChange={(e) => setLuzon(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Visayas</span><span>{visayas}</span>
                      </div>
                      <input type="range" min="0" max="50" value={visayas}
                        onChange={(e) => setVisayas(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>Mindanao</span><span>{mindanao}</span>
                      </div>
                      <input type="range" min="0" max="50" value={mindanao}
                        onChange={(e) => setMindanao(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-4 border-black bg-blue-50 rounded-xl p-5 space-y-4 relative">
                    <div className="absolute -top-4 left-4 bg-black text-white px-3 py-1 font-display font-semibold text-sm border-2 border-white rounded-full">
                      PORMA CONTROLS
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Clothing Style: {clothingStyle}</label>
                        <input type="range" min="0" max="50" value={clothingStyle}
                          onChange={(e) => setClothingStyle(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Hair Amount: {hairAmount}</label>
                        <input type="range" min="0" max="50" value={hairAmount}
                          onChange={(e) => setHairAmount(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Hair Color: {hairColor}</label>
                        <input type="range" min="0" max="50" value={hairColor}
                          onChange={(e) => setHairColor(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Facial Hair: {facialHair}</label>
                        <input type="range" min="0" max="50" value={facialHair}
                          onChange={(e) => setFacialHair(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Eyewear: {eyewear}</label>
                        <input type="range" min="0" max="50" value={eyewear}
                          onChange={(e) => setEyewear(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Skin Tone: {skinColor}</label>
                        <input type="range" min="0" max="50" value={skinColor}
                          onChange={(e) => setSkinColor(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Body Fat: {bodyFat}</label>
                        <input type="range" min="0" max="50" value={bodyFat}
                          onChange={(e) => setBodyFat(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold">Posture: {posture}</label>
                        <input type="range" min="0" max="50" value={posture}
                          onChange={(e) => setPosture(Number(e.target.value))} className="w-full" />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-sm font-semibold">
                        Held Item (Food/Flower)
                      </label>
                      <div className="relative">
                        <select
                          value={holdingItem}
                          onChange={(e) => setHoldingItem(e.target.value)}
                          className="w-full border-2 border-black rounded-lg p-2 bg-white font-medium"
                        >
                          <option value="None">Nothing</option>
                          <option value="Cash">Cash</option>
                          <option value="Random Food">Filipino Food</option>
                          <option value="Random Bouquet of Flowers">Flowers</option>
                          <option value="Random Home Utensils">Home Utensils</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <button
                      onClick={handleShuffle}
                      disabled={loading}
                      className="w-full bg-yellow-400 text-black border-4 border-black rounded-xl py-3 px-6 text-xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Shuffle className="w-7 h-7" />
                      Shuffle
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full bg-green-400 text-black border-4 border-black rounded-xl py-4 px-6 text-2xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <LoaderCircle className="w-8 h-8 animate-spin" />
                      ) : (
                        <Sparkles className="w-8 h-8" />
                      )}
                      {loading ? "Generating..." : "Summon"}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-4 text-sm text-center bg-red-100 p-3 rounded-lg border border-red-300 text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════
                PAGE: PREVIEW
            ═══════════════════════════════════════════════ */}
            <section
              id="page-preview"
              className={cn("page-section flex flex-col h-full", {
                hidden: page !== "page-preview",
              })}
            >
              <div className="flex flex-col md:flex-row border-b-4 border-black">
                <div className="flex flex-col w-full border-4 border-black bg-white overflow-hidden">
                  {/* TOP: Image + Lore */}
                  <div className="flex flex-col md:flex-row border-b-4 border-black">
                    {/* LEFT: Image / Loader */}
                    <div className="relative w-full md:w-1/2 bg-stone-100 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[300px] md:min-h-[450px]">
                      {loading ? (
                        showExitLoader ? (
                          /* STAGE 2: Exit GIF */
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                              src="/images/finalexit.gif"
                              alt="Finishing up..."
                              width={400}
                              height={400}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          /* STAGE 1: Primary loader — same for both normal & easter egg */
                          <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <Image
                              src="/images/loadscreens.gif"
                              alt="Generating..."
                              width={400}
                              height={400}
                              className="object-contain"
                              unoptimized
                            />
                            <p
                              key={loadingStepIndex}
                              style={{ fontSize: "16px" }}
                              className="font-semibold h-6 animate__animated animate__fadeIn mt-2 text-stone-600"
                            >
                              {loadingSteps[loadingStepIndex]}...
                            </p>
                          </div>
                        )
                      ) : generatedImage ? (
                        /* REVEALED */
                        <Image
                          src={generatedImage}
                          alt="Kapogian Character"
                          width={512}
                          height={512}
                          className="animate__animated animate__zoomIn"
                        />
                      ) : (
                        /* ERROR */
                        <div className="flex flex-col items-center justify-center w-full h-full text-stone-500">
                          <Ghost size={48} className="mb-2" />
                          <p style={{ fontSize: "16px" }} className="font-semibold">
                            Summon failed or not started
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Lore */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
                      <div className="mb-6">
                        {loading ? (
                          <Skeleton className="h-10 w-48" />
                        ) : (
                          <h1
                            style={{ fontSize: "42px" }}
                            className={cn(
                              "font-display font-bold uppercase tracking-tight leading-none inline-block animate__animated animate__fadeInUp",
                              isEggActive
                                ? "border-b-8 border-yellow-400"
                                : "border-b-8 border-yellow-300",
                            )}
                          >
                            {generatedName || "..."}
                          </h1>
                        )}
                      </div>

                      <div
                        style={{ fontSize: "16px" }}
                        className="font-medium text-stone-700 leading-relaxed max-h-64 overflow-y-auto pr-2 custom-scrollbar animate__animated animate__fadeInUp"
                      >
                        {loading || !generatedLore ? (
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[85%]" />
                          </div>
                        ) : (
                          renderMarkdown(generatedLore)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: 4-column stat bar */}
                  <div className="flex flex-col md:flex-row w-full divide-y-4 md:divide-y-0 md:divide-x-4 divide-black bg-white">
                    {/* 1. Title */}
                    <div className="flex-1 p-6 flex items-center justify-center text-center">
                      <h3
                        style={{ fontSize: "24px" }}
                        className="font-display font-bold uppercase tracking-tighter"
                      >
                        Game Stats
                      </h3>
                    </div>

                    {/* 2. Battle MMR */}
                    <div className="flex-1 p-6 bg-white flex flex-col items-center justify-center border-black">
                      <p
                        style={{ fontSize: "14px" }}
                        className="font-bold text-stone-500 uppercase tracking-widest mb-1"
                      >
                        Battle MMR
                      </p>
                      {loading ? (
                        <p
                          style={{ fontSize: "24px" }}
                          className="font-display font-bold uppercase leading-none text-black/50 w-24 text-center"
                        >
                          {shufflingMmr.toString().padStart(3, "0")}
                        </p>
                      ) : (
                        <p
                          style={{ fontSize: "24px" }}
                          className={cn(
                            "font-display font-bold uppercase leading-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] animate__animated animate__fadeInUp",
                            isEggActive ? "text-yellow-500" : "text-black",
                          )}
                        >
                          {generatedMmr}
                        </p>
                      )}
                    </div>

                    {/* 3. Rank */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white">
                      <p className="text-[14px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                        Rank
                      </p>
                      {loading ? (
                        <Skeleton className="h-6 w-24 mt-1" />
                      ) : (
                        <h3
                          style={{ fontSize: "24px" }}
                          className={cn(
                            "font-display font-bold uppercase leading-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] animate__animated animate__fadeInUp",
                            isEggActive ? "text-yellow-500" : "text-black",
                          )}
                        >
                          {displayRank}
                        </h3>
                      )}
                    </div>

                    {/* 4. Lineage */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white">
                      <p className="text-[14px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                        Lineage
                      </p>
                      {loading ? (
                        <Skeleton className="h-6 w-32 mt-1" />
                      ) : (
                        <p
                          style={{ fontSize: "24px" }}
                          className={cn(
                            "font-display font-bold uppercase leading-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] animate__animated animate__fadeInUp",
                            isEggActive ? "text-yellow-500" : "text-black",
                          )}
                        >
                          {displayLineage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex justify-between items-center border-t-4 border-black bg-stone-100">
                <button
                  onClick={() => navigate("generator")}
                  disabled={loading}
                  className="bg-white text-black border-4 border-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hard-shadow-sm hard-shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[2.5]" />
                </button>
                <div className="text-center">
                  {loading ? (
                    <>
                      <p className="font-display font-semibold text-lg uppercase">
                        Summoning in Progress...
                      </p>
                      <p className="text-sm text-stone-500">
                        Please wait, this can take a moment.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display font-semibold text-lg uppercase">
                        Character Confirmed!
                      </p>
                      <p className="text-sm text-stone-500">
                        Next, select your merch.
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => navigate("page-merch")}
                  disabled={loading}
                  className="bg-pink-500 text-white border-4 border-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hard-shadow-sm hard-shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-pink-300"
                >
                  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 stroke-[2.5]" />
                </button>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════
                PAGE: MERCH
            ═══════════════════════════════════════════════ */}
            <section
              id="page-merch"
              className={cn(
                "page-section flex flex-col h-full bg-blue-500",
                { hidden: page !== "page-merch" },
              )}
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #60a5fa 25%, transparent 25%, transparent 75%, #60a5fa 75%, #60a5fa), linear-gradient(45deg, #60a5fa 25%, transparent 25%, transparent 75%, #60a5fa 75%, #60a5fa)",
                backgroundPosition: "0 0, 20px 20px",
                backgroundSize: "40px 40px",
              }}
            >
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 border-b-4 border-black">
                <div>
                  <h1
                    className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase drop-shadow-sm"
                    style={{ textShadow: "2px 2px 0px black" }}
                  >
                    The Stylist Shop
                  </h1>
                  <div className="inline-flex items-center gap-2 mt-2 bg-black px-3 py-1 rounded-full shadow-[2px_2px_0px_#000]">
                    <Sparkles className="text-yellow-400 text-sm w-4 h-4" />
                    <span className="text-xs font-bold tracking-tight uppercase text-white">
                      Season 2 Collection
                    </span>
                  </div>
                </div>
                <div className="mt-2 md:mt-0 bg-white border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_#000]">
                  <span className="text-black font-bold tracking-tight uppercase text-sm">
                    Cart: {selection === "Bundle" ? 4 : selection ? 1 : 0} items
                  </span>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow p-6 md:p-8">
                {renderMerchControls()}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {(
                    Object.keys(merchProducts) as Array<
                      keyof typeof merchProducts
                    >
                  ).map((key) => {
                    const product =
                      merchProducts[key as keyof typeof merchProducts];
                    const Icon = product.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelection(product.name)}
                        className={cn(
                          "group bg-white rounded-xl border-4 border-black p-4 flex flex-col items-center hard-shadow hover:-translate-y-1 transition-all",
                          selection === product.name &&
                            "translate-y-1 shadow-none bg-yellow-300",
                        )}
                      >
                        <Icon className="text-4xl mb-2" />
                        <span className="text-sm font-bold uppercase tracking-tight">
                          {product.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  onClick={() => setSelection("Bundle")}
                  className={cn(
                    "relative bg-yellow-400 border-4 border-black rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 hard-shadow hover:-translate-y-1 transition-all cursor-pointer group",
                    selection === "Bundle" &&
                      "translate-y-1 shadow-none bg-yellow-300",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-black bg-white flex items-center justify-center group-hover:bg-black transition-colors">
                      <ShoppingBag className="text-xl text-black group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold uppercase tracking-tight leading-none">
                        The All-In Bundle
                      </h3>
                      <p className="text-xs font-bold text-black/70 mt-1 uppercase tracking-wide">
                        Includes Tee, Mug, Pad, Hoodie
                      </p>
                    </div>
                  </div>
                  <div className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-tight whitespace-nowrap">
                    Upgrade Bundle
                  </div>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center border-t-4 border-black bg-blue-500 shrink-0">
                <button
                  onClick={() => navigate("page-preview")}
                  className="bg-white text-black border-4 border-black rounded-full w-14 h-14 flex items-center justify-center hard-shadow-sm hard-shadow-hover transition-all"
                >
                  <ArrowLeft className="w-8 h-8 stroke-[2.5]" />
                </button>
                {error && (
                  <div className="text-sm text-center bg-red-100 p-2 rounded-lg border border-red-300 text-red-700 max-w-xs">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleContinueToShipping}
                  className="bg-green-400 text-black border-4 border-black rounded-full w-14 h-14 flex items-center justify-center hard-shadow-sm hard-shadow-hover transition-all"
                >
                  <ArrowRight className="w-8 h-8 stroke-[2.5]" />
                </button>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════
                PAGE: SHIPPING
            ═══════════════════════════════════════════════ */}
            <section
              id="page-shipping"
              className={cn(
                "page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-sky-100",
                { hidden: page !== "page-shipping" },
              )}
            >
              <div className="w-full max-w-md bg-white border-4 border-black rounded-2xl p-8 hard-shadow-sm relative">
                <div className="absolute -top-6 -left-6 bg-red-500 text-white font-display font-semibold px-4 py-2 rotate-[-6deg] border-4 border-black rounded-lg shadow-md uppercase">
                  Fragile!
                </div>
                <h2 className="font-display text-3xl font-semibold mb-6 border-b-4 border-stone-200 pb-2">
                  Shipping Details
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">Full Name</label>
                    <Input
                      type="text"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">Contact Number</label>
                    <Input
                      type="text"
                      value={shippingContact}
                      onChange={(e) => setShippingContact(e.target.value)}
                      className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto"
                      placeholder="09123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">Province</label>
                    <Select
                      onValueChange={handleProvinceChange}
                      value={selectedProvince?.code}
                      disabled={provincesLoading}
                    >
                      <SelectTrigger className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto">
                        <SelectValue placeholder={provincesLoading ? "Loading provinces..." : "Select Province"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">City / Municipality</label>
                    <Select
                      onValueChange={handleCityChange}
                      value={selectedCity?.code}
                      disabled={!selectedProvince || citiesLoading}
                    >
                      <SelectTrigger
                        className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto"
                        disabled={!selectedProvince || citiesLoading}
                      >
                        <SelectValue placeholder={citiesLoading ? "Loading cities..." : "Select City/Municipality"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">Barangay</label>
                    <Select
                      onValueChange={handleBarangayChange}
                      value={selectedBarangay?.code}
                      disabled={!selectedCity || barangaysLoading}
                    >
                      <SelectTrigger
                        className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto"
                        disabled={!selectedCity || barangaysLoading}
                      >
                        <SelectValue placeholder={barangaysLoading ? "Loading barangays..." : "Select Barangay"} />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((b) => (
                          <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold uppercase text-sm tracking-wide">
                      Street Address, House/Bldg No.
                    </label>
                    <Input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all !h-auto"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMint}
                  disabled={minting}
                  className="mt-8 w-full bg-blue-500 text-white border-4 border-black rounded-xl py-3 text-xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {minting ? (
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                  ) : (
                    <Truck className="w-6 h-6" />
                  )}
                  {minting ? "Minting & Shipping..." : "Ship It"}
                </button>
                {error && (
                  <div className="mt-4 text-sm text-center bg-red-100 p-3 rounded-lg border border-red-300 text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════
                PAGE: RECEIPT
            ═══════════════════════════════════════════════ */}
            <section
              id="page-receipt"
              className={cn(
                "page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-green-200",
                { hidden: page !== "page-receipt" },
              )}
            >
              <div className="w-full max-w-sm bg-white border-x-4 border-t-4 border-b-[12px] border-dotted border-black rounded-t-xl relative p-6 shadow-2xl">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-200 rounded-full border-4 border-black" />
                <div className="text-center mb-6 border-b-2 border-dashed border-stone-300 pb-4">
                  <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">
                    Order Receipt
                  </h2>
                  <p className="text-stone-500 font-medium text-sm mt-1">
                    Order #{txHash.substring(0, 8)}
                  </p>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="w-20 h-20 bg-stone-100 border-2 border-black rounded-md shrink-0 overflow-hidden">
                    {generatedImage && (
                      <Image
                        src={generatedImage}
                        alt="Kapogian Character"
                        width={80}
                        height={80}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-semibold text-lg">{generatedName}</span>
                    <span className="text-sm text-stone-500">Includes Digital Asset</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-base font-medium">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Merch Bundle</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t-2 border-black">
                    <span>Total</span>
                    <span>10 SUI</span>
                  </div>
                </div>

                <div className="bg-stone-100 border-2 border-stone-300 p-2 text-center rounded mb-6">
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">
                    Status: Pending
                  </span>
                </div>

                <a
                  href="/generate"
                  className="block text-center w-full bg-white text-black border-4 border-black rounded-xl py-3 text-lg font-display font-semibold uppercase tracking-tight hover:bg-stone-100 transition-all"
                >
                  Make Another
                </a>

                <div
                  className="absolute bottom-20 right-4 border-4 border-red-500 text-red-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl uppercase rotate-[-20deg] opacity-80 pointer-events-none"
                  style={{ mixBlendMode: "multiply" }}
                >
                  PAID
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <PageFooter />
    </>
  );
}
