"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Script from "next/script";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// I have to define IconifyIcon for typescript since it's not a standard element
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

// Type definitions for our data
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
}

export default function PodiumPage() {
  const [mode, setMode] = useState<"mmr" | "summon">("mmr");
  const [data, setData] = useState<(MmrEntry | SummonEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PodiumUser | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
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
        if (nftId && owner) {
          nftOwnerMap.set(nftId, owner);
        }
      });

      const nftIds = Array.from(nftOwnerMap.keys());

      if (nftIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const characterObjects = [];
      const chunkSize = 50;
      for (let i = 0; i < nftIds.length; i += chunkSize) {
        const chunk = nftIds.slice(i, i + chunkSize);
        const chunkObjects = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true, showOwner: true, showDisplay: true },
        });
        characterObjects.push(...chunkObjects);
      }

      const validObjects = characterObjects.filter(
        (obj) => obj.data?.content?.dataType === "moveObject",
      );

      const ownerStats: Map<string, Omit<PodiumUser, "rank"> & { totalNftSummon: number } > = new Map();

      validObjects.forEach((obj: any) => {
        const ownerAddress = nftOwnerMap.get(obj.data.objectId);
        if (!ownerAddress) return;

        const currentMmr = Number(obj.data.content.fields.mmr);
        const attributes = JSON.parse(
          obj.data.content.fields.attributes || "{}",
        );
        const lineage = attributes.lineage || "Unknown";

        if (!ownerStats.has(ownerAddress)) {
          ownerStats.set(ownerAddress, {
            walletAddress: ownerAddress,
            totalNftSummon: 0,
            mmrScore: -1,
            avatarImage: "",
            nftName: "",
            lineage: "Unknown",
            attributes: {},
          });
        }

        const stats = ownerStats.get(ownerAddress)!;
        stats.totalNftSummon += 1;

        if (currentMmr > stats.mmrScore) {
          stats.mmrScore = currentMmr;
          stats.avatarImage = getIPFSGatewayUrl(
            (obj.data.display.data as any).image_url,
          );
          stats.nftName = obj.data.content.fields.name;
          stats.lineage = lineage;
          stats.attributes = attributes;
        }
      });

      const processedData = Array.from(ownerStats.values());

      if (mode === "summon") {
        const sortedData: SummonEntry[] = processedData
          .sort((a, b) => b.totalNftSummon - a.totalNftSummon)
          .map((user, index) => ({
            ...user,
            rank: index + 1,
          }));
        setData(sortedData);
      } else {
        // MMR mode
        const sortedData: MmrEntry[] = processedData
          .sort((a, b) => b.mmrScore - a.mmrScore)
          .map((user, index) => ({
            ...user,
            rank: index + 1,
          }));
        setData(sortedData);
      }
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
      setError("Could not fetch leaderboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mode]);

  const switchMode = (newMode: "mmr" | "summon") => {
    if (mode === newMode) return;
    setMode(newMode);
  };

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

  const Podium = ({ users }: { users: (PodiumUser | undefined)[] }) => {
    const podiumOrder = users.length >= 3 ? [users[1], users[0], users[2]] : users;
    if (users.length === 2) {
      podiumOrder.splice(2, 0, undefined);
    } else if (users.length === 1) {
      podiumOrder.splice(1, 0, undefined, undefined);
    }

    return (
      <div className="flex flex-row justify-center items-end gap-2 md:gap-6 mb-12 w-full max-w-2xl mx-auto pt-4">
        {/* Rank 2 */}
        <div
          className="w-1/3 flex flex-col items-center animate-float-2 group cursor-pointer"
          onClick={() => podiumOrder[0] && setSelectedUser(podiumOrder[0])}
        >
          {podiumOrder[0] && (
            <>
              <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src={podiumOrder[0].avatarImage || ""}
                  width={80}
                  height={80}
                  alt="Rank 2"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-slate-200 object-cover shadow-md mix-blend-darken"
                />
                <div className="absolute -bottom-2 -right-2 bg-slate-200 border-2 border-white text-slate-600 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-sm">
                  2
                </div>
              </div>
              <div className="w-full h-32 md:h-40 rounded-t-2xl md:rounded-t-3xl podium-silver flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30"></div>
                <span className="text-xs md:text-sm text-slate-500 font-bold mb-1 truncate w-full px-2">
                  {mode === "mmr"
                    ? podiumOrder[0].nftName
                    : `${podiumOrder[0].walletAddress.slice(0, 6)}...${podiumOrder[0].walletAddress.slice(-4)}`}
                </span>
                <span className="text-sm md:text-lg font-extrabold text-slate-700">
                  {mode === "mmr"
                    ? podiumOrder[0].mmrScore?.toLocaleString()
                    : (podiumOrder[0] as SummonEntry)?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
        {/* Rank 1 */}
        <div
          className="w-1/3 flex flex-col items-center z-10 animate-float-1 group cursor-pointer -mx-1"
          onClick={() => podiumOrder[1] && setSelectedUser(podiumOrder[1])}
        >
          {podiumOrder[1] && (
            <>
              <div className="relative mb-4 transition-transform group-hover:scale-110 duration-300">
                <iconify-icon
                  icon="solar:crown-bold"
                  class="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-sm text-3xl md:text-4xl animate-bounce"
                ></iconify-icon>
                <Image
                  src={podiumOrder[1].avatarImage || ""}
                  width={112}
                  height={112}
                  alt="Rank 1"
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white bg-yellow-100 object-cover shadow-lg ring-4 ring-yellow-200/50 mix-blend-darken"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 border-2 border-white text-white text-sm font-bold px-3 py-0.5 rounded-full shadow-sm">
                  #1
                </div>
              </div>
              <div className="w-full h-44 md:h-52 rounded-t-2xl md:rounded-t-3xl podium-gold flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-white/30"></div>
                <span className="text-xs md:text-sm text-yellow-800/70 font-bold mb-1 truncate w-full px-2">
                  {mode === "mmr"
                    ? podiumOrder[1].nftName
                    : `${podiumOrder[1].walletAddress.slice(0, 6)}...${podiumOrder[1].walletAddress.slice(-4)}`}
                </span>
                <span className="text-lg md:text-2xl font-extrabold text-yellow-900">
                  {mode === "mmr"
                    ? podiumOrder[1].mmrScore?.toLocaleString()
                    : (podiumOrder[1] as SummonEntry)?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
        {/* Rank 3 */}
        <div
          className="w-1/3 flex flex-col items-center animate-float-3 group cursor-pointer"
          onClick={() => podiumOrder[2] && setSelectedUser(podiumOrder[2])}
        >
          {podiumOrder[2] && (
            <>
              <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src={podiumOrder[2].avatarImage || ""}
                  width={80}
                  height={80}
                  alt="Rank 3"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-orange-100 object-cover shadow-md mix-blend-darken"
                />
                <div className="absolute -bottom-2 -right-2 bg-orange-200 border-2 border-white text-orange-700 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-sm">
                  3
                </div>
              </div>
              <div className="w-full h-24 md:h-32 rounded-t-2xl md:rounded-t-3xl podium-bronze flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30"></div>
                <span className="text-xs md:text-sm text-orange-800/60 font-bold mb-1 truncate w-full px-2">
                  {mode === "mmr"
                    ? podiumOrder[2].nftName
                    : `${podiumOrder[2].walletAddress.slice(0, 6)}...${podiumOrder[2].walletAddress.slice(-4)}`}
                </span>
                <span className="text-sm md:text-lg font-extrabold text-orange-900">
                  {mode === "mmr"
                    ? podiumOrder[2].mmrScore?.toLocaleString()
                    : (podiumOrder[2] as SummonEntry)?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const ListItem = ({ user, delayIndex }: { user: PodiumUser; delayIndex: number }) => {
    const rank = user.rank;
    return (
      <div
        onClick={() => setSelectedUser(user)}
        className="card-toy rounded-2xl md:rounded-3xl p-3 md:p-4 mb-3 flex items-center gap-3 md:gap-5 animate-pop-in cursor-pointer group transition-all"
        style={{ animationDelay: `${delayIndex * 50}ms` }}
      >
        <div className="w-10 md:w-12 flex-shrink-0 flex justify-center">
          <span className="text-sm md:text-base font-bold text-slate-400 bg-slate-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center rank-text group-hover:bg-sky-100 group-hover:text-sky-500 transition-colors">
            #{rank}
          </span>
        </div>
        <div className="relative">
          <Image
            src={user.avatarImage || ""}
            width={48}
            height={48}
            alt="Avatar"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm object-cover mix-blend-darken"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-base font-bold text-slate-700 truncate">
            {mode === "mmr"
              ? user.nftName
              : `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
          </div>
        </div>
        <div className="text-right px-2">
          <div className="text-sm md:text-lg font-extrabold text-slate-800">
            {mode === "mmr"
              ? user.mmrScore?.toLocaleString()
              : (user as SummonEntry).totalNftSummon?.toLocaleString()}
          </div>
          <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full inline-block group-hover:bg-sky-100 group-hover:text-sky-500 transition-colors">
            {mode === "mmr" ? "MMR" : "NFTs"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader />
      <div className="text-slate-600 antialiased min-h-screen bg-slate-50">
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-24 pt-32">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                Leaderboard
              </h1>
              <p className="text-slate-500 font-medium">
                Climb the ranks and earn rewards!
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border-2 border-slate-100 inline-flex relative">
              <div
                id="tab-bg"
                className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-sky-400 rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  transform:
                    mode === "mmr" ? "translateX(0)" : "translateX(100%)",
                }}
              ></div>
              <button
                onClick={() => switchMode("mmr")}
                className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 flex items-center gap-2 ${mode === "mmr" ? "text-white" : "text-slate-500 hover:text-sky-500"}`}
              >
                <iconify-icon
                  icon="solar:cup-star-linear"
                  width="18"
                ></iconify-icon>{" "}
                MMR Rank
              </button>
              <button
                onClick={() => switchMode("summon")}
                className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 flex items-center gap-2 ${mode === "summon" ? "text-white" : "text-slate-500 hover:text-sky-500"}`}
              >
                <iconify-icon
                  icon="solar:box-linear"
                  width="18"
                ></iconify-icon>{" "}
                Summons
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-20">
              <iconify-icon
                icon="solar:spinner-gap-linear"
                class="text-4xl animate-spin text-sky-500"
              ></iconify-icon>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border-2 border-red-200 text-center font-bold">
              {error}
            </div>
          ) : (
            <div id="content-area" className="w-full">
              {data.length > 0 && <Podium users={podiumData} />}

              <div className="mt-8">
                {pagedData.length > 0 ? (
                  pagedData.map((user, index) => (
                    <ListItem
                      key={user.walletAddress + index}
                      user={user}
                      delayIndex={index}
                    />
                  ))
                ) : data.length > 3 ? (
                  <div className="text-center py-10 text-slate-500 font-semibold">
                    No more users to display.
                  </div>
                ) : (
                  data.length === 0 && (
                    <div className="text-center py-10 text-slate-500 font-semibold">
                      No data to display.
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {selectedUser && (
            <CharacterDetailModal 
              user={selectedUser} 
              isOpen={!!selectedUser} 
              onClose={() => setSelectedUser(null)} 
            />
          )}

        </main>
      </div>

      {totalPages > 1 && (
        <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xl border-2 border-white shadow-xl shadow-sky-900/10 rounded-full p-2 flex items-center gap-4 pointer-events-auto btn-toy">
            <button
              onClick={() => changePage(-1)}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-400 hover:bg-white hover:text-sky-500 hover:border-sky-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <iconify-icon
                icon="solar:arrow-left-linear"
                width="20"
              ></iconify-icon>
            </button>
            <span className="text-sm font-bold text-slate-600 font-mono w-20 text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-10 h-10 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-400 hover:bg-white hover:text-sky-500 hover:border-sky-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <iconify-icon
                icon="solar:arrow-right-linear"
                width="20"
              ></iconify-icon>
            </button>
          </div>
        </div>
      )}
      <PageFooter />
    </>
  );
}


function CharacterDetailModal({ user, isOpen, onClose }: { user: PodiumUser, isOpen: boolean, onClose: () => void }) {
  const [mmr, setMmr] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMmr(0);
      setAnimate(false);
      
      // Small timeout to trigger CSS transitions after mount
      const timeout = setTimeout(() => setAnimate(true), 100);

      // Count up animation
      let start = 0;
      const end = user.mmrScore;
      if (start === end) return;
      
      const duration = 1500;
      const range = end - start;
      const stepTime = Math.max(Math.abs(Math.floor(duration / range)), 1);
      
      const timer = setInterval(() => {
        start += Math.ceil(range / 60); // Smoother increments
        if (start >= end) {
          setMmr(end);
          clearInterval(timer);
        } else {
          setMmr(start);
        }
      }, 16); // ~60fps

      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, user.mmrScore]);

  const rankInfo = useMemo(() => {
    const rank = user.attributes?.rank || 'Spirit Seed';
    const ranks: { [key: string]: { style: string, icon: string } } = {
      "Kapogian Ascendant": { style: "text-purple-400", icon: "solar:crown-star-bold-duotone" },
      "Master Rancher": { style: "text-purple-400", icon: "solar:crown-star-bold-duotone" },
      "Generational Tycoon": { style: "text-yellow-500", icon: "solar:crown-star-linear" },
      "Cultural Icon": { style: "text-red-500", icon: "solar:crown-star-linear" },
      "Eternal Light Bearer": { style: "text-red-500", icon: "solar:crown-star-linear" },
      "Ritual Architect": { style: "text-yellow-500", icon: "solar:crown-star-linear" },
      "Hall of Fame Immortal": { style: "text-yellow-500", icon: "solar:star-bold" },
      "Supreme Pogi": { style: "text-yellow-400", icon: "solar:star-bold" },
      "Proof of Pogi Elite": { style: "text-emerald-400", icon: "solar:star-bold" },
      "Aura God": { style: "text-emerald-500", icon: "solar:star-line-duotone" },
      "Lord of Biringan": { style: "text-emerald-600", icon: "solar:star-line-duotone" },
      "Fearless Descent": { style: "text-sky-400", icon: "solar:verified-check-linear" },
      "Dalaketnon Slayer": { style: "text-sky-500", icon: "solar:verified-check-linear" },
      "Ghost Walker": { style: "text-sky-600", icon: "solar:verified-check-linear" },
      "Initiate of Pogi": { style: "text-amber-700", icon: "solar:verified-check-linear" },
      "Aura Touched": { style: "text-amber-800", icon: "solar:verified-check-linear" },
      "Pogi Spark": { style: "text-amber-900", icon: "solar:verified-check-linear" },
      "Spirit Seed": { style: "text-slate-500", icon: "solar:verified-check-linear" },
    };
    return ranks[rank] || ranks['Spirit Seed'];
  }, [user.attributes?.rank]);

  const traits = [
    { label: "Style", value: user.attributes?.clothingStyle, icon: "solar:t-shirt-linear" },
    { label: "Hair", value: user.attributes?.hairAmount ? `${user.attributes.hairAmount}% Fluff` : null, icon: "solar:user-hand-up-linear" },
    { label: "Face", value: user.attributes?.facialHair ? `${user.attributes.facialHair}% Stubble` : null, icon: "solar:emoji-funny-circle-linear" },
    { label: "Eyewear", value: user.attributes?.eyewear > 50 ? 'Yes' : 'None', icon: "solar:glasses-linear" },
    { label: "Held", value: user.attributes?.heldItem, icon: "solar:cup-linear" },
  ].filter(t => t.value);


  return (
     <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>Character Details: {user.nftName}</DialogTitle>
            <DialogDescription>
              Detailed statistics and traits for {user.nftName}, including MMR,
              core skills, and visual attributes.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
           {/* Left Side */}
            <div className="w-full md:w-[35%] bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 relative overflow-hidden h-80 md:h-auto border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center justify-center p-4">
                  {/* Rank (Top) */}
                  <div className="slide-up-delay-1 text-center z-20">
                      <h2 className={cn("text-lg font-semibold uppercase tracking-wider", rankInfo.style)}>
                          <iconify-icon icon={rankInfo.icon}></iconify-icon>
                          {user.attributes?.rank || 'Spirit Seed'}
                      </h2>
                  </div>

                {/* Main Stage Area */}
                <div className="relative w-full flex-1 flex flex-col items-center justify-center">
                    {/* Character Image */}
                    <div className="relative z-20 w-64 h-64 md:w-72 md:h-72 -mb-20 mix-blend-darken ">
                      <Image
                        src={user.avatarImage}
                        alt={user.nftName}
                        fill
                        className="object-contain"
                      />
                    </div>

                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-20 z-0">
                    {/* Drop Shadow */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-emerald-900/20 blur-lg rounded-[100%]"></div>
                    
                    {/* Base Structure (Cylinder Side) */}
                    <div className="absolute top-1/2 left-[4%] w-[92%] h-full bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-b-[100%] border-b border-emerald-900/30 shadow-xl z-0"></div>
                    
                    {/* Top Platform (Surface) */}
                    <div className="absolute top-0 w-full h-full bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-[100%] border-[3px] border-emerald-300/50 shadow-[inset_0_6px_12px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center overflow-hidden">
                        {/* Reflection Highlight */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[85%] h-[35%] bg-emerald-300/40 rounded-[100%] blur-[1px]"></div>
                        
                        {/* Rank Number embedded */}
                        <div className="mt-2 text-emerald-900 font-display font-bold text-4xl opacity-20 select-none mix-blend-overlay">
                            {user.rank}
                        </div>
                    </div>

                    {/* Magical Glow Ring */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[105%] h-[105%] border border-emerald-300/30 rounded-[100%] animate-pulse z-20"></div>
                </div>

                </div>

                  {/* Name (Bottom) */}
              <div className="text-center z-20">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {user.nftName}
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm bg-white/50 py-1 px-4 rounded-full backdrop-blur-sm border border-white/50">
                <iconify-icon icon="solar:users-group-rounded-linear" />
                <span>Lineage: <strong className="text-orange-600">{user.lineage}</strong></span>
              </div>
            </div>
          </div>

            {/* Right Side */}
            <div className="w-full md:w-[60%] flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
              
              {/* MMR Header */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl w-full border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-blue-200 shadow-lg">
                    <iconify-icon icon="solar:graph-up-linear" class="text-2xl" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global MMR Rating</p>
                    <p className="text-2xl font-black text-slate-800">{mmr.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <iconify-icon icon="solar:magic-stick-3-linear" class="text-lg text-blue-500" />
                    Core Skills
                  </h3>
                  
                  {[
                    { label: "Cuteness", val: user.attributes?.cuteness, color: "bg-pink-400" },
                    { label: "Confidence", val: user.attributes?.confidence, color: "bg-indigo-400" },
                    { label: "Tili Factor", val: user.attributes?.tiliFactor, color: "bg-amber-400" }
                  ].map(skill => (
                    <div key={skill.label}>
                      <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-600">
                        <span>{skill.label}</span>
                        <span className="text-slate-400">{skill.val || 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000 ease-out", skill.color)}
                          style={{ width: animate ? `${skill.val || 0}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Country Affinity - FIXED BAR RENDERING */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <iconify-icon icon="solar:map-point-wave-linear" class="text-lg"></iconify-icon>
                        Country Affinity
                    </h3>
                    <div className="flex items-end gap-3 h-[120px] pt-8"> 
                        {[
                            { label: "Luzon", val: user.attributes?.luzon, color: "bg-emerald-400" },
                            { label: "Visayas", val: user.attributes?.visayas, color: "bg-emerald-400" },
                            { label: "Mindanao", val: user.attributes?.mindanao, color: "bg-emerald-400" }
                        ].map((region) => (
                            <div key={region.label} className="flex-1 flex flex-col justify-end group h-full">
                                <div className="w-full bg-slate-50 rounded-t-xl relative flex flex-col justify-end h-full overflow-visible">
                                    
                                    {/* THE SCORE LABEL: 
                                        We use 'animate' to move the label from bottom to top 
                                        simultaneously with the bar growth. 
                                    */}
                                    <span 
                                        className={cn(
                                            "absolute left-1/2 -translate-x-1/2 text-xs font-bold transition-all duration-1000 ease-out",
                                            region.val > 0 ? "text-emerald-600 opacity-100" : "text-slate-300 opacity-50"
                                        )}
                                        style={{ 
                                            // This moves the number 8px above whatever the current height is
                                            bottom: `calc(${animate ? (region.val || 0) : 0}% + 8px)`,
                                            zIndex: 10 
                                        }}
                                    >
                                        {region.val || 0}
                                    </span>

                                    {/* THE ANIMATED BAR:
                                        Changed style from fixed '0%' to use the 'animate' state.
                                    */}
                                    <div 
                                        className={cn(
                                            "w-full rounded-t-xl transition-all duration-1000 ease-out", 
                                            region.color
                                        )}
                                        style={{ height: animate ? `${region.val || 0}%` : '0%' }} 
                                    />
                                </div>
                                
                                <span className="text-[10px] text-slate-500 text-center mt-3 font-bold uppercase tracking-tighter">
                                    {region.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div></div>

              {/* Visual Traits */}
              <div className="pt-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <iconify-icon icon="solar:t-shirt-linear" class="text-lg text-orange-500" />
                  Visual Traits
                </h3>
                <div className="flex flex-wrap gap-3">
                  {traits.map((trait) => (
                    <div key={trait.label} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                      <iconify-icon icon={trait.icon} class="text-xl text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase font-black leading-tight">{trait.label}</span>
                        <span className="text-xs text-slate-700 font-bold">{trait.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button 
                onClick={onClose}
                className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95">
                Close Profile
              </button>
            </div>

            </div>
          </div>
        </DialogContent>
     </Dialog>
  )
}