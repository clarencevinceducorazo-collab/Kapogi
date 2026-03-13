"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import {
  getOwnedCharacters,
  getPlayerStats,
  getAllAchievements,
  getPendingGrants,
} from "@/lib/sui";
import { MainProfileV2 } from "@/components/kapogian/main-profile-v2";
import Image from "next/image";
import { Wallet, LoaderCircle, Coins, RefreshCw } from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import type {
  PlayerStatsObject,
  AchievementDef,
  AchievementGrant,
} from "@/lib/sui";

// ─── Wallet Balances Card ─────────────────────────────────────────────────────
// Renders inside the left column of MainProfileV2 via the walletCard prop.
// Shows SUI (live) + Pogi Coin (static placeholder).

function WalletBalancesCard({ address }: { address: string }) {
  const {
    data: balance,
    isLoading,
    refetch,
    isRefetching,
  } = useSuiClientQuery("getBalance", {
    owner: address,
    coinType: "0x2::sui::SUI",
  });

  const rawBalance = balance ? Number(balance.totalBalance) : 0;
  const suiBalance = (rawBalance / 1_000_000_000).toFixed(4);

  return (
    <div className="bg-white rounded-[2rem] border-4 border-slate-100 shadow-[0_8px_0_0_rgba(226,232,240,1)] overflow-hidden">
      {/* Header — matches Social Identity / Profile Actions label style */}
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Wallet size={13} className="text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Token Balances
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40"
          title="Refresh SUI balance"
        >
          <RefreshCw
            size={13}
            className={`text-slate-400 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* ── SUI row ── */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16.25 8.625a4.25 4.25 0 0 0-8.5 0c0 1.31.594 2.481 1.532 3.266L12 14.176l2.718-2.285A4.234 4.234 0 0 0 16.25 8.625ZM12 2a6.625 6.625 0 0 1 5.116 10.855L12 17.324l-5.116-4.469A6.625 6.625 0 0 1 12 2Zm0 16.5 4.25-3.578c1.003.734 1.5 1.65 1.5 2.578C17.75 19.807 15.1 22 12 22s-5.75-2.193-5.75-4.5c0-.928.497-1.844 1.5-2.578L12 18.5Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">
              Sui Network
            </p>
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <LoaderCircle size={13} className="animate-spin text-white/60" />
                <span className="text-white/60 text-xs font-black uppercase tracking-widest">
                  Loading…
                </span>
              </div>
            ) : (
              <p className="text-white font-black text-lg leading-none tracking-tight">
                {suiBalance}
              </p>
            )}
          </div>
          <span className="text-white/70 font-black text-sm uppercase tracking-widest flex-shrink-0">
            SUI
          </span>
        </div>

        {/* ── Pogi Coin row (static) ── */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-base leading-none">✦</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">
              Kapogian Coin
            </p>
            <p className="text-white font-black text-lg leading-none tracking-tight">
              0.0000
            </p>
          </div>
          <span className="text-white/70 font-black text-sm uppercase tracking-widest flex-shrink-0">
            POGI
          </span>
        </div>

        {/* MIST footnote — only once SUI is loaded */}
        {!isLoading && (
          <div className="flex items-center justify-between px-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Coins size={10} />
              MIST
            </span>
            <span className="text-[10px] font-semibold font-mono text-slate-400">
              {rawBalance.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Stats" | "Collections" | "Orders" | "Badges"
  >("Stats");

  const [playerStats, setPlayerStats] = useState<PlayerStatsObject | null>(null);
  const [allAchievements, setAllAchievements] = useState<AchievementDef[]>([]);
  const [pendingGrants, setPendingGrants] = useState<AchievementGrant[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    if (!account?.address) {
      setLoading(false);
      setAchievementsLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setAchievementsLoading(true);
      try {
        const [owned, stats, achievements, grants] = await Promise.all([
          getOwnedCharacters(account.address),
          getPlayerStats(account.address),
          getAllAchievements(),
          getPendingGrants(account.address),
        ]);

        const parsed = owned.map((obj: any) => {
          const display = obj.data?.display?.data || {};
          const content = obj.data?.content?.fields || {};
          let attributes: any = {};
          try {
            if (content.attributes) attributes = JSON.parse(content.attributes);
          } catch (e) {}
          return {
            objectId: obj.data?.objectId,
            name: display.name || "Unnamed Spirit",
            description:
              display.description ||
              "A mysterious spirit from the Kapogian realm.",
            imageUrl: getIPFSGatewayUrl(display.image_url || ""),
            mmr: Number(content.mmr || attributes.mmr || 0),
            attributes: {
              ...attributes,
              lineage: attributes.lineage || "Ancient",
              rank: attributes.rank || "Spirit Seed",
            },
          };
        });
        parsed.sort((a: any, b: any) => b.mmr - a.mmr);

        setCharacters(parsed);
        setPlayerStats(stats);
        setAllAchievements(achievements.filter((a) => a.isActive));
        setPendingGrants(grants);
      } catch (e) {
        console.error("Failed to load profile data:", e);
      } finally {
        setLoading(false);
        setAchievementsLoading(false);
      }
    };

    loadData();
  }, [account?.address]);

  const refreshAchievements = async () => {
    if (!account?.address) return;
    setAchievementsLoading(true);
    try {
      const [stats, grants] = await Promise.all([
        getPlayerStats(account.address),
        getPendingGrants(account.address),
      ]);
      setPlayerStats(stats);
      setPendingGrants(grants);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const bestMmrNum =
    characters.length > 0 ? Math.max(...characters.map((c) => c.mmr)) : 0;
  const avgMmrNum =
    characters.length > 0
      ? Math.round(
          characters.reduce((acc, c) => acc + c.mmr, 0) / characters.length,
        )
      : 0;
  const summonsCount = characters.length;

  const lineageMap: Record<string, number> = {};
  characters.forEach((c) => {
    const lin = c.attributes?.lineage || "Ancient";
    lineageMap[lin] = (lineageMap[lin] || 0) + 1;
  });
  const topLineages = Object.entries(lineageMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 relative font-body antialiased">
        <div className="fixed inset-0 -z-10">
          <Image
            src="/images/kapogian_background.png"
            alt="bg"
            fill
            className="object-cover"
            priority
          />
        </div>
        <PageHeader />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Wallet size={48} />
            </div>
            <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">
              Sync Required
            </h3>
            <p className="font-bold text-gray-500 uppercase mb-10 leading-snug">
              Connect your wallet to view your Kapogian profile.
            </p>
            <CustomConnectButton className="!w-full !py-5 !text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-body antialiased">
        <PageHeader />
        <main className="flex-grow flex flex-col items-center justify-center gap-6">
          <LoaderCircle size={64} className="animate-spin text-black" />
          <p className="font-black uppercase tracking-widest text-xl">
            Scanning Blockchain...
          </p>
        </main>
        <PageFooter />
      </div>
    );
  }

  // ── Main Profile ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-body antialiased selection:bg-black selection:text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div
          className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob"
          style={{ animationDelay: "4s" }}
        />
        <iconify-icon
          icon="solar:cloud-bold"
          className="absolute top-20 left-[10%] text-white opacity-40 text-9xl animate-float-delayed"
        />
        <iconify-icon
          icon="solar:cloud-bold"
          className="absolute top-40 right-[15%] text-white opacity-30 text-8xl animate-float"
        />
      </div>

      <PageHeader />

      <main className="flex-grow pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/*
           * walletCard prop → MainProfileV2 renders it inside the left column
           * between Social Identity and Profile Actions.
           */}
          <MainProfileV2
            characters={characters}
            account={account}
            index={index}
            setIndex={setIndex}
            summonsCount={summonsCount}
            bestMmrNum={bestMmrNum}
            avgMmrNum={avgMmrNum}
            topLineages={topLineages}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            playerStats={playerStats}
            allAchievements={allAchievements}
            pendingGrants={pendingGrants}
            achievementsLoading={achievementsLoading}
            onAchievementsRefresh={refreshAchievements}
            walletCard={<WalletBalancesCard address={account.address} />}
          />
        </div>
      </main>

      <PageFooter />
    </div>
  );
}