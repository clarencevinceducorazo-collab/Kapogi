
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Palette
} from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils';
import { OrdersPanel } from './orders-panel';
import { checkBinding } from '@/lib/identity-api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────────────────────
// DATA STRUCTURES
// ─────────────────────────────────────────────────────────────────────────────

const RANK_DATA = [
  {mmr:0,title:"Spirit Seed",icon:"solar:leaf-linear",color:"#94a3b8",gradient:"linear-gradient(135deg,#475569,#cbd5e1)",rarity:"Top 100%",tier:"Starter",fx:"fx-silver",desc:"Every journey begins here. You planted the first seed of your Kapogian legacy."},
  {mmr:101,title:"Pogi Spark",icon:"solar:bolt-linear",color:"#d97706",gradient:"linear-gradient(135deg,#92400e,#fbbf24)",rarity:"Top 85%",tier:"Starter",fx:"fx-bronze",desc:"A tiny bolt of charm flickers inside you. Awarded at 101 MMR."},
  {mmr:251,title:"Aura Touched",icon:"solar:sprout-linear",color:"#b45309",gradient:"linear-gradient(135deg,#92400e,#d97706)",rarity:"Top 65%",tier:"Initiate",fx:"fx-bronze",desc:"The aura found you first. Unlocked at 251 MMR — you're starting to glow."},
  {mmr:401,title:"Initiate of Pogi",icon:"solar:emoji-funny-circle-linear",color:"#ea580c",gradient:"linear-gradient(135deg,#c2410c,#fb923c)",rarity:"Top 45%",tier:"Initiate",fx:"fx-bronze",desc:"You've been formally welcomed into the world of Pogi. 401 MMR achieved."},
  {mmr:701,title:"Ghost Walker",icon:"solar:ghost-smile-linear",color:"#38bdf8",gradient:"linear-gradient(135deg,#0369a1,#7dd3fc)",rarity:"Top 28%",tier:"Adept",fx:"fx-sky",desc:"You move between worlds unseen. Awarded at 701 MMR — hauntingly good."},
  {mmr:1001,title:"Dalaketnon Slayer",icon:"solar:sword-linear",color:"#2563eb",gradient:"linear-gradient(135deg,#1d4ed8,#60a5fa)",rarity:"Top 18%",tier:"Adept",fx:"fx-sky",desc:"You've defeated the spirits of Biringan. Reached at 1,001 MMR."},
  {mmr:1301,title:"Fearless Descent",icon:"solar:shield-linear",color:"#38bdf8",gradient:"linear-gradient(135deg,#0284c7,#bae6fd)",rarity:"Top 12%",tier:"Adept",fx:"fx-sky",desc:"You dove deep into the unknown without fear. Unlocked at 1,301 MMR."},
  {mmr:1601,title:"Lord of Biringan",icon:"solar:water-sun-linear",color:"#10b981",gradient:"linear-gradient(135deg,#059669,#6ee7b7)",rarity:"Top 7%",tier:"Elite",fx:"fx-emerald",desc:"The mystical city of Biringan bows to you. Achieved at 1,601 MMR."},
  {mmr:1901,title:"Aura God",icon:"solar:crown-star-linear",color:"#059669",gradient:"linear-gradient(135deg,#065f46,#34d399)",rarity:"Top 4%",tier:"Elite",fx:"fx-emerald",desc:"Your aura transcends the mortal plane. You are divine. Reached at 1,901 MMR."},
  {mmr:2201,title:"Proof of Pogi Elite",icon:"solar:gem-linear",color:"#34d399",gradient:"linear-gradient(135deg,#059669,#a7f3d0)",rarity:"Top 2.5%",tier:"Elite",fx:"fx-emerald",desc:"Certified elite-tier Pogi energy, officially verified. Unlocked at 2,201 MMR."},
  {mmr:2501,title:"Supreme Pogi",icon:"solar:star-fall-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#b45309,#fde68a)",rarity:"Top 1.2%",tier:"Master",fx:"fx-gold",desc:"Supreme. There is truly no other word. Reached at 2,501 MMR."},
  {mmr:2801,title:"Hall of Fame Immortal",icon:"solar:cup-star-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#92400e,#fcd34d)",rarity:"Top 0.6%",tier:"Champion",fx:"fx-gold",desc:"Your name is etched in the Hall of Fame for eternity. Achieved at 2,801 MMR."},
  {mmr:3301,title:"Eternal Light Bearer",icon:"solar:flower-linear",color:"#f97316",gradient:"linear-gradient(135deg,#c2410c,#fde68a)",rarity:"Top 0.18%",tier:"Champion",fx:"fx-flame",desc:"You carry the eternal flame. Only the brightest ever reach 3,301 MMR."},
  {mmr:3501,title:"Cultural Icon",icon:"solar:ribbon-linear",color:"#ef4444",gradient:"linear-gradient(135deg,#dc2626,#fca5a5)",rarity:"Top 0.08%",tier:"Legend",fx:"fx-flame",desc:"You are bigger than the game itself — a Cultural Icon. Unlocked at 3,501 MMR."},
  {mmr:3701,title:"Generational Tycoon",icon:"solar:wad-of-money-linear",color:"#eab308",gradient:"linear-gradient(135deg,#a16207,#fef08a)",rarity:"Top 0.04%",tier:"Legend",fx:"fx-gold",desc:"A wealth of aura that spans generations and time. Reached at 3,701 MMR."},
  {mmr:3851,title:"Master Rancher",icon:"solar:palette-linear",color:"#a855f7",gradient:"linear-gradient(135deg,#6d28d9,#e879f9)",rarity:"Top 0.02%",tier:"Mythic",fx:"fx-purple",desc:"You've mastered every field and every frontier. Achieved at 3,851 MMR."},
  {mmr:3951,title:"Kapogian Ascendant",icon:"solar:crown-linear",color:"#818cf8",gradient:"linear-gradient(135deg,#4f46e5,#34d399,#60a5fa,#f472b6)",rarity:"Top 0.005%",tier:"✦ Ascendant ✦",fx:"fx-aurora",desc:"The absolute pinnacle of all existence. Transcend everything. The rarest rank, awarded at 3,951 MMR."},
];

const ACHIEVEMENT_DATA = {
  summons: [
    {id:"first_summon",title:"First Summon",icon:"solar:magic-stick-3-linear",color:"#94a3b8",gradient:"linear-gradient(135deg,#475569,#cbd5e1)",category:"Summoning",fx:"fx-silver",rarity:"Common",desc:"Complete your very first summon.", requiredCount: 1},
    {id:"apprentice_summoner",title:"Apprentice Summoner",icon:"solar:magic-stick-linear",color:"#d97706",gradient:"linear-gradient(135deg,#92400e,#fbbf24)",category:"Summoning",fx:"fx-bronze",rarity:"Common",desc:"Complete 10 summons total.", requiredCount: 10},
    {id:"adept_summoner",title:"Adept Summoner",icon:"solar:stars-linear",color:"#ea580c",gradient:"linear-gradient(135deg,#c2410c,#fb923c)",category:"Summoning",fx:"fx-bronze",rarity:"Uncommon",desc:"Complete 50 summons.", requiredCount: 50},
    {id:"relentless",title:"Relentless",icon:"solar:bolt-circle-linear",color:"#f97316",gradient:"linear-gradient(135deg,#c2410c,#fde68a)",category:"Summoning",fx:"fx-flame",rarity:"Epic",desc:"Reach 500 total summons.", requiredCount: 500},
    {id:"master_summoner",title:"Master Summoner",icon:"solar:stars-minimalistic-linear",color:"#38bdf8",gradient:"linear-gradient(135deg,#0369a1,#7dd3fc)",category:"Summoning",fx:"fx-sky",rarity:"Rare",desc:"Complete 200 summons.", requiredCount: 200},
    {id:"summoning_marathon",title:"Summoning Marathon",icon:"solar:running-round-linear",color:"#10b981",gradient:"linear-gradient(135deg,#059669,#6ee7b7)",category:"Summoning",fx:"fx-emerald",rarity:"Epic",desc:"Complete 1,000 summons.", requiredCount: 1000},
    {id:"speed_summoner",title:"Speed Summoner",icon:"solar:delivery-speed-linear",color:"#a855f7",gradient:"linear-gradient(135deg,#6d28d9,#e879f9)",category:"Summoning",fx:"fx-purple",rarity:"Rare",desc:"Perform 10 summons within a single hour.", requiredCount: 10},
    {id:"freebie_fanatic",title:"Freebie Fanatic",icon:"solar:gift-linear",color:"#34d399",gradient:"linear-gradient(135deg,#059669,#a7f3d0)",category:"Summoning",fx:"fx-emerald",rarity:"Uncommon",desc:"Complete 50 free summons.", requiredCount: 50},
    {id:"most_summons",title:"Most Summons",icon:"solar:crown-star-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#b45309,#fde68a)",category:"Summoning",fx:"fx-gold",rarity:"Legendary",desc:"Rank #1 on the summoning leaderboard.", requiredCount: 1},
  ],
  collection: [
    {id:"unique_10",title:"Unique Collector (10)",icon:"solar:box-linear",color:"#94a3b8",gradient:"linear-gradient(135deg,#475569,#cbd5e1)",category:"Collection",fx:"fx-silver",rarity:"Common",desc:"Own 10 distinct summoned characters.", requiredCount: 10},
    {id:"unique_50",title:"Unique Collector (50)",icon:"solar:box-minimalistic-linear",color:"#10b981",gradient:"linear-gradient(135deg,#059669,#6ee7b7)",category:"Collection",fx:"fx-emerald",rarity:"Rare",desc:"Own 50 distinct summoned characters.", requiredCount: 50},
    {id:"legendary_find",title:"Legendary Find",icon:"solar:star-shine-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#92400e,#fcd34d)",category:"Collection",fx:"fx-gold",rarity:"Legendary",desc:"Summon a legendary or ultra-rare character.", requiredCount: 1},
    {id:"double_luck",title:"Double Luck",icon:"solar:double-alt-arrow-up-linear",color:"#818cf8",gradient:"linear-gradient(135deg,#4f46e5,#34d399,#60a5fa,#f472b6)",category:"Collection",fx:"fx-aurora",rarity:"Mythic",desc:"Pull two legendaries within 24 hours.", requiredCount: 2},
    {id:"trait_hunter",title:"Trait Hunter",icon:"solar:eye-linear",color:"#f472b6",gradient:"linear-gradient(135deg,#9f1239,#fda4af)",category:"Collection",fx:"fx-rose",rarity:"Rare",desc:"Summon a character with specified rare traits.", requiredCount: 1},
    {id:"set_collector",title:"Set Collector",icon:"solar:layers-linear",color:"#22d3ee",gradient:"linear-gradient(135deg,#164e63,#a5f3fc)",category:"Collection",fx:"fx-cyan",rarity:"Epic",desc:"Obtain all characters from a themed set.", requiredCount: 5},
    {id:"battle_tested",title:"Battle-Tested",icon:"solar:shield-check-linear",color:"#38bdf8",gradient:"linear-gradient(135deg,#0284c7,#bae6fd)",category:"Collection",fx:"fx-sky",rarity:"Uncommon",desc:"Win 10 matches using summoned characters.", requiredCount: 10},
    {id:"longevity",title:"Longevity",icon:"solar:calendar-mark-linear",color:"#a855f7",gradient:"linear-gradient(135deg,#6d28d9,#e879f9)",category:"Collection",fx:"fx-purple",rarity:"Epic",desc:"Keep a summoned character for 365 days.", requiredCount: 365},
  ],
  tiers: [
    {id:"mmr_bronze",title:"MMR Bronze",icon:"solar:medal-ribbons-star-linear",color:"#b45309",gradient:"linear-gradient(135deg,#92400e,#d97706)",category:"Tier",fx:"fx-bronze",rarity:"Common",desc:"Hit the Bronze MMR tier (401+ MMR).", requiredMmr: 401},
    {id:"mmr_silver",title:"MMR Silver",icon:"solar:medal-linear",color:"#94a3b8",gradient:"linear-gradient(135deg,#475569,#cbd5e1)",category:"Tier",fx:"fx-silver",rarity:"Common",desc:"Hit the Silver MMR tier (701+ MMR).", requiredMmr: 701},
    {id:"mmr_gold",title:"MMR Gold",icon:"solar:medal-star-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#b45309,#fde68a)",category:"Tier",fx:"fx-gold",rarity:"Rare",desc:"Hit the Gold MMR tier (2501+ MMR).", requiredMmr: 2501},
    {id:"mmr_platinum",title:"MMR Platinum",icon:"solar:trophy-star-linear",color:"#818cf8",gradient:"linear-gradient(135deg,#4f46e5,#a5b4fc)",category:"Tier",fx:"fx-purple",rarity:"Epic",desc:"Hit the Platinum MMR tier (3301+ MMR).", requiredMmr: 3301},
    {id:"mmr_legend",title:"MMR Legend",icon:"solar:crown-linear",color:"#818cf8",gradient:"linear-gradient(135deg,#4f46e5,#34d399,#60a5fa,#f472b6)",category:"Tier",fx:"fx-aurora",rarity:"Mythic",desc:"Hit the Legend MMR tier (3951+ MMR).", requiredMmr: 3951},
  ],
  streaks: [
    {id:"streak_7",title:"Summon Streak (7)",icon:"solar:fire-linear",color:"#f97316",gradient:"linear-gradient(135deg,#c2410c,#fde68a)",category:"Streak",fx:"fx-flame",rarity:"Uncommon",desc:"Summon daily for 7 consecutive days.", requiredDays: 7},
    {id:"streak_30",title:"Summon Streak (30)",icon:"solar:fire-bold",color:"#ef4444",gradient:"linear-gradient(135deg,#dc2626,#fca5a5)",category:"Streak",fx:"fx-flame",rarity:"Legendary",desc:"Summon daily for 30 consecutive days.", requiredDays: 30},
  ],
  social: [
    {id:"referral_summoner",title:"Referral Summoner",icon:"solar:user-plus-rounded-linear",color:"#10b981",gradient:"linear-gradient(135deg,#059669,#6ee7b7)",category:"Social",fx:"fx-emerald",rarity:"Uncommon",desc:"Bring 5 friends who perform a summon.", requiredCount: 5},
    {id:"community_champion",title:"Community Champion",icon:"solar:users-group-rounded-linear",color:"#f59e0b",gradient:"linear-gradient(135deg,#b45309,#fde68a)",category:"Social",fx:"fx-gold",rarity:"Legendary",desc:"Have 50 referred players summon.", requiredCount: 50},
    {id:"event_summoner",title:"Event Summoner",icon:"solar:calendar-linear",color:"#f472b6",gradient:"linear-gradient(135deg,#9f1239,#fda4af)",category:"Social",fx:"fx-rose",rarity:"Rare",desc:"Summon during a special event.", requiredCount: 1},
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
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
  activeTab: 'Stats' | 'Collections' | 'Orders' | 'Badges';
  setActiveTab: (tab: 'Stats' | 'Collections' | 'Orders' | 'Badges') => void;
}

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
  setActiveTab
}: MainProfileV2Props) {
  const [bindingStatus, setBindingStatus] = useState<{ bound: boolean; x_username?: string } | null>(null);
  const [loadingBinding, setLoadingBinding] = useState(false);
  const [badgeTab, setBadgeTab] = useState<'ranks' | 'summons' | 'collection' | 'tiers' | 'social'>('ranks');
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const currentCharacter = characters[index];
  const attrs = currentCharacter?.attributes ?? {};
  const shortAddr = account?.address ? formatAddress(account.address) : '0x...';

  // Strictly filter rank badges to only those found on NFTs currently in the user's wallet
  const ownedRankTitles = useMemo(() => {
    const titles = new Set<string>();
    characters.forEach(c => {
      if (c.attributes?.rank) titles.add(c.attributes.rank);
    });
    return titles;
  }, [characters]);

  useEffect(() => {
    if (account?.address) {
      setLoadingBinding(true);
      checkBinding(account.address)
        .then(res => setBindingStatus(res))
        .catch(e => console.error(e))
        .finally(() => setLoadingBinding(false));
    }
  }, [account?.address]);

  const navItems = [
    { id: 'Stats', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-sky-50 text-sky-600 border-sky-200 shadow-[0_4px_0_0_rgba(186,230,253,1)]' },
    { id: 'Badges', label: 'Badges', icon: Medal, color: 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-[0_4px_0_0_rgba(199,210,254,1)]' },
    { id: 'Collections', label: 'Collections', icon: Grid3X3, color: 'bg-pink-50 text-pink-600 border-pink-200 shadow-[0_4px_0_0_rgba(251,207,232,1)]' },
    { id: 'Orders', label: 'Orders', icon: Package, color: 'bg-amber-50 text-amber-600 border-amber-200 shadow-[0_4px_0_0_rgba(253,230,138,1)]' },
  ];

  const traits = [
    { label: "Style", value: attrs.clothingStyle, icon: "solar:t-shirt-linear" },
    { label: "Hair", value: attrs.hairAmount ? `${attrs.hairAmount}% Fluff` : null, icon: "solar:user-hand-up-linear" },
    { label: "Face", value: attrs.facialHair ? `${attrs.facialHair}% Stubble` : null, icon: "solar:emoji-funny-circle-linear" },
    { label: "Eyewear", value: (attrs.eyewear ?? 0) > 50 ? "Yes" : "None", icon: "solar:glasses-linear" },
    { label: "Held", value: attrs.heldItem, icon: "solar:cup-linear" },
  ].filter((t) => t.value);

  // Requirement check for the achievement badges
  const isUnlocked = (ach: any) => {
    if (ach.requiredCount !== undefined) {
      if (ach.category === 'Summoning') return summonsCount >= ach.requiredCount;
      if (ach.category === 'Collection') return characters.length >= ach.requiredCount;
      if (ach.category === 'Social') return false; // Mock until referral data is ready
    }
    if (ach.requiredMmr !== undefined) return bestMmrNum >= ach.requiredMmr;
    if (ach.requiredDays !== undefined) return false; // Mock until streak tracking is on-chain
    return false;
  };

  return (
    <div className="w-full max-w-6xl mx-auto font-body">
      {/* Immersive FX Styles */}
      <style jsx global>{`
        .kpg-fx-aurora {
          background: linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#f472b6,#fbbf24,#a78bfa);
          background-size: 500% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: kpg-auroraFlow 3s linear infinite;
          filter: drop-shadow(0 0 10px rgba(167,139,250,0.4));
        }
        @keyframes kpg-auroraFlow { to{background-position:500% center} }
        
        .kpg-card-inner {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .kpg-badge-card:hover .kpg-card-inner {
          transform: translateY(-4px) scale(1.02);
        }
        .kpg-conic-spin {
          animation: kpg-spin 3s linear infinite;
        }
        @keyframes kpg-spin { to{transform:rotate(360deg)} }
        
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
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: kpg-shine 3s infinite;
        }
        @keyframes kpg-shine { 0% { left: -100%; } 100% { left: 200%; } }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT PANEL: Identity & Navigation ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Character Preview */}
          <div className="bg-white rounded-[2.5rem] p-6 border-4 border-slate-100 shadow-[0_12px_0_0_rgba(226,232,240,1)] text-center relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-32 aspect-square bg-pink-50 rounded-full"></div>
            <div className="relative">
              <div className="mb-4">
                <h2 className="text-3xl tracking-tight font-semibold text-slate-800 uppercase font-headline">
                  {currentCharacter?.name || 'Kapogian'}
                </h2>
                <div className="inline-flex items-center justify-center gap-2 bg-slate-50 border-2 border-slate-100 px-4 py-1.5 rounded-full text-slate-500 text-sm font-semibold mt-2 shadow-sm">
                  <Wallet size={14} />
                  {shortAddr}
                </div>
              </div>
              <div className="bg-gradient-to-br from-sky-100 to-indigo-50 rounded-[2rem] aspect-square flex items-center justify-center border-4 border-sky-200 mb-2 shadow-inner relative overflow-hidden">
                {currentCharacter?.imageUrl ? (
                  <Image src={currentCharacter.imageUrl} alt={currentCharacter.name} fill className="object-contain p-4 hover:scale-110 transition-transform duration-300" />
                ) : (
                  <iconify-icon icon="solar:ghost-smile-linear" class="text-8xl text-sky-400 drop-shadow-md" />
                )}
              </div>
            </div>
          </div>

          {/* Social Identity (X Binding) */}
          <div className="bg-white rounded-[2rem] p-5 border-4 border-slate-100 shadow-[0_8px_0_0_rgba(226,232,240,1)]">
            <h3 className="text-sm tracking-wide font-semibold text-slate-400 uppercase mb-4 px-2 flex items-center gap-2">
              <Twitter size={14} className="text-blue-400" /> Social Identity
            </h3>
            {loadingBinding ? (
              <div className="p-4 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div></div>
            ) : bindingStatus?.bound ? (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm"><Twitter size={18} className="text-blue-500" /></div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Verified Account</p>
                  <p className="font-black text-blue-600 truncate text-sm">@{bindingStatus.x_username}</p>
                </div>
                <ShieldCheck className="ml-auto text-green-500" size={20} />
              </div>
            ) : (
              <Link href="/identity">
                <button className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-white hover:border-blue-300 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><UserPlus size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-600">Link X Account</p>
                    <p className="text-[10px] font-semibold text-slate-400">Earn extra rewards & status</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-300" />
                </button>
              </Link>
            )}
          </div>

          {/* Profile Navigation */}
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
                    activeTab === item.id ? "translate-y-[4px] shadow-none" : "hover:-translate-y-0.5"
                  )}
                >
                  <span className="flex items-center gap-3"><item.icon size={20} /> {item.label}</span>
                  <ChevronRightIcon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Content Area ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Stats */}
          <div>
            <h3 className="text-lg tracking-wide font-semibold text-slate-600 mb-3 px-2 flex items-center gap-2 uppercase">
              <iconify-icon icon="solar:gamepad-linear" class="text-indigo-500" /> Player Hub
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Best MMR" value={bestMmrNum.toLocaleString()} icon="solar:medal-star-circle-linear" theme="yellow" />
              <StatCard label="Avg MMR" value={avgMmrNum.toLocaleString()} icon="solar:chart-square-linear" theme="orange" />
              <StatCard label="Summons" value={summonsCount} icon="solar:magic-stick-3-linear" theme="purple" />
              <StatCard label="Lineage" value={topLineages[0] || 'Ancient'} icon="solar:crown-linear" theme="pink" />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-4 border-slate-100 shadow-[0_12px_0_0_rgba(226,232,240,1)] flex-grow min-h-[600px]">
            
            {/* Dashboard Tab */}
            {activeTab === 'Stats' && (
              <div className="animate-in fade-in duration-500 space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-4 border-slate-100 border-dashed">
                  <div>
                    <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">Current Loadout</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <ProfileBadge label={`Rank: ${attrs.rank || 'Spirit Seed'}`} icon="solar:stars-linear" theme="indigo" />
                      <ProfileBadge label={`Lineage: ${attrs.lineage || 'Unknown'}`} icon="solar:crown-linear" theme="emerald" />
                      <ProfileBadge label={`Style: ${attrs.clothingStyle || 'Classic'}`} icon="solar:glasses-linear" theme="rose" />
                    </div>
                  </div>
                  <div className="bg-yellow-100 border-4 border-yellow-300 px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-[0_6px_0_0_rgba(253,224,71,1)]">
                    <div className="bg-white w-12 aspect-square rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-sm">
                      <iconify-icon icon="solar:cup-star-linear" class="text-3xl text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wider mb-1">Global MMR</p>
                      <p className="text-3xl font-semibold text-yellow-800 tracking-tight leading-none">{(currentCharacter?.mmr ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border-4 border-slate-100 p-6 rounded-[2rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={64} className="text-slate-400" /></div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wider relative z-10">
                    <iconify-icon icon="solar:notes-linear" class="text-indigo-500" /> Spirit Lore
                  </h4>
                  <p className="text-slate-600 font-medium leading-relaxed italic relative z-10">{currentCharacter?.description || "This spirit's origin is shrouded in mystery..."}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider"><iconify-icon icon="solar:star-fall-linear" /> Core Skills</h4>
                    <SkillBar label="Cuteness" value={attrs.cuteness || 0} color="from-pink-400 to-pink-500" icon="solar:heart-angle-linear" />
                    <SkillBar label="Confidence" value={attrs.confidence || 0} color="from-sky-400 to-sky-500" icon="solar:fire-square-linear" />
                    <SkillBar label="Tili Factor" value={attrs.tiliFactor || 0} color="from-yellow-400 to-yellow-500" icon="solar:bolt-linear" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider"><iconify-icon icon="solar:map-point-linear" /> Territory Info</h4>
                    <div className="flex flex-col gap-4">
                      <TerritoryRow label="Luzon" value={attrs.luzon || 0} theme="blue" />
                      <TerritoryRow label="Visayas" value={attrs.visayas || 0} theme="teal" />
                      <TerritoryRow label="Mindanao" value={attrs.mindanao || 0} theme="rose" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t-4 border-slate-100 border-dashed">
                  <h4 className="text-sm font-semibold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider"><iconify-icon icon="solar:t-shirt-linear" class="text-orange-500" /> Visual Traits</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {traits.map((trait) => (
                      <div key={trait.label} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors shadow-sm">
                        <iconify-icon icon={trait.icon} class="text-2xl text-slate-400" />
                        <div className="flex flex-col overflow-hidden text-left">
                          <span className="text-[10px] text-slate-400 uppercase font-black leading-tight">{trait.label}</span>
                          <span className="text-xs text-slate-700 font-bold truncate">{trait.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Badges & Achievements Tab */}
            {activeTab === 'Badges' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">
                      <Medal className="text-indigo-500" /> {showAllAchievements ? 'Achievement Gallery' : 'My Earned Badges'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                      {showAllAchievements ? 'Explore all possible milestones' : 'Milestones reached by your verified wallet data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowAllAchievements(!showAllAchievements)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2",
                        showAllAchievements 
                          ? "bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_0_#3730a3]" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-[0_4px_0_0_#e2e8f0]"
                      )}
                    >
                      {showAllAchievements ? <Grid3X3 size={14} /> : <Trophy size={14} />}
                      {showAllAchievements ? 'Hide Gallery' : 'View Gallery'}
                    </button>
                    {!showAllAchievements && (
                      <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-200 overflow-x-auto max-w-[300px] sm:max-w-none">
                        {(['ranks', 'summons', 'collection', 'tiers', 'social'] as const).map((tab) => (
                          <button 
                            key={tab}
                            onClick={() => setBadgeTab(tab)}
                            className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap", badgeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                          >{tab}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {showAllAchievements ? (
                  <div className="space-y-10">
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                        <iconify-icon icon="solar:star-fall-bold" class="text-yellow-500" /> On-Chain Ranks (Locked to NFTs)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {RANK_DATA.map((rank) => (
                          <BadgeCard 
                            key={rank.title}
                            item={rank}
                            isUnlocked={ownedRankTitles.has(rank.title)}
                            showRequirement
                            onClick={() => setSelectedBadge({ ...rank, isUnlocked: ownedRankTitles.has(rank.title), type: 'rank' })}
                          />
                        ))}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                        <iconify-icon icon="solar:magic-stick-3-bold" class="text-indigo-500" /> Feats & Milestones
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[...ACHIEVEMENT_DATA.summons, ...ACHIEVEMENT_DATA.collection, ...ACHIEVEMENT_DATA.tiers, ...ACHIEVEMENT_DATA.streaks, ...ACHIEVEMENT_DATA.social].map((ach) => {
                          const unlocked = isUnlocked(ach);
                          return (
                            <BadgeCard 
                              key={ach.id}
                              item={ach}
                              isUnlocked={unlocked}
                              showRequirement
                              onClick={() => setSelectedBadge({ ...ach, isUnlocked: unlocked, type: 'feat' })}
                            />
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <>
                    {badgeTab === 'ranks' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {RANK_DATA.filter(r => ownedRankTitles.has(r.title)).length === 0 ? (
                          <EmptyBadges msg="No Ranks Found in Wallet" sub="Summon your first spirit to unlock rank badges!" />
                        ) : (
                          RANK_DATA.filter(r => ownedRankTitles.has(r.title)).map((rank) => (
                            <BadgeCard 
                              key={rank.title}
                              item={rank}
                              isUnlocked={true}
                              onClick={() => setSelectedBadge({ ...rank, isUnlocked: true, type: 'rank' })}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {(['summons', 'collection', 'tiers', 'social'] as const).includes(badgeTab as any) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {ACHIEVEMENT_DATA[badgeTab as keyof typeof ACHIEVEMENT_DATA].filter(a => isUnlocked(a)).length === 0 ? (
                          <EmptyBadges msg={`No ${badgeTab} Badges Earned`} sub="Keep playing to unlock these milestones!" />
                        ) : (
                          ACHIEVEMENT_DATA[badgeTab as keyof typeof ACHIEVEMENT_DATA].filter(a => isUnlocked(a)).map((ach) => (
                            <BadgeCard 
                              key={ach.id}
                              item={ach}
                              isUnlocked={true}
                              onClick={() => setSelectedBadge({ ...ach, isUnlocked: true, type: 'feat' })}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Collection Tab */}
            {activeTab === 'Collections' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl tracking-tight font-semibold text-slate-800 mb-6 flex items-center gap-2"><Grid3X3 className="text-pink-500" /> My Collection ({characters.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {characters.map((c, i) => (
                    <div key={c.objectId} onClick={() => { setIndex(i); setActiveTab('Stats'); }} className={cn("group bg-slate-50 border-4 rounded-3xl p-2 cursor-pointer transition-all hover:scale-105", index === i ? "border-sky-400 bg-sky-50" : "border-slate-100 hover:border-slate-200")}>
                      <div className="aspect-square relative rounded-2xl overflow-hidden bg-white border-2 border-slate-100 mb-2">
                        <Image src={c.imageUrl} alt={c.name} fill className="object-contain p-2" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold truncate text-slate-700 uppercase px-1">{c.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">MMR: {c.mmr}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'Orders' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <OrdersPanel account={account} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Badge Detail Dialog */}
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
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EmptyBadges({ msg, sub }: { msg: string, sub: string }) {
  return (
    <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100">
      <Sparkles className="mx-auto mb-4 text-slate-200" size={48} />
      <p className="font-black uppercase text-slate-400 tracking-widest text-sm">{msg}</p>
      <p className="text-xs font-bold text-slate-300 mt-1">{sub}</p>
    </div>
  );
}

function BadgeCard({ item, isUnlocked, isCurrent, showRequirement, onClick }: { item: any, isUnlocked: boolean, isCurrent?: boolean, showRequirement?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "kpg-badge-card relative p-0 overflow-visible cursor-pointer select-none transition-all duration-300",
        !isUnlocked && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className={cn(
        "kpg-card-inner p-5 border-2 rounded-[2rem] flex flex-col items-center gap-3 relative overflow-hidden",
        isCurrent ? "bg-white border-transparent shadow-xl" : isUnlocked ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 border-dashed border-slate-200"
      )}>
        {isCurrent && (
          <>
            <div className="absolute inset-[-2px] rounded-[2rem] bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 kpg-conic-spin z-[-1]" />
            <div className="absolute inset-[-10px] rounded-[3rem] opacity-20 blur-xl z-[-2]" style={{ backgroundColor: item.color }} />
          </>
        )}

        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
            isUnlocked ? "bg-white shadow-md" : "bg-slate-200 border-slate-300"
          )} style={isUnlocked ? { borderColor: `${item.color}44` } : {}}>
            <iconify-icon 
              icon={item.icon} 
              style={isUnlocked ? { color: item.color, fontSize: '28px', filter: `drop-shadow(0 0 8px ${item.color}66)` } : { color: '#94a3b8', fontSize: '24px' }} 
            />
          </div>
          {isCurrent && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm uppercase">Now</div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className={cn("text-[10px] font-black uppercase tracking-tighter truncate w-24", isUnlocked ? "text-slate-800" : "text-slate-400")}>
            {item.title}
          </p>
          <div className={cn(
            "text-[8px] font-bold px-2 py-0.5 rounded-full border inline-block",
            isUnlocked ? "bg-slate-50 text-slate-500 border-slate-100" : "bg-slate-100 text-slate-400 border-slate-200"
          )}>
            {showRequirement || !isUnlocked 
              ? (item.mmr !== undefined ? `${item.mmr} MMR` : (item.requiredMmr !== undefined ? `${item.requiredMmr} MMR` : (item.requiredDays !== undefined ? `${item.requiredDays} Days` : `${item.requiredCount} ${item.category === 'Collection' ? 'NFTs' : (item.category === 'Streak' ? 'Days' : 'Pulls')}`))) 
              : (item.rarity || 'Unlocked')}
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeDetailModal({ badge, isOpen, onClose }: { badge: any, isOpen: boolean, onClose: () => void }) {
  const reqText = badge.mmr !== undefined ? `${badge.mmr} MMR` : (badge.requiredMmr !== undefined ? `${badge.requiredMmr} MMR` : (badge.requiredDays !== undefined ? `${badge.requiredDays} Consecutive Days` : `${badge.requiredCount} ${badge.category === 'Collection' ? 'Owned NFTs' : 'Summons'}`));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>{badge.title}</DialogTitle>
          <DialogDescription>{badge.desc}</DialogDescription>
        </DialogHeader>
        
        <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-50">
          <div className="p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: badge.gradient }} />
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-[-10px] rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: badge.color }} />
                <div className="w-24 h-24 rounded-full bg-white border-4 flex items-center justify-center shadow-xl" style={{ borderColor: `${badge.color}22` }}>
                  <iconify-icon icon={badge.icon} style={{ fontSize: '48px', color: badge.color, filter: `drop-shadow(0 4px 12px ${badge.color}44)` }} />
                </div>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block">
                  {badge.tier || badge.category} Milestone
                </span>
                <h2 className={cn("text-3xl font-headline tracking-tight", badge.fx === 'fx-aurora' ? 'kpg-fx-aurora' : '')} style={badge.fx !== 'fx-aurora' ? { color: badge.color } : {}}>
                  {badge.title}
                </h2>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed mb-8 px-4">
                {badge.desc || `Unlocked by your verified on-chain activity.`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <div className="px-4 py-1.5 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                  {badge.isUnlocked ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-slate-300" />}
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    {badge.isUnlocked ? 'Unlocked' : `Requires ${reqText}`}
                  </span>
                </div>
                {badge.rarity && (
                  <div className="px-4 py-1.5 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center gap-2">
                    <iconify-icon icon="solar:users-group-rounded-linear" class="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-600 uppercase">{badge.rarity} Tier</span>
                  </div>
                )}
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-sm kpg-shimmer-btn shadow-lg transition-transform active:scale-95"
                style={{ background: badge.gradient }}
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

function StatCard({ label, value, icon, theme }: { label: string, value: string | number, icon: string, theme: string }) {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-100 shadow-[0_6px_0_0_rgba(254,240,138,1)] bg-yellow-100 text-yellow-500 border-yellow-200',
    orange: 'border-orange-100 shadow-[0_6px_0_0_rgba(255,237,213,1)] bg-orange-100 text-orange-500 border-orange-200',
    purple: 'border-purple-100 shadow-[0_6px_0_0_rgba(243,232,255,1)] bg-purple-100 text-purple-500 border-purple-200',
    pink: 'border-pink-100 shadow-[0_6px_0_0_rgba(252,231,243,1)] bg-pink-100 text-pink-500 border-pink-200',
  };
  const c = colors[theme].split(' ');
  return (
    <div className={cn("bg-white rounded-3xl p-4 border-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform", c.slice(0,2).join(' '))}>
      <div className={cn("w-12 aspect-square rounded-2xl flex items-center justify-center mb-2 border-2", c.slice(2).join(' '))}>
        <iconify-icon icon={icon} class="text-2xl" />
      </div>
      <span className="text-xs text-slate-500 font-semibold mb-1 uppercase">{label}</span>
      <span className="text-xl tracking-tight font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function ProfileBadge({ label, icon, theme }: { label: string, icon: string, theme: string }) {
  const themes: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <span className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border-2 flex items-center gap-1 shadow-sm", themes[theme])}>
      <iconify-icon icon={icon} /> {label}
    </span>
  );
}

function SkillBar({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) {
  return (
    <div className="text-left">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span className="text-slate-700 flex items-center gap-1.5">
          <iconify-icon icon={icon} class={cn("text-lg", color.split(' ')[1])} /> {label}
        </span>
        <span className={cn("px-3 py-1 rounded-xl text-xs border-2", color.split(' ')[1].replace('text-', 'bg-').replace('500', '100'), color.split(' ')[1].replace('text-', 'text-').replace('500', '600'), color.split(' ')[1].replace('text-', 'border-').replace('500', '200'))}>
          {value}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-6 border-2 border-slate-200 p-1 shadow-inner overflow-hidden">
        <div className={cn("bg-gradient-to-r h-full rounded-full relative shadow-sm transition-all duration-1000", color)} style={{ width: `${value}%` }}>
          <div className="absolute inset-0 bg-white/30 w-full transform -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

function TerritoryRow({ label, value, theme }: { label: string, value: number, theme: 'blue' | 'teal' | 'rose' }) {
  const themes = {
    blue: 'bg-blue-50 border-blue-100 shadow-[0_4px_0_0_rgba(219,234,254,1)] icon-bg:bg-blue-200 icon:text-blue-600 icon-border:border-blue-300 text:text-blue-800 badge:text-blue-600 badge-border:border-blue-200',
    teal: 'bg-teal-50 border-teal-100 shadow-[0_4px_0_0_rgba(204,251,241,1)] icon-bg:bg-teal-200 icon:text-teal-600 icon-border:border-teal-300 text:text-teal-800 badge:text-teal-600 badge-border:border-teal-200',
    rose: 'bg-rose-50 border-rose-100 shadow-[0_4px_0_0_rgba(255,228,230,1)] icon-bg:bg-rose-200 icon:text-rose-600 icon-border:border-rose-300 text:text-rose-800 badge:text-rose-600 badge-border:border-rose-200',
  };
  const c = themes[theme].split(' ').reduce((acc, curr) => {
    const [k, v] = curr.split(':');
    if (v) acc[k] = v;
    else acc['base'] = (acc['base'] || '') + ' ' + curr;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className={cn("border-4 p-4 rounded-3xl flex items-center justify-between transition-all hover:translate-x-1", c['base'])}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 aspect-square rounded-full flex items-center justify-center border-2", c['icon-bg'], c['icon-border'])}>
          <iconify-icon icon={label === 'Visayas' ? "solar:flag-2-linear" : "solar:flag-linear"} class={c['icon']} />
        </div>
        <span className={cn("font-semibold text-lg", c['text'])}>{label}</span>
      </div>
      <span className={cn("bg-white px-4 py-1.5 rounded-xl text-base font-semibold border-2 shadow-sm", c['badge'], c['badge-border'])}>
        {value}%
      </span>
    </div>
  );
}
