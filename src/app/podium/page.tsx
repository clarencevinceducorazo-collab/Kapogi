"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { X, ShieldAlert, ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

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

export default function PodiumPage() {
  const [mode, setMode] = useState<"mmr" | "summon">("mmr");
  const [data, setData] = useState<(MmrEntry | SummonEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PodiumUser | null>(null);
  const [selectedSummonUser, setSelectedSummonUser] =
    useState<SummonEntry | null>(null);

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
        if (nftId && owner) nftOwnerMap.set(nftId, owner);
      });

      const nftIds = Array.from(nftOwnerMap.keys());
      if (nftIds.length === 0) {
        setData([]);
        setLoading(false);
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
        Omit<PodiumUser, "rank"> & {
          totalNftSummon: number;
          allNfts: NftEntry[];
        }
      > = new Map();

      validObjects.forEach((obj: any) => {
        const ownerAddress = nftOwnerMap.get(obj.data.objectId);
        if (!ownerAddress) return;

        const currentMmr = Number(obj.data.content.fields.mmr);
        const attributes = JSON.parse(
          obj.data.content.fields.attributes || "{}",
        );
        const lineage = attributes.lineage || "Unknown";
        const nftRank = attributes.rank || "Spirit Seed";
        const nftName = obj.data.content.fields.name;
        const imageUrl = getIPFSGatewayUrl(
          (obj.data.display?.data as any)?.image_url,
        );

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

        stats.allNfts.push({
          objectId: obj.data.objectId,
          name: nftName,
          imageUrl,
          mmr: currentMmr,
          lineage,
          rank: nftRank,
        });

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

      if (mode === "summon") {
        const sortedData: SummonEntry[] = processedData
          .sort((a, b) => b.totalNftSummon - a.totalNftSummon)
          .map((user, index) => ({ ...user, rank: index + 1 }));
        setData(sortedData);
      } else {
        const sortedData: MmrEntry[] = processedData
          .sort((a, b) => b.mmrScore - a.mmrScore)
          .map((user, index) => ({ ...user, rank: index + 1 }));
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

  const handleUserClick = (user: PodiumUser | undefined) => {
    if (!user) return;
    if (mode === "summon") {
      setSelectedSummonUser(user as SummonEntry);
    } else {
      setSelectedUser(user);
    }
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
    const podiumOrder =
      users.length >= 3 ? [users[1], users[0], users[2]] : [...users];
    if (users.length === 2) podiumOrder.splice(2, 0, undefined);
    else if (users.length === 1) {
      podiumOrder.unshift(undefined);
      podiumOrder.push(undefined);
    }

    return (
      <div className="flex flex-row justify-center items-end gap-2 md:gap-6 mb-12 w-full max-w-3xl mx-auto pt-12 relative z-10">
        {/* Silver #2 */}
        <div
          className="w-1/3 flex flex-col items-center animate-float-2 group cursor-pointer"
          onClick={() => handleUserClick(podiumOrder[0])}
        >
          {podiumOrder[0] && (
            <>
              <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src={podiumOrder[0].avatarImage || ""}
                  width={100}
                  height={100}
                  alt="Rank 2"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-slate-200 object-cover shadow-lg mix-blend-multiply"
                />
                <div className="absolute -bottom-2 -right-2 bg-slate-400 border-4 border-white text-white text-sm font-black w-10 h-10 flex items-center justify-center rounded-full shadow-md">
                  2
                </div>
              </div>
              <div
                className="w-full h-32 md:h-44 rounded-t-[2.5rem] podium-silver flex flex-col justify-end items-center p-4 text-center relative overflow-hidden border-4 border-black"
              >
                <div className="absolute top-0 left-0 w-full h-3 bg-white/40" />
                <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest mb-1 truncate w-full px-2">
                  {mode === "mmr"
                    ? podiumOrder[0].nftName
                    : `${podiumOrder[0].walletAddress.slice(0, 6)}...${podiumOrder[0].walletAddress.slice(-4)}`}
                </span>
                <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter">
                  {mode === "mmr"
                    ? podiumOrder[0].mmrScore?.toLocaleString()
                    : (
                        podiumOrder[0] as SummonEntry
                      )?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Gold #1 */}
        <div
          className="w-1/3 flex flex-col items-center z-10 animate-float-1 group cursor-pointer -mx-1"
          onClick={() => handleUserClick(podiumOrder[1])}
        >
          {podiumOrder[1] && (
            <>
              <div className="relative mb-4 transition-transform group-hover:scale-110 duration-300">
                <iconify-icon
                  icon="solar:crown-bold"
                  class="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] text-4xl md:text-6xl animate-bounce"
                />
                <Image
                  src={podiumOrder[1].avatarImage || ""}
                  width={140}
                  height={140}
                  alt="Rank 1"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-yellow-100 object-cover shadow-2xl ring-8 ring-yellow-400/30 mix-blend-multiply"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-white text-black text-sm font-black px-4 py-1 rounded-full shadow-lg">
                  #1
                </div>
              </div>
              <div
                className="w-full h-44 md:h-60 rounded-t-[3rem] podium-gold flex flex-col justify-end items-center p-5 text-center relative overflow-hidden border-4 border-black"
              >
                <div className="absolute top-0 left-0 w-full h-4 bg-white/50" />
                <span className="text-xs md:text-sm font-black text-yellow-950 uppercase tracking-widest mb-1 truncate w-full px-2 opacity-80">
                  {mode === "mmr"
                    ? podiumOrder[1].nftName
                    : `${podiumOrder[1].walletAddress.slice(0, 6)}...${podiumOrder[1].walletAddress.slice(-4)}`}
                </span>
                <span className="text-3xl md:text-5xl font-black text-yellow-950 tracking-tighter mb-2">
                  {mode === "mmr"
                    ? podiumOrder[1].mmrScore?.toLocaleString()
                    : (
                        podiumOrder[1] as SummonEntry
                      )?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bronze #3 */}
        <div
          className="w-1/3 flex flex-col items-center animate-float-3 group cursor-pointer"
          onClick={() => handleUserClick(podiumOrder[2])}
        >
          {podiumOrder[2] && (
            <>
              <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src={podiumOrder[2].avatarImage || ""}
                  width={100}
                  height={100}
                  alt="Rank 3"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-orange-100 object-cover shadow-lg mix-blend-multiply"
                />
                <div className="absolute -bottom-2 -right-2 bg-orange-500 border-4 border-white text-white text-sm font-black w-10 h-10 flex items-center justify-center rounded-full shadow-md">
                  3
                </div>
              </div>
              <div
                className="w-full h-24 md:h-36 rounded-t-[2.5rem] podium-bronze flex flex-col justify-end items-center p-4 text-center relative overflow-hidden border-4 border-black"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30" />
                <span className="text-[10px] md:text-xs font-black text-orange-950 uppercase tracking-widest mb-1 truncate w-full px-2 opacity-70">
                  {mode === "mmr"
                    ? podiumOrder[2].nftName
                    : `${podiumOrder[2].walletAddress.slice(0, 6)}...${podiumOrder[2].walletAddress.slice(-4)}`}
                </span>
                <span className="text-xl md:text-3xl font-black text-orange-950 tracking-tighter">
                  {mode === "mmr"
                    ? podiumOrder[2].mmrScore?.toLocaleString()
                    : (
                        podiumOrder[2] as SummonEntry
                      )?.totalNftSummon?.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const ListItem = ({
    user,
    delayIndex,
  }: {
    user: PodiumUser;
    delayIndex: number;
  }) => (
    <div
      onClick={() => handleUserClick(user)}
      className="bg-white border-4 border-black rounded-[2rem] p-4 mb-4 flex items-center gap-4 animate-pop-in cursor-pointer group transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      style={{ animationDelay: `${delayIndex * 50}ms` }}
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
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

        <main className="relative flex-1 max-w-5xl mx-auto w-full px-4 pb-24 pt-32 z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-2"
                  style={{ textShadow: '6px 6px 0px rgba(0,0,0,0.5)' }}>
                Leaderboard
              </h1>
              <p className="text-white font-black uppercase tracking-[0.2em] text-sm md:text-base bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border-2 border-white/20 inline-block shadow-lg">
                Climb the ranks and earn rewards!
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-[2.5rem] border-4 border-black inline-flex relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <div
                id="tab-bg"
                className="absolute top-2 bottom-2 left-2 w-[calc(50%-8px)] bg-sky-400 border-4 border-black rounded-[1.8rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  transform:
                    mode === "mmr" ? "translateX(0)" : "translateX(100%)",
                }}
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
                      <ListItem
                        key={user.walletAddress + index}
                        user={user}
                        delayIndex={index}
                      />
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
            <CharacterDetailModal
              user={selectedUser}
              isOpen={!!selectedUser}
              onClose={() => setSelectedUser(null)}
            />
          )}

          {selectedSummonUser && (
            <SummonDetailModal
              user={selectedSummonUser}
              isOpen={!!selectedSummonUser}
              onClose={() => setSelectedSummonUser(null)}
            />
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                Registry Page
              </span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {currentPage} / {totalPages}
              </span>
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

function SummonDetailModal({
  user,
  isOpen,
  onClose,
}: {
  user: SummonEntry;
  isOpen: boolean;
  onClose: () => void;
}) {
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
  const avgMmr =
    user.allNfts.length > 0
      ? Math.round(
          user.allNfts.reduce((s, n) => s + n.mmr, 0) / user.allNfts.length,
        )
      : 0;

  const lineageCounts = user.allNfts.reduce<Record<string, number>>(
    (acc, n) => {
      acc[n.lineage] = (acc[n.lineage] || 0) + 1;
      return acc;
    },
    {},
  );

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
        if (start >= end) {
          setMmr(end);
          clearInterval(timer);
        } else {
          setMmr(start);
        }
      }, 16);
      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, highestMmr]);

  const rankInfo = useMemo(() => {
    const rank = bestNft?.rank || "Spirit Seed";
    const ranks: { [key: string]: { style: string; icon: string } } = {
      "Kapogian Ascendant": {
        style: "rank-ascendant",
        icon: "fluent-emoji:shooting-star",
      },
      "Master Rancher": {
        style: "rank-rancher",
        icon: "fluent-emoji:cow-face",
      },
      "Generational Tycoon": {
        style: "rank-tycoon",
        icon: "fluent-emoji:money-bag",
      },
      "Cultural Icon": {
        style: "rank-icon",
        icon: "fluent-emoji:performing-arts",
      },
      "Eternal Light Bearer": {
        style: "rank-eternal",
        icon: "fluent-emoji:fire",
      },
      "Hall of Fame Immortal": {
        style: "rank-hof",
        icon: "fluent-emoji:trophy",
      },
      "Supreme Pogi": { style: "rank-supreme", icon: "fluent-emoji:star" },
      "Proof of Pogi Elite": {
        style: "rank-elite",
        icon: "fluent-emoji:gem-stone",
      },
      "Aura God": {
        style: "rank-auragod",
        icon: "fluent-emoji:crown",
      },
      "Lord of Biringan": {
        style: "rank-biringan",
        icon: "fluent-emoji:classical-building",
      },
      "Fearless Descent": {
        style: "rank-fearless",
        icon: "fluent-emoji:shield",
      },
      "Dalaketnon Slayer": {
        style: "rank-slayer",
        icon: "fluent-emoji:crossed-swords",
      },
      "Ghost Walker": {
        style: "rank-ghost",
        icon: "fluent-emoji:ghost",
      },
      "Initiate of Pogi": {
        style: "rank-initiate",
        icon: "fluent-emoji:person-raising-hand-light",
      },
      "Aura Touched": {
        style: "rank-touched",
        icon: "fluent-emoji:sparkles",
      },
      "Pogi Spark": {
        style: "rank-spark",
        icon: "fluent-emoji:zap",
      },
      "Spirit Seed": {
        style: "rank-seed",
        icon: "fluent-emoji:seedling",
      },
    };
    return ranks[rank] || ranks["Spirit Seed"];
  }, [bestNft?.rank]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseButton
        className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Summoner: {short(user.walletAddress)}</DialogTitle>
          <DialogDescription>
            Best MMR NFT and full collection for this wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full bg-white rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[85vh] relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] bg-white border-4 border-black rounded-full p-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            <X size={24} strokeWidth={3} />
          </button>

          <div className="w-full md:w-[35%] bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 relative overflow-hidden h-80 md:h-auto border-b md:border-b-0 md:border-r-4 border-black flex flex-col items-center justify-start pt-16 p-4">
            <div className="slide-up-delay-1 text-center z-20">
              <span className="inline-flex items-center gap-1 bg-white/80 border-2 border-black text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 px-3 py-1 rounded-full shadow-sm">
                <iconify-icon icon="fluent-emoji:trophy" class="text-sm" />
                Best MMR NFT
              </span>
            </div>

            <div className="slide-up-delay-1 text-center z-20 mt-4">
              <h2
                className={cn(
                  "uppercase font-black tracking-wider flex items-center justify-center gap-1 drop-shadow-sm",
                  rankInfo.style,
                )}
              >
                <iconify-icon icon={rankInfo.icon} />
                {bestNft?.rank || "Spirit Seed"}
              </h2>
            </div>

            <div className="relative w-full flex-1 flex flex-col items-center justify-center">
              <div
                className="relative z-30 w-64 h-64 md:w-72 md:h-72 mb-1 transition-all duration-700 ease-out mix-blend-multiply"
                style={{
                  transform: animate
                    ? highestMmr > 1200
                      ? "translateY(-5px)"
                      : "translateY(-10px)"
                    : "translateY(0px)",
                }}
              >
                {bestNft?.imageUrl ? (
                  <Image
                    src={bestNft.imageUrl}
                    alt={bestNft.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <iconify-icon
                      icon="fluent-emoji:ghost"
                      class="text-8xl text-slate-300"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="text-center z-20 mb-16">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
                {bestNft?.name ?? "—"}
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-black bg-white border-2 border-black py-1.5 px-4 rounded-full shadow-sm">
                <iconify-icon icon="solar:wallet-bold" class="text-indigo-500" />
                <span>
                  WALLET:{" "}
                  <strong className="text-indigo-600 font-mono">
                    {short(user.walletAddress)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[65%] flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
              <div className="flex flex-col sm:flex-row gap-4 border-b-4 border-slate-50 pb-8">
                <div className="flex items-center gap-4 bg-slate-50 border-4 border-black p-4 rounded-[1.5rem] flex-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center border-2 border-black">
                    <iconify-icon icon="fluent-emoji:trophy" class="text-2xl" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      Best Rating
                    </p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">
                      {mmr.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 border-4 border-black p-4 rounded-[1.5rem] flex-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center border-2 border-black">
                    <iconify-icon
                      icon="fluent-emoji:chart-increasing"
                      class="text-2xl"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      Avg MMR
                    </p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">
                      {avgMmr.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 border-4 border-black p-4 rounded-[1.5rem] flex-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center border-2 border-black">
                    <iconify-icon
                      icon="fluent-emoji:package"
                      class="text-2xl"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      Summons
                    </p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">
                      {user.totalNftSummon}
                    </p>
                  </div>
                </div>
              </div>

              {Object.keys(lineageCounts).length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <iconify-icon icon="fluent-emoji:dna" class="text-lg" />
                    Lineage Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(lineageCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 bg-slate-50 border-2 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <div
                            className={`w-3 h-3 rounded-full border border-black/20 ${lineageColors[name] ?? "bg-slate-300"}`}
                          />
                          <span className="text-[11px] font-black text-slate-700 uppercase italic">
                            {name}
                          </span>
                          <span className="text-[11px] font-black text-indigo-500 bg-white border border-slate-200 px-1.5 rounded-md ml-1">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <iconify-icon
                    icon="fluent-emoji:framed-picture"
                    class="text-lg"
                  />
                  Full Collection
                  {restNfts.length > 0 && (
                    <span className="ml-auto bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-black text-slate-400 normal-case tracking-normal">
                      {restNfts.length + 1} ASSETS
                    </span>
                  )}
                </h3>

                {restNfts.length === 0 ? (
                  <p className="text-sm font-bold text-slate-300 text-center py-12 italic border-2 border-dashed border-slate-100 rounded-2xl">
                    No other spirits found in this wallet.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {pagedRestNfts.map((nft, i) => (
                        <div
                          key={nft.objectId}
                          className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-[1.5rem] p-3 hover:border-black hover:translate-x-1 transition-all shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-black overflow-hidden flex-shrink-0 relative">
                            {nft.imageUrl ? (
                              <Image
                                src={nft.imageUrl}
                                alt={nft.name}
                                fill
                                className="object-contain mix-blend-multiply p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <iconify-icon
                                  icon="fluent-emoji:ghost"
                                  class="text-base"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-black text-base text-slate-800 truncate leading-tight uppercase italic tracking-tighter">
                              {nft.name}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-widest mt-0.5">
                              {nft.rank}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                            <span className="font-black text-lg text-slate-900 leading-none">
                              {nft.mmr.toLocaleString()}
                            </span>
                            <span
                              className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-black/10 text-white shadow-sm",
                                lineageColors[nft.lineage] ?? "bg-slate-400",
                              )}
                            >
                              {nft.lineage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {restNfts.length > PAGE_SIZE && (
                      <div className="flex flex-col items-center gap-4 mt-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] py-6 px-4">
                        <div className="flex justify-center items-center gap-4 w-full">
                          <button
                            onClick={() =>
                              setRestPage((p) => Math.max(1, p - 1))
                            }
                            disabled={restPage === 1}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            <ArrowLeft size={20} strokeWidth={3} />
                          </button>

                          <div className="flex items-center px-6 py-2 rounded-2xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[140px] justify-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
                              PAGE
                            </span>
                            <span className="text-xl font-black text-indigo-500 mx-1">
                              {restPage}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                              OF {totalRestPages}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              setRestPage((p) =>
                                Math.min(totalRestPages, p + 1),
                              )
                            }
                            disabled={restPage === totalRestPages}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                          >
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
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                  Encrypted Player Profile
                </span>
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

function CharacterDetailModal({
  user,
  isOpen,
  onClose,
}: {
  user: PodiumUser;
  isOpen: boolean;
  onClose: () => void;
}) {
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
        if (start >= end) {
          setMmr(end);
          clearInterval(timer);
        } else setMmr(start);
      }, 16);
      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [isOpen, user.mmrScore]);

  const rankInfo = useMemo(() => {
    const rank = user.attributes?.rank || "Spirit Seed";
    const ranks: { [key: string]: { style: string; icon: string } } = {
      "Kapogian Ascendant": {
        style: "rank-ascendant",
        icon: "fluent-emoji:shooting-star",
      },
      "Master Rancher": {
        style: "rank-rancher",
        icon: "fluent-emoji:cow-face",
      },
      "Generational Tycoon": {
        style: "rank-tycoon",
        icon: "fluent-emoji:money-bag",
      },
      "Cultural Icon": {
        style: "rank-icon",
        icon: "fluent-emoji:performing-arts",
      },
      "Eternal Light Bearer": {
        style: "rank-eternal",
        icon: "fluent-emoji:fire",
      },
      "Hall of Fame Immortal": {
        style: "rank-hof",
        icon: "fluent-emoji:trophy",
      },
      "Supreme Pogi": { style: "rank-supreme", icon: "fluent-emoji:star" },
      "Proof of Pogi Elite": {
        style: "rank-elite",
        icon: "fluent-emoji:gem-stone",
      },
      "Aura God": {
        style: "rank-auragod",
        icon: "fluent-emoji:crown",
      },
      "Lord of Biringan": {
        style: "rank-biringan",
        icon: "fluent-emoji:classical-building",
      },
      "Fearless Descent": {
        style: "rank-fearless",
        icon: "fluent-emoji:shield",
      },
      "Dalaketnon Slayer": {
        style: "rank-slayer",
        icon: "fluent-emoji:crossed-swords",
      },
      "Ghost Walker": {
        style: "rank-ghost",
        icon: "fluent-emoji:ghost",
      },
      "Initiate of Pogi": {
        style: "rank-initiate",
        icon: "fluent-emoji:person-raising-hand-light",
      },
      "Aura Touched": {
        style: "rank-touched",
        icon: "fluent-emoji:sparkles",
      },
      "Pogi Spark": {
        style: "rank-spark",
        icon: "fluent-emoji:zap",
      },
      "Spirit Seed": {
        style: "rank-seed",
        icon: "fluent-emoji:seedling",
      },
    };
    return ranks[rank] || ranks["Spirit Seed"];
  }, [user.attributes?.rank]);

  const traits = [
    {
      label: "Style",
      value: user.attributes?.clothingStyle,
      icon: "solar:t-shirt-bold",
    },
    {
      label: "Hair",
      value: user.attributes?.hairAmount
        ? `${user.attributes.hairAmount}% Fluff`
        : null,
      icon: "solar:user-hand-up-bold",
    },
    {
      label: "Face",
      value: user.attributes?.facialHair
        ? `${user.attributes.facialHair}% Stubble`
        : null,
      icon: "solar:emoji-funny-circle-bold",
    },
    {
      label: "Eyewear",
      value: (user.attributes?.eyewear ?? 0) > 50 ? "Yes" : "None",
      icon: "solar:glasses-bold",
    },
    {
      label: "Held",
      value: user.attributes?.heldItem,
      icon: "solar:cup-bold",
    },
  ].filter((t) => t.value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseButton
        className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Character Details: {user.nftName}</DialogTitle>
          <DialogDescription>
            Detailed statistics and traits for {user.nftName}.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full bg-white rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] bg-white border-4 border-black rounded-full p-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            <X size={24} strokeWidth={3} />
          </button>

          <div className="w-full md:w-[35%] bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 relative overflow-hidden h-80 md:h-auto border-b md:border-b-0 md:border-r-4 border-black flex flex-col items-center justify-start pt-16 p-4">
            <div className="slide-up-delay-1 text-center z-20 mb-8">
              <h2
                className={cn(
                  "uppercase font-black tracking-wider flex items-center justify-center gap-1 drop-shadow-sm",
                  rankInfo.style,
                )}
              >
              
                {user.attributes?.rank || "Spirit Seed"}
              </h2>
            </div>
            <div className="relative w-full flex-1 flex flex-col items-center justify-center">
              <div
                className="relative z-30 w-64 h-64 md:w-72 md:h-72 transition-all duration-700 ease-out mix-blend-multiply"
                style={{
                  transform: animate
                    ? user.mmrScore > 1200
                      ? "translateY(-5px)"
                      : "translateY(-10px)"
                    : "translateY(0px)",
                }}
              >
                <Image
                  src={user.avatarImage}
                  alt={user.nftName}
                  fill
                  className="object-contain p-4"
                />
              </div>
              
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-20 z-0">
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 bg-emerald-900/20 blur-lg rounded-[100%]" />
                <div className="absolute top-1/2 left-[4%] w-[92%] h-full bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-b-[100%] border-b-4 border-black shadow-xl z-0" />
                <div className="absolute top-0 w-full h-full bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-[100%] border-4 border-black shadow-[inset_0_6px_12px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[85%] h-[35%] bg-emerald-300/40 rounded-[100%] blur-[1px]" />
                  <div className="mt-2 text-black font-headline font-bold text-4xl opacity-20 select-none mix-blend-overlay">
                    {user.rank}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center z-20 mt-8 mb-12">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
                {user.nftName}
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-black bg-white border-2 border-black py-1.5 px-4 rounded-full shadow-sm">
                <iconify-icon icon="solar:users-group-rounded-bold" class="text-orange-500" />
                <span>
                  LINEAGE:{" "}
                  <strong className="text-orange-600 uppercase italic">{user.lineage}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[65%] flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
              <div className="flex justify-between items-center border-b-4 border-slate-50 pb-8">
                <div className="flex items-center gap-4 bg-slate-50 border-4 border-black p-5 rounded-[2rem] w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center border-2 border-black shadow-lg">
                    <iconify-icon
                      icon="fluent-emoji:chart-increasing"
                      class="text-3xl"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Spirit Rating (MMR)
                    </p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                      {mmr.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <iconify-icon
                      icon="fluent-emoji:magic-wand"
                      class="text-lg"
                    />
                    Core Skillset
                  </h3>
                  {[
                    {
                      label: "Cuteness",
                      val: user.attributes?.cuteness,
                      color: "bg-pink-400",
                    },
                    {
                      label: "Confidence",
                      val: user.attributes?.confidence,
                      color: "bg-indigo-400",
                    },
                    {
                      label: "Tili Factor",
                      val: user.attributes?.tiliFactor,
                      color: "bg-amber-400",
                    },
                  ].map((skill) => (
                    <div key={skill.label}>
                      <div className="flex justify-between text-xs font-black mb-2 text-slate-600 uppercase tracking-wider">
                        <span>{skill.label}</span>
                        <span className="text-slate-400 font-mono">
                          {skill.val || 0}%
                        </span>
                      </div>
                      <div className="h-5 w-full bg-slate-100 rounded-full border-2 border-black p-0.5 shadow-inner overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out border-r-2 border-black/20",
                            skill.color,
                          )}
                          style={{
                            width: animate ? `${skill.val || 0}%` : "0%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <iconify-icon
                      icon="fluent-emoji:map-point"
                      class="text-lg"
                    />
                    Territory Affinity
                  </h3>
                  <div className="flex items-end gap-4 h-[120px] pt-8">
                    {[
                      {
                        label: "Luzon",
                        val: user.attributes?.luzon,
                        color: "bg-red-400",
                      },
                      {
                        label: "Visayas",
                        val: user.attributes?.visayas,
                        color: "bg-blue-400",
                      },
                      {
                        label: "Mindanao",
                        val: user.attributes?.mindanao,
                        color: "bg-yellow-400",
                      },
                    ].map((region) => (
                      <div
                        key={region.label}
                        className="flex-1 flex flex-col justify-end group h-full"
                      >
                        <div className="w-full bg-slate-100 rounded-t-xl relative border-x-2 border-t-2 border-black flex flex-col justify-end h-full overflow-visible">
                          <span
                            className={cn(
                              "absolute left-1/2 -translate-x-1/2 text-[10px] font-black transition-all duration-1000 ease-out font-mono",
                              (region.val ?? 0) > 0
                                ? "text-slate-900 opacity-100"
                                : "text-slate-300 opacity-50",
                            )}
                            style={{
                              bottom: `calc(${animate ? region.val || 0 : 0}% + 8px)`,
                              zIndex: 10,
                            }}
                          >
                            {region.val || 0}%
                          </span>
                          <div
                            className={cn(
                              "w-full rounded-t-lg transition-all duration-1000 ease-out",
                              region.color,
                            )}
                            style={{
                              height: animate ? `${region.val || 0}%` : "0%",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 text-center mt-3 font-black uppercase tracking-tighter italic">
                          {region.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                  <iconify-icon icon="fluent-emoji:t-shirt" class="text-lg" />
                  Visual Signature
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {traits.map((trait) => (
                    <div
                      key={trait.label}
                      className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <iconify-icon
                          icon={trait.icon}
                          class="text-xl text-slate-400"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-slate-400 uppercase font-black leading-tight tracking-widest">
                          {trait.label}
                        </span>
                        <span className="text-xs text-slate-800 font-black uppercase italic tracking-tighter truncate">
                          {trait.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-900 border-t-4 border-black mt-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                  Encrypted Player Profile
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}