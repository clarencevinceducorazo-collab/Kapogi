"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatAddress } from "@/lib/utils";
import { X, ShieldAlert, ArrowLeft, ArrowRight, LoaderCircle, RefreshCw } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        icon: string;
        width?: string;
        class?: string;
      };
    }
  }
}

const ITEMS_PER_PAGE = 10;

interface NftEntry {
  objectId: string;
  name: string;
  imageUrl: string;
  mmr: number;
  lineage: string;
  rank: string;
}

interface PodiumUser {
  rank: number;
  walletAddress: string;
  avatarImage: string;
  mmrScore: number;
  nftName: string;
  lineage: string;
  attributes: {
    cuteness?: number;
    confidence?: number;
    tiliFactor?: number;
    luzon?: number;
    visayas?: number;
    mindanao?: number;
    clothingStyle?: string;
    hairColor?: string;
    hairAmount?: number;
    facialHair?: number;
    eyewear?: number;
    skinTone?: string;
    heldItem?: string;
    posture?: string;
    rank?: string;
  };
}

interface MmrEntry extends PodiumUser {}

interface SummonEntry extends PodiumUser {
  totalNftSummon: number;
  allNfts: NftEntry[];
}

const lineageColors: Record<string, string> = {
  Malakas: "bg-blue-400",
  Maganda: "bg-pink-400",
  Mahawari: "bg-yellow-400",
  Maharaba: "bg-emerald-400",
  Unknown: "bg-slate-300",
};

// Podium slot config: display order is [left=2nd, center=1st, right=3rd]
// Each slot defines which rank index to pull from sorted `data` array (0-based)
const PODIUM_SLOTS = [
  // LEFT — Silver #2
  {
    dataIndex: 1,
    rankLabel: "2",
    badgeBg: "bg-slate-400",
    badgeText: "text-white",
    blockClass: "podium-silver",
    blockHeight: "h-32 md:h-44",
    avatarSize: "w-20 h-20 md:w-24 md:h-24",
    avatarRing: "border-4 border-white",
    scoreSize: "text-xl md:text-3xl",
    nameSize: "text-[10px] md:text-xs",
    isCenter: false,
    badgeSize: "w-10 h-10 text-sm",
    floatClass: "animate-float-2",
  },
  // CENTER — Gold #1
  {
    dataIndex: 0,
    rankLabel: "1",
    badgeBg: "bg-yellow-400",
    badgeText: "text-black",
    blockClass: "podium-gold",
    blockHeight: "h-44 md:h-60",
    avatarSize: "w-24 h-24 md:w-32 md:h-32",
    avatarRing: "border-4 border-white ring-8 ring-yellow-400/30",
    scoreSize: "text-3xl md:text-5xl",
    nameSize: "text-xs md:text-sm",
    isCenter: true,
    badgeSize: "px-4 py-1 text-sm rounded-full",
    floatClass: "animate-float-1",
  },
  // RIGHT — Bronze #3
  {
    dataIndex: 2,
    rankLabel: "3",
    badgeBg: "bg-orange-500",
    badgeText: "text-white",
    blockClass: "podium-bronze",
    blockHeight: "h-24 md:h-36",
    avatarSize: "w-20 h-20 md:w-24 md:h-24",
    avatarRing: "border-4 border-white",
    scoreSize: "text-xl md:text-3xl",
    nameSize: "text-[10px] md:text-xs",
    isCenter: false,
    badgeSize: "w-10 h-10 text-sm",
    floatClass: "animate-float-3",
  },
] as const;

const REFRESH_INTERVAL = 30; // seconds

// Season 1 end date — 30 days from a fixed start
const SEASON_1_END = new Date("2026-04-10T00:00:00Z"); // adjust start as needed

function useSeasonCountdown(endDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endDate.getTime() - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(Math.max(0, endDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  const totalSecs = Math.floor(timeLeft / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const ended   = timeLeft === 0;

  return { days, hours, minutes, seconds, ended };
}

export default function PodiumPage() {
  const [mode, setMode] = useState<"mmr" | "summon">("mmr");
  const [data, setData] = useState<(MmrEntry | SummonEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PodiumUser | null>(null);
  const [selectedSummonUser, setSelectedSummonUser] = useState<SummonEntry | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const season = useSeasonCountdown(SEASON_1_END);

  const startCountdown = useCallback(() => {
    setCountdown(REFRESH_INTERVAL);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (silent) { setRefreshing(true); } else { setLoading(true); setCurrentPage(1); }
    setError("");
    try {
      const allMintEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted`,
        },
      });

      const nftOwnerMap = new Map<string, string>();
      allMintEvents.data.forEach((event) => {
        const nftId = (event.parsedJson as any)?.nft_id;
        const owner = (event.parsedJson as any)?.owner;
        if (nftId && owner) nftOwnerMap.set(nftId, owner);
      });

      const nftIds = Array.from(nftOwnerMap.keys());
      if (nftIds.length === 0) {
        setData([]);
        return;
      }

      const characterObjects = [];
      for (let i = 0; i < nftIds.length; i += 50) {
        const chunk = nftIds.slice(i, i + 50);
        const chunkObjects = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true, showOwner: true, showDisplay: true },
        });
        characterObjects.push(...chunkObjects);
      }

      const validObjects = characterObjects.filter(
        (obj) => obj.data?.content?.dataType === "moveObject",
      );

      const ownerStats: Map<
        string,
        Omit<PodiumUser, "rank"> & { totalNftSummon: number; allNfts: NftEntry[] }
      > = new Map();

      validObjects.forEach((obj: any) => {
        const ownerAddress = nftOwnerMap.get(obj.data.objectId);
        if (!ownerAddress) return;

        const currentMmr = Number(obj.data.content.fields.mmr);
        const attributes = JSON.parse(obj.data.content.fields.attributes || "{}");
        const lineage = attributes.lineage || "Unknown";
        const nftRank = attributes.rank || "Spirit Seed";
        const nftName = obj.data.content.fields.name;
        const imageUrl = getIPFSGatewayUrl((obj.data.display?.data as any)?.image_url);

        if (!ownerStats.has(ownerAddress)) {
          ownerStats.set(ownerAddress, {
            walletAddress: ownerAddress,
            totalNftSummon: 0,
            mmrScore: -1,
            avatarImage: "",
            nftName: "",
            lineage: "Unknown",
            attributes: {},
            allNfts: [],
          });
        }

        const stats = ownerStats.get(ownerAddress)!;
        stats.totalNftSummon += 1;
        stats.allNfts.push({ objectId: obj.data.objectId, name: nftName, imageUrl, mmr: currentMmr, lineage, rank: nftRank });

        if (currentMmr > stats.mmrScore) {
          stats.mmrScore = currentMmr;
          stats.avatarImage = imageUrl;
          stats.nftName = nftName;
          stats.lineage = lineage;
          stats.attributes = attributes;
        }
      });

      ownerStats.forEach((s) => s.allNfts.sort((a, b) => b.mmr - a.mmr));
      const processedData = Array.from(ownerStats.values());

      // Build new sorted array, then set in one atomic state update
      const newData = mode === "summon"
        ? processedData
            .sort((a, b) => b.totalNftSummon - a.totalNftSummon)
            .map((user, index) => ({ ...user, rank: index + 1 })) as SummonEntry[]
        : processedData
            .sort((a, b) => b.mmrScore - a.mmrScore)
            .map((user, index) => ({ ...user, rank: index + 1 })) as MmrEntry[];

      setData(newData);
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
      if (!silent) setError("Could not fetch leaderboard data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  }, [mode]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchData(true);
      startCountdown();
    }, REFRESH_INTERVAL * 1000);
    startCountdown();
  }, [mode]);

  useEffect(() => {
    fetchData(false);
    startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [mode]);

  const handleManualRefresh = () => {
    if (refreshing || loading) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchData(true);
    startPolling();
  };

  const switchMode = (newMode: "mmr" | "summon") => {
    if (mode === newMode) return;
    setMode(newMode);
  };

  const handleUserClick = (user: PodiumUser | undefined) => {
    if (!user) return;
    if (mode === "summon") {
      setSelectedSummonUser(user as SummonEntry);
    } else {
      setSelectedUser(user);
    }
  };

  // data[0] = rank #1 (highest), data[1] = rank #2, data[2] = rank #3
  const podiumData = data.slice(0, 3);
  const listData = data.slice(3);
  const totalPages = Math.ceil(listData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedData = listData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const changePage = (direction: number) => {
    setCurrentPage((prev) => {
      const newPage = prev + direction;
      if (newPage >= 1 && newPage <= totalPages) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return newPage;
      }
      return prev;
    });
  };

  // ─── Podium ──────────────────────────────────────────────────────────────────
  // Layout order: [Silver/Left #2] [Gold/Center #1] [Bronze/Right #3]
  // data is sorted descending so data[0]=1st, data[1]=2nd, data[2]=3rd
  const Podium = ({ users }: { users: (PodiumUser | undefined)[] }) => (
    <div className="flex flex-row justify-center items-end gap-2 md:gap-6 mb-12 w-full max-w-3xl mx-auto pt-12 relative z-10">
      {PODIUM_SLOTS.map((slot) => {
        const user = users[slot.dataIndex];
        const scoreValue = user
          ? mode === "mmr"
            ? user.mmrScore?.toLocaleString()
            : (user as SummonEntry)?.totalNftSummon?.toLocaleString()
          : null;
        const displayName = user
          ? mode === "mmr"
            ? user.nftName
            : `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
          : null;

        return (
          <div
            key={slot.rankLabel}
            className={cn(
              "w-1/3 flex flex-col items-center group cursor-pointer",
              slot.floatClass,
              slot.isCenter && "z-10 -mx-1",
            )}
            onClick={() => handleUserClick(user)}
          >
            {user && (
              <>
                {/* Avatar */}
                <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
                  {/* Crown only for #1 */}
                  {slot.isCenter && (
                    <iconify-icon
                      icon="solar:crown-bold"
                      class="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] text-4xl md:text-6xl animate-bounce"
                    />
                  )}
                  <Image
                    src={user.avatarImage || ""}
                    width={slot.isCenter ? 140 : 100}
                    height={slot.isCenter ? 140 : 100}
                    alt={`Rank ${slot.rankLabel}`}
                    className={cn(
                      "rounded-full object-cover shadow-lg mix-blend-multiply",
                      slot.avatarSize,
                      slot.avatarRing,
                      slot.isCenter ? "bg-yellow-100 shadow-2xl" : "bg-slate-200",
                    )}
                  />
                  {/* Rank badge */}
                  {slot.isCenter ? (
                    <div
                      className={cn(
                        "absolute -bottom-3 left-1/2 -translate-x-1/2 border-4 border-white font-black shadow-lg",
                        slot.badgeBg,
                        slot.badgeText,
                        slot.badgeSize,
                      )}
                    >
                      #{slot.rankLabel}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "absolute -bottom-2 -right-2 border-4 border-white font-black flex items-center justify-center rounded-full shadow-md",
                        slot.badgeBg,
                        slot.badgeText,
                        slot.badgeSize,
                      )}
                    >
                      {slot.rankLabel}
                    </div>
                  )}
                </div>

                {/* Podium block */}
                <div
                  className={cn(
                    "w-full rounded-t-[2.5rem] flex flex-col justify-end items-center p-4 text-center relative overflow-hidden border-4 border-black",
                    slot.blockClass,
                    slot.blockHeight,
                    slot.isCenter && "rounded-t-[3rem] p-5",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full bg-white/40",
                      slot.isCenter ? "h-4" : "h-3",
                    )}
                  />
                  <span
                    className={cn(
                      "font-black uppercase tracking-widest mb-1 truncate w-full px-2",
                      slot.nameSize,
                      slot.isCenter
                        ? "text-yellow-950 opacity-80"
                        : slot.dataIndex === 1
                        ? "text-slate-700"
                        : "text-orange-950 opacity-70",
                    )}
                  >
                    {displayName}
                  </span>
                  <span
                    className={cn(
                      "font-black tracking-tighter",
                      slot.scoreSize,
                      slot.isCenter
                        ? "text-yellow-950 mb-2"
                        : slot.dataIndex === 1
                        ? "text-slate-900"
                        : "text-orange-950",
                    )}
                  >
                    {scoreValue}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  const ListItem = ({ user, delayIndex }: { user: PodiumUser; delayIndex: number }) => (
    <div
      onClick={() => handleUserClick(user)}
      className="bg-white border-4 border-black rounded-[2rem] p-4 mb-4 flex items-center gap-4 cursor-pointer group transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      style={{}}
    >
      <div className="w-12 flex-shrink-0 flex justify-center">
        <span className="text-base font-black text-slate-400 bg-slate-100 w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center group-hover:bg-sky-400 group-hover:text-white group-hover:border-black transition-colors">
          #{user.rank}
        </span>
      </div>
      <div className="relative">
        <Image
          src={user.avatarImage || ""}
          width={56}
          height={56}
          alt="Avatar"
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 border-2 border-black shadow-sm object-cover mix-blend-multiply p-1"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base md:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate">
          {mode === "mmr"
            ? user.nftName
            : `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">
          {formatAddress(user.walletAddress)}
        </div>
      </div>
      <div className="text-right px-4">
        <div className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">
          {mode === "mmr"
            ? user.mmrScore?.toLocaleString()
            : (user as SummonEntry).totalNftSummon?.toLocaleString()}
        </div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block group-hover:bg-sky-100 group-hover:text-sky-600 group-hover:border-sky-200 transition-colors">
          {mode === "mmr" ? "MMR Rating" : "Total Summons"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <div
        className="text-slate-600 antialiased min-h-screen relative flex-1 flex flex-col"
        style={{
          backgroundImage: "url('/images/podium/biringanbg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

        <main className="relative flex-1 max-w-5xl mx-auto w-full px-4 pb-24 pt-32 z-10">

          {/* ── Season 1 Banner ─────────────────────────────────────────── */}
          <div className="mb-10 bg-black/50 backdrop-blur-md border-2 border-yellow-400/40 rounded-[2rem] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0_#000]">
                <iconify-icon icon="solar:cup-star-bold" class="text-black text-xl" />
              </div>
              <div>
                <p className="text-[9px] font-black text-yellow-400/70 uppercase tracking-[0.25em]">Current Season</p>
                <p className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Season 1  Dawn of Biringan</p>
              </div>
            </div>

            {/* Countdown blocks */}
            {season.ended ? (
              <div className="bg-red-500/20 border-2 border-red-400/40 rounded-2xl px-6 py-2">
                <p className="text-sm font-black text-red-300 uppercase tracking-widest">Season Ended</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mr-1 hidden sm:block">Ends in</p>
                {[
                  { val: season.days,    label: "Days"  },
                  { val: season.hours,   label: "Hrs"   },
                  { val: season.minutes, label: "Min"   },
                  { val: season.seconds, label: "Sec"   },
                ].map(({ val, label }, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && <span className="text-white/30 font-black text-lg -mx-1">:</span>}
                    <div className="flex flex-col items-center bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 min-w-[46px]">
                      <span className="text-xl font-black text-white leading-none tabular-nums">
                        {String(val).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">{label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="text-center md:text-left">
              <h1
                className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-3"
                style={{ textShadow: "6px 6px 0px rgba(0,0,0,0.5)" }}
              >
                Leaderboard
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <p className="text-white font-black uppercase tracking-[0.2em] text-sm md:text-base bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/20 inline-block shadow-lg">
                  Climb the ranks and earn rewards!
                </p>
                {/* Live sync badge */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border-2 border-white/20 shadow-lg">
                  <div className="relative w-7 h-7 flex-shrink-0">
                    <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                      <circle
                        cx="14" cy="14" r="11" fill="none"
                        stroke={refreshing ? "#facc15" : "#34d399"}
                        strokeWidth="2.5"
                        strokeDasharray={`${2 * Math.PI * 11}`}
                        strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / REFRESH_INTERVAL)}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center">
                      {refreshing
                        ? <LoaderCircle size={10} className="text-yellow-300 animate-spin" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      }
                    </span>
                  </div>
                  <div className="flex flex-col leading-none gap-0.5">
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">
                      {refreshing ? "Syncing..." : "Live"}
                    </span>
                    {lastUpdated && !refreshing && (
                      <span className="text-[9px] font-black text-white/60 tabular-nums">
                        {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={refreshing || loading}
                    className="ml-1 w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    title="Refresh now"
                  >
                    <RefreshCw size={12} className={cn("text-white", refreshing && "animate-spin")} />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-[2.5rem] border-4 border-black inline-flex relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <div
                id="tab-bg"
                className="absolute top-2 bottom-2 left-2 w-[calc(50%-8px)] bg-sky-400 border-4 border-black rounded-[1.8rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ transform: mode === "mmr" ? "translateX(0)" : "translateX(100%)" }}
              />
              <button
                onClick={() => switchMode("mmr")}
                className={`relative z-10 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 ${mode === "mmr" ? "text-white drop-shadow-[2px_2px_0_#000]" : "text-slate-500 hover:text-sky-600"}`}
              >
                <iconify-icon icon="solar:cup-star-bold" width="20" /> MMR Rank
              </button>
              <button
                onClick={() => switchMode("summon")}
                className={`relative z-10 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 ${mode === "summon" ? "text-white drop-shadow-[2px_2px_0_#000]" : "text-slate-500 hover:text-sky-600"}`}
              >
                <iconify-icon icon="solar:box-bold" width="20" /> Summons
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-20 bg-white/10 backdrop-blur-xl rounded-[3rem] border-4 border-white/20">
              <LoaderCircle className="text-6xl animate-spin text-white drop-shadow-lg" size={64} />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-8 rounded-[2.5rem] border-4 border-red-200 text-center font-black uppercase tracking-tight shadow-xl">
              <ShieldAlert className="mx-auto mb-4 w-12 h-12" />
              {error}
            </div>
          ) : (
            <div id="content-area" className="w-full">
              {data.length > 0 && <Podium users={podiumData} />}
              <div className="mt-16">
                {pagedData.length > 0 ? (
                  <div className="space-y-4">
                    {pagedData.map((user, index) => (
                      <ListItem key={user.walletAddress + index} user={user} delayIndex={index} />
                    ))}
                  </div>
                ) : data.length > 3 ? (
                  <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-[2rem] border-2 border-white/10 text-white font-black uppercase tracking-widest text-sm">
                    End of the board.
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-[2rem] border-2 border-white/10 text-white font-black uppercase tracking-widest text-sm">
                    No records found in the facility.
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {selectedUser && (
            <CharacterDetailModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
          )}
          {selectedSummonUser && (
            <SummonDetailModal user={selectedSummonUser} isOpen={!!selectedSummonUser} onClose={() => setSelectedSummonUser(null)} />
          )}
        </main>
      </div>

      {totalPages > 1 && (
        <div className="fixed bottom-10 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-3xl p-3 flex items-center gap-6 pointer-events-auto">
            <button
              onClick={() => changePage(-1)}
              disabled={currentPage === 1}
              className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-black text-black hover:bg-sky-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Registry Page</span>
              <span className="text-lg font-black text-slate-900 font-mono">{currentPage} / {totalPages}</span>
            </div>
            <button
              onClick={() => changePage(1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-black text-black hover:bg-sky-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ArrowRight size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
      <PageFooter />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMON MODAL
// ─────────────────────────────────────────────────────────────────────────────

function SummonDetailModal({ user, isOpen, onClose }: { user: SummonEntry; isOpen: boolean; onClose: () => void }) {
  const [mmr, setMmr] = useState(0);
  const [animate, setAnimate] = useState(false);

  const PAGE_SIZE = 3;
  const [restPage, setRestPage] = useState(1);
  const bestNft = user.allNfts[0] ?? null;
  const restNfts = user.allNfts.slice(1);
  const totalRestPages = Math.ceil(restNfts.length / PAGE_SIZE);
  const startIdx = (restPage - 1) * PAGE_SIZE;
  const pagedRestNfts = restNfts.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    if (restPage > totalRestPages) setRestPage(1);
  }, [restNfts.length, totalRestPages]);

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const highestMmr = bestNft?.mmr ?? 0;
  const avgMmr = user.allNfts.length > 0
    ? Math.round(user.allNfts.reduce((s, n) => s + n.mmr, 0) / user.allNfts.length)
    : 0;

  const lineageCounts = user.allNfts.reduce<Record<string, number>>((acc, n) => {
    acc[n.lineage] = (acc[n.lineage] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    if (isOpen) {
      setMmr(0);
      setAnimate(false);
      const timeout = setTimeout(() => setAnimate(true), 100);
      let start = 0;
      const end = highestMmr;
      if (start === end) return;
      const timer = setInterval(() => {
        start += Math.ceil((end - start) / 60);
        if (start >= end) { setMmr(end); clearInterval(timer); } else { setMmr(start); }
      }, 16);
      return () => { clearInterval(timer); clearTimeout(timeout); };
    }
  }, [isOpen, highestMmr]);

  const rankInfo = useMemo(() => {
    const rank = bestNft?.rank || "Spirit Seed";
    const ranks: { [key: string]: { style: string; icon: string } } = {
      "Kapogian Ascendant": { style: "rank-ascendant", icon: "fluent-emoji:shooting-star" },
      "Master Rancher": { style: "rank-rancher", icon: "fluent-emoji:cow-face" },
      "Generational Tycoon": { style: "rank-tycoon", icon: "fluent-emoji:money-bag" },
      "Cultural Icon": { style: "rank-icon", icon: "fluent-emoji:performing-arts" },
      "Eternal Light Bearer": { style: "rank-eternal", icon: "fluent-emoji:fire" },
      "Hall of Fame Immortal": { style: "rank-hof", icon: "fluent-emoji:trophy" },
      "Supreme Pogi": { style: "rank-supreme", icon: "fluent-emoji:star" },
      "Proof of Pogi Elite": { style: "rank-elite", icon: "fluent-emoji:gem-stone" },
      "Aura God": { style: "rank-auragod", icon: "fluent-emoji:crown" },
      "Lord of Biringan": { style: "rank-biringan", icon: "fluent-emoji:classical-building" },
      "Fearless Descent": { style: "rank-fearless", icon: "fluent-emoji:shield" },
      "Dalaketnon Slayer": { style: "rank-slayer", icon: "fluent-emoji:crossed-swords" },
      "Ghost Walker": { style: "rank-ghost", icon: "fluent-emoji:ghost" },
      "Initiate of Pogi": { style: "rank-initiate", icon: "fluent-emoji:person-raising-hand-light" },
      "Aura Touched": { style: "rank-touched", icon: "fluent-emoji:sparkles" },
      "Pogi Spark": { style: "rank-spark", icon: "fluent-emoji:zap" },
      "Spirit Seed": { style: "rank-seed", icon: "fluent-emoji:seedling" },
    };
    return ranks[rank] || ranks["Spirit Seed"];
  }, [bestNft?.rank]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="max-w-[95vw] md:max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Summoner: {short(user.walletAddress)}</DialogTitle>
          <DialogDescription>Best MMR NFT and full collection for this wallet.</DialogDescription>
        </DialogHeader>
        <div className="w-full bg-white rounded-[2.5rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[85vh] relative">
          <button onClick={onClose} className="absolute top-6 right-6 z-[60] bg-white border-4 border-black rounded-full p-2 hover:bg-red-500 hover:text-white transition-all active:scale-95">
            <X size={24} strokeWidth={3} />
          </button>
          <div className="w-full md:w-[35%] bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 relative overflow-hidden h-80 md:h-auto border-b md:border-b-0 md:border-r-4 border-black flex flex-col items-center justify-start pt-16 p-4">
            <div className="slide-up-delay-1 text-center z-20">
              <span className="inline-flex items-center gap-1 bg-white/80 border-2 border-black text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 px-3 py-1 rounded-full shadow-sm">
                <iconify-icon icon="fluent-emoji:trophy" class="text-sm" /> Best MMR NFT
              </span>
            </div>
            <div className="slide-up-delay-1 text-center z-20 mt-4">
              <h2 className={cn("uppercase font-black tracking-wider flex items-center justify-center gap-1 drop-shadow-sm", rankInfo.style)}>
                <iconify-icon icon={rankInfo.icon} /> {bestNft?.rank || "Spirit Seed"}
              </h2>
            </div>
            <div className="relative w-full flex-1 flex flex-col items-center justify-center">
              <div className="relative z-30 w-64 h-64 md:w-72 md:h-72 mb-1 transition-all duration-700 ease-out mix-blend-multiply"
                style={{ transform: animate ? (highestMmr > 1200 ? "translateY(-5px)" : "translateY(-10px)") : "translateY(0px)" }}>
                {bestNft?.imageUrl ? (
                  <Image src={bestNft.imageUrl} alt={bestNft.name} fill className="object-contain p-4" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <iconify-icon icon="fluent-emoji:ghost" class="text-8xl text-slate-300" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center z-20 mb-16">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">{bestNft?.name ?? "—"}</h1>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-black bg-white border-2 border-black py-1.5 px-4 rounded-full shadow-sm">
                <iconify-icon icon="solar:wallet-bold" class="text-indigo-500" />
                <span>WALLET: <strong className="text-indigo-600 font-mono">{short(user.walletAddress)}</strong></span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-[65%] flex flex-col h-full bg-white min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 border-b-4 border-slate-50 pb-4 md:pb-8">
                <div className="flex items-center gap-3 md:gap-4 bg-slate-50 border-4 border-black p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] flex-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center border-2 border-black">
                    <iconify-icon icon="fluent-emoji:trophy" class="text-xl md:text-2xl" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Best Rating</p>
                    <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{mmr.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-row justify-between gap-3 sm:gap-4 flex-1">
                  <div className="flex items-center gap-2 md:gap-4 bg-slate-50 border-4 border-black p-2 md:p-4 rounded-2xl md:rounded-[1.5rem] flex-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-indigo-500 text-white flex items-center justify-center border-2 border-black">
                      <iconify-icon icon="fluent-emoji:chart-increasing" class="text-lg md:text-2xl" />
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Avg MMR</p>
                      <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{avgMmr.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 bg-slate-50 border-4 border-black p-2 md:p-4 rounded-2xl md:rounded-[1.5rem] flex-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-500 text-white flex items-center justify-center border-2 border-black">
                      <iconify-icon icon="fluent-emoji:package" class="text-lg md:text-2xl" />
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Summons</p>
                      <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{user.totalNftSummon}</p>
                    </div>
                  </div>
                </div>
              </div>
              {Object.keys(lineageCounts).length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <iconify-icon icon="fluent-emoji:dna" class="text-lg" /> Lineage Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(lineageCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className={`w-3 h-3 rounded-full border border-black/20 ${lineageColors[name] ?? "bg-slate-300"}`} />
                        <span className="text-[11px] font-black text-slate-700 uppercase italic">{name}</span>
                        <span className="text-[11px] font-black text-indigo-500 bg-white border border-slate-200 px-1.5 rounded-md ml-1">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <iconify-icon icon="fluent-emoji:framed-picture" class="text-lg" /> Full Collection
                  {restNfts.length > 0 && (
                    <span className="ml-auto bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-black text-slate-400 normal-case tracking-normal">
                      {restNfts.length + 1} ASSETS
                    </span>
                  )}
                </h3>
                {restNfts.length === 0 ? (
                  <p className="text-sm font-bold text-slate-300 text-center py-12 italic border-2 border-dashed border-slate-100 rounded-2xl">No other spirits found in this wallet.</p>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {pagedRestNfts.map((nft) => (
                        <div key={nft.objectId} className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-[1.5rem] p-3 hover:border-black hover:translate-x-1 transition-all shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-black overflow-hidden flex-shrink-0 relative">
                            {nft.imageUrl ? (
                              <Image src={nft.imageUrl} alt={nft.name} fill className="object-contain mix-blend-multiply p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <iconify-icon icon="fluent-emoji:ghost" class="text-base" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-base text-slate-800 truncate leading-tight uppercase italic tracking-tighter">{nft.name}</p>
                            <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-widest mt-0.5">{nft.rank}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                            <span className="font-black text-lg text-slate-900 leading-none">{nft.mmr.toLocaleString()}</span>
                            <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-black/10 text-white shadow-sm", lineageColors[nft.lineage] ?? "bg-slate-400")}>{nft.lineage}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {restNfts.length > PAGE_SIZE && (
                      <div className="flex flex-col items-center gap-4 mt-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] py-6 px-4">
                        <div className="flex justify-center items-center gap-4 w-full">
                          <button onClick={() => setRestPage((p) => Math.max(1, p - 1))} disabled={restPage === 1}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                            <ArrowLeft size={20} strokeWidth={3} />
                          </button>
                          <div className="flex items-center px-6 py-2 rounded-2xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[140px] justify-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">PAGE</span>
                            <span className="text-xl font-black text-indigo-500 mx-1">{restPage}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">OF {totalRestPages}</span>
                          </div>
                          <button onClick={() => setRestPage((p) => Math.min(totalRestPages, p + 1))} disabled={restPage === totalRestPages}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                            <ArrowRight size={20} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-900 border-t-4 border-black mt-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Encrypted Player Profile</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MMR MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CharacterDetailModal({ user, isOpen, onClose }: { user: PodiumUser; isOpen: boolean; onClose: () => void }) {
  const [mmr, setMmr] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMmr(0);
      setAnimate(false);
      const timeout = setTimeout(() => setAnimate(true), 100);
      let start = 0;
      const end = user.mmrScore;
      if (start === end) return;
      const timer = setInterval(() => {
        start += Math.ceil((end - start) / 60);
        if (start >= end) { setMmr(end); clearInterval(timer); } else setMmr(start);
      }, 16);
      return () => { clearInterval(timer); clearTimeout(timeout); };
    }
  }, [isOpen, user.mmrScore]);

  const rankInfo = useMemo(() => {
    const rank = user.attributes?.rank || "Spirit Seed";
    const ranks: { [key: string]: { style: string; icon: string } } = {
      "Kapogian Ascendant": { style: "rank-ascendant", icon: "fluent-emoji:shooting-star" },
      "Master Rancher": { style: "rank-rancher", icon: "fluent-emoji:cow-face" },
      "Generational Tycoon": { style: "rank-tycoon", icon: "fluent-emoji:money-bag" },
      "Cultural Icon": { style: "rank-icon", icon: "fluent-emoji:performing-arts" },
      "Eternal Light Bearer": { style: "rank-eternal", icon: "fluent-emoji:fire" },
      "Hall of Fame Immortal": { style: "rank-hof", icon: "fluent-emoji:trophy" },
      "Supreme Pogi": { style: "rank-supreme", icon: "fluent-emoji:star" },
      "Proof of Pogi Elite": { style: "rank-elite", icon: "fluent-emoji:gem-stone" },
      "Aura God": { style: "rank-auragod", icon: "fluent-emoji:crown" },
      "Lord of Biringan": { style: "rank-biringan", icon: "fluent-emoji:classical-building" },
      "Fearless Descent": { style: "rank-fearless", icon: "fluent-emoji:shield" },
      "Dalaketnon Slayer": { style: "rank-slayer", icon: "fluent-emoji:crossed-swords" },
      "Ghost Walker": { style: "rank-ghost", icon: "fluent-emoji:ghost" },
      "Initiate of Pogi": { style: "rank-initiate", icon: "fluent-emoji:person-raising-hand-light" },
      "Aura Touched": { style: "rank-touched", icon: "fluent-emoji:sparkles" },
      "Pogi Spark": { style: "rank-spark", icon: "fluent-emoji:zap" },
      "Spirit Seed": { style: "rank-seed", icon: "fluent-emoji:seedling" },
    };
    return ranks[rank] || ranks["Spirit Seed"];
  }, [user.attributes?.rank]);

  const traits = [
    { label: "Style",  value: user.attributes?.clothingStyle, icon: "solar:t-shirt-bold" },
    { label: "Hair",   value: user.attributes?.hairAmount ? `${user.attributes.hairAmount}% Fluff` : null, icon: "solar:user-hand-up-bold" },
    { label: "Face",   value: user.attributes?.facialHair ? `${user.attributes.facialHair}% Stubble` : null, icon: "solar:emoji-funny-circle-bold" },
    { label: "Eyewear", value: (user.attributes?.eyewear ?? 0) > 50 ? "Yes" : "None", icon: "solar:glasses-bold" },
    { label: "Held",   value: user.attributes?.heldItem, icon: "solar:cup-bold" },
  ].filter((t) => t.value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton className="max-w-[95vw] md:max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Character Details: {user.nftName}</DialogTitle>
          <DialogDescription>Detailed statistics and traits for {user.nftName}.</DialogDescription>
        </DialogHeader>
        <div className="w-full bg-white rounded-[2.5rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[85vh] relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-[60] bg-white border-[3px] border-black rounded-full p-1 md:p-2 hover:bg-red-500 hover:text-white transition-all active:scale-95">
            <X size={20} strokeWidth={3} />
          </button>
          <div className="w-full bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 relative overflow-hidden h-64 md:h-80 border-b-[3px] md:border-b-4 border-black flex flex-col items-center justify-start pt-8 md:pt-16 p-4">
            <div className="text-center z-20 absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-full">
              <h2 className={cn("text-[10px] md:text-base uppercase font-black tracking-widest flex items-center justify-center gap-1 drop-shadow-sm opacity-80", rankInfo.style)}>
                {user.attributes?.rank || "Spirit Seed."}
              </h2>
            </div>
            <div className="relative w-full flex-1 flex flex-col items-center justify-center mt-4 md:mt-0">
              <div className="relative z-30 w-48 h-48 md:w-64 md:h-64 transition-all duration-700 ease-out mix-blend-multiply"
                style={{ transform: animate ? (user.mmrScore > 1200 ? "translateY(-5px)" : "translateY(-10px)") : "translateY(0px)" }}>
                <Image src={user.avatarImage} alt={user.nftName} fill className="object-contain p-2 md:p-4" />
              </div>
              <div className="absolute bottom-[-16px] md:bottom-16 left-1/2 -translate-x-1/2 w-48 h-20 md:w-48 md:h-20 z-0 hidden md:block">
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-emerald-900/20 blur-lg rounded-[100%]" />
                <div className="absolute top-1/2 left-[4%] w-[92%] h-full bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-b-[100%] border-b-4 border-black shadow-xl z-0" />
                <div className="absolute top-0 w-full h-full bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-[100%] border-4 border-black shadow-[inset_0_6px_12px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[85%] h-[35%] bg-emerald-300/40 rounded-[100%] blur-[1px]" />
                  <div className="mt-2 text-black font-headline font-bold text-4xl opacity-20 select-none mix-blend-overlay">{user.rank}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col bg-white overflow-hidden min-h-0 relative">
            {/* Absolute positioning of Name and Lineage to overlap avatar container on mobile */}
            <div className="absolute top-[-30px] md:relative md:top-0 left-0 w-full text-center z-40 md:mt-8 md:mb-12 pointer-events-none">
              <h1 className="text-2xl md:text-3xl font-black text-[#5ce1e6] tracking-tighter uppercase leading-none mb-1 md:mb-2 pointer-events-auto filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] md:drop-shadow-none">{user.nftName}</h1>
            </div>
            {/* Removed the absolute positioning wrapper, returning to a normal scroll layout */}
            <div className="overflow-y-auto w-full flex flex-col flex-1 custom-scrollbar pt-8">
              <div className="px-4 pb-6 sm:p-6 md:px-10 md:pb-10 space-y-4 md:space-y-6 flex-1">
              <div className="flex justify-between items-center pb-2 md:pb-6">
                <div className="flex items-center gap-3 md:gap-4 bg-slate-50 border-4 border-black p-3 md:p-5 rounded-2xl md:rounded-[2rem] w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-500 text-white flex items-center justify-center border-2 border-black shadow-md md:shadow-lg">
                    <iconify-icon icon="fluent-emoji:chart-increasing" class="text-xl md:text-3xl" />
                  </div>
                  <div className="flex-1 flex justify-between items-center sm:block">
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0 md:mb-1">Spirit Rating</p>
                    <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{mmr.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-0">
                <div className="space-y-2">
                  <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-1 md:mb-0">
                    <iconify-icon icon="fluent-emoji:magic-wand" class="text-base md:text-lg" /> Core Skillset
                  </h3>
                  {[
                    { label: "Cuteness",   val: user.attributes?.cuteness,   color: "bg-pink-400"   },
                    { label: "Confidence", val: user.attributes?.confidence, color: "bg-indigo-400" },
                    { label: "Tili Factor", val: user.attributes?.tiliFactor, color: "bg-amber-400"  },
                  ].map((skill) => (
                    <div key={skill.label}>
                      <div className="flex justify-between items-end text-[10px] font-black mb-1 text-slate-800 uppercase tracking-wider leading-none">
                        <span>{skill.label}</span>
                        <span className="text-slate-500 font-mono text-[9px]">{skill.val || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full border border-black p-[1px] shadow-inner overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", skill.color)}
                          style={{ width: animate ? `${skill.val || 0}%` : "0%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 md:pt-4">
                  <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2 md:mb-3">
                    <iconify-icon icon="fluent-emoji:map-point" class="text-base" /> Territory Affinity
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Luzon",    val: user.attributes?.luzon,    color: "bg-red-400"    },
                      { label: "Visayas",  val: user.attributes?.visayas,  color: "bg-blue-400"   },
                      { label: "Mindanao", val: user.attributes?.mindanao, color: "bg-yellow-400" },
                    ].map((region) => (
                      <div key={region.label} className="flex flex-col items-center justify-center bg-white border border-slate-200 md:border-2 md:border-black rounded-lg p-2 relative overflow-hidden text-center shadow-sm">
                        <span className="text-[7px] uppercase font-black text-slate-400 tracking-wider mb-0.5 z-10">{region.label}</span>
                        <span className="text-xs font-black text-slate-800 font-mono z-10">{region.val || 0}%</span>
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100">
                          <div className={cn("h-full transition-all duration-1000 ease-out", region.color)} style={{ width: animate ? `${region.val || 0}%` : "0%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-2 md:pt-4">
                <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <iconify-icon icon="fluent-emoji:t-shirt" class="text-base md:text-lg" /> Visual Signature
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {traits.map((trait) => (
                    <div key={trait.label} className="min-w-0 flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-white md:bg-slate-50 border-2 border-slate-200 md:border-black rounded-lg md:rounded-2xl shadow-sm md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                      <div className="w-5 h-5 md:w-8 md:h-8 rounded-md md:rounded-lg bg-slate-50 md:bg-white border md:border-slate-200 flex items-center justify-center flex-shrink-0">
                        <iconify-icon icon={trait.icon} class="text-[10px] md:text-xl text-slate-400" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[6px] md:text-[9px] text-slate-400 uppercase font-black leading-none tracking-widest">{trait.label}</span>
                        <span className="text-[9px] md:text-xs text-slate-800 font-black uppercase italic tracking-tighter truncate mt-[1px] md:mt-0.5">{trait.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            <div className="p-6 bg-slate-900 border-t-4 border-black mt-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Encrypted Player Profile</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}