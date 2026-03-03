"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wallet,
  LayoutDashboard,
  Grid3X3,
  Package,
  ChevronRight,
  BookOpen,
  Twitter,
  ShieldCheck,
  UserPlus,
  Medal,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Star,
  Lock,
  Trophy,
  Sparkles,
  Flame,
  Zap,
  Target,
  Eye,
  Scissors,
  Shirt,
  MapPin,
  Clock,
  Dna,
  Shield,
  Palette,
  LoaderCircle,
  Gift,
  CheckCircle,
  Plus,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { cn, formatAddress } from "@/lib/utils";
import { OrdersPanel } from "./orders-panel";
import { checkBinding, unbind } from "@/lib/identity-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import {
  createPlayerStats,
  claimAchievement,
  claimGrantedAchievement,
  type PlayerStatsObject,
  type AchievementDef,
  type AchievementGrant,
  type UnlockedAchievement,
} from "@/lib/sui";
import { toast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
// DATA STRUCTURES (High-fidelity game badge style icons)
// ─────────────────────────────────────────────────────────────────────────────

const RANK_DATA = [
  {
    mmr: 0,
    title: "Spirit Seed",
    icon: "fluent-emoji:seedling",
    color: "#5dd68a",
    gradient: "linear-gradient(135deg,#38a169,#c6f6d5)",
    rarity: "Top 100%",
    tier: "Starter",
    fx: "fx-silver",
    desc: "Every journey begins here. You planted the first seed of your Kapogian legacy.",
  },
  {
    mmr: 101,
    title: "Pogi Spark",
    icon: "fluent-emoji:zap",
    color: "#fbbf24",
    gradient: "linear-gradient(135deg,#92400e,#fde68a)",
    rarity: "Top 85%",
    tier: "Starter",
    fx: "fx-bronze",
    desc: "A tiny bolt of charm flickers inside you. Awarded at 101 MMR.",
  },
  {
    mmr: 251,
    title: "Aura Touched",
    icon: "fluent-emoji:sparkles",
    color: "#d97706",
    gradient: "linear-gradient(135deg,#92400e,#ffedd5)",
    rarity: "Top 65%",
    tier: "Initiate",
    fx: "fx-bronze",
    desc: "The aura found you first. Unlocked at 251 MMR — you're starting to glow.",
  },
  {
    mmr: 401,
    title: "Initiate of Pogi",
    icon: "fluent-emoji:person-raising-hand-light",
    color: "#f97316",
    gradient: "linear-gradient(135deg,#c2410c,#ffedd5)",
    rarity: "Top 45%",
    tier: "Initiate",
    fx: "fx-bronze",
    desc: "You've been formally welcomed into the world of Pogi. 401 MMR achieved.",
  },
  {
    mmr: 701,
    title: "Ghost Walker",
    icon: "fluent-emoji:ghost",
    color: "#38bdf8",
    gradient: "linear-gradient(135deg,#0369a1,#e0f2fe)",
    rarity: "Top 28%",
    tier: "Adept",
    fx: "fx-sky",
    desc: "You move between worlds unseen. Awarded at 701 MMR — hauntingly good.",
  },
  {
    mmr: 1001,
    title: "Dalaketnon Slayer",
    icon: "fluent-emoji:crossed-swords",
    color: "#2563eb",
    gradient: "linear-gradient(135deg,#1d4ed8,#dbeafe)",
    rarity: "Top 18%",
    tier: "Adept",
    fx: "fx-sky",
    desc: "You've defeated the spirits of Biringan. Reached at 1,001 MMR.",
  },
  {
    mmr: 1301,
    title: "Fearless Descent",
    icon: "fluent-emoji:shield",
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg,#0369a1,#e0f2fe)",
    rarity: "Top 12%",
    tier: "Adept",
    fx: "fx-sky",
    desc: "You dove deep into the unknown without fear. Unlocked at 1,301 MMR.",
  },
  {
    mmr: 1601,
    title: "Lord of Biringan",
    icon: "fluent-emoji:classical-building",
    color: "#10b981",
    gradient: "linear-gradient(135deg,#059669,#d1fae5)",
    rarity: "Top 7%",
    tier: "Elite",
    fx: "fx-emerald",
    desc: "The mystical city of Biringan bows to you. Achieved at 1,601 MMR.",
  },
  {
    mmr: 1901,
    title: "Aura God",
    icon: "fluent-emoji:crown",
    color: "#059669",
    gradient: "linear-gradient(135deg,#064e3b,#d1fae5)",
    rarity: "Top 4%",
    tier: "Elite",
    fx: "fx-emerald",
    desc: "Your aura transcends the mortal plane. You are divine. Reached at 1,901 MMR.",
  },
  {
    mmr: 2201,
    title: "Proof of Pogi Elite",
    icon: "fluent-emoji:gem-stone",
    color: "#34d399",
    gradient: "linear-gradient(135deg,#065f46,#ecfdf5)",
    rarity: "Top 2.5%",
    tier: "Elite",
    fx: "fx-emerald",
    desc: "Certified elite-tier Pogi energy, officially verified. Unlocked at 2,201 MMR.",
  },
  {
    mmr: 2501,
    title: "Supreme Pogi",
    icon: "fluent-emoji:star",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg,#b45309,#fef3c7)",
    rarity: "Top 1.2%",
    tier: "Master",
    fx: "fx-gold",
    desc: "Supreme. There is truly no other word. Reached at 2,501 MMR.",
  },
  {
    mmr: 2801,
    title: "Hall of Fame Immortal",
    icon: "fluent-emoji:trophy",
    color: "#fbbf24",
    gradient: "linear-gradient(135deg,#92400e,#fef3c7)",
    rarity: "Top 0.6%",
    tier: "Champion",
    fx: "fx-gold",
    desc: "Your name is etched in the Hall of Fame for eternity. Achieved at 2,801 MMR.",
  },
  {
    mmr: 3301,
    title: "Eternal Light Bearer",
    icon: "fluent-emoji:fire",
    color: "#f97316",
    gradient: "linear-gradient(135deg,#c2410c,#fff7ed)",
    rarity: "Top 0.18%",
    tier: "Champion",
    fx: "fx-flame",
    desc: "You carry the eternal flame. Only the brightest ever reach 3,301 MMR.",
  },
  {
    mmr: 3501,
    title: "Cultural Icon",
    icon: "fluent-emoji:performing-arts",
    color: "#ef4444",
    gradient: "linear-gradient(135deg,#dc2626,#fee2e2)",
    rarity: "Top 0.08%",
    tier: "Legend",
    fx: "fx-flame",
    desc: "You are bigger than the game itself — a Cultural Icon. Unlocked at 3,501 MMR.",
  },
  {
    mmr: 3701,
    title: "Generational Tycoon",
    icon: "fluent-emoji:money-bag",
    color: "#eab308",
    gradient: "linear-gradient(135deg,#a16207,#fef9c3)",
    rarity: "Top 0.04%",
    tier: "Legend",
    fx: "fx-gold",
    desc: "A wealth of aura that spans generations and time. Reached at 3,701 MMR.",
  },
  {
    mmr: 3851,
    title: "Master Rancher",
    icon: "fluent-emoji:cow-face",
    color: "#a855f7",
    gradient: "linear-gradient(135deg,#6d28d9,#f3e8ff)",
    rarity: "Top 0.02%",
    tier: "Mythic",
    fx: "fx-purple",
    desc: "You've mastered every field and every frontier. Achieved at 3,851 MMR.",
  },
  {
    mmr: 3951,
    title: "Kapogian Ascendant",
    icon: "fluent-emoji:shooting-star",
    color: "#818cf8",
    gradient: "linear-gradient(135deg,#4f46e5,#34d399,#60a5fa,#f472b6)",
    rarity: "Top 0.005%",
    tier: "✦ Ascendant ✦",
    fx: "fx-aurora",
    desc: "The absolute pinnacle of all existence. Transcend everything. The rarest rank, awarded at 3,951 MMR.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT TYPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const REQ_TYPE_LABEL: Record<number, string> = {
  0: "Total MMR",
  1: "Best MMR",
  2: "Summons",
  3: "Admin Grant",
};

function getPlayerValueForReq(
  reqType: number,
  totalMmr: number,
  bestMmr: number,
  summons: number,
): number {
  if (reqType === 0) return totalMmr;
  if (reqType === 1) return bestMmr;
  if (reqType === 2) return summons;
  return 0;
}

function isAchievementEligible(
  ach: AchievementDef,
  totalMmr: number,
  bestMmr: number,
  summons: number,
): boolean {
  if (ach.requirementType === 3) return false; // admin granted — needs a grant object
  const playerVal = getPlayerValueForReq(
    ach.requirementType,
    totalMmr,
    bestMmr,
    summons,
  );
  return playerVal >= ach.threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface MainProfileV2Props {
  characters: any[];
  account: any;
  index: number;
  setIndex: (i: number) => void;
  summonsCount: number;
  bestMmrNum: number;
  avgMmrNum: number;
  topLineages: string[];
  activeTab: "Stats" | "Collections" | "Orders" | "Badges";
  setActiveTab: (tab: "Stats" | "Collections" | "Orders" | "Badges") => void;
  // Achievement props
  playerStats: PlayerStatsObject | null;
  allAchievements: AchievementDef[];
  pendingGrants: AchievementGrant[];
  achievementsLoading: boolean;
  onAchievementsRefresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MainProfileV2({
  characters,
  account,
  index,
  setIndex,
  summonsCount,
  bestMmrNum,
  avgMmrNum,
  topLineages,
  activeTab,
  setActiveTab,
  playerStats,
  allAchievements,
  pendingGrants,
  achievementsLoading,
  onAchievementsRefresh,
}: MainProfileV2Props) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [bindingStatus, setBindingStatus] = useState<{
    bound: boolean;
    x_username?: string;
  } | null>(null);
  const [loadingBinding, setLoadingBinding] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryFilter, setGalleryFilter] = "all";

  // Initialise PlayerStats
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState("");

  // Claim state
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const currentCharacter = characters[index];
  const attrs = currentCharacter?.attributes ?? {};
  const shortAddr = account?.address ? formatAddress(account.address) : "0x...";
  
  const descriptionText =
    currentCharacter?.description ??
    "This spirit's origin is shrouded in mystery...";
  const sentences = useMemo(() => {
    if (!descriptionText) return [] as string[];
    const m = descriptionText.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+$/g);
    return (m || [descriptionText]).map((s) => s.trim());
  }, [descriptionText]);
  const showScrollableDescription = sentences.length > 5;

  const totalMmr = useMemo(
    () => characters.reduce((acc, c) => acc + c.mmr, 0),
    [characters],
  );

  const unlockedIds = useMemo(() => {
    const s = new Set<string>();
    playerStats?.unlocked.forEach((u) => s.add(u.achievementId));
    return s;
  }, [playerStats]);

  const ownedRankTitles = useMemo(() => {
    const titles = new Set<string>();
    characters.forEach((c) => {
      if (c.attributes?.rank) titles.add(c.attributes.rank);
    });
    return titles;
  }, [characters]);

  useEffect(() => {
    if (account?.address) {
      setLoadingBinding(true);
      checkBinding(account.address)
        .then((res) => setBindingStatus(res))
        .catch((e) => console.error(e))
        .finally(() => setLoadingBinding(false));
    }
  }, [account?.address]);

  const handleInitialize = async () => {
    setInitializing(true);
    setInitError("");
    try {
      await createPlayerStats({ signAndExecute });
      await onAchievementsRefresh();
    } catch (e: any) {
      setInitError(
        e?.message?.includes("already")
          ? "Already initialized."
          : "Transaction failed. Try again.",
      );
    } finally {
      setInitializing(false);
    }
  };

  const handleClaim = async (ach: AchievementDef) => {
    if (!playerStats) return;
    setClaimingId(ach.objectId);
    try {
      const playerVal = getPlayerValueForReq(
        ach.requirementType,
        totalMmr,
        bestMmrNum,
        summonsCount,
      );
      await claimAchievement({
        achievementObjectId: ach.objectId,
        playerStatsObjectId: playerStats.objectId,
        value: playerVal,
        signAndExecute,
      });
      await onAchievementsRefresh();
    } catch (e) {
      console.error("Claim failed", e);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimGrant = async (grant: AchievementGrant) => {
    if (!playerStats) return;
    setClaimingId(grant.objectId);
    try {
      await claimGrantedAchievement({
        grantObjectId: grant.objectId,
        achievementObjectId: grant.achievementId,
        playerStatsObjectId: playerStats.objectId,
        signAndExecute,
      });
      await onAchievementsRefresh();
    } catch (e) {
      console.error("Grant claim failed", e);
    } finally {
      setClaimingId(null);
    }
  };

  const handleUnbind = async () => {
    if (!account?.address) return;
    setUnbinding(true);
    try {
      const res = await unbind(account.address);
      if (res.success) {
        toast({ title: "Account Unlinked", description: "Binding has been removed." });
        setBindingStatus({ bound: false });
      } else {
        throw new Error('Unbind failed');
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to unlink account." });
    } finally {
      setUnbinding(false);
    }
  };

  const filteredGallery = useMemo(() => {
    const filter = "all"; // Stub for gallery filter state
    return allAchievements.filter((ach) => {
      // Logic for filtering can be restored if showGallery state is fully integrated
      return true;
    });
  }, [allAchievements]);

  const navItems = [
    {
      id: "Stats",
      label: "Dashboard",
      icon: LayoutDashboard,
      color:
        "bg-sky-50 text-sky-600 border-sky-200 shadow-[0_4px_0_0_rgba(186,230,253,1)]",
    },
    {
      id: "Badges",
      label: "Badges",
      icon: Medal,
      color:
        "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-[0_4px_0_0_rgba(199,210,254,1)]",
    },
    {
      id: "Collections",
      label: "Collections",
      icon: Grid3X3,
      color:
        "bg-pink-50 text-pink-600 border-pink-200 shadow-[0_4px_0_0_rgba(251,207,232,1)]",
    },
    {
      id: "Orders",
      label: "Orders",
      icon: Package,
      color:
        "bg-amber-50 text-amber-600 border-amber-200 shadow-[0_4px_0_0_rgba(253,230,138,1)]",
    },
  ];

  const traits = [
    {
      label: "Style",
      value: attrs.clothingStyle,
      icon: "solar:t-shirt-linear",
    },
    {
      label: "Hair",
      value: attrs.hairAmount ? `${attrs.hairAmount}% Fluff` : null,
      icon: "solar:user-hand-up-linear",
    },
    {
      label: "Face",
      value: attrs.facialHair ? `${attrs.facialHair}% Stubble` : null,
      icon: "solar:emoji-funny-circle-linear",
    },
    {
      label: "Eyewear",
      value: (attrs.eyewear ?? 0) > 50 ? "Yes" : "None",
      icon: "solar:glasses-linear",
    },
    { label: "Held", value: attrs.heldItem, icon: "solar:cup-linear" },
  ].filter((t) => t.value);

  const renderBadgesTab = () => {
    if (achievementsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoaderCircle size={40} className="animate-spin text-indigo-400" />
          <p className="font-black text-sm uppercase tracking-widest text-slate-400">
            Loading Achievements...
          </p>
        </div>
      );
    }

    if (!playerStats) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-indigo-200 flex items-center justify-center mb-6 shadow-[0_8px_0_0_rgba(199,210,254,1)]">
            <Trophy size={44} className="text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-800">
            Initialize Achievements
          </h3>
          <p className="text-sm font-bold text-slate-500 mb-2 max-w-sm leading-relaxed">
            Your achievement profile hasn't been created on-chain yet. This is a
            one-time transaction that sets up your player record.
          </p>
          <p className="text-xs font-bold text-slate-400 mb-8">
            You have {allAchievements.length} achievements available to earn.
          </p>
          {initError && (
            <p className="text-xs font-black text-red-500 mb-4 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2">
              {initError}
            </p>
          )}
          <button
            onClick={handleInitialize}
            disabled={initializing}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-500 text-white rounded-2xl border-4 border-indigo-700 font-black uppercase tracking-widest text-sm shadow-[0_6px_0_0_#3730a3] active:translate-y-1.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initializing ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />{" "}
                Initializing...
              </>
            ) : (
              <>
                <Plus size={18} /> Create My Achievement Profile
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">
              <Medal className="text-indigo-500" />
              {showGallery ? "Achievement Gallery" : "My Earned Badges"}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">
              {showGallery
                ? `${allAchievements.length} total achievements`
                : `${unlockedIds.size} of ${allAchievements.length} earned on-chain`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAchievementsRefresh}
              disabled={achievementsLoading}
              title="Refresh"
              className="w-9 h-9 flex items-center justify-center border-2 border-slate-200 rounded-xl text-slate-400 hover:text-black hover:border-black transition-colors"
            >
              <RefreshCw
                size={14}
                className={achievementsLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => {
                setShowGallery((v) => !v);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2",
                showGallery
                  ? "bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_0_#3730a3]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-[0_4px_0_0_#e2e8f0]",
              )}
            >
              {showGallery ? (
                <>
                  <Grid3X3 size={14} /> Hide Gallery
                </>
              ) : (
                <>
                  <Trophy size={14} /> View Gallery
                </>
              )}
            </button>
          </div>
        </div>

        {pendingGrants.length > 0 && (
          <div className="mb-5 p-4 bg-yellow-50 border-4 border-yellow-300 rounded-2xl shadow-[0_4px_0_0_rgba(253,224,71,1)]">
            <p className="text-xs font-black uppercase text-yellow-700 mb-3 flex items-center gap-2">
              <Gift size={14} /> {pendingGrants.length} Pending Grant
              {pendingGrants.length > 1 ? "s" : ""} — Claim Now!
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingGrants.map((grant) => {
                const achDef = allAchievements.find(
                  (a) => a.objectId === grant.achievementId,
                );
                return (
                  <button
                    key={grant.objectId}
                    onClick={() => handleClaimGrant(grant)}
                    disabled={claimingId === grant.objectId}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-xl border-2 border-yellow-600 font-black text-xs uppercase shadow-[0_3px_0_0_rgba(161,98,7,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
                  >
                    {claimingId === grant.objectId ? (
                      <LoaderCircle size={12} className="animate-spin" />
                    ) : (
                      <Gift size={12} />
                    )}
                    {achDef?.name ?? "Claim Grant"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showGallery ? (
          <div>
            <section className="mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <iconify-icon
                  icon="fluent-emoji:glowing-star"
                  class="text-sm"
                />{" "}
                On-Chain Ranks
              </h4>
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                  RANK_DATA.length > 4 ? "max-h-96 overflow-auto p-2" : "",
                )}
              >
                {RANK_DATA.map((rank) => (
                  <BadgeCard
                    key={rank.title}
                    item={rank}
                    isUnlocked={ownedRankTitles.has(rank.title)}
                    showRequirement
                    onClick={() =>
                      setSelectedBadge({
                        ...rank,
                        isUnlocked: ownedRankTitles.has(rank.title),
                        type: "rank",
                      })
                    }
                  />
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2">
                <iconify-icon
                  icon="fluent-emoji:trophy"
                  class="text-sm"
                />{" "}
                On-Chain Achievements
              </h4>
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                  allAchievements.length > 4 ? "max-h-96 overflow-auto p-2" : "",
                )}
              >
                {allAchievements.map((ach) => {
                  const earned = unlockedIds.has(ach.objectId);
                  const eligible =
                    !earned &&
                    isAchievementEligible(
                      ach,
                      totalMmr,
                      bestMmrNum,
                      summonsCount,
                    );
                  const playerVal = getPlayerValueForReq(
                    ach.requirementType,
                    totalMmr,
                    bestMmrNum,
                    summonsCount,
                  );
                  return (
                    <OnChainAchievementCard
                      key={ach.objectId}
                      ach={ach}
                      earned={earned}
                      eligible={eligible}
                      playerVal={playerVal}
                      claiming={claimingId === ach.objectId}
                      onClaim={() => handleClaim(ach)}
                      onClick={() =>
                        setSelectedBadge({
                          ...ach,
                          title: ach.name,
                          desc: ach.description,
                          icon: "fluent-emoji:trophy",
                          gradient: "linear-gradient(135deg,#4f46e5,#818cf8)",
                          color: "#6366f1",
                          isUnlocked: earned,
                          type: "onchain",
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div>
            {ownedRankTitles.size > 0 && (
              <section className="mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <iconify-icon
                    icon="fluent-emoji:star"
                    class="text-sm"
                  />{" "}
                  Rank Badges
                </h4>
                <div
                  className={cn(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                    ownedRankTitles.size > 4
                      ? "max-h-96 overflow-auto p-2"
                      : "",
                  )}
                >
                  {RANK_DATA.filter((r) => ownedRankTitles.has(r.title)).map(
                    (rank) => (
                      <BadgeCard
                        key={rank.title}
                        item={rank}
                        isUnlocked={true}
                        onClick={() =>
                          setSelectedBadge({
                            ...rank,
                            isUnlocked: true,
                            type: "rank",
                          })
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <iconify-icon
                  icon="fluent-emoji:magic-wand"
                  class="text-sm"
                />{" "}
                Claimed Achievements
              </h4>
              {playerStats.unlocked.length === 0 &&
              ownedRankTitles.size === 0 ? (
                <EmptyBadges
                  msg="No achievements claimed yet"
                  sub={`You have ${allAchievements.length} achievements to explore. Open the Gallery to see what you can earn!`}
                />
              ) : playerStats.unlocked.length === 0 ? null : (
                <div
                  className={cn(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
                    playerStats.unlocked.length > 4
                      ? "max-h-96 overflow-auto p-2"
                      : "",
                  )}
                >
                  {playerStats.unlocked.map((u) => {
                    const achDef = allAchievements.find(
                      (a) => a.objectId === u.achievementId,
                    );
                    return (
                      <EarnedAchievementCard
                        key={u.achievementId}
                        unlocked={u}
                        achDef={achDef}
                        onClick={() =>
                          setSelectedBadge({
                            title: u.achievementName,
                            desc:
                              achDef?.description ??
                              "Claimed on-chain achievement.",
                            icon: "fluent-emoji:trophy",
                            gradient: "linear-gradient(135deg,#4f46e5,#818cf8)",
                            color: "#6366f1",
                            rarity: REQ_TYPE_LABEL[u.requirementType],
                            isUnlocked: true,
                            type: "onchain",
                            badgeUrl: achDef?.badgeUrl,
                            claimedAt: u.claimedAt,
                          })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto font-body">
      <style jsx global>{`
        .kpg-fx-aurora {
          background: linear-gradient(
            90deg,
            #a78bfa,
            #60a5fa,
            #34d399,
            #f472b6,
            #fbbf24,
            #a78bfa
          );
          background-size: 500% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: kpg-auroraFlow 3s linear infinite;
          filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.4));
        }
        @keyframes kpg-auroraFlow {
          to {
            background-position: 500% center;
          }
        }
        .kpg-card-inner {
          transition:
            transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.2s ease;
        }
        .kpg-badge-card:hover .kpg-card-inner {
          transform: translateY(-4px) scale(1.02);
        }
        .kpg-conic-spin {
          animation: kpg-spin 3s linear infinite;
        }
        @keyframes kpg-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .kpg-shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .kpg-shimmer-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-20deg);
          animation: kpg-shine 3s infinite;
        }
        @keyframes kpg-shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-[0_12px_0_0_rgba(226,232,240,1)] text-center relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-32 aspect-square bg-pink-50 rounded-full"></div>
            <div className="relative">
              <div className="mb-4">
                <h2 className="text-3xl tracking-tight font-semibold text-slate-800 uppercase font-headline">
                  {currentCharacter?.name || "Kapogian"}
                </h2>
                <div className="inline-flex items-center justify-center gap-2 bg-slate-50 border-2 border-slate-100 px-4 py-1.5 rounded-full text-slate-500 text-sm font-semibold mt-2 shadow-sm">
                  <Wallet size={14} />
                  {shortAddr}
                </div>
              </div>
              <div className="bg-gradient-to-br from-sky-100 to-indigo-50 rounded-[2rem] aspect-square flex items-center justify-center border-4 border-sky-200 mb-2 shadow-inner relative overflow-hidden">
                {currentCharacter?.imageUrl ? (
                  <Image
                    src={currentCharacter.imageUrl}
                    alt={currentCharacter.name}
                    fill
                    className="object-contain p-4 hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <iconify-icon
                    icon="solar:ghost-smile-linear"
                    class="text-8xl text-sky-400 drop-shadow-md"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-5 border-4 border-slate-100 shadow-[0_8px_0_0_rgba(226,232,240,1)]">
            <h3 className="text-sm tracking-wide font-semibold text-slate-400 uppercase mb-4 px-2 flex items-center gap-2">
              <Twitter size={14} className="text-blue-400" /> Social Identity
            </h3>
            {loadingBinding ? (
              <div className="p-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bindingStatus?.bound ? (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm">
                    <Twitter size={18} className="text-blue-500" />
                  </div>
                  <div className="overflow-hidden text-left">
                    <p className="font-black text-blue-600 truncate text-sm leading-none mb-1">
                      @{bindingStatus.x_username}
                    </p>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      X Account Linked <CheckCircle size={10} className="text-green-500" />
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleUnbind}
                  disabled={unbinding}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-red-100 rounded-xl text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:translate-y-0.5 disabled:opacity-50"
                >
                  {unbinding ? <LoaderCircle size={14} className="animate-spin" /> : <Unlink size={14} />}
                  Unbind
                </button>
              </div>
            ) : (
              <Link href="/identity">
                <button className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-white hover:border-blue-300 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <UserPlus size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-600">
                      Link X Account
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Earn extra rewards & status
                    </p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-300" />
                </button>
              </Link>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-5 border-4 border-slate-100 shadow-[0_8px_0_0_rgba(226,232,240,1)]">
            <h3 className="text-sm tracking-wide font-semibold text-slate-400 uppercase mb-4 px-2 flex items-center gap-2">
              <iconify-icon icon="solar:user-id-linear" /> Profile Actions
            </h3>
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-full px-5 py-3 rounded-2xl font-semibold text-left flex items-center justify-between transition-all border-2",
                    item.color,
                    activeTab === item.id
                      ? "translate-y-[4px] shadow-none"
                      : "hover:-translate-y-0.5",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={20} /> {item.label}
                  </span>
                  <ChevronRightIcon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div>
            <h3 className="text-lg tracking-wide font-semibold text-slate-600 mb-3 px-2 flex items-center gap-2 uppercase">
              <iconify-icon
                icon="solar:gamepad-linear"
                class="text-indigo-500"
              />{" "}
              Player Hub
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Best MMR"
                value={bestMmrNum.toLocaleString()}
                icon="solar:medal-star-circle-linear"
                theme="yellow"
              />
              <StatCard
                label="Avg MMR"
                value={avgMmrNum.toLocaleString()}
                icon="solar:chart-square-linear"
                theme="orange"
              />
              <StatCard
                label="Summons"
                value={summonsCount}
                icon="solar:magic-stick-3-linear"
                theme="purple"
              />
              <StatCard
                label="Lineage"
                value={topLineages[0] || "Ancient"}
                icon="solar:crown-linear"
                theme="pink"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-4 border-slate-100 shadow-[0_12px_0_0_rgba(226,232,240,1)] flex-grow min-h-[600px]">
            {activeTab === "Stats" && (
              <div className="animate-in fade-in duration-500 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pb-1 border-b border-slate-100 border-dashed">
                  <div>
                    <h3 className="text-lg tracking-tight font-semibold text-slate-800 flex items-center gap-2">
                      Current Loadout
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <ProfileBadge
                        label={`Rank: ${attrs.rank || "Spirit Seed"}`}
                        icon="solar:stars-linear"
                        theme="indigo"
                      />
                      <ProfileBadge
                        label={`Lineage: ${attrs.lineage || "Unknown"}`}
                        icon="solar:crown-linear"
                        theme="emerald"
                      />
                      <ProfileBadge
                        label={`Style: ${attrs.clothingStyle || "Classic"}`}
                        icon="solar:glasses-linear"
                        theme="rose"
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm">
                    <div className="bg-white w-12 aspect-square rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-sm">
                      <iconify-icon
                        icon="solar:cup-star-linear"
                        class="text-lg text-yellow-500"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider mb-0.5">
                        Global MMR
                      </p>
                      <p className="text-xl font-semibold text-yellow-800 tracking-tight leading-none">
                        {(currentCharacter?.mmr ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-8">
                    <BookOpen size={36} className="text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider relative z-10">
                    <iconify-icon
                      icon="solar:notes-linear"
                      class="text-indigo-500"
                    />{" "}
                    Spirit Lore
                  </h4>
                  <div
                    className={cn(
                      "relative z-10",
                      showScrollableDescription
                        ? "max-h-[9rem] overflow-auto pr-2"
                        : "",
                    )}
                  >
                    <p className="text-slate-600 font-medium leading-relaxed italic">
                      {descriptionText}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2 uppercase tracking-wider">
                      <iconify-icon icon="solar:star-fall-linear" /> Core Skills
                    </h4>
                    <SkillBar
                      label="Cuteness"
                      value={attrs.cuteness || 0}
                      color="from-pink-400 to-pink-500"
                      icon="solar:heart-angle-linear"
                    />
                    <SkillBar
                      label="Confidence"
                      value={attrs.confidence || 0}
                      color="from-sky-400 to-sky-500"
                      icon="solar:fire-square-linear"
                    />
                    <SkillBar
                      label="Tili Factor"
                      value={attrs.tiliFactor || 0}
                      color="from-yellow-400 to-yellow-500"
                      icon="solar:bolt-linear"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                      <iconify-icon icon="solar:map-point-linear" /> Territory
                      Info
                    </h4>
                    <div className="flex flex-col gap-6">
                      <TerritoryRow
                        label="Luzon"
                        value={attrs.luzon || 0}
                        theme="blue"
                      />
                      <TerritoryRow
                        label="Visayas"
                        value={attrs.visayas || 0}
                        theme="teal"
                      />
                      <TerritoryRow
                        label="Mindanao"
                        value={attrs.mindanao || 0}
                        theme="rose"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-100 border-dashed">
                  <h4 className="text-sm font-semibold text-slate-500 mb-8 flex items-center gap-2 uppercase tracking-wider">
                    <iconify-icon
                      icon="solar:t-shirt-linear"
                      class="text-orange-500"
                    />{" "}
                    Visual Traits
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {traits.map((trait) => (
                      <div
                        key={trait.label}
                        className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <iconify-icon
                          icon={trait.icon}
                          class="text-xl text-slate-400"
                        />
                        <div className="flex flex-col overflow-hidden text-left">
                          <span className="text-[10px] text-slate-400 uppercase font-black leading-tight">
                            {trait.label}
                          </span>
                          <span className="text-xs text-slate-700 font-bold truncate">
                            {trait.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Badges" && renderBadgesTab()}

            {activeTab === "Collections" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl tracking-tight font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <Grid3X3 className="text-pink-500" /> My Collection (
                  {characters.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {characters.map((c, i) => (
                    <div
                      key={c.objectId}
                      onClick={() => {
                        setIndex(i);
                        setActiveTab("Stats");
                      }}
                      className={cn(
                        "group bg-slate-50 border-4 rounded-3xl p-2 cursor-pointer transition-all hover:scale-105",
                        index === i
                          ? "border-sky-400 bg-sky-50"
                          : "border-slate-100 hover:border-slate-200",
                      )}
                    >
                      <div className="aspect-square relative rounded-2xl overflow-hidden bg-white border-2 border-slate-100 mb-2">
                        <Image
                          src={c.imageUrl}
                          alt={c.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold truncate text-slate-700 uppercase px-1">
                          {c.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          MMR: {c.mmr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Orders" && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <OrdersPanel account={account} />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          isOpen={!!selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ON-CHAIN ACHIEVEMENT CARDS
// ─────────────────────────────────────────────────────────────────────────────

function OnChainAchievementCard({
  ach,
  earned,
  eligible,
  playerVal,
  claiming,
  onClaim,
  onClick,
}: {
  ach: AchievementDef;
  earned: boolean;
  eligible: boolean;
  playerVal: number;
  claiming: boolean;
  onClaim: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "kpg-badge-card relative overflow-visible cursor-pointer select-none transition-all duration-300",
        !earned && !eligible && "opacity-60 grayscale-[0.4]",
      )}
    >
      <div
        className={cn(
          "kpg-card-inner p-4 border-2 rounded-[2rem] flex flex-col items-center gap-3 relative overflow-hidden",
          earned
            ? "bg-white border-indigo-200 shadow-[0_4px_0_0_rgba(199,210,254,1)]"
            : eligible
              ? "bg-indigo-50 border-dashed border-indigo-300"
              : "bg-slate-50 border-dashed border-slate-200",
        )}
        onClick={onClick}
      >
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center border-2 overflow-hidden",
              earned
                ? "bg-white shadow-md border-indigo-200"
                : "bg-slate-100 border-slate-300",
            )}
          >
            {ach.badgeUrl ? (
              <img
                src={ach.badgeUrl}
                alt={ach.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <iconify-icon
                icon={
                  earned
                    ? "fluent-emoji:trophy"
                    : eligible
                      ? "fluent-emoji:lock-unlocked"
                      : "fluent-emoji:lock"
                }
                style={{
                  fontSize: "28px",
                }}
              />
            )}
          </div>
          {earned && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <CheckCircle size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1 w-full">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-tighter truncate w-full px-1",
              earned ? "text-slate-800" : "text-slate-500",
            )}
          >
            {ach.name}
          </p>
          <div className="text-[8px] font-bold px-2 py-0.5 rounded-full border inline-block bg-slate-50 text-slate-500 border-slate-100">
            {ach.requirementType === 3
              ? "Admin Grant"
              : `${REQ_TYPE_LABEL[ach.requirementType]}: ${ach.threshold.toLocaleString()}`}
          </div>
        </div>

        {eligible && !earned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            disabled={claiming}
            className="w-full h-7 flex items-center justify-center gap-1 bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-wider border-2 border-indigo-700 shadow-[0_3px_0_0_#3730a3] active:translate-y-0.5 active:shadow-none disabled:opacity-50 transition-all"
          >
            {claiming ? (
              <LoaderCircle size={10} className="animate-spin" />
            ) : (
              <>
                <Zap size={10} /> Claim
              </>
            )}
          </button>
        )}

        {!earned && !eligible && ach.requirementType !== 3 && (
          <div className="w-full text-center text-[8px] font-bold text-slate-400 uppercase">
            {playerVal.toLocaleString()} / {ach.threshold.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function EarnedAchievementCard({
  unlocked,
  achDef,
  onClick,
}: {
  unlocked: UnlockedAchievement;
  achDef: AchievementDef | undefined;
  onClick: () => void;
}) {
  const date = new Date(unlocked.claimedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div
      className="kpg-badge-card relative overflow-visible cursor-pointer select-none"
      onClick={onClick}
    >
      <div className="kpg-card-inner p-4 border-2 border-indigo-200 rounded-[2rem] flex flex-col items-center gap-3 bg-white shadow-[0_4px_0_0_rgba(199,210,254,1)]">
        <div className="relative w-14 h-14">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-indigo-200 shadow-md flex items-center justify-center overflow-hidden">
            {achDef?.badgeUrl ? (
              <img
                src={achDef.badgeUrl}
                alt={unlocked.achievementName}
                className="w-full h-full object-cover"
              />
            ) : (
              <iconify-icon
                icon="fluent-emoji:trophy"
                style={{ fontSize: "28px" }}
              />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            <CheckCircle size={10} className="text-white" />
          </div>
        </div>
        <div className="text-center space-y-1 w-full">
          <p className="text-[10px] font-black uppercase tracking-tighter truncate w-full px-1 text-slate-800">
            {unlocked.achievementName}
          </p>
          <p className="text-[8px] font-bold text-slate-400">{date}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyBadges({ msg, sub }: { msg: string; sub: string }) {
  return (
    <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100">
      <Sparkles className="mx-auto mb-4 text-slate-200" size={48} />
      <p className="font-black uppercase text-slate-400 tracking-widest text-sm">
        {msg}
      </p>
      <p className="text-xs font-bold text-slate-300 mt-1">{sub}</p>
    </div>
  );
}

function BadgeCard({
  item,
  isUnlocked,
  isCurrent,
  showRequirement,
  onClick,
}: {
  item: any;
  isUnlocked: boolean;
  isCurrent?: boolean;
  showRequirement?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "kpg-badge-card relative p-0 overflow-visible cursor-pointer select-none transition-all duration-300",
        !isUnlocked && "opacity-60 grayscale-[0.5]",
      )}
    >
      <div
        className={cn(
          "kpg-card-inner p-5 border-2 rounded-[2rem] flex flex-col items-center gap-3 relative overflow-hidden",
          isCurrent
            ? "bg-white border-transparent shadow-xl"
            : isUnlocked
              ? "bg-white border-slate-100 shadow-sm"
              : "bg-slate-50 border-dashed border-slate-200",
        )}
      >
        {isCurrent && (
          <>
            <div className="absolute inset-[-2px] rounded-[2rem] bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 kpg-conic-spin z-[-1]" />
            <div
              className="absolute inset-[-10px] rounded-[3rem] opacity-20 blur-xl z-[-2]"
              style={{ backgroundColor: item.color }}
            />
          </>
        )}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
              isUnlocked
                ? "bg-white shadow-md"
                : "bg-slate-200 border-slate-300",
            )}
            style={isUnlocked ? { borderColor: `${item.color}44` } : {}}
          >
            <iconify-icon
              icon={item.icon}
              style={{ fontSize: "28px" }}
            />
          </div>
          {isCurrent && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm uppercase">
              Now
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-tighter truncate w-24",
              isUnlocked ? "text-slate-800" : "text-slate-400",
            )}
          >
            {item.title}
          </p>
          <div
            className={cn(
              "text-[8px] font-bold px-2 py-0.5 rounded-full border inline-block",
              isUnlocked
                ? "bg-slate-50 text-slate-500 border-slate-100"
                : "bg-slate-100 text-slate-400 border-slate-200",
            )}
          >
            {showRequirement || !isUnlocked
              ? item.mmr !== undefined
                ? `${item.mmr} MMR`
                : item.requiredMmr !== undefined
                  ? `${item.requiredMmr} MMR`
                  : item.requiredDays !== undefined
                    ? `${item.requiredDays} Days`
                    : `${item.requiredCount} ${item.category === "Collection" ? "NFTs" : item.category === "Streak" ? "Days" : "Pulls"}`
              : item.rarity || "Unlocked"}
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeDetailModal({
  badge,
  isOpen,
  onClose,
}: {
  badge: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const reqText =
    badge.mmr !== undefined
      ? `${badge.mmr} MMR`
      : badge.requiredMmr !== undefined
        ? `${badge.requiredMmr} MMR`
        : badge.requiredDays !== undefined
          ? `${badge.requiredDays} Consecutive Days`
          : badge.threshold !== undefined
            ? `${badge.threshold.toLocaleString()} ${REQ_TYPE_LABEL[badge.requirementType] ?? ""}`
            : badge.requiredCount !== undefined
              ? `${badge.requiredCount} ${badge.category === "Collection" ? "Owned NFTs" : "Summons"}`
              : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseButton
        className="max-w-md w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{badge.title}</DialogTitle>
          <DialogDescription>{badge.desc}</DialogDescription>
        </DialogHeader>
        <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-50">
          <div className="p-8 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: badge.gradient }}
            />
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div
                  className="absolute inset-[-10px] rounded-full blur-xl opacity-30 animate-pulse"
                  style={{ backgroundColor: badge.color }}
                />
                <div
                  className="w-24 h-24 rounded-full bg-white border-4 flex items-center justify-center shadow-xl overflow-hidden"
                  style={{ borderColor: `${badge.color}22` }}
                >
                  {badge.badgeUrl ? (
                    <img
                      src={badge.badgeUrl}
                      alt={badge.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iconify-icon
                      icon={badge.icon || "fluent-emoji:trophy"}
                      style={{
                        fontSize: "48px",
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">
                  {badge.tier || badge.category || "Achievement"} Milestone
                </span>
                <h2
                  className={cn(
                    "text-3xl font-headline tracking-tight",
                    badge.fx === "fx-aurora" ? "kpg-fx-aurora" : "",
                  )}
                  style={badge.fx !== "fx-aurora" ? { color: badge.color } : {}}
                >
                  {badge.title}
                </h2>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed mb-6 px-4">
                {badge.desc || "Unlocked by your verified on-chain activity."}
              </p>
              {badge.claimedAt && (
                <p className="text-xs font-bold text-indigo-400 mb-4">
                  Claimed{" "}
                  {new Date(badge.claimedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <div className="px-4 py-1.5 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                  {badge.isUnlocked ? (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300" />
                  )}
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    {badge.isUnlocked
                      ? "Unlocked"
                      : reqText
                        ? `Requires ${reqText}`
                        : "Locked"}
                  </span>
                </div>
                {badge.rarity && (
                  <div className="px-4 py-1.5 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                    <iconify-icon
                      icon="solar:users-group-rounded-linear"
                      class="text-indigo-400"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      {badge.rarity} Tier
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm kpg-shimmer-btn shadow-lg transition-transform active:scale-95"
                style={{
                  background:
                    badge.gradient || "linear-gradient(135deg,#4f46e5,#818cf8)",
                }}
              >
                Awesome! 🎉
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  icon,
  theme,
}: {
  label: string;
  value: string | number;
  icon: string;
  theme: string;
}) {
  const colors: Record<string, string> = {
    yellow:
      "border-yellow-100 shadow-[0_6px_0_0_rgba(254,240,138,1)] bg-yellow-100 text-yellow-500 border-yellow-200",
    orange:
      "border-orange-100 shadow-[0_6px_0_0_rgba(255,237,213,1)] bg-orange-100 text-orange-500 border-orange-200",
    purple:
      "border-purple-100 shadow-[0_6px_0_0_rgba(243,232,255,1)] bg-purple-100 text-purple-500 border-purple-200",
    pink: "border-pink-100 shadow-[0_6px_0_0_rgba(252,231,243,1)] bg-pink-100 text-pink-500 border-pink-200",
  };
  const c = colors[theme].split(" ");
  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-4 border-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform",
        c.slice(0, 2).join(" "),
      )}
    >
      <div
        className={cn(
          "w-12 aspect-square rounded-2xl flex items-center justify-center mb-2 border-2",
          c.slice(2).join(" "),
        )}
      >
        <iconify-icon icon={icon} class="text-2xl" />
      </div>
      <span className="text-xs text-slate-500 font-semibold mb-1 uppercase">
        {label}
      </span>
      <span className="text-xl tracking-tight font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function ProfileBadge({
  label,
  icon,
  theme,
}: {
  label: string;
  icon: string;
  theme: string;
}) {
  const themes: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-semibold border-2 flex items-center gap-1 shadow-sm",
        themes[theme],
      )}
    >
      <iconify-icon icon={icon} class="text-xs mr-1" /> {label}
    </span>
  );
}

function SkillBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="text-left">
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-slate-700 flex items-center gap-1.5">
          <iconify-icon
            icon={icon}
            class={cn("text-base", color.split(" ")[1])}
          />{" "}
          {label}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-xl text-[10px] border",
            color.split(" ")[1].replace("text-", "bg-").replace("500", "100"),
            color.split(" ")[1].replace("text-", "text-").replace("500", "600"),
            color
              .split(" ")[1]
              .replace("text-", "border-")
              .replace("500", "200"),
          )}
        >
          {value}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-4 border border-slate-200 p-0.5 shadow-inner overflow-hidden">
        <div
          className={cn(
            "bg-gradient-to-r h-full rounded-full relative transition-all duration-700",
            color,
          )}
          style={{ width: `${Math.min(100, value)}%`, height: "100%" }}
        >
          <div className="absolute inset-0 bg-white/20 w-full transform -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

function TerritoryRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: "blue" | "teal" | "rose";
}) {
  const themes = {
    blue: "bg-blue-50 border-blue-100 shadow-[0_4px_0_0_rgba(219,234,254,1)] icon-bg:bg-blue-200 icon:text-blue-600 icon-border:border-blue-300 text:text-blue-800 badge:text-blue-600 badge-border:border-blue-200",
    teal: "bg-teal-50 border-teal-100 shadow-[0_4px_0_0_rgba(204,251,241,1)] icon-bg:bg-teal-200 icon:text-teal-600 icon-border:border-teal-300 text:text-teal-800 badge:text-teal-600 badge-border:border-teal-200",
    rose: "bg-rose-50 border-rose-100 shadow-[0_4px_0_0_rgba(255,228,230,1)] icon-bg:bg-rose-200 icon:text-rose-600 icon-border:border-rose-300 text:text-rose-800 badge:text-rose-600 badge-border:border-rose-200",
  };
  const c = themes[theme].split(" ").reduce(
    (acc, curr) => {
      const [k, v] = curr.split(":");
      if (v) acc[k] = v;
      else acc["base"] = (acc["base"] || "") + " " + curr;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <div
      className={cn(
        "border p-2 rounded-lg flex items-center justify-between transition-all",
        c["base"],
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border",
            c["icon-bg"],
            c["icon-border"],
          )}
        >
          <iconify-icon
            icon={
              label === "Visayas" ? "solar:flag-2-linear" : "solar:flag-linear"
            }
            class={c["icon"]}
          />
        </div>
        <div className="flex flex-col">
          <span className={cn("font-black text-sm", c["text"])}>{label}</span>
          <span className="text-[11px] text-slate-400">Territory</span>
        </div>
      </div>
      <span
        className={cn(
          "bg-white px-2 py-0.5 rounded-md text-sm font-semibold border shadow-sm",
          c["badge"],
          c["badge-border"],
        )}
      >
        {value}%
      </span>
    </div>
  );
}
