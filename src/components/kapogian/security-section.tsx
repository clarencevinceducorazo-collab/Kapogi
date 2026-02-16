'use client';

import React, { useState, useEffect } from "react";
import {
  Zap,
  Activity,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "@/lib/constants";
import { timeAgo, formatAddress } from "@/lib/utils";

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
  name: string; // The name of their highest MMR NFT
  highestMmr: number;
}

export const SecuritySection = () => {
  const [recentMints, setRecentMints] = useState<MintEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch last 100 mints for both recent activity and live leaderboard
        const mintEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::character_nft::CharacterMinted` },
          limit: 100,
          order: 'descending',
        });

        if (!mintEvents.data || mintEvents.data.length === 0) {
          if (loading) setLoading(false);
          return;
        }

        // --- Part 1: Update Recent Mints ---
        setRecentMints(mintEvents.data as MintEvent[]);

        // --- Part 2: Calculate Live Leaderboard ---
        const nftIds = mintEvents.data.map(event => (event.parsedJson as any)?.nft_id).filter(Boolean);
        const ownerMmrMap = new Map<string, { address: string; highestMmr: number; name: string }>();

        if (nftIds.length > 0) {
          const nftObjects = await suiClient.multiGetObjects({
            ids: nftIds,
            options: { showContent: true },
          });

          const nftObjectMap = new Map(nftObjects.map(obj => [obj.data?.objectId, obj.data]));

          mintEvents.data.forEach(event => {
            const parsed = event.parsedJson as any;
            if (!parsed.owner || !parsed.nft_id) return;

            const nftObject = nftObjectMap.get(parsed.nft_id);
            if (!nftObject?.content || nftObject.content.dataType !== 'moveObject') return;

            const fields = nftObject.content.fields as any;
            const currentMmr = Number(fields.mmr);
            const nftName = fields.name;

            if (!ownerMmrMap.has(parsed.owner) || currentMmr > ownerMmrMap.get(parsed.owner)!.highestMmr) {
              ownerMmrMap.set(parsed.owner, {
                address: parsed.owner,
                highestMmr: currentMmr,
                name: nftName,
              });
            }
          });
        }
        
        const sortedLeaderboard = Array.from(ownerMmrMap.values())
          .sort((a, b) => b.highestMmr - a.highestMmr)
          .slice(0, 5)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));

        setLeaderboard(sortedLeaderboard);
        
      } catch (error) {
        console.error("Failed to fetch live activity:", error);
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      if (isLive) fetchData();
    }, 8000); // Refresh every 8 seconds

    return () => clearInterval(interval);
  }, [isLive, loading]);

  return (
    <div className="min-h-[80vh] bg-[#3B82F6] text-slate-900 font-sans p-4 py-8 flex flex-col items-center justify-center overflow-x-hidden relative pb-20">
      {/* Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-48 h-48 bg-yellow-400 border-8 border-black rounded-full opacity-10 animate-pulse" />
      <div className="absolute bottom-10 right-[-5%] w-72 h-16 bg-white border-8 border-black rounded-full rotate-12 opacity-10" />

      {/* Main Header */}
      <h2
        className="font-headline text-5xl md:text-8xl font-bold text-white uppercase pt-20 pb-20"
        style={{
          textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
        }}
      >
        Live Activity
      </h2>

      <div className="w-full max-w-4xl relative z-10">
        <div className="relative pt-8">
          <div
            className="absolute -top-10 -left-4 w-32 h-32 md:-top-36 md:-left-12 md:w-64 md:h-64 z-0 pointer-events-none transition-all duration-300"
          >
            <img
              src="/images/rihee.png"
              alt="Chibi"
              className="w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]"
            />
          </div>
          <div
            className="absolute -top-4 -right-2 w-28 h-28 md:-top-28 md:-right-12 md:w-64 md:h-64 z-0 pointer-events-none transition-all duration-300"
          >
            <img
              src="/images/rihe.png"
              alt="Chibi Right"
              className="w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.3)]"
            />
          </div>

          <div className="bg-white border-[5px] border-black rounded-[2rem] p-6 md:p-8 shadow-[12px_12px_0px_black] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: Live Summons */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-4 border-b-4 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-8 h-8 text-blue-500 fill-blue-500" />
                    <h2 className="font-black text-2xl uppercase italic tracking-tighter">
                      Live Summons
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsLive(!isLive)}>
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="text-xs font-bold text-slate-500">{isLive ? 'LIVE' : 'PAUSED'}</span>
                  </div>
                </div>

                {loading && recentMints.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[24rem] text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 h-[24rem] overflow-y-auto pr-2 custom-scrollbar">
                    {recentMints.slice(0, 10).map((mint, idx) => (
                      <a
                        key={mint.id.txDigest}
                        href={`https://suiscan.xyz/${NETWORK_CONFIG.network}/tx/${mint.id.txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 border-2 border-black rounded-xl bg-slate-50 hover:bg-white hover:border-blue-500 hover:shadow-md transition-all animate-slide-in-top"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-sm tracking-tight truncate pr-2">{mint.parsedJson.name || 'Unnamed Character'}</p>
                          {idx === 0 && Date.now() - parseInt(mint.timestampMs) < 15000 && (
                            <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-black animate-pulse">NEW!</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-500">{formatAddress(mint.sender)}</span>
                          <span className="text-slate-400">{timeAgo(mint.timestampMs)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: MMR Leaderboard */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <h2 className="font-black text-2xl uppercase italic tracking-tighter">
                    Live MMR
                  </h2>
                </div>

                {loading && leaderboard.length === 0 ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="bg-slate-100 border-[3px] border-black p-3 rounded-xl h-[76px] animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => {
                      const rankColors = ["bg-yellow-400", "bg-slate-200", "bg-orange-400"];
                      return (
                        <div
                          key={i}
                          className={`flex justify-between items-center bg-white border-[3px] border-black p-3 rounded-xl shadow-[4px_4px_0px_black]`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border-2 border-black shadow-[2px_2px_0px_black] ${rankColors[i] || 'bg-white'}`}
                            >
                              #{entry.rank}
                            </div>
                            <div className="max-w-[120px]">
                              <p className="font-black text-sm uppercase italic tracking-tighter leading-none truncate">
                                {entry.name || 'Unnamed'}
                              </p>
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest font-mono">
                                {formatAddress(entry.address)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black font-mono block leading-none text-base">
                              {entry.highestMmr.toLocaleString()}
                            </span>
                            <p className="text-[8px] font-black uppercase text-purple-600 mt-0.5">
                              MMR
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 pt-4 flex justify-around border-t-[3px] border-slate-100 border-dashed">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Users
                    </p>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Users size={14} className="text-blue-500" />
                      <p className="font-black text-lg">4.2k</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Server
                    </p>
                    <div className="flex items-center gap-1.5 justify-center">
                      <Activity size={14} className="text-green-500" />
                      <p className="font-black text-lg text-green-500 uppercase">
                        Legend
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
