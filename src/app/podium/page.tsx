"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { useCurrentAccount } from "@mysten/dapp-kit";




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
interface MmrEntry {
  rank: number;
  walletAddress: string;
  avatarImage: string;
  mmrScore: number;
  nftName: string;
}

interface SummonEntry {
  rank: number;
  walletAddress: string;
  avatarImage: string;
  totalNftSummon: number;
}

export default function PodiumPage() {
  const [mode, setMode] = useState<"mmr" | "summon">("mmr");
  const [data, setData] = useState<(MmrEntry | SummonEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const account = useCurrentAccount();

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

      const nftIds = allMintEvents.data
        .map((event) => (event.parsedJson as any)?.nft_id)
        .filter(Boolean);

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
        (obj) => obj.data?.content?.dataType === "moveObject" && obj.data.owner,
      );

      const ownerStats: Map<
        string,
        {
          walletAddress: string;
          totalNftSummon: number;
          mmrScore: number;
          avatarImage: string;
          nftName: string;
        }
      > = new Map();

      validObjects.forEach((obj: any) => {
        const ownerAddress = obj.data.owner.AddressOwner;
        const currentMmr = Number(obj.data.content.fields.mmr);

        if (!ownerStats.has(ownerAddress)) {
          ownerStats.set(ownerAddress, {
            walletAddress: ownerAddress,
            totalNftSummon: 0,
            mmrScore: -1,
            avatarImage: "",
            nftName: "",
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

  const podiumData = data.length >= 3 ? [data[1], data[0], data[2]] : [];
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

  const Podium = ({
    users,
  }: {
    users: (MmrEntry | SummonEntry | undefined)[];
  }) => (
    <div className="flex flex-row justify-center items-end gap-2 md:gap-6 mb-12 w-full max-w-2xl mx-auto pt-4">
      {/* Rank 2 */}
      <div className="w-1/3 flex flex-col items-center animate-float-2 group cursor-pointer">
        {users[0] && (
          <>
            <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
              <Image
                src={(users[0] as any).avatarImage}
                width={80}
                height={80}
                alt="Rank 2"
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-slate-200 object-cover shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 bg-slate-200 border-2 border-white text-slate-600 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-sm">
                2
              </div>
            </div>
            <div className="w-full h-32 md:h-40 rounded-t-2xl md:rounded-t-3xl podium-silver flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/30"></div>
              <span className="text-xs md:text-sm text-slate-500 font-bold mb-1 truncate w-full px-2">
                {(users[0] as any).walletAddress.slice(0, 6)}...
                {(users[0] as any).walletAddress.slice(-4)}
              </span>
              <span className="text-sm md:text-lg font-extrabold text-slate-700">
                {mode === "mmr"
                  ? (users[0] as MmrEntry)?.mmrScore?.toLocaleString()
                  : (users[0] as SummonEntry)?.totalNftSummon?.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
      {/* Rank 1 */}
      <div className="w-1/3 flex flex-col items-center z-10 animate-float-1 group cursor-pointer -mx-1">
        {users[1] && (
          <>
            <div className="relative mb-4 transition-transform group-hover:scale-110 duration-300">
              <iconify-icon
                icon="solar:crown-bold"
                class="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-sm text-3xl md:text-4xl animate-bounce"
              ></iconify-icon>
              <Image
                src={(users[1] as any).avatarImage}
                width={112}
                height={112}
                alt="Rank 1"
                className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white bg-yellow-100 object-cover shadow-lg ring-4 ring-yellow-200/50"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 border-2 border-white text-white text-sm font-bold px-3 py-0.5 rounded-full shadow-sm">
                #1
              </div>
            </div>
            <div className="w-full h-44 md:h-52 rounded-t-2xl md:rounded-t-3xl podium-gold flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-white/30"></div>
              <span className="text-xs md:text-sm text-yellow-800/70 font-bold mb-1 truncate w-full px-2">
                {(users[1] as any).walletAddress.slice(0, 6)}...
                {(users[1] as any).walletAddress.slice(-4)}
              </span>
              <span className="text-lg md:text-2xl font-extrabold text-yellow-900">
                {mode === "mmr"
                  ? (users[1] as MmrEntry)?.mmrScore?.toLocaleString()
                  : (users[1] as SummonEntry)?.totalNftSummon?.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
      {/* Rank 3 */}
      <div className="w-1/3 flex flex-col items-center animate-float-3 group cursor-pointer">
        {users[2] && (
          <>
            <div className="relative mb-3 transition-transform group-hover:scale-110 duration-300">
              <Image
                src={(users[2] as any).avatarImage}
                width={80}
                height={80}
                alt="Rank 3"
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-orange-100 object-cover shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 bg-orange-200 border-2 border-white text-orange-700 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-sm">
                3
              </div>
            </div>
            <div className="w-full h-24 md:h-32 rounded-t-2xl md:rounded-t-3xl podium-bronze flex flex-col justify-end items-center p-3 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/30"></div>
              <span className="text-xs md:text-sm text-orange-800/60 font-bold mb-1 truncate w-full px-2">
                {(users[2] as any).walletAddress.slice(0, 6)}...
                {(users[2] as any).walletAddress.slice(-4)}
              </span>
              <span className="text-sm md:text-lg font-extrabold text-orange-900">
                {mode === "mmr"
                  ? (users[2] as MmrEntry)?.mmrScore?.toLocaleString()
                  : (users[2] as SummonEntry)?.totalNftSummon?.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const ListItem = ({
    user,
    delayIndex,
  }: {
    user: MmrEntry | SummonEntry;
    delayIndex: number;
  }) => {
    return (
      <div
        className="card-toy rounded-2xl md:rounded-3xl p-3 md:p-4 mb-3 flex items-center gap-3 md:gap-5 animate-pop-in cursor-default group transition-all"
        style={{ animationDelay: `${delayIndex * 50}ms` }}
      >
        <div className="w-10 md:w-12 flex-shrink-0 flex justify-center">
          <span className="text-sm md:text-base font-bold text-slate-400 bg-slate-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center rank-text group-hover:bg-sky-100 group-hover:text-sky-500 transition-colors">
            #{user.rank}
          </span>
        </div>
        <div className="relative">
          <Image
            src={user.avatarImage}
            width={48}
            height={48}
            alt="Avatar"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-base font-bold text-slate-700 truncate">
            {mode === 'mmr' 
              ? (user as MmrEntry).nftName 
              : `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
          </div>
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2"></div>
        </div>
        <div className="text-right px-2">
          <div className="text-sm md:text-lg font-extrabold text-slate-800">
            {mode === "mmr"
              ? (user as MmrEntry)?.mmrScore?.toLocaleString()
              : (user as SummonEntry)?.totalNftSummon?.toLocaleString()}
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
      <div className="bg-[#f0f9ff] text-slate-600 antialiased min-h-screen">
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
                  class=""
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
                  class=""
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
              {data.length >= 3 && <Podium users={podiumData} />}
              
              <div className="mt-8">
                {pagedData.length > 0 ? (
                  pagedData.map((user, index) => (
                    <ListItem
                      key={(user as any).walletAddress + index}
                      user={user}
                      delayIndex={index}
                    />
                  ))
                ) : data.length > 0 ? (
                   <div className="text-center py-10 text-slate-500 font-semibold">
                     No more users to display.
                   </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 font-semibold">
                    No data to display.
                  </div>
                )}
              </div>
            </div>
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
                class=""
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
                class=""
              ></iconify-icon>
            </button>
          </div>
        </div>
      )}
      <PageFooter />
    </>
  );
}
