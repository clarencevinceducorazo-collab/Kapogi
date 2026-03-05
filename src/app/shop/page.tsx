"use client";

// Main shop page for Kapogian merch
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/kapogian/page-header"; // Page header component
import { PageFooter } from "@/components/kapogian/page-footer"; // Page footer component
import { cn } from "@/lib/utils"; // Utility for conditional classNames
import { useCurrentAccount } from "@mysten/dapp-kit"; // SUI wallet hook
import { getOwnedCharacters } from "@/lib/sui"; // Fetch owned NFTs
import { getIPFSGatewayUrl } from "@/lib/pinata"; // IPFS image gateway
import { LoaderCircle, Wallet, Sparkles } from "lucide-react"; // Icon components
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton"; // Wallet connect button

// Product interface for shop items
// Represents a single merch product
interface Product {
  id: string; // Unique product ID
  type: "shirt" | "hoodie" | "mug" | "mousepad"; // Product category
  name: string; // Display name
  price: number; // Price in SUI
  colorClass: string; // Tailwind color classes for card
  icon: string; // Iconify icon name
  iconColor: string; // Icon color class
  badge?: string; // Optional badge (e.g. NEW, HOT)
  staticImage: string; // Static image path
  animatedImage: string; // Animated image path (GIF)
}

// List of all products available in the shop
// Each product is rendered in the grid below
const PRODUCTS: Product[] = [
  // SHIRTS
  {
    id: "s1",
    type: "shirt",
    name: "KAPO White Tee",
    price: 0.42,
    colorClass: "bg-gradient-to-br from-slate-50 to-slate-100",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-slate-400",
    badge: "✨ NEW",
    staticImage: "/images/merch-selection/shirts/whiteNoBG.png",
    animatedImage: "/images/merch-selection/shirts/whiteshirt.gif",
  },
  {
    id: "s2",
    type: "shirt",
    name: "KAPO Black Tee",
    price: 0.42,
    colorClass: "bg-gradient-to-br from-slate-800 to-slate-900",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-white",
    staticImage: "/images/merch-selection/shirts/whiteNoBG.png",
    animatedImage: "/images/merch-selection/shirts/blackshirt.gif",
  },
  {
    id: "s3",
    type: "shirt",
    name: "KAPO Blue Tee",
    price: 0.42,
    colorClass: "bg-gradient-to-br from-blue-400 to-blue-600",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-blue-100",
    staticImage: "/images/merch-selection/shirts/whiteNoBG.png",
    animatedImage: "/images/merch-selection/shirts/blueshirt.gif",
  },
  {
    id: "s4",
    type: "shirt",
    name: "KAPO Red Tee",
    price: 0.42,
    colorClass: "bg-gradient-to-br from-red-400 to-red-600",
    icon: "solar:t-shirt-bold-duotone",
    iconColor: "text-red-100",
    staticImage: "/images/merch-selection/shirts/whiteNoBG.png",
    animatedImage: "/images/merch-selection/shirts/redshirt.gif",
  },
  // HOODIES
  {
    id: "h1",
    type: "hoodie",
    name: "Grey Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-slate-200 to-slate-300",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-slate-500",
    badge: "🔥 HOT",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/greyhoodie.gif",
  },
  {
    id: "h2",
    type: "hoodie",
    name: "Black Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-slate-800 to-slate-950",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-white",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/blackhoodie.gif",
  },
  {
    id: "h3",
    type: "hoodie",
    name: "Blue Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-blue-500 to-blue-700",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-blue-100",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/bluehoodie.gif",
  },
  {
    id: "h4",
    type: "hoodie",
    name: "Red Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-red-500 to-red-700",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-red-100",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/redhoodie.gif",
  },
  {
    id: "h5",
    type: "hoodie",
    name: "Beige Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-stone-100 to-stone-200",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-stone-500",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/biegehoodie.gif",
  },
  {
    id: "h6",
    type: "hoodie",
    name: "Cyan Aura Hoodie",
    price: 0.85,
    colorClass: "bg-gradient-to-br from-cyan-300 to-cyan-500",
    icon: "solar:hoodie-bold-duotone",
    iconColor: "text-cyan-900",
    staticImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    animatedImage: "/images/merch-selection/hoodies/cyanhoodie.gif",
  },
  // MUGS
  {
    id: "m1",
    type: "mug",
    name: "White Spirit Mug",
    price: 0.22,
    colorClass: "bg-gradient-to-br from-slate-50 to-slate-100",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-slate-400",
    staticImage: "/images/merch-selection/mug/staticMUG.png",
    animatedImage: "/images/merch-selection/mug/gifWhiteMug.gif",
  },
  {
    id: "m2",
    type: "mug",
    name: "Black Spirit Mug",
    price: 0.22,
    colorClass: "bg-gradient-to-br from-slate-800 to-slate-900",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-white",
    staticImage: "/images/merch-selection/mug/staticBlackMUG.png",
    animatedImage: "/images/merch-selection/mug/gifBlackMug.gif",
  },
  {
    id: "m3",
    type: "mug",
    name: "Blue Spirit Mug",
    price: 0.22,
    colorClass: "bg-gradient-to-br from-blue-400 to-blue-600",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-blue-100",
    staticImage: "/images/merch-selection/mug/BLUE_MUG_noBG.png",
    animatedImage: "/images/merch-selection/mug/gifBlueMug.gif",
  },
  {
    id: "m4",
    type: "mug",
    name: "Red Spirit Mug",
    price: 0.22,
    colorClass: "bg-gradient-to-br from-red-400 to-red-600",
    icon: "solar:cup-hot-bold-duotone",
    iconColor: "text-red-100",
    staticImage: "/images/merch-selection/mug/RED_MUG_noBG.png",
    animatedImage: "/images/merch-selection/mug/gifRedMug.gif",
  },
  // MOUSEPADS
  {
    id: "p1",
    type: "mousepad",
    name: "KAPO XL Desk Mat",
    price: 0.35,
    colorClass: "bg-gradient-to-br from-violet-100 to-fuchsia-100",
    icon: "solar:mouse-bold-duotone",
    iconColor: "text-violet-500",
    badge: "🖱️ XL SIZE",
    staticImage: "/images/merch-selection/pads/mousePad.png",
    animatedImage: "/images/merch-selection/pads/spinPad3.gif",
  },
];

// Main shop component
// Handles product display, modal flow, and NFT integration
export default function KapogianShop() {
  // Current connected wallet/account
  const account = useCurrentAccount();
  // UI state: active filter pill (all, shirt, hoodie, etc)
  const [activeFilter, setActiveFilter] = useState("all");
  // UI state: selected product for modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // UI state: current step in modal (1: config, 2: logistics, 3: payment)
  const [currentStep, setCurrentStep] = useState(1);
  // UI state: selected quantity
  const [currentQty, setCurrentQty] = useState(1);
  // UI state: selected size (for shirts/hoodies)
  const [selectedSize, setSelectedSize] = useState("");
  // UI state: selected NFT print ID
  const [selectedPrintId, setSelectedPrintId] = useState("none");
  // NFT state: owned NFTs fetched from SUI
  const [ownedNfts, setOwnedNfts] = useState<any[]>([]);
  // NFT state: loading indicator
  const [loadingNfts, setLoadingNfts] = useState(false);

  // Load owned NFTs from SUI when account changes
  useEffect(() => {
    if (account?.address) {
      setLoadingNfts(true);
      getOwnedCharacters(account.address)
        .then((chars) => {
          // Parse NFT objects to display info
          const parsed = chars.map((obj: any) => {
            const display = obj.data?.display?.data || {};
            return {
              id: obj.data?.objectId, // NFT object ID
              name: display.name || "Unnamed Spirit", // NFT name
              imageUrl: getIPFSGatewayUrl(display.image_url || ""), // NFT image
            };
          });
          setOwnedNfts(parsed);
        })
        .catch((err) => console.error("Failed to load NFTs", err))
        .finally(() => setLoadingNfts(false));
    } else {
      setOwnedNfts([]); // Reset if wallet disconnected
    }
  }, [account?.address]);

  // Filter products by active filter pill
  const filteredProducts = PRODUCTS.filter(
    (p) => activeFilter === "all" || p.type === activeFilter,
  );

  // Open modal for product purchase
  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setCurrentStep(1); // Start at step 1
    setCurrentQty(1); // Default quantity
    setSelectedSize(
      product.type === "mug" || product.type === "mousepad" ? "N/A" : "",
    ); // Only shirts/hoodies have size
    setSelectedPrintId("none"); // No NFT print by default
    document.body.style.overflow = "hidden"; // Prevent background scroll
  };

  // Close modal and reset state
  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = "";
  };

  // Go to next step in modal (max 3)
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  // Go to previous step in modal (min 1)
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Find selected NFT for print (if any)
  const selectedNft = ownedNfts.find((n) => n.id === selectedPrintId);
  // Get print label for selected NFT (or fallback)
  const printLabel = selectedNft ? selectedNft.name : "No Print";

  // Render shop UI
  return (
    <div className="bg-gradient-to-b from-sky-200 via-indigo-50 to-white text-slate-700 min-h-screen overflow-x-hidden selection:bg-pink-300 selection:text-white font-sans">
      {/* Global styles and keyframes for shop UI animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes shine-sweep {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
        @keyframes blob-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        @keyframes pop-in {
          0% {
            transform: scale(0.7) translateY(40px);
            opacity: 0;
          }
          70% {
            transform: scale(1.04) translateY(-4px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(99, 220, 248, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(99, 220, 248, 0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite 1s;
        }
        .animate-blob {
          animation: blob-pulse 8s infinite;
        }
        .animate-pop-in {
          animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease forwards;
        }

        .poster-card {
          background: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .poster-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 12px 12px 0px 0px rgba(0, 0, 0, 1);
        }

        .squishy-btn {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .squishy-btn:active {
          transform: scale(0.93);
        }

        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        .shine-effect::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          transform: skewX(-20deg);
          animation: shine-sweep 3s infinite;
        }

        .size-btn.selected {
          background: linear-gradient(135deg, #67e8f9, #3b82f6);
          color: white;
          border-color: #3b82f6;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.3),
            0 4px 12px rgba(59, 130, 246, 0.3);
          animation: glow-pulse 2s infinite;
        }

        .print-btn.selected-print {
          border-color: #67e8f9;
          background: #ecfeff;
          box-shadow:
            0 0 0 3px rgba(103, 232, 249, 0.25),
            0 4px 12px rgba(103, 232, 249, 0.2);
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

      {/* Page header */}
      <div style={{ fontFamily: "Fredoka, sans-serif" }}>
        <PageHeader />
      </div>

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

      {/* Hero section: shop title and description */}
      <section className="relative z-10 pt-32 pb-8 px-4 text-center">
        <div className="flex justify-center gap-3 mb-5 animate-float">
          <div className="bg-pink-300 text-pink-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-2 border-2 border-white shadow-md">
            🛍️ MERCH DROP
          </div>
          <div className="bg-cyan-300 text-cyan-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform rotate(1deg) border-2 border-white shadow-md">
            💫 LIMITED STOCK
          </div>
        </div>
        <h1
          className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none drop-shadow-xl"
          style={{ textShadow: "2px 2px 0px #3b82f6,-1px -1px 0 #fff" }}
        >
          KAPO SHOP
        </h1>
        <p className="text-lg font-bold text-slate-500 max-w-xl mx-auto">
          Official phygital merch for true Kapogian collectors. Pay with{" "}
          <span className="text-cyan-500">SUI</span> only.
        </p>
      </section>

      {/* Filter pills for product categories */}
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

      {/* Products grid: displays all filtered products */}
      <section className="relative z-10 pb-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card poster-card rounded-[2.5rem] overflow-hidden flex flex-col h-full group"
            >
              <div
                className={cn(
                  "relative h-64 flex items-center justify-center overflow-hidden m-2 rounded-[2rem] border-2 border-black",
                  product.colorClass,
                )}
              >
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Images with hover animation */}
                <div className="relative z-10 w-40 h-40 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <Image
                    src={product.staticImage}
                    alt={product.name}
                    width={160}
                    height={160}
                    className="object-contain drop-shadow-2xl transition-opacity duration-300 group-hover:opacity-0"
                  />

                  {/* wrapper to keep gif centred and allow vertical shift */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={product.animatedImage}
                      alt={product.name}
                      width={160}
                      height={160}
                      unoptimized
                      className="object-contain drop-shadow-2xl opacity-0 transition-opacity duration-300 transform transition-transform duration-300 group-hover:opacity-100 group-hover:-translate-y-2"
                    />
                  </div>
                </div>

                {product.badge && (
                  <div className="absolute top-4 right-4 bg-yellow-300 text-black text-[10px] font-black px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {product.badge}
                  </div>
                )}
              </div>
              <div className="p-6 bg-white flex-grow flex flex-col items-center text-center">
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-widest border border-slate-200">
                  {product.type}
                </span>
                <h3 className="font-headline text-2xl text-black mt-3 mb-2 tracking-tight uppercase leading-none">
                  {product.name}
                </h3>

                <div className="flex items-center gap-2 mt-auto w-full">
                  <div className="bg-sky-50 border-2 border-black rounded-xl p-1 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] min-w-[70px] max-w-[90px]">
                    <iconify-icon
                      icon="token-branded:sui"
                      class="text-blue-500 text-xl"
                    ></iconify-icon>
                    <span className="font-black text-black text-s pt-1 pb-1 pr-1">
                      {product.price}
                    </span>
                  </div>
                  <button
                    className="bg-black text-white font-black px-4 py-2 rounded-[1rem] hover:bg-slate-900 transition-all squishy-btn flex items-center justify-center gap-2 text-lg shine-effect shadow-[3px_3px_0px_0px_rgba(59,130,246,0.6)] border-2 border-black w-full max-w-[180px] text-center"
                    onClick={() => openModal(product)}
                  >
                    Purchase
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal: purchase flow for selected product */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div
            className="relative z-10 w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border-4 border-black flex flex-col md:flex-row overflow-hidden animate-pop-in"
            style={{ maxHeight: "90vh" }}
          >
            {/* LEFT: Item preview and details */}
            <div
              className={cn(
                "w-full md:w-64 flex-shrink-0 flex flex-col items-center justify-center p-8 relative overflow-hidden",
                selectedProduct.colorClass,
              )}
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 w-60 h-54 bg-white rounded-3xl flex items-center justify-center shadow-xl border-4 border-black mb-5 animate-float overflow-hidden">
                <Image
                  src={selectedProduct.animatedImage}
                  alt="preview"
                  width={160}
                  height={160}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="relative z-10 bg-black text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest shadow-lg">
                {selectedProduct.type}
              </div>
              <h2 className="relative z-10 text-xl font-headline text-white tracking-tight text-center leading-tight mb-3 uppercase">
                <span
                  style={{
                    textShadow:
                      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                  }}
                >
                  {selectedProduct.name}
                </span>
              </h2>
              <div className="relative z-10 bg-sky-50 border-2 border-black rounded-xl p-3 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <iconify-icon
                  icon="token-branded:sui"
                  class="text-blue-500 text-2xl"
                ></iconify-icon>
                <span className="font-black text-black text-xl">
                  {selectedProduct.price}
                </span>
              </div>
            </div>

            {/* RIGHT: Form panel for purchase steps */}
            <div className="flex-1 flex flex-col overflow-hidden border-l-4 border-black bg-slate-50">
              <div className="px-7 pt-6 pb-4 border-b-4 border-black bg-white flex items-center justify-between flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <div
                    className={cn(
                      currentStep >= 1
                        ? "active"
                        : "text-slate-400 bg-slate-100",
                    )}
                  >
                    1
                  </div>
                  <div className="h-1.5 w-10 bg-slate-200 rounded-full border border-black/10 overflow-hidden">
                    [ {/* Purchase Button beside price */}
                    <div
                      className={cn(
                        "h-full bg-sky-400 transition-all duration-500",
                        currentStep >= 2 ? "w-full" : "w-0",
                      )}
                    ></div>
                  </div>
                  <div
                    className={cn(
                      "step-indicator w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                      currentStep >= 2
                        ? "active"
                        : "text-slate-400 bg-slate-100",
                    )}
                  >
                    2
                  </div>
                  <div className="h-1.5 w-10 bg-slate-200 rounded-full border border-black/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-sky-400 transition-all duration-500",
                        currentStep >= 3 ? "w-full" : "w-0",
                      )}
                    ></div>
                  </div>
                  <div
                    className={cn(
                      "step-indicator w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                      currentStep >= 3
                        ? "active"
                        : "text-slate-400 bg-slate-100",
                    )}
                  >
                    3
                  </div>
                  <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-[0.2em]">
                    {currentStep === 1
                      ? "Configuration"
                      : currentStep === 2
                        ? "Logistics"
                        : "Authorized Pay"}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 bg-red-500 text-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-600 transition-colors font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto ">
                {/* STEP 1: Product configuration (size, NFT print, quantity) */}
                {currentStep === 1 && (
                  <div className="px-7 py-2 space-y-8">
                    {/* Size selection for shirts/hoodies only */}
                    {(selectedProduct.type === "shirt" ||
                      selectedProduct.type === "hoodie") && (
                      <div>
                        <p className="font-black text-black mb-2 text-xs tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-4"></span>{" "}
                          Select Fit
                        </p>
                        <div className="flex gap-2.5 flex-wrap">
                          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={cn(
                                "size-btn h-9 min-w-9 px-2 rounded-[0.75rem] font-black text-xs border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none",
                                selectedSize === size
                                  ? "bg-sky-400 border-black text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-black",
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1 mb-2 ">
                        <p className="font-black text-black text-xs tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-pink-400 rounded-full"></span>{" "}
                          Custom Print
                        </p>
                        <span className="bg-pink-100 text-pink-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-pink-200">
                          EXCLUSIVE
                        </span>
                      </div>

                      {/* NFT print selection (shows wallet connect, loader, or NFT grid) */}
                      <div className="bg-white border-4 border-black rounded-[2rem] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                        {!account ? (
                          <div className="text-center py-8">
                            <Wallet className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-5 tracking-widest">
                              Authorize wallet to view squad
                            </p>
                            <CustomConnectButton className="!text-xs !px-6 !py-3" />
                          </div>
                        ) : loadingNfts ? (
                          <div className="text-center py-10">
                            <LoaderCircle className="w-10 h-10 animate-spin mx-auto text-sky-400" />
                            <p className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-[0.2em]">
                              Decrypting Assets...
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {/* None option for no NFT print */}
                            <button
                              onClick={() => setSelectedPrintId("none")}
                              className={cn(
                                "aspect-square rounded-2xl border-4 flex flex-col items-center justify-center transition-all",
                                selectedPrintId === "none"
                                  ? "bg-black border-black text-white shadow-lg scale-105 z-10"
                                  : "bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-300",
                              )}
                            >
                              <iconify-icon
                                icon="solar:forbidden-circle-bold-duotone"
                                class="text-2xl"
                              ></iconify-icon>
                              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">
                                NONE
                              </span>
                            </button>

                            {/* Owned NFTs for custom print selection */}
                            {ownedNfts.map((nft) => (
                              <button
                                key={nft.id}
                                onClick={() => setSelectedPrintId(nft.id)}
                                className={cn(
                                  "aspect-square rounded-2xl border-4 overflow-hidden relative transition-all bg-white",
                                  selectedPrintId === nft.id
                                    ? "border-sky-400 shadow-lg scale-105 z-10"
                                    : "border-slate-100 opacity-70 hover:opacity-100 hover:border-slate-300",
                                )}
                              >
                                <Image
                                  src={nft.imageUrl}
                                  alt={nft.name}
                                  fill
                                  className="object-cover"
                                />
                                {selectedPrintId === nft.id && (
                                  <div className="absolute inset-0 bg-sky-400/20 flex items-center justify-center">
                                    <div className="bg-white rounded-full p-1 border-2 border-black">
                                      <iconify-icon
                                        icon="solar:check-circle-bold"
                                        class="text-xs text-sky-500"
                                      ></iconify-icon>
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}

                            {/* Message if no NFTs owned */}
                            {ownedNfts.length === 0 && (
                              <div className="col-span-full py-10 text-center">
                                <Sparkles className="w-10 h-10 mx-auto text-amber-200 mb-3" />
                                <p className="text-[10px] font-black uppercase text-slate-400 leading-relaxed tracking-widest">
                                  No spirits detected in this wallet.
                                  <br />
                                  Summon one to unlock custom gear.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity selection */}
                    <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-3xl">
                      <p className="font-black text-black text-xs tracking-widest uppercase">
                        Copies
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            setCurrentQty(Math.max(1, currentQty - 1))
                          }
                          className="w-7 h-7 bg-slate-100 border-2 border-black rounded-[0.75rem] font-black text-base text-black hover:bg-slate-200 transition-colors shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-2xl font-black text-black w-7 text-center">
                          {currentQty}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentQty(Math.min(10, currentQty + 1))
                          }
                          className="w-7 h-7 bg-slate-100 border-2 border-black rounded-[0.75rem] font-black text-base text-black hover:bg-slate-200 transition-colors shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 flex items-center justify-center relative"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Button to proceed to logistics step */}
                    <button
                      onClick={nextStep}
                      className="w-full bg-black text-white font-black py-5 rounded-3xl hover:bg-slate-800 transition-all squishy-btn flex items-center justify-center gap-3 shine-effect text-sm uppercase tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] ml-auto -mt-5"
                    >
                      <iconify-icon
                        icon="solar:rocket-2-bold"
                        width="22"
                      ></iconify-icon>
                      Initialize Manifest
                    </button>
                  </div>
                )}

                {/* STEP 2: Logistics/shipping form */}
                {currentStep === 2 && (
                  <div className="px-7 py-6 space-y-5">
                    <div className="bg-white border-4 border-black rounded-[2rem] p-6 mb-2">
                      <h3 className="text-2xl font-headline text-black mb-1 uppercase tracking-tight">
                        Logistics Form
                      </h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Encrypted end-to-end
                      </p>
                    </div>

                    {/* Shipping address and contact fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Receiver Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Satoshi Pogi"
                          className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3.5 font-black text-slate-700 placeholder-slate-200 transition-all text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            Province
                          </label>
                          <input
                            type="text"
                            placeholder="Metro Manila"
                            className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3.5 font-black text-slate-700 placeholder-slate-200 transition-all text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                            City
                          </label>
                          <input
                            type="text"
                            placeholder="Quezon City"
                            className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3.5 font-black text-slate-700 placeholder-slate-200 transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Street & Vault Address
                        </label>
                        <input
                          type="text"
                          placeholder="Lot, Block, Street Name..."
                          className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3.5 font-black text-slate-700 placeholder-slate-200 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Secure Contact (Mobile)
                        </label>
                        <input
                          type="tel"
                          placeholder="+63 9XX XXX XXXX"
                          className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3.5 font-black text-slate-700 placeholder-slate-200 transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Navigation buttons for modal steps */}
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={prevStep}
                        className="w-14 h-14 bg-white border-4 border-black rounded-2xl font-black text-slate-800 hover:bg-slate-50 transition-colors squishy-btn flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                      >
                        <iconify-icon
                          icon="solar:arrow-left-bold"
                          width="24"
                        ></iconify-icon>
                      </button>
                      <button
                        onClick={nextStep}
                        className="flex-1 bg-sky-400 text-white border-4 border-black font-black py-4 rounded-2xl hover:bg-sky-500 transition-all squishy-btn flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest text-sm"
                      >
                        Confirm Order
                        <iconify-icon
                          icon="solar:check-circle-bold"
                          width="20"
                        ></iconify-icon>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Payment/checkout summary */}
                {currentStep === 3 && (
                  <div className="px-7 py-6 space-y-6">
                    <div className="bg-white border-4 border-black rounded-[2rem] p-6 mb-2">
                      <h3 className="text-2xl font-headline text-black mb-1 uppercase tracking-tight">
                        Checkout Manifest
                      </h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Network: SUI Mainnet
                      </p>
                    </div>

                    {/* Final receipt and summary of order */}
                    <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Final Receipt
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border-2 border-black rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden relative">
                          {selectedPrintId !== "none" && selectedNft ? (
                            <Image
                              src={selectedNft.imageUrl}
                              alt="sum"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src={selectedProduct.animatedImage}
                              alt="sum"
                              width={50}
                              height={50}
                              unoptimized
                              className="object-contain"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black text-lg truncate uppercase italic tracking-tighter">
                            {selectedProduct.name}
                          </p>
                          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            Qty: {currentQty}{" "}
                            {selectedSize && (
                              <>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>{" "}
                                Size: {selectedSize}
                              </>
                            )}
                          </p>
                          {selectedPrintId !== "none" && (
                            <p className="text-sky-500 font-black text-[9px] mt-1 uppercase tracking-tighter border-t border-sky-100 pt-1">
                              🎨 Print: {printLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 pt-5 border-t-4 border-black flex justify-between items-center">
                        <span className="font-black text-slate-400 text-xs uppercase tracking-widest">
                          Total SUI
                        </span>
                        <div className="flex-1 bg-sky-50 border-2 border-black rounded-xl p-3 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <iconify-icon
                            icon="token-branded:sui"
                            class="text-blue-500 text-2xl"
                          ></iconify-icon>
                          <span className="font-black text-black text-xl">
                            {(selectedProduct.price * currentQty).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Authorize and pay button (SUI network) */}
                    <button className="w-full bg-black text-white font-black py-6 rounded-[2rem] hover:bg-slate-900 transition-all squishy-btn flex items-center justify-center gap-4 text-xl shine-effect shadow-[8px_8px_0px_0px_rgba(59,130,246,0.6)] border-4 border-black">
                      <iconify-icon
                        icon="token-branded:sui"
                        width="32"
                      ></iconify-icon>
                      Authorize & Pay
                    </button>

                    {/* Security info and navigation back to logistics */}
                    <div className="text-center pt-2">
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black mb-6 uppercase tracking-[0.2em]">
                        <iconify-icon
                          icon="solar:shield-check-bold-duotone"
                          class="text-green-500 text-sm"
                        ></iconify-icon>
                        Secured on SUI Network
                      </div>
                      <button
                        onClick={prevStep}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-black transition-colors underline decoration-2 underline-offset-4"
                      >
                        ← Modify Logistics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page footer */}
      <div style={{ fontFamily: "Fredoka, sans-serif" }}>
        <PageFooter />
      </div>
    </div>
  );
}
