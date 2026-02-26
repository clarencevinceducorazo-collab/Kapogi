"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getOwnedCharacters } from "@/lib/sui";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { MainProfileV2 } from "@/components/kapogian/main-profile-v2";

export default function Page() {
  const account = useCurrentAccount();
  const [characters, setCharacters] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"Collections" | "Orders" | "Stats">("Stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account?.address) return;
    setLoading(true);
    
    const loadData = async () => {
      try {
        const ownedObjects = await getOwnedCharacters(account.address);
        const parsed = (ownedObjects || [])
          .map((obj: any) => {
            const displayData = obj.data?.display?.data || {};
            const contentData = obj.data?.content?.fields || {};
            let attributes: any = {};
            try {
              if (contentData.attributes)
                attributes = JSON.parse(contentData.attributes);
            } catch (e) {}

            return {
              objectId: obj.data?.objectId || "",
              name: displayData.name || "Unnamed",
              description: displayData.description || "No lore recorded for this spirit.",
              imageUrl: getIPFSGatewayUrl(displayData.image_url || ""),
              attributes: attributes || {},
              mmr: Number(contentData.mmr || 0),
            };
          })
          .filter((c: any) => c.objectId);

        parsed.sort((a: any, b: any) => b.mmr - a.mmr);
        setCharacters(parsed);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [account?.address]);

  // Derived stats
  const summonsCount = characters.length;
  const bestMmrNum = characters.length > 0 ? characters[0].mmr : 0;
  const avgMmrNum = summonsCount > 0 
    ? Math.round(characters.reduce((acc, c) => acc + c.mmr, 0) / summonsCount) 
    : 0;
  
  const lineageMap: Record<string, number> = {};
  characters.forEach(c => {
    const l = c.attributes?.lineage || 'Unknown';
    lineageMap[l] = (lineageMap[l] || 0) + 1;
  });
  const topLineages = Object.entries(lineageMap)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-pink-100 to-yellow-100 relative selection:bg-pink-300 selection:text-white">
      <div className="fixed top-10 left-10 w-64 aspect-square bg-sky-200/50 rounded-full mix-blend-multiply filter blur-2xl opacity-80 -z-10 animate-pulse"></div>
      <div className="fixed bottom-10 right-10 w-72 aspect-square bg-pink-200/50 rounded-full mix-blend-multiply filter blur-2xl opacity-80 -z-10 animate-pulse delay-75"></div>
      <div className="fixed top-1/2 left-1/2 w-80 aspect-square bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-2xl opacity-80 -z-10 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-150"></div>

      <PageHeader />
      
      <main className="pt-32 pb-20 px-4 md:px-8 relative z-10">
        {!account ? (
          <div className="max-w-md mx-auto text-center py-20 bg-white/80 backdrop-blur-md rounded-[3rem] border-4 border-black shadow-xl">
            <h2 className="text-4xl font-headline mb-4">Sync Required</h2>
            <p className="text-slate-500 font-bold mb-8">Connect your wallet to view your legendary squad.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-16 h-16 border-8 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black uppercase tracking-widest text-sky-600">Syncing Bio-Data...</p>
          </div>
        ) : (
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
          />
        )}
      </main>

      <PageFooter />
    </div>
  );
}
