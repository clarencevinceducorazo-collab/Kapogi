'use client';

import React, { useState, useEffect } from "react";
import {
  Zap,
  Loader2,
  Trophy,
  Clock,
  Wallet,
  ChevronRight,
  RefreshCcw,
  Star,
  Flame,
  Crown,
  ShieldAlert,
} from "lucide-react";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "@/lib/constants";
import { timeAgo, formatAddress } from "@/lib/utils";
import { SuiObjectResponse } from "@mysten/sui/client";

// Type for the parsed data from a CharacterMinted event
interface MintEvent {
  id: { txDigest: string; eventSeq: string };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: {
    edition: string;
    kiosk_id: string;
    name: string;
    nft_id: string;
    owner: string;
    timestamp: string;
  };
  timestampMs: string;
}

// Type for a user's entry on the leaderboard
interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  highestMmr: number;
}

// Type for the weekly best NFT
interface WeeklyBestEntry {
  name: string;
  address: string;
  mmr: number;
  nftId: string;
}

const rankColors = ["bg-yellow-400", "bg-slate-200", "bg-orange-300"];

// Returns how many days until the next Monday (weekly reset)
function getDaysUntilMonday(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  return daysUntil === 0 ? 7 : daysUntil;
}

export const SecuritySection = () => {
  const [recentMints, setRecentMints] = useState<MintEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyBest, setWeeklyBest] = useState<WeeklyBestEntry | null>(null);
  const [totalMint, setTotalMint] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(""); // Clear previous errors
        const mintEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted` },
          limit: 100,
          order: 'descending',
        });

        if (!mintEvents.data || mintEvents.data.length === 0) {
          if (loading) setLoading(false);
          return;
        }

        // Update total mint count
        setTotalMint(mintEvents.data.length);

        const nftIds = mintEvents.data.map(event => (event.parsedJson as any)?.nft_id).filter(Boolean);
        let nftObjectMap = new Map<string, SuiObjectResponse['data']>();

        if (nftIds.length > 0) {
          const nftObjects = await suiClient.multiGetObjects({
            ids: nftIds,
            options: { showContent: true },
          });
          nftObjectMap = new Map(nftObjects.map(obj => [obj.data?.objectId, obj.data]));
        }

        const enhancedMints = mintEvents.data.map(event => {
          const parsed = { ...event.parsedJson } as any;
          const nftObject = nftObjectMap.get(parsed.nft_id);
          if (nftObject?.content?.dataType === 'moveObject') {
            const fields = nftObject.content.fields as any;
            if (fields.name) parsed.name = fields.name;
          }
          return { ...event, parsedJson: parsed };
        });

        setRecentMints(enhancedMints as MintEvent[]);

        // 7-day window for weekly best
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const weekAgo = Date.now() - ONE_WEEK_MS;

        // Calculate Live Leaderboard (all-time, top 3 only)
        const ownerMmrMap = new Map<string, { address: string; highestMmr: number; name: string }>();
        // Also track weekly best separately
        let weeklyBestCandidate: WeeklyBestEntry | null = null;

        enhancedMints.forEach(event => {
          const parsed = event.parsedJson as any;
          if (!parsed.owner || !parsed.nft_id) return;

          const nftObject = nftObjectMap.get(parsed.nft_id);
          if (!nftObject?.content || nftObject.content.dataType !== 'moveObject') return;

          const fields = nftObject.content.fields as any;
          const currentMmr = Number(fields.mmr);
          const nftName = parsed.name;
          const mintedAt = parseInt(event.timestampMs);

          // All-time leaderboard: highest MMR per owner
          if (!ownerMmrMap.has(parsed.owner) || currentMmr > ownerMmrMap.get(parsed.owner)!.highestMmr) {
            ownerMmrMap.set(parsed.owner, {
              address: parsed.owner,
              highestMmr: currentMmr,
              name: nftName,
            });
          }

          // Weekly best: only NFTs minted within the last 7 days
          if (mintedAt >= weekAgo) {
            if (!weeklyBestCandidate || currentMmr > weeklyBestCandidate.mmr) {
              weeklyBestCandidate = {
                name: nftName || 'Unnamed',
                address: parsed.owner,
                mmr: currentMmr,
                nftId: parsed.nft_id,
              };
            }
          }
        });

        const sortedLeaderboard = Array.from(ownerMmrMap.values())
          .sort((a, b) => b.highestMmr - a.highestMmr)
          .slice(0, 3) // Top 3 only
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        setLeaderboard(sortedLeaderboard);
        setWeeklyBest(weeklyBestCandidate);

      } catch (error) {
        console.error("Failed to fetch live activity:", error);
        setError(
          "Could not connect to the Sui network. Please check your internet connection or disable any browser extensions (like ad-blockers) and refresh."
        );
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      if (isLive) fetchData();
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive, loading]);

  return (
    <div
      className="min-h-screen font-sans p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #4A80FF, #3B70FF, #1A56FF)' }}
    >
      {/* Background decorative blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-48 h-48 bg-yellow-400 border-8 border-black rounded-full opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 right-[-5%] w-72 h-16 bg-white border-8 border-black rounded-full rotate-12 opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="relative w-full max-w-5xl flex flex-col items-center mb-10 mt-8 z-10">
        <div className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-black uppercase italic mb-4 shadow-lg border-2 border-black"
          style={{ animation: 'pulse 2s infinite' }}>
          <Star size={14} fill="black" /> Mint is Live
        </div>

        <h1
          className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase text-center"
          style={{ textShadow: '0 6px 0px rgba(0,0,0,0.2)' }}
        >
          KAPOGIAN <br className="md:hidden" />{' '}
          <span className="text-yellow-300">ACTIVITY</span>
        </h1>

        <p className="text-white font-bold italic uppercase tracking-widest mt-2 opacity-90"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          Be Pogi! Be Confident Everyday
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden border-4 border-black border-b-[12px] relative z-10">

        {/* Top Stats Bar */}
        <div className="bg-black text-white p-5 md:p-6 flex flex-wrap justify-between items-center gap-4 border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 10px #4ade80', animation: 'pulse 2s infinite' }}
            />
            <button
              onClick={() => setIsLive(!isLive)}
              className="font-bold uppercase tracking-widest text-sm text-green-400 cursor-pointer hover:text-green-300 transition-colors"
            >
              {isLive ? 'Real-time Stream' : 'Stream Paused'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Total Spirit Minted
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-yellow-400 leading-none mt-1">
                {totalMint > 0 ? totalMint.toLocaleString() : (
                  loading ? <Loader2 size={20} className="animate-spin text-yellow-400" /> : '0'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        {error ? (
          <div className="p-10 text-center flex flex-col items-center gap-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-bold max-w-md">{error}</p>
          </div>
        ) : (
          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Left: Live Summons */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-2 rounded-xl border-2 border-black">
                    <Zap className="text-white fill-white" size={20} />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-800">
                    Live Summons
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isLive ? 'bg-green-500' : 'bg-slate-400'}`}
                    style={isLive ? { animation: 'pulse 2s infinite' } : {}} />
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    {isLive ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>

              <div className="flex-grow space-y-3">
                {loading && recentMints.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[20rem] text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : recentMints.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[20rem] text-slate-400 font-bold uppercase italic">
                    No summons yet
                  </div>
                ) : (
                  recentMints.slice(0, 5).map((mint, idx) => (
                    <a
                      key={mint.id.txDigest}
                      href={`https://suiscan.xyz/${NETWORK_CONFIG.network}/tx/${mint.id.txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white border-4 border-black rounded-2xl p-4 transition-all hover:-translate-y-1 cursor-pointer block"
                      style={{ boxShadow: '0 0 0 0 rgba(0,0,0,1)', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,0,0,1)')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border-2 border-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Wallet size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                              {mint.parsedJson.name || 'Unnamed Character'}
                            </h3>
                            <code className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded mt-1 inline-block font-mono border border-gray-100 uppercase">
                              {formatAddress(mint.sender)}
                            </code>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {idx === 0 && Date.now() - parseInt(mint.timestampMs) < 15000 && (
                            <span
                              className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-black"
                              style={{ animation: 'pulse 2s infinite' }}
                            >
                              NEW!
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 italic">
                            <Clock size={10} /> {timeAgo(mint.timestampMs)}
                          </span>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Right: MMR Leaderboard */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-yellow-400 p-2 rounded-xl border-2 border-black">
                  <Trophy className="text-black" size={20} />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-gray-800">
                  Leaderboard
                </h2>
              </div>

              <div className="flex-grow flex flex-col gap-6">
                {/* MMR Card */}
                <div className="bg-black rounded-[32px] p-1 shadow-xl flex-grow flex">
                  <div className="bg-white rounded-[28px] p-5 text-gray-900 border-2 border-black flex flex-col gap-3 w-full">
                    {loading && leaderboard.length === 0 ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-slate-100 border-2 border-black p-3 rounded-2xl h-[68px] animate-pulse" />
                      ))
                    ) : leaderboard.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[12rem] text-slate-400 font-bold uppercase italic text-sm">
                        No leaderboard data yet
                      </div>
                    ) : (
                      leaderboard.map((entry, idx) => (
                        <div
                          key={entry.address}
                          className={`flex items-center justify-between p-3 rounded-2xl border-2 border-black transition-all ${
                            idx === 0 ? 'bg-blue-50' : 'bg-white'
                          }`}
                          style={idx === 0 ? { boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' } : {}}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`${rankColors[idx]} text-black w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl italic border-2 border-black`}
                              style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                            >
                              {entry.rank}
                            </div>
                            <div>
                              <h3
                                className={`font-black italic uppercase leading-none ${
                                  idx === 0 ? 'text-xl text-blue-900' : 'text-lg text-gray-700'
                                }`}
                              >
                                {entry.name || 'Unnamed'}
                              </h3>
                              <p className="text-[9px] font-mono text-gray-400 font-bold mt-1 uppercase tracking-tighter">
                                {formatAddress(entry.address)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-black italic leading-none ${
                                idx === 0 ? 'text-3xl text-blue-600' : 'text-xl text-gray-400'
                              }`}
                            >
                              {entry.highestMmr.toLocaleString()}
                            </div>
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
                              MMR
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex-grow" />
                  </div>
                </div>

                {/* Weekly Best NFT Card */}
                <div
                  className="relative bg-blue-50 rounded-[24px] p-5 border-4 border-black overflow-hidden cursor-pointer group transition-all"
                  style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'translate(4px, 4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                    (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                  }}
                >
                  {/* Decorative background crown */}
                  <div className="absolute top-0 right-0 p-4 opacity-[0.07] pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <Crown size={80} className="text-blue-900" />
                  </div>

                  <div className="relative z-10">
                    {/* Label */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="bg-orange-500 p-1 rounded-md border-2 border-black"
                        style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                      >
                        <Flame className="text-white" size={13} fill="currentColor" />
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900">
                        Weekly Best NFT
                      </span>
                      <span className="ml-auto text-[9px] font-black uppercase text-blue-400 italic">
                        Resets in {getDaysUntilMonday()} days
                      </span>
                    </div>

                    {/* Content */}
                    {loading && !weeklyBest ? (
                      <div className="h-12 bg-blue-100 animate-pulse rounded-xl" />
                    ) : weeklyBest ? (
                      <div className="flex items-center gap-4">
                        {/* Avatar placeholder using initials */}
                        <div
                          className="w-14 h-14 rounded-full border-4 border-black bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md"
                          style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                        >
                          <span className="text-white font-black text-lg italic uppercase">
                            {weeklyBest.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black italic uppercase text-blue-900 leading-tight truncate">
                            {weeklyBest.name}
                          </h4>
                          <p className="text-[10px] font-mono text-blue-500 uppercase tracking-tighter mt-0.5 truncate">
                            {formatAddress(weeklyBest.address)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-black italic text-blue-700 leading-none">
                            {weeklyBest.mmr.toLocaleString()}
                          </div>
                          <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">
                            MMR
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-14 h-14 rounded-full border-4 border-dashed border-blue-200 bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Trophy size={20} className="text-blue-300" />
                        </div>
                        <div>
                          <p className="font-black italic uppercase text-blue-300 text-sm">No mints this week</p>
                          <p className="text-[9px] font-bold text-blue-300 mt-0.5">Be the first to earn this spot!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-4 border-black p-6 flex justify-between items-center bg-gray-50 px-10">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase italic tracking-widest text-gray-400">
            <RefreshCcw
              size={14}
              className={isLive ? 'text-green-500' : 'text-gray-400'}
              style={isLive ? { animation: 'spin-slow 8s linear infinite' } : {}}
            />
            {isLive ? 'Data updates live' : 'Stream paused'}
          </div>
          <a
            href="/podium"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black uppercase italic text-sm tracking-widest border-4 border-black transition-all"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.transform = 'translate(4px, 4px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
            }}
          >
            View Leaderboards
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slide-in-top {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-top {
          animation: slide-in-top 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default SecuritySection;
