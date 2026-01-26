'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Sparkles,
  Ghost,
  Shirt,
  Coffee,
  MousePointer2,
  ArrowRight,
  Truck,
  Utensils,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function GeneratorPage() {
  const [page, setPage] = useState('generator');

  const navigate = (targetId: string) => {
    setPage(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="generate-page min-h-screen p-4 md:p-8 flex items-center justify-center text-lg text-black antialiased">
      <main className="relative w-full max-w-4xl bg-white border-4 border-black rounded-3xl hard-shadow overflow-hidden flex flex-col">
        <header className="bg-black text-white p-4 border-b-4 border-black flex justify-between items-center">
          <div className="w-1/3">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors">
                <ArrowLeft className="w-6 h-6" />
                <span className="font-display font-semibold tracking-tight text-lg hidden md:inline">Home</span>
            </Link>
          </div>
          <div className="w-1/3 flex justify-center items-center gap-2">
            <Package className="w-6 h-6 text-yellow-400" />
            <span className="font-display font-semibold tracking-tight text-xl text-yellow-400">KAPOGIAN WORLD</span>
          </div>
          <div className="w-1/3 flex justify-end gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
        </header>

        <div className="p-0 bg-stone-50 min-h-[600px] relative">
          <section id="page-generator" className={cn('page-section p-6 md:p-8 flex flex-col gap-8 h-full', { 'hidden': page !== 'generator' })}>
            <div className="text-center space-y-2">
                <h1 className="font-display text-4xl font-semibold tracking-tight uppercase">Kapogian Image Generator</h1>
                <p className="text-xl text-stone-600 font-medium max-w-lg mx-auto">Generate a unique character image and its corresponding lore for your collection.</p>
            </div>

            <div className="border-4 border-black rounded-2xl bg-white hard-shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
                <div className="absolute top-2 right-2 rotate-12 bg-yellow-400 text-black text-xs font-bold px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_#000]">NEW!</div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-display font-semibold text-xl uppercase">Character Name</label>
                        <input type="text" placeholder="Leave blank for random..." className="w-full border-4 border-black rounded-lg p-3 text-lg font-medium outline-none focus:ring-4 ring-yellow-300 transition-all placeholder:text-stone-400" />
                    </div>

                    <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                        <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">Enchantments</h3>
                        
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Cuteness</span><span>85</span></div>
                            <input type="range" min="0" max="100" defaultValue="85" className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Confidence</span><span>40</span></div>
                            <input type="range" min="0" max="100" defaultValue="40" className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Tili Factor</span><span>92</span></div>
                            <input type="range" min="0" max="100" defaultValue="92" className="w-full" />
                        </div>
                    </div>

                     <div className="space-y-4 p-4 border-4 border-stone-200 border-dashed rounded-xl bg-stone-50">
                        <h3 className="font-display font-semibold text-lg text-stone-500 uppercase">Origin Stats</h3>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Luzon</span></div>
                            <input type="range" min="0" max="100" defaultValue="60" className="w-full" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-sm"><span>Visayas</span></div>
                            <input type="range" min="0" max="100" defaultValue="20" className="w-full" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border-4 border-black bg-blue-50 rounded-xl p-5 space-y-4 relative">
                        <div className="absolute -top-4 left-4 bg-black text-white px-3 py-1 font-display font-semibold text-sm border-2 border-white rounded-full">PORMA CONTROLS</div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Clothing Style</label>
                                <select className="w-full border-2 border-black rounded-lg p-2 bg-white font-medium"><option>Streetwear</option><option>Traditional</option><option>Sci-Fi</option></select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Hair Color</label>
                                <select className="w-full border-2 border-black rounded-lg p-2 bg-white font-medium"><option>Neon Pink</option><option>Black</option><option>Blue</option></select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Eyewear</label>
                                <select className="w-full border-2 border-black rounded-lg p-2 bg-white font-medium"><option>None</option><option>Shades</option><option>Monocle</option></select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Skin Tone</label>
                                <select className="w-full border-2 border-black rounded-lg p-2 bg-white font-medium"><option>Morena</option><option>Fair</option><option>Dark</option></select>
                            </div>
                        </div>
                        
                        <div className="space-y-1 pt-2">
                            <label className="text-sm font-semibold">Held Item (Food/Flower)</label>
                            <div className="relative">
                                <Utensils className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                                <input type="text" placeholder="e.g. Mango" className="w-full border-2 border-black rounded-lg p-2 pl-10 bg-white font-medium" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button onClick={() => navigate('page-preview')} className="w-full bg-green-400 text-black border-4 border-black rounded-xl py-4 px-6 text-2xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-3">
                            <Sparkles className="w-6 h-6" />
                            Generate Character
                        </button>
                    </div>
                </div>
            </div>
          </section>

          <section id="page-preview" className={cn('page-section flex flex-col h-full', { 'hidden': page !== 'page-preview' })}>
                
                <div className="flex flex-col md:flex-row border-b-4 border-black">
                    <div className="w-full md:w-1/2 p-8 bg-stone-100 flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black min-h-[300px]">
                        <Image src="/images/KPG.png" alt="Kapogian Character" width={256} height={256} className="rounded-full border-4 border-black hard-shadow" />
                    </div>
                    <div className="w-full md:w-1/2 p-8 bg-white flex flex-col">
                        <div className="mb-4">
                            <h2 className="font-display text-2xl font-semibold tracking-tight uppercase border-b-4 border-yellow-300 inline-block">Character Lore</h2>
                        </div>
                        <div className="flex-grow bg-stone-50 border-2 border-stone-200 rounded-lg p-4 font-medium text-stone-500 italic">
                            "Lore will appear here. The backstory is generated based on your stats..."
                        </div>
                    </div>
                </div>

                <div className="stripe-bg p-6 md:p-8 flex-grow flex flex-col justify-center relative border-t-4 border-black">
                    <div className="flex justify-between items-end mb-6 relative z-10">
                        <div>
                            <h2 className="font-display text-4xl font-semibold text-white tracking-tight drop-shadow-[4px_4px_0_#000]" style={{WebkitTextStroke: '1.5px black'}}>THE STYLIST SHOP</h2>
                            <div className="bg-white border-2 border-black px-2 py-0.5 rounded text-xs font-bold inline-block mt-1 uppercase tracking-wide shadow-[2px_2px_0px_rgba(0,0,0,1)]">Holders Only Access</div>
                        </div>
                        <span className="font-display font-semibold text-white text-lg drop-shadow-md">FALL COLLECTION</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <Shirt className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Tee</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <Coffee className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Mug</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <MousePointer2 className="w-10 h-10 text-stone-800" />
                            </div>
                            <span className="font-display font-semibold uppercase">Pad</span>
                        </button>
                        <button className="group bg-white border-4 border-black rounded-xl p-4 flex flex-col items-center gap-3 hard-shadow-sm hard-shadow-hover transition-all">
                            <div className="w-full aspect-square bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <div className="w-10 h-10 rounded-full border-2 border-stone-800"></div>
                            </div>
                            <span className="font-display font-semibold uppercase">Plate</span>
                        </button>
                    </div>

                    <div className="bg-yellow-400 border-4 border-black rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hard-shadow-sm relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-white border-4 border-black rounded-md"></div>
                            <div className="flex flex-col">
                                <span className="font-display font-semibold text-xl uppercase leading-none">The "All-In" Bundle</span>
                                <span className="text-sm font-medium leading-tight">Save 20% when you grab the whole set.</span>
                            </div>
                        </div>
                        <button className="bg-black text-white font-display font-semibold px-6 py-3 rounded-lg border-2 border-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform uppercase text-base">
                            Upgrade (+10 SUI)
                        </button>
                    </div>
                    
                    <div className="absolute -bottom-4 -right-4 z-20">
                         <button onClick={() => navigate('page-shipping')} className="bg-pink-500 text-white border-4 border-black rounded-full w-20 h-20 flex items-center justify-center hard-shadow hover:rotate-12 transition-transform">
                            <ArrowRight className="w-10 h-10 stroke-[2.5]" />
                        </button>
                    </div>
                </div>
            </section>

             <section id="page-shipping" className={cn('page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-sky-100', { 'hidden': page !== 'page-shipping' })}>
                <div className="w-full max-w-md bg-white border-4 border-black rounded-2xl p-8 hard-shadow-sm relative">
                    <div className="absolute -top-6 -left-6 bg-red-500 text-white font-display font-semibold px-4 py-2 rotate-[-6deg] border-4 border-black rounded-lg shadow-md uppercase">Fragile!</div>

                    <h2 className="font-display text-3xl font-semibold mb-6 border-b-4 border-stone-200 pb-2">Shipping Details</h2>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Full Name</label>
                            <input type="text" className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Contact Number</label>
                            <input type="text" className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-semibold uppercase text-sm tracking-wide">Full Address</label>
                            <textarea rows={3} className="w-full border-4 border-black rounded-xl p-3 bg-stone-50 text-xl font-medium focus:bg-white focus:ring-4 ring-sky-200 outline-none transition-all resize-none"></textarea>
                        </div>
                    </div>

                    <button onClick={() => navigate('page-receipt')} className="mt-8 w-full bg-blue-500 text-white border-4 border-black rounded-xl py-3 text-xl font-display font-semibold uppercase tracking-tight hard-shadow-sm hard-shadow-hover transition-all flex items-center justify-center gap-2">
                        <Truck className="w-6 h-6" />
                        Ship It
                    </button>
                </div>
            </section>

             <section id="page-receipt" className={cn('page-section p-8 flex flex-col items-center justify-center h-full min-h-[600px] bg-green-200', { 'hidden': page !== 'page-receipt' })}>
                <div className="w-full max-w-sm bg-white border-x-4 border-t-4 border-b-[12px] border-dotted border-black rounded-t-xl relative p-6 shadow-2xl">
                    
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-200 rounded-full border-4 border-black"></div>

                    <div className="text-center mb-6 border-b-2 border-dashed border-stone-300 pb-4">
                        <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">Order Receipt</h2>
                        <p className="text-stone-500 font-medium text-sm mt-1">Order #KAP-8821</p>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 bg-stone-100 border-2 border-black rounded-md shrink-0"></div>
                        <div className="flex flex-col justify-center">
                            <span className="font-semibold text-lg">Kapogian #442</span>
                            <span className="text-sm text-stone-500">Includes Digital Asset</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6 text-base font-medium">
                        <div className="flex justify-between">
                            <span className="text-stone-600">Merch Bundle</span>
                            <span>Included</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-600">Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t-2 border-black">
                            <span>Total</span>
                            <span>10 SUI</span>
                        </div>
                    </div>

                    <div className="bg-stone-100 border-2 border-stone-300 p-2 text-center rounded mb-6">
                        <span className="text-xs font-bold uppercase text-stone-500 tracking-widest">Status: Pending</span>
                    </div>

                    <button onClick={() => navigate('page-generator')} className="w-full bg-white text-black border-4 border-black rounded-xl py-3 text-lg font-display font-semibold uppercase tracking-tight hover:bg-stone-100 transition-all">
                        Make Another
                    </button>

                    <div className="absolute bottom-20 right-4 border-4 border-red-500 text-red-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl uppercase rotate-[-20deg] opacity-80 pointer-events-none" style={{mixBlendMode: 'multiply'}}>
                        PAID
                    </div>
                </div>
            </section>
        </div>
      </main>
    </div>
  );
}
