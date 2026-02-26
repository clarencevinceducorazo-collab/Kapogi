'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Wallet, 
  LayoutDashboard, 
  Grid3X3, 
  Package, 
  ChevronRight
} from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils';
import { OrdersPanel } from './orders-panel';

interface MainProfileV2Props {
  characters: any[];
  account: any;
  index: number;
  setIndex: (i: number) => void;
  summonsCount: number;
  bestMmrNum: number;
  avgMmrNum: number;
  topLineages: string[];
  activeTab: 'Stats' | 'Collections' | 'Orders';
  setActiveTab: (tab: 'Stats' | 'Collections' | 'Orders') => void;
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
  
  const currentCharacter = characters[index];
  const attrs = currentCharacter?.attributes ?? {};
  
  const shortAddr = account?.address ? formatAddress(account.address) : '0x...';

  // Navigation Items
  const navItems = [
    { id: 'Stats', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-sky-50 text-sky-600 border-sky-200 shadow-[0_4px_0_0_rgba(186,230,253,1)]' },
    { id: 'Collections', label: 'Collections', icon: Grid3X3, color: 'bg-pink-50 text-pink-600 border-pink-200 shadow-[0_4px_0_0_rgba(251,207,232,1)]' },
    { id: 'Orders', label: 'Orders', icon: Package, color: 'bg-amber-50 text-amber-600 border-amber-200 shadow-[0_4px_0_0_rgba(253,230,138,1)]' },
  ];

  // Traits for Visual Traits section
  const traits = [
    {
      label: "Style",
      value: attrs.clothingStyle,
      icon: "solar:t-shirt-linear",
    },
    {
      label: "Hair",
      value: attrs.hairAmount
        ? `${attrs.hairAmount}% Fluff`
        : null,
      icon: "solar:user-hand-up-linear",
    },
    {
      label: "Face",
      value: attrs.facialHair
        ? `${attrs.facialHair}% Stubble`
        : null,
      icon: "solar:emoji-funny-circle-linear",
    },
    {
      label: "Eyewear",
      value: (attrs.eyewear ?? 0) > 50 ? "Yes" : "None",
      icon: "solar:glasses-linear",
    },
    {
      label: "Held",
      value: attrs.heldItem,
      icon: "solar:cup-linear",
    },
  ].filter((t) => t.value);

  return (
    <div className="w-full max-w-6xl mx-auto font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Panel: Profile Identity & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active Avatar Card */}
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

              {/* Active Avatar Image */}
              <div className="bg-gradient-to-br from-sky-100 to-indigo-50 rounded-[2rem] aspect-square flex items-center justify-center border-4 border-sky-200 mb-2 shadow-inner relative overflow-hidden">
                {currentCharacter?.imageUrl ? (
                  <Image 
                    src={currentCharacter.imageUrl} 
                    alt={currentCharacter.name} 
                    fill
                    className="object-contain p-4 hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <iconify-icon icon="solar:ghost-smile-linear" class="text-8xl text-sky-400 drop-shadow-md" />
                )}
              </div>
            </div>
          </div>

          {/* Profile Action Buttons */}
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
                  <span className="flex items-center gap-3">
                    <item.icon size={20} /> {item.label}
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Player Hub & Dynamic Views */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Account-Level Stats Row */}
          <div>
            <h3 className="text-lg tracking-wide font-semibold text-slate-600 mb-3 px-2 flex items-center gap-2 uppercase">
              <iconify-icon icon="solar:gamepad-linear" class="text-indigo-500" /> Player Hub
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                label="Best MMR" 
                value={bestMmrNum.toLocaleString()} 
                icon="solar:medal-star-circle-linear" 
                theme="yellow" 
              />
              <StatCard 
                label="Avg MMR" 
                value={avgMmrNum.toLocaleString()} 
                icon="solar:chart-square-linear" 
                theme="orange" 
              />
              <StatCard 
                label="Summons" 
                value={summonsCount} 
                icon="solar:magic-stick-3-linear" 
                theme="purple" 
              />
              <StatCard 
                label="Lineage" 
                value={topLineages[0] || 'Ancient'} 
                icon="solar:crown-linear" 
                theme="pink" 
              />
            </div>
          </div>

          {/* Dynamic Content Based on Tabs */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-4 border-slate-100 shadow-[0_12px_0_0_rgba(226,232,240,1)] flex-grow">
            
            {activeTab === 'Stats' && (
              <div className="animate-in fade-in duration-500 space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-4 border-slate-100 border-dashed">
                  <div>
                    <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">
                      Current Loadout
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge label={`Rank: ${attrs.rank || 'Spirit Seed'}`} icon="solar:stars-linear" theme="indigo" />
                      <Badge label={`Lineage: ${attrs.lineage || 'Unknown'}`} icon="solar:crown-linear" theme="emerald" />
                      <Badge label={`Style: ${attrs.clothingStyle || 'Classic'}`} icon="solar:glasses-linear" theme="rose" />
                    </div>
                  </div>
                  <div className="bg-yellow-100 border-4 border-yellow-300 px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-[0_6px_0_0_rgba(253,224,71,1)]">
                    <div className="bg-white w-12 aspect-square rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-sm">
                      <iconify-icon icon="solar:cup-star-linear" class="text-3xl text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wider mb-1">Global MMR</p>
                      <p className="text-3xl font-semibold text-yellow-800 tracking-tight leading-none">
                        {(currentCharacter?.mmr ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                      <iconify-icon icon="solar:star-fall-linear" /> Core Skills
                    </h4>
                    <SkillBar label="Cuteness" value={attrs.cuteness || 0} color="from-pink-400 to-pink-500" icon="solar:heart-angle-linear" />
                    <SkillBar label="Confidence" value={attrs.confidence || 0} color="from-sky-400 to-sky-500" icon="solar:fire-square-linear" />
                    <SkillBar label="Telli Factor" value={attrs.tiliFactor || 0} color="from-yellow-400 to-yellow-500" icon="solar:bolt-linear" />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <iconify-icon icon="solar:map-point-linear" /> Territory Info
                    </h4>
                    <div className="flex flex-col gap-4">
                      <TerritoryRow label="Luzon" value={attrs.luzon || 0} theme="blue" />
                      <TerritoryRow label="Visayas" value={attrs.visayas || 0} theme="teal" />
                      <TerritoryRow label="Mindanao" value={attrs.mindanao || 0} theme="rose" />
                    </div>
                  </div>
                </div>

                {/* Visual Traits Section */}
                <div className="pt-6 border-t-4 border-slate-100 border-dashed">
                  <h4 className="text-sm font-semibold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <iconify-icon icon="solar:t-shirt-linear" class="text-orange-500" /> Visual Traits
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {traits.map((trait) => (
                      <div
                        key={trait.label}
                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        <iconify-icon
                          icon={trait.icon}
                          class="text-2xl text-slate-400"
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] text-slate-400 uppercase font-black leading-tight">
                            {trait.label}
                          </span>
                          <span className="text-xs text-slate-700 font-bold truncate">
                            {trait.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Collections' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl tracking-tight font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <Grid3X3 className="text-pink-500" /> My Collection ({characters.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {characters.map((c, i) => (
                    <div 
                      key={c.objectId}
                      onClick={() => { setIndex(i); setActiveTab('Stats'); }}
                      className={cn(
                        "group bg-slate-50 border-4 rounded-3xl p-2 cursor-pointer transition-all hover:scale-105",
                        index === i ? "border-sky-400 bg-sky-50" : "border-slate-100 hover:border-slate-200"
                      )}
                    >
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

            {activeTab === 'Orders' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <OrdersPanel account={account} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, theme }: { label: string, value: string | number, icon: string, theme: string }) {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-100 shadow-[0_6px_0_0_rgba(254,240,138,1)] bg-yellow-100 text-yellow-500 border-yellow-200',
    orange: 'border-orange-100 shadow-[0_6px_0_0_rgba(255,237,213,1)] bg-orange-100 text-orange-500 border-orange-200',
    purple: 'border-purple-100 shadow-[0_6px_0_0_rgba(243,232,255,1)] bg-purple-100 text-purple-500 border-purple-200',
    pink: 'border-pink-100 shadow-[0_6px_0_0_rgba(252,231,243,1)] bg-pink-100 text-pink-500 border-pink-200',
  };

  return (
    <div className={cn("bg-white rounded-3xl p-4 border-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform", colors[theme].split(' ').slice(0,2).join(' '))}>
      <div className={cn("w-12 aspect-square rounded-2xl flex items-center justify-center mb-2 border-2", colors[theme].split(' ').slice(2).join(' '))}>
        <iconify-icon icon={icon} class="text-2xl" />
      </div>
      <span className="text-xs text-slate-500 font-semibold mb-1 uppercase">{label}</span>
      <span className="text-xl tracking-tight font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Badge({ label, icon, theme }: { label: string, icon: string, theme: string }) {
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
    <div>
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span className="text-slate-700 flex items-center gap-1.5">
          <iconify-icon icon={icon} class={cn("text-lg", color.split(' ')[1])} /> {label}
        </span>
        <span className={cn("px-3 py-1 rounded-xl text-xs border-2", color.split(' ')[1].replace('text-', 'bg-').replace('500', '100'), color.split(' ')[1].replace('text-', 'text-').replace('500', '600'), color.split(' ')[1].replace('text-', 'border-').replace('500', '200'))}>
          {value}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-6 border-2 border-slate-200 p-1 shadow-inner overflow-hidden">
        <div 
          className={cn("bg-gradient-to-r h-full rounded-full relative shadow-sm transition-all duration-1000", color)}
          style={{ width: `${value}%` }}
        >
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
  
  const colors = themes[theme].split(' ').reduce((acc, curr) => {
    const [key, val] = curr.split(':');
    if (val) acc[key] = val;
    else acc['base'] = (acc['base'] || '') + ' ' + curr;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className={cn("border-4 p-4 rounded-3xl flex items-center justify-between transition-all hover:translate-x-1", colors['base'])}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 aspect-square rounded-full flex items-center justify-center border-2", colors['icon-bg'], colors['icon-border'])}>
          <iconify-icon icon={label === 'Visayas' ? "solar:flag-2-linear" : "solar:flag-linear"} class={colors['icon']} />
        </div>
        <span className={cn("font-semibold text-lg", colors['text'])}>{label}</span>
      </div>
      <span className={cn("bg-white px-4 py-1.5 rounded-xl text-base font-semibold border-2 shadow-sm", colors['badge'], colors['badge-border'])}>
        {value}%
      </span>
    </div>
  );
}
