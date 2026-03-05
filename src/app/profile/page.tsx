"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  getOwnedCharacters,
  getPlayerStats,
  getAllAchievements,
  getPendingGrants,
} from "@/lib/sui";
import { MainProfileV2 } from "@/components/kapogian/main-profile-v2";
import Image from "next/image";
import { Wallet, LoaderCircle } from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import type {
  PlayerStatsObject,
  AchievementDef,
  AchievementGrant,
} from "@/lib/sui";

export default function ProfilePage() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Stats" | "Collections" | "Orders" | "Badges"
  >("Stats");

  // Achievement state
  const [playerStats, setPlayerStats] = useState<PlayerStatsObject | null>(
    null,
  );
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-body antialiased selection:bg-black selection:text-white">
      {/* Floating background blobs and clouds for visual effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div
          className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>
        <iconify-icon
          icon="solar:cloud-bold"
          className="absolute top-20 left-[10%] text-white opacity-40 text-9xl animate-float-delayed"
        ></iconify-icon>
        <iconify-icon
          icon="solar:cloud-bold"
          className="absolute top-40 right-[15%] text-white opacity-30 text-8xl animate-float"
        ></iconify-icon>
      </div>
      <PageHeader />
      <main className="flex-grow pt-32 pb-20 px-6">
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
        />
      </main>
      <PageFooter />
    </div>
  );
}
