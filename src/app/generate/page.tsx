"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Crown,
  Palette,
  Dna,
  ChevronDown,
  Info,
  Wind,
  Zap,
  Accessibility,
  Scissors,
  Shield,
  Frown,
  Smile,
  Flame,
  ChevronLeft,
  ChevronRight,
  Cpu,
  History,
  Leaf,
  Target,
  Cloud,
  Eye,
  AlertCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  mintCharacterNFT,
  getAdminRegistryInfo,
  getTreasuryConfigInfo,
} from "@/lib/sui";
import { ENCRYPTION_CONFIG, mistToSui } from "@/lib/constants";
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
import {
  getHairColorDescription,
  getSkinToneDescription,
} from "@/lib/color-mapping";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const EnchantmentControl = ({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (value: number) => void;
}) => (
  <div className="flex flex-col">
    <div className="flex justify-between px-1 -mb-2 text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mt-2 md:mt-5">
      <span>{label}</span>
      <span className="font-mono opacity-80">{value}%</span>
    </div>
    <div className="w-11/12 mx-auto mb-2">
      <CustomSlider value={value} color={color} onChange={onChange} />
    </div>
  </div>
);

// Carousel Selectors with Dynamic Themes
const CarouselSelector = ({
  label,
  options,
  currentIndex,
  onPrev,
  onNext,
}: {
  label: string;
  options: any[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const current = options[currentIndex];
  const Icon = current.icon;

  return (
    <div className="space-y-2 md:space-y-3">
      <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 flex items-center gap-2">
        {label}
      </label>
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={onPrev}
          className="p-1 md:p-3 bg-white border-2 border-black rounded-[0.4rem] md:rounded-xl hover:bg-slate-50 shadow-[1px_1px_0_0_#000] md:shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none transition-all flex-shrink-0"
        >
          <ChevronLeft size={14} className="md:hidden" />
          <ChevronLeft size={20} className="hidden md:block" />
        </button>

        <div
          className={`flex-1 flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-6 rounded-[1rem] md:rounded-3xl border-[2px] md:border-4 border-black transition-all duration-300 ${current.color} shadow-[2px_2px_0_0_#000] md:shadow-[4px_4px_0_0_#000] min-w-0`}
        >
          <Icon size={20} strokeWidth={2.5} className="text-black md:hidden" />
          <Icon
            size={32}
            strokeWidth={2.5}
            className="text-black hidden md:block"
          />
          <span className="font-black text-[10px] md:text-sm uppercase tracking-tighter text-black truncate w-full text-center">
            {current.name}
          </span>
          <div className="flex gap-1 mt-0.5 md:mt-1 flex-wrap justify-center">
            {options.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full border border-black/20 ${i === currentIndex ? "bg-black w-2 md:w-4" : "bg-black/10"}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          className="p-1 md:p-3 bg-white border-2 border-black rounded-[0.4rem] md:rounded-xl hover:bg-slate-50 shadow-[1px_1px_0_0_#000] md:shadow-[2px_2px_0_0_#000] active:translate-y-[1px] active:shadow-none transition-all flex-shrink-0"
        >
          <ChevronRight size={14} className="md:hidden" />
          <ChevronRight size={20} className="hidden md:block" />
        </button>
      </div>
    </div>
  );
};

const CustomSlider = ({
  value,
  color,
  customStyle,
  onChange,
}: {
  value: number;
  color?: string;
  customStyle?: React.CSSProperties;
  onChange: (value: number) => void;
}) => (
  <div className="relative flex items-center h-5 md:h-8">
    <div className="absolute inset-0 h-2 md:h-4 my-auto bg-white rounded-full border-[1.5px] md:border-2 border-black overflow-hidden shadow-inner">
      <div
        className={`h-full transition-all duration-150 ${color || ""}`}
        style={{
          width: `${value}%`,
          ...(customStyle || {}),
        }}
      />
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />
    <div
      className="absolute w-4 h-4 md:w-7 md:h-7 bg-white border-[1.5px] md:border-2 border-black rounded-full md:rounded-xl shadow-[1px_1px_0_0_#000] md:shadow-[2px_2px_0_0_#000] pointer-events-none transition-all duration-75"
      style={{
        left: `${value}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    />
  </div>
);

interface Province {
  code: string;
  name: string;
}

export default function GeneratorPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [page, setPage] = useState("generator");

  // Generation State
  const [loading, setLoading] = useState(false);
  const [showExitLoader, setShowExitLoader] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const [mintPaused, setMintPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const [pricing, setPricing] = useState<{
    base: number;
    bundle: number;
    totalBundle: number;
  } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  // Refs
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getAdminRegistryInfo(), getTreasuryConfigInfo()])
      .then(([adminInfo, pricingInfo]) => {
        if (adminInfo) {
          setMintPaused(adminInfo.mintPaused);
          setPauseReason(adminInfo.pauseReason);
        }
        if (pricingInfo) {
          setPricing({
            base: pricingInfo.baseMintPrice,
            bundle: pricingInfo.bundleUpgradePrice,
            totalBundle:
              pricingInfo.baseMintPrice + pricingInfo.bundleUpgradePrice,
          });
        }
      })
      .finally(() => {
        setPricingLoading(false);
      });
  }, []);

  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // New design state
  const [lineage, setLineage] = useState("Malakas");
  const [characterName, setCharacterName] = useState("");

  const [attributes, setAttributes] = useState({
    clothingStyle: "Casual",
    hairAmount: 25,
    hairColor: "#4A2C2A",
    skinTone: "#D2B48C",
    bodyFat: 25,
    posture: "Neutral",
    heldItem: "Nothing",
    facialHair: 0,
    eyewear: 0,
  });

  const [stats, setStats] = useState({
    cuteness: 50,
    confidence: 50,
    tiliFactor: 50,
    luzon: 50,
    visayas: 50,
    mindanao: 50,
  });

  const [outfitIndex, setOutfitIndex] = useState(0);
  const [postureIndex, setPostureIndex] = useState(1);

  // Configuration from new design
  const lineages = [
    { name: "Malakas", color: "bg-blue-500" },
    { name: "Maganda", color: "bg-pink-400" },
    { name: "Mahawari", color: "bg-yellow-500" },
    { name: "Maharaba", color: "bg-emerald-500" },
  ];

  const items = [
    "Nothing",
    "Boquet of Flowers",
    "Torch",
    "Rock",
    "Machete",
    "Juice",
    "Arnis Sticks",
  ];

  const clothingOptions = [
    { name: "Casual", icon: Shirt, color: "bg-emerald-400" },
    { name: "Formal", icon: Crown, color: "bg-yellow-400" },
    { name: "Warrior", icon: Shield, color: "bg-red-400" },
    { name: "Spirit", icon: Ghost, color: "bg-purple-400" },
    { name: "Cyber", icon: Cpu, color: "bg-blue-400" },
    { name: "Classic", icon: History, color: "bg-amber-600" },
    { name: "Nature", icon: Leaf, color: "bg-green-400" },
  ];

  const postureOptions = [
    { name: "Slumped", icon: Frown, color: "bg-slate-400" },
    { name: "Neutral", icon: Accessibility, color: "bg-sky-400" },
    { name: "Heroic", icon: Smile, color: "bg-indigo-400" },
    { name: "Divine", icon: Flame, color: "bg-orange-400" },
    { name: "Meditation", icon: Wind, color: "bg-teal-300" },
    { name: "Ready", icon: Target, color: "bg-rose-400" },
    { name: "Floating", icon: Cloud, color: "bg-cyan-200" },
  ];

  const skinTones = [
    "#FFF5E1",
    "#F7E2C4",
    "#F1C27D",
    "#E0AC69",
    "#D2B48C",
    "#BB8353",
    "#8D5524",
    "#634439",
    "#4A2C2A",
    "#2E1D1A",
  ];

  // Carousel handlers
  const handleNextOutfit = () => {
    const next = (outfitIndex + 1) % clothingOptions.length;
    setOutfitIndex(next);
    setAttributes((prev) => ({
      ...prev,
      clothingStyle: clothingOptions[next].name,
    }));
  };

  const handlePrevOutfit = () => {
    const prev =
      (outfitIndex - 1 + clothingOptions.length) % clothingOptions.length;
    setOutfitIndex(prev);
    setAttributes((prevAttr) => ({
      ...prevAttr,
      clothingStyle: clothingOptions[prev].name,
    }));
  };

  const handleNextPosture = () => {
    const next = (postureIndex + 1) % postureOptions.length;
    setPostureIndex(next);
    setAttributes((prev) => ({ ...prev, posture: postureOptions[next].name }));
  };

  const handlePrevPosture = () => {
    const prev =
      (postureIndex - 1 + postureOptions.length) % postureOptions.length;
    setPostureIndex(prev);
    setAttributes((prevAttr) => ({
      ...prevAttr,
      posture: postureOptions[prev].name,
    }));
  };

  // Shipping State
  const [shippingName, setShippingName] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingContact, setShippingContact] = useState("");

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

  // Synchronization flag for shipping localStorage
  const [isShippingInitialized, setIsShippingInitialized] = useState(false);

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
  const [shufflingRank, setShufflingRank] = useState({
    name: "Shuffling...",
    style: "rank-seed",
    rarity: "??%",
  });

  const [eggRank, setEggRank] = useState<string | null>(null);
  const [eggLineage, setEggLineage] = useState<string | null>(null);

  const [generatedNamesHistory, setGeneratedNamesHistory] = useState<string[]>(
    [],
  );

  const totalPrice = useMemo(() => {
    if (!pricing) return 0;
    return selection === "Bundle" ? pricing.totalBundle : pricing.base;
  }, [selection, pricing]);

  const displayedLore = useTypewriter(generatedLore || "", 20);

  const activeEgg = useEasterEgg({
    cuteness: stats.cuteness,
    confidence: stats.confidence,
    tiliFactor: stats.tiliFactor,
    luzon: stats.luzon,
    visayas: stats.visayas,
    mindanao: stats.mindanao,
    hairColor: 0,
    clothingStyle: 0,
    skinColor: 0,
    hairAmount: attributes.hairAmount,
    facialHair: attributes.facialHair,
    eyewear: attributes.eyewear,
  });

  const getRankFromMmr = (
    mmr: number,
  ): { name: string; style: string; rarity: string } => {
    if (mmr >= 3951)
      return {
        name: "Kapogian Ascendant",
        style: "rank-ascendant",
        rarity: "Top 0.005%",
      };
    if (mmr >= 3851)
      return {
        name: "Master Rancher",
        style: "rank-rancher",
        rarity: "Top 0.02%",
      };
    if (mmr >= 3701)
      return {
        name: "Generational Tycoon",
        style: "rank-tycoon",
        rarity: "Top 0.04%",
      };
    if (mmr >= 3501)
      return {
        name: "Cultural Icon",
        style: "rank-icon",
        rarity: "Top 0.08%",
      };
    if (mmr >= 3301)
      return {
        name: "Eternal Light Bearer",
        style: "rank-eternal",
        rarity: "Top 0.18%",
      };
    if (mmr >= 2801)
      return {
        name: "Hall of Fame Immortal",
        style: "rank-hof",
        rarity: "Top 0.6%",
      };
    if (mmr >= 2501)
      return {
        name: "Supreme Pogi",
        style: "rank-supreme",
        rarity: "Top 1.2%",
      };
    if (mmr >= 2201)
      return {
        name: "Proof of Pogi Elite",
        style: "rank-elite",
        rarity: "Top 2.5%",
      };
    if (mmr >= 1901)
      return {
        name: "Aura God",
        style: "rank-auragod",
        rarity: "Top 4%",
      };
    if (mmr >= 1601)
      return {
        name: "Lord of Biringan",
        style: "rank-biringan",
        rarity: "Top 7%",
      };
    if (mmr >= 1301)
      return {
        name: "Fearless Descent",
        style: "rank-fearless",
        rarity: "Top 12%",
      };
    if (mmr >= 1001)
      return {
        name: "Dalaketnon Slayer",
        style: "rank-slayer",
        rarity: "Top 18%",
      };
    if (mmr >= 701)
      return {
        name: "Ghost Walker",
        style: "rank-ghost",
        rarity: "Top 28%",
      };
    if (mmr >= 401)
      return {
        name: "Initiate of Pogi",
        style: "rank-initiate",
        rarity: "Top 45%",
      };
    if (mmr >= 251)
      return {
        name: "Aura Touched",
        style: "rank-touched",
        rarity: "Top 65%",
      };
    if (mmr >= 101)
      return { name: "Pogi Spark", style: "rank-spark", rarity: "Top 85%" };
    return {
      name: "Spirit Seed",
      style: "rank-seed",
      rarity: "Top 100%",
    };
  };

  const loadingSteps = [
    "Preparing clothing style",
    "Generating hairstyle",
    "Refining facial features",
    "Adjusting skin tone",
    "Configuring accessories",
    "Balancing body proportions",
    "Finalizing character pose",
  ];

  const generateProbabilisticMMR = (): number => {
    const random = Math.random();
    let minMMR, maxMMR;

    if (random <= 0.00005) {
      minMMR = 3951;
      maxMMR = 4000;
    } else if (random <= 0.0002) {
      minMMR = 3851;
      maxMMR = 3950;
    } else if (random <= 0.0004) {
      minMMR = 3701;
      maxMMR = 3850;
    } else if (random <= 0.0008) {
      minMMR = 3501;
      maxMMR = 3700;
    } else if (random <= 0.0018) {
      minMMR = 3301;
      maxMMR = 3500;
    } else if (random <= 0.0035) {
      minMMR = 3101;
      maxMMR = 3300;
    } else if (random <= 0.006) {
      minMMR = 2801;
      maxMMR = 3100;
    } else if (random <= 0.012) {
      minMMR = 2501;
      maxMMR = 2800;
    } else if (random <= 0.025) {
      minMMR = 2201;
      maxMMR = 2500;
    } else if (random <= 0.04) {
      minMMR = 1901;
      maxMMR = 2200;
    } else if (random <= 0.07) {
      minMMR = 1601;
      maxMMR = 1900;
    } else if (random <= 0.12) {
      minMMR = 1301;
      maxMMR = 1600;
    } else if (random <= 0.18) {
      minMMR = 1001;
      maxMMR = 1300;
    } else if (random <= 0.28) {
      minMMR = 701;
      maxMMR = 1000;
    } else if (random <= 0.45) {
      minMMR = 401;
      maxMMR = 700;
    } else if (random <= 0.65) {
      minMMR = 251;
      maxMMR = 400;
    } else if (random <= 0.85) {
      minMMR = 101;
      maxMMR = 250;
    } else {
      minMMR = 1;
      maxMMR = 100;
    }

    return Math.floor(Math.random() * (maxMMR - minMMR + 1)) + minMMR;
  };

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

  useEffect(() => {
    if (!account?.address) {
      setIsShippingInitialized(false);
      return;
    }

    const savedDataRaw = localStorage.getItem(
      `kapogian_shipping_${account.address}`,
    );
    if (savedDataRaw) {
      try {
        const data = JSON.parse(savedDataRaw);
        if (data.name) setShippingName(data.name);
        if (data.email) setShippingEmail(data.email);
        if (data.contact) setShippingContact(data.contact);
        if (data.street) setStreetAddress(data.street);
        if (data.province) setSelectedProvince(data.province);
        if (data.city) setSelectedCity(data.city);
        if (data.barangay) setSelectedBarangay(data.barangay);
      } catch (e) {
        console.error("Failed to parse saved shipping data", e);
      }
    }
    setIsShippingInitialized(true);
  }, [account?.address]);

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
        setError(
          "Could not load province data. Please check your internet connection or try again later.",
        );
        setProvinces([]);
      } finally {
        setProvincesLoading(false);
      }
    };
    fetchProvinces();
  }, []);

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
          setCities([]);
        } finally {
          setCitiesLoading(false);
        }
      };

      if (selectedCity && selectedCity.provinceCode !== selectedProvince.code) {
        setCities([]);
        setSelectedCity(null);
        setBarangays([]);
        setSelectedBarangay(null);
      }
      fetchCities();
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedProvince]);

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
          setBarangays([]);
        } finally {
          setBarangaysLoading(false);
        }
      };

      if (selectedBarangay && selectedBarangay.cityCode !== selectedCity.code) {
        setBarangays([]);
        setSelectedBarangay(null);
      }
      fetchBarangays();
    } else {
      setBarangays([]);
      setSelectedBarangay(null);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!account?.address || !isShippingInitialized) return;

    const data = {
      name: shippingName,
      email: shippingEmail,
      contact: shippingContact,
      province: selectedProvince,
      city: selectedCity,
      barangay: selectedBarangay,
      street: streetAddress,
    };
    try {
      localStorage.setItem(
        `kapogian_shipping_${account.address}`,
        JSON.stringify(data),
      );
    } catch (e) {
      console.error("Failed to autosave shipping data.", e);
    }
  }, [
    account?.address,
    isShippingInitialized,
    shippingName,
    shippingEmail,
    shippingContact,
    selectedProvince,
    selectedCity,
    selectedBarangay,
    streetAddress,
  ]);

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
      const context = getIdentityContext(lineage);
      const excludeList =
        generatedNamesHistory.length > 0
          ? `Do not use any of these names: ${generatedNamesHistory.join(", ")}.`
          : "";

      const result = await generateText({
        prompt: `Generate a single unique name for a character who belongs to the ${lineage} lineage (Identity Context: ${context}). The name can be from ANY country or culture in the world (Filipino, Spanish, Japanese, American, European, etc.). ${excludeList} Make it unique, catchy, and fitting for a heroic Chibi. Only return the name, no extra text.`,
      });

      const newName = result.text?.replace(/["']+/g, "") || "Pogi";
      setGeneratedNamesHistory((prev) => [...prev, newName]);
      return newName;
    } catch (e) {
      console.error("Name generation failed:", e);
      return "Pogi";
    }
  };

  const generateLore = async (
    name: string,
    originDesc: string,
  ): Promise<string> => {
    try {
      const identityContext = getIdentityContext(lineage);
      const skinToneDescriptor = getSkinToneDescription(attributes.skinTone);
      const hairColorDescription = getHairColorDescription(
        attributes.hairColor,
      );
      const promptText = `
        You are a lore generator for a fictional universe called "Kapogian Chibis".
        A Kapogian Chibi is a confident, good-looking Filipino character.

        Here is the character's profile:
        - Name: **${name}**
        - Lineage: ${lineage} (Identity Context: ${identityContext})
        - Origin: ${originDesc}
        - Core Stats: Cuteness is ${stats.cuteness}/100, Confidence is ${stats.confidence}/100, and Tili Factor (energy) is ${stats.tiliFactor}/100.
        - Appearance:
            - Clothing: ${attributes.clothingStyle} outfit
            - Stance: ${attributes.posture}
            - Body Type: A body fat ratio of ${attributes.bodyFat}/100.
            - Hair: ${attributes.hairAmount}/100 amount, with a ${hairColorDescription} color.
            - Facial Hair: ${attributes.facialHair}/100 amount.
            - Eyewear: ${attributes.eyewear}/100 amount.
            - Skin Tone: ${skinToneDescriptor}.
            - Held Item: ${attributes.heldItem}.

        Create a detailed lore for this character.
        The lore should be about 150 words and include a backstory, a personality description influenced by their stats and appearance, a heroic anecdote, and a concluding sentence.
        Do not mention the exact stat numbers or colors in the narrative. Instead, interpret them creatively. For example, high confidence could mean they are bold, while low cuteness could mean they are more rugged. A ${attributes.clothingStyle} outfit might mean they are practical or flamboyant.
        (Note to AI: NEVER use the word "${identityContext.toLowerCase()}" in your response. Only use the term "${lineage}").
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
    const identityContext = getIdentityContext(lineage);
    const skinToneDescriptor = getSkinToneDescription(attributes.skinTone);
    const hairColorDescription = getHairColorDescription(attributes.hairColor);

    let pose = "standing confidently";
    switch (attributes.posture) {
      case "Slumped":
        pose =
          "with a shy, slumped posture (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Neutral":
        pose =
          "with a casual, relaxed posture (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Heroic":
        pose =
          "flexing heroically in a bodybuilder-inspired stance (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Divine":
        pose =
          "glowing with divine energy, floating slightly (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Meditation":
        pose =
          "in a peaceful meditation pose (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Ready":
        pose =
          "in a ready stance, as if preparing for battle (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
      case "Floating":
        pose =
          "floating gracefully in the air (Important: The character should have only two hands and two feet. Do not add any extra limbs.)";
        break;
    }

    let hairDescriptor = "medium length hair";
    if (attributes.hairAmount <= 10)
      hairDescriptor =
        identityContext === "Female" || identityContext === "Lesbian"
          ? "stylish pixie cut"
          : "bald";
    else if (attributes.hairAmount <= 25) hairDescriptor = "short spiky hair";
    else if (attributes.hairAmount <= 75) hairDescriptor = "medium length hair";
    else hairDescriptor = "long, flowing hair";

    let facialHairDescriptor = "clean shaven";
    if (identityContext === "Male" || identityContext === "Gay") {
      if (attributes.facialHair > 10) facialHairDescriptor = "light stubble";
      if (attributes.facialHair > 40)
        facialHairDescriptor = "short, neat beard";
      if (attributes.facialHair > 80)
        facialHairDescriptor = "long, full beard and a stylish mustache";
    }

    let clothingDescriptor = "wearing casual streetwear";
    switch (attributes.clothingStyle) {
      case "Casual":
        clothingDescriptor = "wearing simple t-shirt and shorts";
        break;
      case "Formal":
        clothingDescriptor =
          identityContext === "Female" || identityContext === "Gay"
            ? "wearing elegant formal attire"
            : "wearing a crisp barong tagalog";
        break;
      case "Warrior":
        clothingDescriptor = "wearing epic warrior armor";
        break;
      case "Spirit":
        clothingDescriptor = "adorned in mystical spirit garments";
        break;
      case "Cyber":
        clothingDescriptor = "wearing futuristic cyberpunk gear";
        break;
      case "Classic":
        clothingDescriptor = "wearing retro filipiniana attire";
        break;
      case "Nature":
        clothingDescriptor = "wearing clothes made of leaves and vines";
        break;
    }

    let eyewearDescriptor = "no eyewear";
    if (attributes.eyewear > 10) eyewearDescriptor = "stylish eyeglasses";
    if (attributes.eyewear > 40) eyewearDescriptor = "cool sunglasses";
    if (attributes.eyewear > 80)
      eyewearDescriptor = "futuristic sporty eyewear";

    let bodyFatDescriptor = "average body type";
    if (attributes.bodyFat <= 20) bodyFatDescriptor = "thin and slender body";
    else if (attributes.bodyFat <= 60) bodyFatDescriptor = "average body type";
    else bodyFatDescriptor = "chubby and plump body";

    let holdingItemDescriptor = "not holding anything";
    if (attributes.heldItem && attributes.heldItem !== "Nothing") {
      holdingItemDescriptor = `holding ${attributes.heldItem}`;
    }

    return `full body shot of a high quality, well-proportioned, anatomically correct cute ${bodyFatDescriptor} chibi pinoy character with only two arms and two legs, of the ${lineage} lineage (${identityContext}), named ${name}, from ${originDesc}, with ${skinToneDescriptor}. The character has ${hairDescriptor} with ${hairColorDescription} hair. The character has ${facialHairDescriptor}, is wearing ${clothingDescriptor}, with ${eyewearDescriptor}, in a ${pose}, and is ${holdingItemDescriptor}, showing confident pose, smiling. Chibi character art, clean vector line art, cel-shaded, sticker style, 100% pure White background, PNG format.`;
  };

  const handleShuffle = () => {
    const rOutfit = Math.floor(Math.random() * clothingOptions.length);
    const rPosture = Math.floor(Math.random() * postureOptions.length);
    setOutfitIndex(rOutfit);
    setPostureIndex(rPosture);

    setAttributes({
      clothingStyle: clothingOptions[rOutfit].name,
      hairAmount: Math.floor(Math.random() * 101),
      hairColor: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      bodyFat: Math.floor(Math.random() * 101),
      posture: postureOptions[rPosture].name,
      heldItem: items[Math.floor(Math.random() * items.length)],
      facialHair: Math.floor(Math.random() * 101),
      eyewear: Math.floor(Math.random() * 101),
    });
    setStats({
      cuteness: Math.floor(Math.random() * 101),
      confidence: Math.floor(Math.random() * 101),
      tiliFactor: Math.floor(Math.random() * 101),
      luzon: Math.floor(Math.random() * 101),
      visayas: Math.floor(Math.random() * 101),
      mindanao: Math.floor(Math.random() * 101),
    });
    setLineage(lineages[Math.floor(Math.random() * lineages.length)].name);
  };

  const handleGenerate = async () => {
    let shuffleInterval: NodeJS.Timeout | undefined;

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

      const finalMMR = generateProbabilisticMMR();
      setGeneratedMmr(finalMMR);

      setEggRank(null);
      setEggLineage(null);

      shuffleInterval = setInterval(() => {
        const randomMmr = Math.floor(Math.random() * 4001);
        setShufflingMmr(randomMmr);
        setShufflingRank(getRankFromMmr(randomMmr));
      }, 75);

      navigate("page-preview");

      const originDesc = "the Philippines";
      const nameToUse = characterName ? characterName : await generateName();
      const fullPrompt = buildCharacterPrompt(nameToUse, originDesc);

      const [imageResult, loreResult] = await Promise.all([
        generateImage({ prompt: fullPrompt }),
        generateLore(nameToUse, originDesc),
      ]);

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
      console.error("Generation failed:", err);

      if (
        err.message?.includes("RESOURCE_EXHAUSTED") ||
        err.message?.includes("429")
      ) {
        setQuotaModalOpen(true);
        setLoading(false);
        setShowExitLoader(false);
        return;
      }

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
      email: shippingEmail,
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
  };

  const handleMint = async () => {
    if (!account || !account.address) {
      setError("Wallet not connected or address is missing.");
      return;
    }
    if (!pricing) {
      setError("Prices are still loading. Please wait a moment.");
      setMinting(false);
      return;
    }

    if (!generatedImageBlob && !eggRank) {
      setError("Character data is missing.");
      return;
    }

    setMinting(true);
    setError("");

    let imageHash: string | null = null;

    try {
      const { valid, errors, fullAddress } = validateShippingInfo(
        {
          full_name: shippingName,
          email: shippingEmail,
          contact_number: shippingContact,
        },
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
        email: shippingEmail,
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
        const uploadForm = new FormData();
        uploadForm.append("file", generatedImageBlob, `${generatedName}.png`);
        uploadForm.append("name", generatedName);
        const uploadRes = await fetch("/api/pinata/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadErr.error || "IPFS upload failed");
        }
        const { imageUrl, imageHash: imgHash } = await uploadRes.json();
        finalImageUrl = imageUrl;
        imageHash = imgHash;
      }

      const plainTextLore = (
        generatedLore || `A Kapogian character from ${originDescription}`
      ).replace(/\*/g, "");

      const displayRankInfo = getRankFromMmr(generatedMmr);

      const result = await mintCharacterNFT({
        name: generatedName,
        description: plainTextLore,
        imageUrl: finalImageUrl!,
        attributes: JSON.stringify({
          lineage: displayLineage,
          rank: displayRankInfo.name,
          ...stats,
          ...attributes,
        }),
        mmr: generatedMmr,
        itemsSelected: itemsSelected,
        encryptedShippingInfo: encryptedString,
        encryptionPubkey: ENCRYPTION_CONFIG.adminPublicKey,
        walletAddress: account.address,
        totalPrice,
        signAndExecute,
      });

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
        fetch("/api/pinata/unpin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash: imageHash }),
        }).catch(() => {});
      }
    } finally {
      setMinting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`kapogian-receipt-${txHash.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
      setError("Failed to download receipt. Please try again.");
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

  const displayRankInfo = useMemo(() => {
    if (eggRank) {
      return {
        name: eggRank,
        style: "rank-ascendant",
        rarity: "Legendary Find",
      };
    }
    return getRankFromMmr(generatedMmr);
  }, [eggRank, generatedMmr]);

  const displayLineage = eggLineage ? eggLineage : lineage || "Ancient";

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
    pad: { name: "Pad", icon: Mouse, sizes: [], colors: [] },
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
        <div
          id="bundle-view"
          className="transition-opacity duration-300 min-h-[520px]"
        >
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
      <div
        id="single-view"
        className="transition-opacity duration-300 min-h-[520px]"
      >
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
              <span className="text-lg font-bold">
                {pricingLoading ? "..." : mistToSui(pricing?.base ?? 0)} SUI
              </span>
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
        <main className="generate-page relative w-full max-w-7xl bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col">
          <div className="bg-stone-50 min-h-[600px] relative">
            <section
              id="page-generator"
              className={cn("page-section h-full", {
                hidden: page !== "generator",
              })}
            >
              <div className="bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col">
                <header className="bg-black text-white p-4 border-b-4 border-black flex justify-between items-center">
                  <div className="w-1/3" />
                  <div className="w-1/3 flex justify-center items-center gap-2">
                    <Package className="w-6 h-6 text-yellow-400" />
                    <span className="font-display font-semibold tracking-tight text-xl text-yellow-400">
                      KAPOGIAN CUSTOMIZATION
                    </span>
                  </div>
                  <div className="w-1/3 flex justify-end gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                    <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white animate-pulse delay-200" />
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse delay-400" />
                  </div>
                </header>
                {mintPaused ? (
                  <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="flex flex-col items-center justify-center text-center max-w-md">
                      <div className="bg-yellow-400 border-4 border-black rounded-full p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="56"
                          height="56"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      </div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter mb-3">
                        Under Maintenance
                      </h2>
                      <p className="font-bold text-slate-600 text-lg leading-relaxed mb-4">
                        {pauseReason ||
                          "The summoning ritual is temporarily on hold."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-screen text-slate-900 font-sans p-4 md:p-8">
                    <header className="max-w-6xl mx-auto text-center mb-6 md:mb-10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="bg-yellow-400 p-1 md:p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Sparkles
                            size={20}
                            strokeWidth={2.5}
                            className="md:hidden"
                          />
                          <Sparkles
                            size={24}
                            strokeWidth={2.5}
                            className="hidden md:block"
                          />
                        </div>
                        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-black leading-tight">
                          Kapogian Spirit Summoner
                        </h1>
                      </div>
                    </header>

                    <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
                      <section className="lg:col-span-4 space-y-4 md:space-y-6 flex flex-col h-fit">
                        <div className="bg-white border-[2px] md:border-4 border-black p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:h-[150px]">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                            <Dna
                              size={18}
                              className="text-blue-600 md:hidden"
                            />
                            <Dna
                              size={20}
                              className="text-blue-600 hidden md:block"
                            />
                            <h2 className="font-bold text-base md:text-lg uppercase tracking-tight">
                              Spirit Lineage
                            </h2>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {lineages.map((l) => (
                              <button
                                key={l.name}
                                onClick={() => setLineage(l.name)}
                                className={`py-1 px-1 rounded-xl border-2 font-black text-xs uppercase transition-all ${
                                  lineage === l.name
                                    ? `${l.color} text-white border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] -translate-y-0.5`
                                    : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {l.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border-[2px] md:border-4 border-black p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-4">
                            <User
                              size={18}
                              className="text-purple-600 md:hidden"
                            />
                            <User
                              size={20}
                              className="text-purple-600 hidden md:block"
                            />
                            <h2 className="font-bold text-base md:text-lg uppercase tracking-tight">
                              Identity
                            </h2>
                          </div>
                          <input
                            type="text"
                            placeholder="Leave blank for random..."
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            className="w-full bg-slate-50 border-[1.5px] md:border-2 border-slate-200 rounded-lg md:rounded-xl p-2.5 md:p-4 font-bold text-sm md:text-base outline-none focus:border-purple-400 focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        <div className="bg-white border-[2px] md:border-4 border-black p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                            <Crown
                              size={18}
                              className="text-yellow-600 md:hidden"
                            />
                            <Crown
                              size={20}
                              className="text-yellow-600 hidden md:block"
                            />
                            <h2 className="font-bold text-base md:text-lg uppercase tracking-tight">
                              Enchantments
                            </h2>
                          </div>
                          <div className="-space-y-6 flex-1 flex flex-col justify-center">
                            <EnchantmentControl
                              label="Cuteness"
                              value={stats.cuteness}
                              color="bg-pink-400"
                              onChange={(v) =>
                                setStats({ ...stats, cuteness: v })
                              }
                            />
                            <EnchantmentControl
                              label="Confidence"
                              value={stats.confidence}
                              color="bg-blue-400"
                              onChange={(v) =>
                                setStats({ ...stats, confidence: v })
                              }
                            />
                            <EnchantmentControl
                              label="Tili Factor"
                              value={stats.tiliFactor}
                              color="bg-orange-400"
                              onChange={(v) =>
                                setStats({ ...stats, tiliFactor: v })
                              }
                            />
                          </div>
                        </div>

                        <div className="bg-white border-[2px] md:border-4 border-black p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                            <Crown
                              size={18}
                              className="text-red-600 md:hidden"
                            />
                            <Crown
                              size={20}
                              className="text-red-600 hidden md:block"
                            />
                            <h2 className="font-bold text-base md:text-lg uppercase tracking-tight">
                              Regions
                            </h2>
                          </div>
                          <div className="-space-y-6 flex-1 flex flex-col justify-center">
                            <EnchantmentControl
                              label="Luzon"
                              value={stats.luzon}
                              color="bg-red-400"
                              onChange={(v) => setStats({ ...stats, luzon: v })}
                            />
                            <EnchantmentControl
                              label="Visayas"
                              value={stats.visayas}
                              color="bg-blue-400"
                              onChange={(v) =>
                                setStats({ ...stats, visayas: v })
                              }
                            />
                            <EnchantmentControl
                              label="Mindanao"
                              value={stats.mindanao}
                              color="bg-yellow-400"
                              onChange={(v) =>
                                setStats({ ...stats, mindanao: v })
                              }
                            />
                          </div>
                        </div>
                      </section>

                      <section className="lg:col-span-8 flex flex-col">
                        <div className="bg-[#E6F4F1] border-2 md:border-4 border-black p-3 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-4 md:mb-8">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Palette
                                size={20}
                                className="text-emerald-600 md:hidden"
                                strokeWidth={3}
                              />
                              <Palette
                                size={24}
                                className="text-emerald-600 hidden md:block"
                              />
                              <h2 className="font-black text-xl md:text-2xl uppercase tracking-tighter italic leading-none">
                                Porma Designer
                              </h2>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div className="grid grid-cols-2 gap-2 md:gap-6 mb-3 md:mb-10">
                              <CarouselSelector
                                label="Outfit Style"
                                options={clothingOptions}
                                currentIndex={outfitIndex}
                                onPrev={handlePrevOutfit}
                                onNext={handleNextOutfit}
                              />
                              <CarouselSelector
                                label="Posture & Stance"
                                options={postureOptions}
                                currentIndex={postureIndex}
                                onPrev={handlePrevPosture}
                                onNext={handleNextPosture}
                              />
                            </div>

                            <div className="bg-white border-2 border-black rounded-2xl md:rounded-3xl p-3 md:p-6 mb-3 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 shadow-[2px_2px_0_0_#000]">
                              <div className="space-y-4 md:space-y-6">
                                <div className="space-y-1.5 md:space-y-2">
                                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 md:gap-2">
                                    <Palette size={14} /> Hair Color
                                  </label>
                                  <div className="flex gap-2 md:gap-4 items-center">
                                    <input
                                      type="color"
                                      value={attributes.hairColor}
                                      onChange={(e) =>
                                        setAttributes({
                                          ...attributes,
                                          hairColor: e.target.value,
                                        })
                                      }
                                      className="w-12 h-8 md:w-16 md:h-10 cursor-pointer appearance-none bg-transparent border-none md:border-[1.5px] lg:border-2 md:border-black rounded-[2rem] md:rounded-full overflow-hidden shadow-[2px_2px_0_0_#000] md:shadow-[4px_4px_0_0_#000] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-[2rem] md:[&::-webkit-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-moz-color-swatch]:rounded-[2rem] md:[&::-moz-color-swatch]:rounded-full"
                                    />
                                    <div className="flex-1 bg-slate-50 border-[1.5px] md:border-2 border-black/10 rounded-lg md:rounded-xl px-2 py-1.5 md:px-3 md:py-2 font-mono text-[10px] md:text-xs font-bold uppercase text-center">
                                      {attributes.hairColor}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                    <Scissors size={14} /> Hair Style Amount
                                  </label>
                                  <CustomSlider
                                    value={attributes.hairAmount}
                                    customStyle={{
                                      backgroundColor: attributes.hairColor,
                                    }}
                                    onChange={(v) =>
                                      setAttributes({
                                        ...attributes,
                                        hairAmount: v,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                    Facial Hair
                                  </label>
                                  <CustomSlider
                                    value={attributes.facialHair}
                                    color="bg-slate-400"
                                    onChange={(v) =>
                                      setAttributes({
                                        ...attributes,
                                        facialHair: v,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2.5 md:space-y-4">
                                <label className="text-[10px] md:text-xs font-black uppercase text-slate-500">
                                  Skin Tone
                                </label>
                                <div className="grid grid-cols-5 gap-1.5 md:gap-2 p-1.5 md:p-2 bg-slate-50 border-[1.5px] md:border-2 border-black/10 rounded-xl md:rounded-2xl">
                                  {skinTones.map((tone) => (
                                    <button
                                      key={tone}
                                      onClick={() =>
                                        setAttributes({
                                          ...attributes,
                                          skinTone: tone,
                                        })
                                      }
                                      className={`h-5 md:h-10 rounded-md md:rounded-lg border-[1.5px] md:border-2 transition-all ${attributes.skinTone === tone ? "border-black scale-[1.15] shadow-[2px_2px_0_0_#000] z-10" : "border-transparent opacity-60"}`}
                                      style={{ backgroundColor: tone }}
                                    />
                                  ))}
                                </div>
                                <div className="space-y-2 pt-1 md:pt-2">
                                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                    <Eye size={14} /> Eyewear
                                  </label>
                                  <CustomSlider
                                    value={attributes.eyewear}
                                    color="bg-sky-400"
                                    onChange={(v) =>
                                      setAttributes({
                                        ...attributes,
                                        eyewear: v,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-8">
                              <div className="space-y-2 md:space-y-4">
                                <label className="text-[10px] md:text-xs font-black uppercase text-slate-500">
                                  Body Mass Ratio
                                </label>
                                <CustomSlider
                                  value={attributes.bodyFat}
                                  color="bg-emerald-400"
                                  onChange={(v) =>
                                    setAttributes({ ...attributes, bodyFat: v })
                                  }
                                />
                              </div>
                              <div className="space-y-2 md:space-y-3">
                                <label className="text-[10px] md:text-xs font-black uppercase text-slate-500">
                                  Ritual Item
                                </label>
                                <div className="relative">
                                  <select
                                    value={attributes.heldItem}
                                    onChange={(e) =>
                                      setAttributes({
                                        ...attributes,
                                        heldItem: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white border-[1.5px] md:border-2 border-black rounded-lg md:rounded-xl px-2 py-1.5 md:p-3 font-black text-[10px] md:text-sm appearance-none outline-none shadow-[2px_2px_0_0_#000] md:shadow-[3px_3px_0_0_#000]"
                                  >
                                    {items.map((item) => (
                                      <option key={item} value={item}>
                                        {item}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown
                                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                    size={16}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 pt-2 md:pt-6">
                          <button
                            onClick={handleShuffle}
                            className="flex-1 flex items-center justify-center gap-1.5 md:gap-3 bg-white hover:bg-slate-50 border-[2px] md:border-4 border-black py-2 px-3 md:p-6 rounded-xl md:rounded-[2rem] font-black text-xs md:text-xl uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px]"
                          >
                            <Shuffle
                              size={16}
                              strokeWidth={3}
                              className="md:hidden"
                            />
                            <Shuffle
                              size={24}
                              strokeWidth={3}
                              className="hidden md:block"
                            />
                            Randomize
                          </button>
                          <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`flex-[1.5] flex items-center justify-center gap-1.5 md:gap-3 ${loading ? "bg-emerald-200" : "bg-yellow-400 hover:bg-yellow-300"} border-[2px] md:border-4 border-black py-2 px-3 md:p-6 rounded-xl md:rounded-[2rem] font-black text-sm md:text-2xl uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] transition-all group`}
                          >
                            {loading ? (
                              <LoaderCircle className="w-5 h-5 md:w-8 md:h-8 animate-spin" />
                            ) : (
                              <>
                                <Sparkles
                                  size={20}
                                  strokeWidth={3}
                                  className="md:hidden"
                                />
                                <Sparkles
                                  size={28}
                                  strokeWidth={3}
                                  className="hidden md:block"
                                />
                              </>
                            )}
                            {loading ? "Summoning..." : "Summon Spirit"}
                          </button>
                        </div>
                        {error && (
                          <div className="mt-4 text-sm text-center bg-red-100 p-3 rounded-lg border border-red-300 text-red-700">
                            {error}
                          </div>
                        )}
                      </section>
                    </main>
                  </div>
                )}
              </div>
            </section>

            <section
              id="page-preview"
              className={cn("page-section flex flex-col h-full", {
                hidden: page !== "page-preview",
              })}
            >
              <div className="grid md:grid-cols-2 flex-1">
                <div className="relative bg-stone-100 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[300px] md:min-h-0">
                  {loading ? (
                    showExitLoader ? (
                      <div className="relative w-full max-w-[800px] h-[270px] md:h-[400px] flex items-center justify-center">
                        <Image
                          src="/images/latefinalexit.gif"
                          alt="Finishing up..."
                          width={300}
                          height={400}
                          className="object-contain w-full h-[270px] md:w-[800px] md:h-[400px]"
                          unoptimized
                          priority
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <Image
                          src="/images/loadscreens.gif"
                          alt="Generating..."
                          width={300}
                          height={400}
                          className="object-contain w-full h-[270px] md:w-[300px] md:h-[400px]"
                          unoptimized
                        />
                        <p className="font-semibold animate__animated animate__fadeIn mt-2 text-stone-600">
                          {loadingSteps[loadingStepIndex]}...
                        </p>
                      </div>
                    )
                  ) : generatedImage ? (
                    <Image
                      src={generatedImage}
                      alt="Kapogian Character"
                      width={512}
                      height={512}
                      className="animate__animated animate__zoomIn"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-stone-500">
                      <Ghost size={48} className="mb-2" />
                      <p className="font-semibold">
                        Summon failed or not started
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-8 flex flex-col justify-between bg-white">
                  <div>
                    <div className="mb-6">
                      {loading ? (
                        <Skeleton className="h-10 w-48" />
                      ) : (
                        <h1
                          className={cn(
                            "font-display font-bold uppercase tracking-tight leading-none inline-block animate__animated animate__fadeInUp border-b-8",
                            eggRank ? "border-yellow-400" : "border-yellow-300",
                          )}
                          style={{ fontSize: "42px" }}
                        >
                          {generatedName || "..."}
                        </h1>
                      )}
                    </div>

                    <div
                      className="font-medium text-stone-700 leading-relaxed max-h-64 overflow-y-auto pr-2 animate__animated animate__fadeInUp"
                      style={{ fontSize: "16px" }}
                    >
                      {loading || !generatedLore ? (
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-[90%]" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : (
                        renderMarkdown(generatedLore)
                      )}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 w-full divide-x-2 divide-black bg-white border-2 border-black rounded-xl overflow-hidden hard-shadow-sm">
                    <div className="p-4 flex flex-col items-center justify-center text-center">
                      <p className="font-bold text-stone-500 uppercase tracking-widest mb-1 text-[12px]">
                        Battle MMR
                      </p>
                      {loading ? (
                        <p
                          className="font-display font-bold uppercase leading-none text-black/50 w-16 text-center"
                          style={{ fontSize: "20px" }}
                        >
                          {shufflingMmr.toString().padStart(3, "0")}
                        </p>
                      ) : (
                        <p
                          className={cn(
                            "font-display font-bold uppercase leading-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] animate__animated animate__fadeInUp",
                            eggRank ? "text-yellow-500" : "text-black",
                          )}
                          style={{ fontSize: "20px" }}
                        >
                          {generatedMmr}
                        </p>
                      )}
                    </div>
                    <div className="p-2 md:p-4 flex flex-col items-center justify-center bg-white text-center">
                      <p className="text-[10px] md:text-[12px] font-bold text-stone-500 uppercase tracking-widest mb-0.5 md:mb-1">
                        Rank
                      </p>
                      {loading ? (
                        <h3
                          className={cn(
                            "w-24 md:w-32 text-center truncate text-base md:text-lg",
                            shufflingRank.style,
                          )}
                        >
                          {shufflingRank.name}
                        </h3>
                      ) : (
                        <>
                          <h3
                            className={cn(
                              "animate__animated animate__fadeInUp text-base md:text-lg",
                              displayRankInfo.style,
                            )}
                          >
                            {displayRankInfo.name}
                          </h3>
                          <p className="text-[9px] md:text-[10px] font-bold text-stone-400 mt-0.5 md:mt-1 uppercase tracking-wide">
                            (Top {displayRankInfo.rarity})
                          </p>
                        </>
                      )}
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center bg-white">
                      <p className="text-[12px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                        Lineage
                      </p>
                      {loading ? (
                        <Skeleton className="h-5 w-24 mt-1" />
                      ) : (
                        <p
                          className={cn(
                            "font-display font-bold uppercase leading-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] animate__animated animate__fadeInUp",
                            eggRank ? "text-yellow-500" : "text-black",
                          )}
                          style={{ fontSize: "16px" }}
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
                  className="bg-white text-black border-4 border-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hard-shadow-sm hover:translate-y-[-2px] transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 stroke-[2.5]" />
                </button>
                <div className="text-center min-h-[56px] flex flex-col justify-center">
                  {loading ? (
                    <>
                      <p className="font-display font-semibold text-lg uppercase">
                        Summoning...
                      </p>
                      <p className="text-sm text-stone-500">
                        Wait, it's almost here.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display font-semibold text-lg uppercase">
                        Character Ready!
                      </p>
                      <p className="text-sm text-stone-500">
                        Choose your merchandise.
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => navigate("page-merch")}
                  disabled={loading}
                  className="bg-pink-500 text-white border-4 border-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center hard-shadow-sm hover:translate-y-[-2px] transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 stroke-[2.5]" />
                </button>
              </div>
            </section>

            <section
              id="page-merch"
              className={cn("page-section flex flex-col h-full bg-blue-500", {
                hidden: page !== "page-merch",
              })}
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
                    className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase"
                    style={{ textShadow: "2px 2px 0px black" }}
                  >
                    The Stylist Shop
                  </h1>
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
                    const product = merchProducts[key];
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
                    UPGRADE BUNDLE (+
                    {pricingLoading
                      ? "..."
                      : mistToSui(pricing?.bundle ?? 0)}{" "}
                    SUI)
                  </div>
                </div>
              </div>

              <div className="p-4 flex justify-between items-center border-t-4 border-black bg-blue-500 shrink-0">
                <button
                  onClick={() => navigate("page-preview")}
                  className="bg-white text-black border-4 border-black rounded-full w-14 h-14 flex items-center justify-center hard-shadow-sm hover:translate-y-[-2px] transition-all"
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
                  className="bg-green-400 text-black border-4 border-black rounded-full w-14 h-14 flex items-center justify-center hard-shadow-sm hover:translate-y-[-2px] transition-all"
                >
                  <ArrowRight className="w-8 h-8 stroke-[2.5]" />
                </button>
              </div>
            </section>

            <section
              id="page-shipping"
              className={cn(
                "page-section p-8 flex flex-col items-center justify-center h-full min-h-[400px] bg-sky-100",
                { hidden: page !== "page-shipping" },
              )}
            >
              <div className="w-full max-w-xl bg-white border-4 border-black rounded-2xl p-4 md:p-6 hard-shadow-sm relative">
                <div className="absolute -top-6 -left-6 bg-red-500 text-white font-display font-semibold px-4 py-2 rotate-[-6deg] border-4 border-black rounded-lg shadow-md uppercase">
                  Fragile!
                </div>
                <h2 className="font-display text-3xl font-semibold mb-6 border-b-4 border-stone-200 pb-2">
                  Shipping Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-300 border-2 border-black font-bold text-lg">
                          1
                        </span>
                        <span className="font-black uppercase tracking-wide text-md">
                          Identity
                        </span>
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto"
                          placeholder="e.g. Satoshi Nakamoto"
                        />
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={shippingEmail}
                          onChange={(e) => setShippingEmail(e.target.value)}
                          className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto"
                          placeholder="e.g. satoshi@email.com"
                        />
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          Contact Number
                        </label>
                        <Input
                          type="text"
                          value={shippingContact}
                          onChange={(e) => setShippingContact(e.target.value)}
                          className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto"
                          placeholder="0912 345 6789"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-300 border-2 border-black font-bold text-lg">
                          2
                        </span>
                        <span className="font-black uppercase tracking-wide text-md">
                          Destination
                        </span>
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          Province
                        </label>
                        <Select
                          onValueChange={handleProvinceChange}
                          value={selectedProvince?.code}
                          disabled={provincesLoading}
                        >
                          <SelectTrigger className="w-full max-w-2xl border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto">
                            <SelectValue
                              placeholder={
                                provincesLoading
                                  ? "Loading..."
                                  : "Select Province"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((p) => (
                              <SelectItem key={p.code} value={p.code}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          City
                        </label>
                        <Select
                          onValueChange={handleCityChange}
                          value={selectedCity?.code}
                          disabled={!selectedProvince || citiesLoading}
                        >
                          <SelectTrigger className="w-full max-w-2xl border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto">
                            <SelectValue
                              placeholder={
                                citiesLoading ? "Loading..." : "Select City"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="font-semibold uppercase text-xs tracking-wide">
                          Barangay
                        </label>
                        <Select
                          onValueChange={handleBarangayChange}
                          value={selectedBarangay?.code}
                          disabled={!selectedCity || barangaysLoading}
                        >
                          <SelectTrigger className="w-full max-w-2xl border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto">
                            <SelectValue
                              placeholder={
                                barangaysLoading
                                  ? "Loading..."
                                  : "Select Neighborhood"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {barangays.map((b) => (
                              <SelectItem key={b.code} value={b.code}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="font-semibold uppercase text-xs tracking-wide">
                      Street Address
                    </label>
                    <Input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-base font-medium focus:bg-white transition-all !h-auto"
                      placeholder="Apt #, Building, Street..."
                    />
                  </div>
                </div>

                <button
                  onClick={handleMint}
                  disabled={minting || pricingLoading}
                  className="mt-8 w-full bg-blue-500 text-white border-4 border-black rounded-xl py-3 text-xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {minting ? (
                    <LoaderCircle className="w-6 h-6 animate-spin" />
                  ) : (
                    <Truck className="w-6 h-6" />
                  )}
                  {minting
                    ? "Minting..."
                    : `Ship It for ${pricingLoading ? "..." : mistToSui(totalPrice)} SUI`}
                </button>
                {error && (
                  <div className="mt-4 text-sm text-center bg-red-100 p-3 rounded-lg border border-red-300 text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section
              id="page-receipt"
              className={cn(
                "page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-green-200",
                { hidden: page !== "page-receipt" },
              )}
            >
              <div
                ref={receiptRef}
                className="w-full max-w-sm bg-white border-x-4 border-t-4 border-b-[12px] border-dotted border-black rounded-t-xl relative p-6 shadow-2xl mb-8"
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-200 rounded-full border-4 border-black" />
                <div className="text-center mb-6 border-b-2 border-dashed border-stone-300 pb-4">
                  <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">
                    Order Receipt
                  </h2>
                  <p className="text-stone-500 font-medium text-sm mt-1">
                    Order. #{txHash.substring(0, 8)}
                  </p>
                </div>

                <div className="flex gap-4 mb-6">
                  <div className="w-20 h-20 bg-stone-100 border-2 border-black rounded-md shrink-0 overflow-hidden relative">
                    {generatedImage && (
                      <Image
                        src={generatedImage}
                        alt="Character"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-semibold text-lg">
                      {generatedName}
                    </span>
                    <span className="text-sm text-stone-500">
                      Digital Asset Secured
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-base font-medium">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Selected Merch</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t-2 border-black">
                    <span>Total</span>
                    <span>
                      {pricingLoading ? "..." : mistToSui(totalPrice)} SUI
                    </span>
                  </div>
                </div>

                <div className="bg-stone-100 border-2 border-stone-300 p-2 text-center rounded mb-6">
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">
                    Status: Pending
                  </span>
                </div>

                <div
                  className="absolute bottom-20 right-4 border-4 border-red-500 text-red-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl uppercase rotate-[-20deg] opacity-80 pointer-events-none"
                  style={{ mixBlendMode: "multiply" }}
                >
                  PAID
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-sm">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-blue-500 text-white border-4 border-black rounded-xl py-3 text-lg font-display font-semibold uppercase tracking-tight hard-shadow-sm hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF Receipt
                </button>
                <a
                  href="/generate"
                  className="block text-center w-full bg-white text-black border-4 border-black rounded-xl py-3 text-lg font-display font-semibold uppercase tracking-tight hard-shadow-sm hover:translate-y-[-2px] transition-all"
                >
                  Make Another
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Dialog open={quotaModalOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-full p-0 bg-transparent border-none shadow-none !rounded-3xl">
          <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500 w-10 h-10" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic text-center mb-2">
                Generation Temporarily Unavailable
              </DialogTitle>
              <DialogDescription className="text-slate-600 font-bold text-center text-base leading-relaxed">
                Too many users are generating characters right now.
                <br />
                Please come back in a few minutes and try again.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-500 text-white border-4 border-black rounded-xl py-4 font-black uppercase tracking-widest text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PageFooter />
    </>
  );
}
