
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { cn } from "@/lib/utils";

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

interface Product {
  id: string;
  type: "shirt" | "hoodie" | "mug" | "mousepad";
  name: string;
  price: number;
  colorClass: string;
  icon: string;
  iconColor: string;
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "s1",
    type: "shirt",
    name: "KAPO Classic Tee",
    price: 0.42,
    colorClass: "bg-gradient-to-br from-cyan-100 to-blue-100",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-cyan-500",
    badge: "✨ NEW",
  },
  {
    id: "s2",
    type: "shirt",
    name: "Biringan Battle Shirt",
    price: 0.48,
    colorClass: "bg-gradient-to-br from-indigo-100 to-purple-100",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-indigo-500",
    badge: "⚔️ LIMITED",
  },
  {
    id: "h1",
    type: "hoodie",
    name: "KAPO Cozy Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-pink-100 to-rose-100",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-pink-500",
    badge: "🔥 HOT",
  },
  {
    id: "h2",
    type: "hoodie",
    name: "$POGI Pullover",
    price: 0.9,
    colorClass: "bg-gradient-to-br from-yellow-100 to-amber-100",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-amber-500",
    badge: "💰 $POGI",
  },
  {
    id: "m1",
    type: "mug",
    name: "KAPO Morning Mug",
    price: 0.22,
    colorClass: "bg-gradient-to-br from-emerald-100 to-teal-100",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-emerald-500",
  },
  {
    id: "m2",
    type: "mug",
    name: "Biringan War Mug",
    price: 0.25,
    colorClass: "bg-gradient-to-br from-slate-100 to-zinc-100",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-slate-500",
    badge: "🛡️ EPIC",
  },
  {
    id: "p1",
    type: "mousepad",
    name: "KAPO XL Desk Mat",
    price: 0.35,
    colorClass: "bg-gradient-to-br from-violet-100 to-fuchsia-100",
    icon: "solar:mouse-bold-duotone",
    iconColor: "text-violet-500",
    badge: "🖱️ XL SIZE",
  },
  {
    id: "p2",
    type: "mousepad",
    name: "Biringan Battle Mat",
    price: 0.38,
    colorClass: "bg-gradient-to-br from-orange-100 to-red-100",
    icon: "solar:mouse-bold-duotone",
    iconColor: "text-orange-500",
    badge: "⚔️ BATTLE",
  },
];

const PRINT_OPTIONS = [
  { id: "none", label: "No Print", icon: "solar:forbidden-circle-bold-duotone", color: "text-slate-300" },
  { id: "kapo-logo", label: "KAPO Logo", icon: "solar:shield-star-bold-duotone", color: "text-cyan-400" },
  { id: "chibi", label: "Chibi Kapo", icon: "solar:user-rounded-bold-duotone", color: "text-purple-400" },
  { id: "biringan", label: "Biringan", icon: "solar:castle-bold-duotone", color: "text-indigo-400" },
  { id: "pogi-coin", label: "$POGI Coin", icon: "solar:dollar-minimalistic-bold-duotone", color: "text-yellow-400" },
  { id: "battle", label: "Battle Art", icon: "solar:swords-bold-duotone", color: "text-pink-400" },
  { id: "farm", label: "Farm Scene", icon: "solar:leaf-bold-duotone", color: "text-emerald-400" },
  { id: "galaxy", label: "Galaxy", icon: "solar:stars-bold-duotone", color: "text-violet-400" },
];

export default function KapogianShopV2() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQty, setCurrentQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPrint, setSelectedPrint] = useState("none");

  const filteredProducts = PRODUCTS.filter(
    (p) => activeFilter === "all" || p.type === activeFilter,
  );

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setCurrentStep(1);
    setCurrentQty(1);
    setSelectedSize("");
    setSelectedPrint("none");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = "";
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const printLabel = PRINT_OPTIONS.find(o => o.id === selectedPrint)?.label || "No Print";

  return (
    <div className="bg-gradient-to-b from-sky-200 via-indigo-50 to-white text-slate-700 min-h-screen overflow-x-hidden selection:bg-pink-300 selection:text-white font-sans">
      <style jsx global>{`
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-15px)} }
        @keyframes float-delayed { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes shine-sweep { 0%{left:-100%} 100%{left:200%} }
        @keyframes blob-pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.1);opacity:0.8} }
        @keyframes pop-in { 0%{transform:scale(0.7) translateY(40px);opacity:0} 70%{transform:scale(1.04) translateY(-4px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,220,248,0.4)} 50%{box-shadow:0 0 0 10px rgba(99,220,248,0)} }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite 1s; }
        .animate-blob { animation: blob-pulse 8s infinite; }
        .animate-pop-in { animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease forwards; }

        .toy-card {
            background: linear-gradient(145deg,#ffffff,#f0f4ff);
            box-shadow: 8px 8px 16px #d1d9e6,-8px -8px 16px #ffffff;
            transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        .toy-card:hover {
            transform: scale(1.04) translateY(-6px);
            box-shadow: 12px 12px 28px #cbd5e1,-12px -12px 24px #ffffff;
        }

        .squishy-btn { transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
        .squishy-btn:active { transform: scale(0.93); }

        .shine-effect { position:relative; overflow:hidden; }
        .shine-effect::after {
            content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
            background:linear-gradient(to right,transparent,rgba(255,255,255,0.6),transparent);
            transform:skewX(-20deg); animation:shine-sweep 3s infinite;
        }

        .size-btn.selected {
            background: linear-gradient(135deg,#67e8f9,#3b82f6);
            color: white;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 4px 12px rgba(59,130,246,0.3);
            animation: glow-pulse 2s infinite;
        }

        .print-btn.selected-print {
            border-color: #67e8f9;
            background: #ecfeff;
            box-shadow: 0 0 0 3px rgba(103,232,249,0.25), 0 4px 12px rgba(103,232,249,0.2);
        }
        .print-btn.selected-print > div:first-child {
            border-color: #67e8f9;
            background: white;
        }
        .print-btn.selected-print span {
            color: #0891b2;
        }

        .step-indicator.active {
            background: linear-gradient(135deg, #67e8f9, #3b82f6);
            color: white;
        }
      `}</style>

      <PageHeader />

      {/* Floating BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: "4s" }}></div>
        <iconify-icon icon="solar:cloud-bold" class="absolute top-20 left-[10%] text-white opacity-40 text-9xl animate-float-delayed"></iconify-icon>
        <iconify-icon icon="solar:cloud-bold" class="absolute top-40 right-[15%] text-white opacity-30 text-8xl animate-float"></iconify-icon>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-8 px-4 text-center">
        <div className="flex justify-center gap-3 mb-5 animate-float">
          <div className="bg-pink-300 text-pink-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-2 border-2 border-white shadow-md">🛍️ MERCH DROP</div>
          <div className="bg-cyan-300 text-cyan-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform rotate(1deg) border-2 border-white shadow-md">💫 LIMITED STOCK</div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none drop-shadow-xl" style={{ textShadow: "2px 2px 0px #3b82f6,-1px -1px 0 #fff" }}>
          KAPO SHOP
        </h1>
        <p className="text-lg font-bold text-slate-500 max-w-xl mx-auto">Official phygital merch for true Kapogian collectors. Pay with <span className="text-cyan-500">SUI</span> only.</p>
      </section>

      {/* Filter Pills */}
      <div className="relative z-10 px-4 mb-10">
        <div className="max-w-6xl mx-auto flex gap-3 flex-wrap justify-center">
          {[
            { id: "all", label: "All Items", icon: "" },
            { id: "shirt", label: "Shirts", icon: "👕" },
            { id: "hoodie", label: "Hoodies", icon: "🧥" },
            { id: "mug", label: "Mugs", icon: "☕" },
            { id: "mousepad", label: "Mouse Pads", icon: "🖱️" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "px-5 py-2 rounded-full font-bold text-sm squishy-btn border-2 transition-all flex items-center gap-2",
                activeFilter === filter.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-100 hover:border-cyan-300",
              )}
            >
              {filter.icon && <span>{filter.icon}</span>} {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <section className="relative z-10 pb-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card toy-card rounded-[2rem] overflow-hidden border-2 border-slate-50 cursor-pointer flex flex-col h-full"
              onClick={() => openModal(product)}
            >
              <div className={cn("relative h-56 flex items-center justify-center overflow-hidden", product.colorClass)}>
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#bae6fd_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 w-28 h-28 bg-white/80 rounded-3xl flex items-center justify-center shadow-lg border-2 border-white">
                  <iconify-icon icon={product.icon} class={cn("text-6xl", product.iconColor)}></iconify-icon>
                </div>
                {product.badge && (
                  <div className="absolute top-3 right-3 bg-yellow-300 text-yellow-900 text-[10px] font-extrabold px-2 py-1 rounded-full border border-white shadow">
                    {product.badge}
                  </div>
                )}
              </div>
              <div className="p-5 bg-white flex-grow flex flex-col">
                <span className="bg-slate-50 text-slate-500 text-xs font-extrabold px-3 py-1 rounded-full w-fit capitalize">
                  {product.type}
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg mt-2 tracking-tight">
                  {product.name}
                </h3>
                <p className="text-slate-400 text-sm font-semibold mb-4">
                  Everyday vibes, Kapogian style
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1">
                    <iconify-icon icon="token-branded:sui" class="text-blue-500 text-xl"></iconify-icon>
                    <span className="font-extrabold text-slate-800 text-lg">{product.price} SUI</span>
                  </div>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors squishy-btn">
                    Purchase
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col md:flex-row overflow-hidden animate-pop-in" style={{ maxHeight: "90vh" }}>
            
            {/* LEFT: Item Preview */}
            <div className={cn("w-full md:w-64 flex-shrink-0 flex flex-col items-center justify-center p-8 relative overflow-hidden", selectedProduct.colorClass)}>
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#bae6fd_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 w-36 h-36 bg-white/90 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white mb-5 animate-float">
                <iconify-icon icon={selectedProduct.icon} class={cn("text-7xl", selectedProduct.iconColor)}></iconify-icon>
              </div>
              <div className="relative z-10 bg-white/80 text-cyan-600 text-xs font-extrabold px-3 py-1 rounded-full mb-2 backdrop-blur-sm border border-white shadow-sm capitalize">
                {selectedProduct.type}
              </div>
              <h2 className="relative z-10 text-lg font-black text-slate-800 tracking-tight text-center leading-tight mb-2">
                {selectedProduct.name}
              </h2>
              <div className="relative z-10 flex items-center gap-1.5">
                <iconify-icon icon="token-branded:sui" class="text-blue-500 text-xl"></iconify-icon>
                <span className="text-xl font-extrabold text-slate-700">{selectedProduct.price} SUI</span>
              </div>
            </div>

            {/* RIGHT: Form Panel */}
            <div className="flex-1 flex flex-col overflow-hidden border-l-2 border-slate-50">
              <div className="px-7 pt-6 pb-4 border-b-2 border-slate-50 flex items-center justify-between flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <div className={cn("step-indicator w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all", currentStep >= 1 ? "active" : "text-slate-400 bg-slate-100")}>1</div>
                  <div className="h-1 w-10 bg-slate-100 rounded-full">
                    <div className={cn("h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500", currentStep >= 2 ? "w-full" : "w-0")}></div>
                  </div>
                  <div className={cn("step-indicator w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all", currentStep >= 2 ? "active" : "text-slate-400 bg-slate-100")}>2</div>
                  <div className="h-1 w-10 bg-slate-100 rounded-full">
                    <div className={cn("h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500", currentStep >= 3 ? "w-full" : "w-0")}></div>
                  </div>
                  <div className={cn("step-indicator w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-all", currentStep >= 3 ? "active" : "text-slate-400 bg-slate-100")}>3</div>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-widest">
                    {currentStep === 1 ? "Details" : currentStep === 2 ? "Shipping" : "Payment"}
                  </span>
                </div>
                <button onClick={closeModal} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors font-bold text-slate-400 text-sm">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* STEP 1: Details */}
                {currentStep === 1 && (
                  <div className="px-7 py-5 space-y-6">
                    {(selectedProduct.type === "shirt" || selectedProduct.type === "hoodie") && (
                      <div className="mb-5">
                        <p className="font-extrabold text-slate-600 mb-2.5 text-xs tracking-widest uppercase">Select Size</p>
                        <div className="flex gap-2 flex-wrap">
                          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={cn(
                                "size-btn px-4 py-2 rounded-full font-extrabold text-sm border-2 transition-all",
                                selectedSize === size
                                  ? "selected"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <p className="font-extrabold text-slate-600 text-xs tracking-widest uppercase">Custom Image Print</p>
                        <span className="bg-pink-100 text-pink-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-pink-200">Optional</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {PRINT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedPrint(opt.id)}
                            className={cn(
                              "print-btn group flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                              selectedPrint === opt.id
                                ? "selected-print"
                                : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50"
                            )}
                          >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-cyan-200 transition-all">
                              <iconify-icon icon={opt.icon} class={cn("text-2xl", opt.color)}></iconify-icon>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-400 text-center leading-tight">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="font-extrabold text-slate-600 mb-2.5 text-xs tracking-widest uppercase">Quantity</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentQty(Math.max(1, currentQty - 1))} className="w-10 h-10 bg-slate-100 rounded-xl font-extrabold text-lg text-slate-600 hover:bg-slate-200 transition-colors squishy-btn flex items-center justify-center">−</button>
                        <span className="text-2xl font-black text-slate-800 w-7 text-center">{currentQty}</span>
                        <button onClick={() => setCurrentQty(Math.min(10, currentQty + 1))} className="w-10 h-10 bg-slate-100 rounded-xl font-extrabold text-lg text-slate-600 hover:bg-slate-200 transition-colors squishy-btn flex items-center justify-center">+</button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={nextStep} className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-extrabold py-3.5 rounded-2xl hover:shadow-lg hover:shadow-cyan-200 hover:-translate-y-0.5 transition-all squishy-btn flex items-center justify-center gap-2 shine-effect text-sm">
                        <iconify-icon icon="solar:rocket-2-bold" width="18"></iconify-icon>
                        Proceed
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Shipping */}
                {currentStep === 2 && (
                  <div className="px-7 py-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-0.5 tracking-tight">Shipping Details</h3>
                      <p className="text-slate-400 font-semibold text-xs mb-5">Where should we send your Kapogian merch?</p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <input type="text" placeholder="Juan dela Cruz" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Province</label>
                          <input type="text" placeholder="e.g. Metro Manila" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">City</label>
                          <input type="text" placeholder="e.g. Quezon City" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Barangay</label>
                        <input type="text" placeholder="e.g. Batasan Hills" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Street Address</label>
                        <input type="text" placeholder="House No., Street, Subdivision" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Contact Number</label>
                        <input type="tel" placeholder="+63 9XX XXX XXXX" className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={prevStep} className="w-11 h-12 bg-slate-100 rounded-2xl font-extrabold text-slate-500 hover:bg-slate-200 transition-colors squishy-btn flex items-center justify-center flex-shrink-0">
                        <iconify-icon icon="solar:arrow-left-bold" width="18"></iconify-icon>
                      </button>
                      <button onClick={nextStep} className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-extrabold py-3.5 rounded-2xl hover:shadow-lg hover:shadow-cyan-200 hover:-translate-y-0.5 transition-all squishy-btn flex items-center justify-center gap-2 shine-effect text-sm uppercase tracking-widest">
                        Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Payment */}
                {currentStep === 3 && (
                  <div className="px-7 py-5 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-0.5 tracking-tight">Confirm & Pay</h3>
                      <p className="text-slate-400 font-semibold text-xs mb-5">Secure your phygital asset on SUI.</p>
                    </div>

                    <div className="bg-sky-50 rounded-3xl p-5 border-2 border-sky-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Order Summary</p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                          <iconify-icon icon={selectedProduct.icon} class={cn("text-2xl", selectedProduct.iconColor)}></iconify-icon>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-800 text-sm truncate">{selectedProduct.name}</p>
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">
                            Qty: {currentQty} {selectedSize && `· Size: ${selectedSize}`}
                          </p>
                          {selectedPrint !== "none" && (
                            <p className="text-cyan-500 font-bold text-xs mt-0.5 uppercase tracking-tighter">🎨 Print: {printLabel}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t-2 border-sky-100 flex justify-between items-center">
                        <span className="font-extrabold text-slate-500 text-sm uppercase">Total</span>
                        <div className="flex items-center gap-1.5">
                          <iconify-icon icon="token-branded:sui" class="text-blue-500 text-xl"></iconify-icon>
                          <span className="text-xl font-black text-slate-800">{(selectedProduct.price * currentQty).toFixed(2)} SUI</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold py-4 rounded-2xl hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-1 transition-all squishy-btn flex items-center justify-center gap-3 text-base shine-effect mb-3 uppercase tracking-widest">
                      <iconify-icon icon="token-branded:sui" width="24"></iconify-icon>
                      Pay with SUI
                    </button>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold mb-4 uppercase tracking-widest">
                        <iconify-icon icon="solar:lock-bold-duotone" class="text-green-400 text-sm"></iconify-icon>
                        Secured on SUI Network
                      </div>
                      <button onClick={prevStep} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                        ← Edit Shipping
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}
