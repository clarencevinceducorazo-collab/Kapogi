"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction 
} from "@mysten/dapp-kit";
import { 
  Package, 
  Shirt, 
  Coffee, 
  User, 
  ChevronRight, 
  X, 
  Check, 
  LoaderCircle, 
  ShoppingBag,
  ImageIcon as LucideImageIcon,
  Tag,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { 
  getOwnedCharacters, 
  mintCharacterNFT, 
  getTreasuryConfigInfo 
} from "@/lib/sui";
import { mistToSui, ENCRYPTION_CONFIG } from "@/lib/constants";
import { 
  encryptShippingInfo
} from "@/lib/encryption";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// --- Product Data using specific assets ---
const PRODUCTS = [
  {
    id: "shirt",
    name: "Kapogian Premium Tee",
    type: "Shirt",
    pricePeso: 499,
    displayImage: "/images/merch-selection/shirts/whiteNoBG.png",
    hasSize: true,
    colors: [
      { name: "White", hex: "#FFFFFF", static: "/images/merch-selection/shirts/whiteNoBG.png", gif: "/images/merch-selection/shirts/whiteshirt.gif" },
      { name: "Black", hex: "#171717", static: "/images/merch-selection/shirts/whiteNoBG.png", gif: "/images/merch-selection/shirts/blackshirt.gif" },
      { name: "Blue", hex: "#3b82f6", static: "/images/merch-selection/shirts/whiteNoBG.png", gif: "/images/merch-selection/shirts/blueshirt.gif" },
      { name: "Red", hex: "#ef4444", static: "/images/merch-selection/shirts/whiteNoBG.png", gif: "/images/merch-selection/shirts/redshirt.gif" },
    ],
    description: "Custom-cut heavyweight cotton tee. The definitive Kapogian fit."
  },
  {
    id: "mug",
    name: "Spirit Vessel Mug",
    type: "Mug",
    pricePeso: 349,
    displayImage: "/images/merch-selection/mug/staticMUG.png",
    hasSize: false,
    colors: [
      { name: "White", hex: "#FFFFFF", static: "/images/merch-selection/mug/staticMUG.png", gif: "/images/merch-selection/mug/gifWhiteMug.gif" },
      { name: "Black", hex: "#171717", static: "/images/merch-selection/mug/staticBlackMUG.png", gif: "/images/merch-selection/mug/gifBlackMug.gif" },
      { name: "Blue", hex: "#3b82f6", static: "/images/merch-selection/mug/staticMUG.png", gif: "/images/merch-selection/mug/gifBlueMug.gif" },
      { name: "Red", hex: "#ef4444", static: "/images/merch-selection/mug/staticMUG.png", gif: "/images/merch-selection/mug/gifRedMug.gif" },
    ],
    description: "High-grade ceramic with reinforced coating. Built for the daily grind."
  },
  {
    id: "hoodie",
    name: "Aura Guard Hoodie",
    type: "Hoodie",
    pricePeso: 999,
    displayImage: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    hasSize: true,
    colors: [
      { name: "Grey", hex: "#94a3b8", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/greyhoodie.gif" },
      { name: "Black", hex: "#171717", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/blackhoodie.gif" },
      { name: "Blue", hex: "#3b82f6", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/bluehoodie.gif" },
      { name: "Red", hex: "#ef4444", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/redhoodie.gif" },
      { name: "Cyan", hex: "#22d3ee", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/cyanhoodie.gif" },
      { name: "Beige", hex: "#f5f5dc", static: "/images/merch-selection/hoodies/greyhoodiestatic.png", gif: "/images/merch-selection/hoodies/biegehoodie.gif" },
    ],
    description: "Premium fleece lining with ribbed cuffs. Maximum comfort, maximum presence."
  }
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function KapogianShopPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Selection State
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [customPrintNft, setCustomPrintNft] = useState<any | null>(null);
  
  // Shipping State
  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    contact: "",
    address: ""
  });

  // Data State
  const [ownedNfts, setOwnedNfts] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Initialize modal data when product changes
  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colors[0]);
      setSelectedSize(selectedProduct.hasSize ? "M" : "");
    }
  }, [selectedProduct]);

  useEffect(() => {
    getTreasuryConfigInfo().then(setPricing);
    if (account?.address) {
      setLoadingNfts(true);
      getOwnedCharacters(account.address).then(chars => {
        const parsed = chars.map((obj: any) => ({
          id: obj.data.objectId,
          name: obj.data.display?.data?.name || "Unnamed NFT",
          imageUrl: obj.data.display?.data?.image_url || ""
        }));
        setOwnedNfts(parsed);
        setLoadingNfts(false);
      }).catch(err => {
        console.error("Failed to load NFTs", err);
        setLoadingNfts(false);
      });
    }
  }, [account?.address]);

  const handlePurchase = async () => {
    if (!account || !selectedProduct || !pricing || !selectedColor) return;
    
    // Validation
    if (selectedProduct.hasSize && !selectedSize) {
      setError("Please select a size.");
      return;
    }
    if (!shipping.name || !shipping.email || !shipping.contact || !shipping.address) {
      setError("Please fill in all shipping details.");
      return;
    }

    setMinting(true);
    setError("");

    try {
      const encryptedShipping = await encryptShippingInfo({
        full_name: shipping.name,
        email: shipping.email,
        contact_number: shipping.contact,
        address: shipping.address
      });

      const itemsSelected = `${selectedProduct.type.toUpperCase()}-${selectedColor.name.toUpperCase()}${selectedSize ? `-${selectedSize}` : ""}${customPrintNft ? `+PRINT-${customPrintNft.id.slice(0,8)}` : ""}`;

      const attributes = JSON.stringify({
        item_type: selectedProduct.type,
        color: selectedColor.name,
        size: selectedSize || "N/A",
        custom_print: customPrintNft ? customPrintNft.name : "None",
        mmr: 0,
        lineage: "None",
        rank: "Spirit Seed"
      });

      const result = await mintCharacterNFT({
        name: `Kapogian ${selectedProduct.type}`,
        description: `Physical ${selectedProduct.name} in ${selectedColor.name} ${customPrintNft ? `with custom print of ${customPrintNft.name}` : ""}`,
        imageUrl: selectedColor.gif || selectedColor.static,
        attributes,
        mmr: 0,
        itemsSelected,
        encryptedShippingInfo: encryptedShipping,
        encryptionPubkey: ENCRYPTION_CONFIG.adminPublicKey,
        walletAddress: account.address,
        totalPrice: pricing.baseMintPrice,
        signAndExecute
      });

      if (result) {
        setSuccess(true);
        setSelectedProduct(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction failed.");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative font-body selection:bg-yellow-200">
      <div className="fixed inset-0 -z-10">
        <Image src="/images/kapogian_background.png" alt="bg" fill className="object-cover" priority />
      </div>
      
      <PageHeader />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center md:text-left animate-in slide-in-from-top duration-700">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-black" style={{ textShadow: "6px 6px 0px #fff, 10px 10px 0px #000" }}>
              The Shop
            </h1>
            <p className="text-xl font-bold text-slate-600 mt-4 uppercase tracking-widest">
              Direct-to-Spirit Physical Gear
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((product, i) => (
              <div 
                key={product.id}
                className={cn(
                  "bg-white border-4 border-black rounded-[2.5rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
                  `delay-${i * 100}`
                )}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square relative rounded-[2rem] bg-slate-50 border-4 border-black mb-6 overflow-hidden shadow-inner group-hover:bg-blue-50 transition-colors">
                  <Image 
                    src={product.displayImage} 
                    alt={product.name} 
                    fill 
                    className="object-contain p-6 group-hover:scale-110 transition-transform duration-500 group-hover:opacity-0" 
                  />
                  <Image 
                    src={product.colors[0].gif} 
                    alt={product.name} 
                    fill 
                    className="object-contain p-6 group-hover:scale-110 transition-transform duration-500 absolute inset-0 opacity-0 group-hover:opacity-100" 
                    unoptimized
                  />
                  <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black px-3 py-1 rounded-full font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ₱{product.pricePeso}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">{product.name}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{product.type}</p>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">{product.description}</p>
                </div>
                <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors">
                  Select Item <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PageFooter />

      {/* Configurator Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-5xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
          <div className="bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Panel: Live Preview */}
            <div className="w-full md:w-[45%] bg-blue-500 border-b-4 md:border-b-0 md:border-r-4 border-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              <div className="relative w-64 h-64 md:w-80 md:h-80 z-10 group">
                {selectedColor && (
                  <Image 
                    src={selectedColor.gif || selectedColor.static} 
                    alt="preview" 
                    fill 
                    className="object-contain drop-shadow-2xl scale-110" 
                    unoptimized
                  />
                )}
                
                {customPrintNft && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-16 md:mt-20">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-black/20 bg-white/40 backdrop-blur-sm shadow-xl animate-in zoom-in-75 duration-300">
                      <Image src={customPrintNft.imageUrl} alt="print" width={96} height={96} className="object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 text-center z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1 rounded-full text-white text-xs font-black uppercase">
                    ₱{selectedProduct?.pricePeso}
                  </div>
                  <div className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full text-black text-xs font-black uppercase">
                    {pricing ? `${mistToSui(pricing.baseMintPrice)} SUI` : "..."}
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">
                  {selectedProduct?.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {selectedColor?.name}
                  </div>
                  {selectedSize && (
                    <div className="bg-white text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-black">
                      SIZE: {selectedSize}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Configuration */}
            <div className="w-full md:w-[55%] flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* 1. Color Selection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Palette size={14} className="text-blue-500" /> 01. Select Shade
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct?.colors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "group relative w-12 h-12 rounded-2xl border-4 transition-all active:scale-95",
                          selectedColor?.name === color.name 
                            ? "border-blue-500 scale-110 shadow-lg" 
                            : "border-slate-100 hover:border-slate-300"
                        )}
                        title={color.name}
                      >
                        <div 
                          className="absolute inset-1 rounded-xl shadow-inner" 
                          style={{ backgroundColor: color.hex }}
                        />
                        {selectedColor?.name === color.name && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white shadow-sm">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Size Selection */}
                {selectedProduct?.hasSize && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Tag size={14} className="text-amber-500" /> 02. Select Size
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "w-14 h-12 rounded-2xl border-4 font-black transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none",
                            selectedSize === size 
                              ? "bg-yellow-400 border-black text-black scale-105" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Custom Print Selection */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <LucideImageIcon size={14} className="text-pink-500" /> 03. Custom Image Print (Optional)
                  </h3>
                  <div className="bg-slate-50 border-4 border-slate-100 border-dashed rounded-3xl p-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      <button
                        onClick={() => setCustomPrintNft(null)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-sm",
                          !customPrintNft ? "bg-black border-black text-white" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        <X size={20} strokeWidth={3} />
                        <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">NONE</span>
                      </button>
                      
                      {ownedNfts.map(nft => (
                        <button
                          key={nft.id}
                          onClick={() => setCustomPrintNft(nft)}
                          className={cn(
                            "aspect-square rounded-2xl border-4 overflow-hidden relative transition-all active:scale-95 shadow-sm",
                            customPrintNft?.id === nft.id ? "border-blue-500 scale-105 z-10 shadow-lg" : "border-white hover:border-slate-200 opacity-70 hover:opacity-100"
                          )}
                        >
                          <Image src={nft.imageUrl} alt={nft.name} fill className="object-cover" />
                          {customPrintNft?.id === nft.id && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <Check className="text-white drop-shadow-md" size={24} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {!loadingNfts && ownedNfts.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No NFTs found in your wallet</p>
                        <Link href="/generate" className="text-[9px] font-black text-blue-500 hover:underline uppercase tracking-widest mt-1 inline-block">Summon one now →</Link>
                      </div>
                    )}
                    
                    {loadingNfts && (
                      <div className="flex justify-center py-4">
                        <LoaderCircle size={20} className="animate-spin text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Delivery Form */}
                <div className="space-y-4 pt-4 border-t-4 border-slate-50 border-dashed">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Package size={14} className="text-indigo-500" /> 04. Delivery Manifest
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      placeholder="Receiver Full Name" 
                      className="h-14 border-4 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:border-blue-200 transition-all !h-auto" 
                      value={shipping.name}
                      onChange={e => setShipping({...shipping, name: e.target.value})}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input 
                        placeholder="Email Address" 
                        className="h-14 border-4 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:border-blue-200 transition-all !h-auto" 
                        value={shipping.email}
                        onChange={e => setShipping({...shipping, email: e.target.value})}
                      />
                      <Input 
                        placeholder="Contact Number" 
                        className="h-14 border-4 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:border-blue-200 transition-all !h-auto" 
                        value={shipping.contact}
                        onChange={e => setShipping({...shipping, contact: e.target.value})}
                      />
                    </div>
                    <Input 
                      placeholder="Complete Address (Street, Barangay, City, Zip)" 
                      className="h-14 border-4 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:border-blue-200 transition-all !h-auto" 
                      value={shipping.address}
                      onChange={e => setShipping({...shipping, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 border-t-4 border-black">
                {error && <p className="text-red-500 text-[10px] font-black uppercase mb-4 text-center bg-red-50 border-2 border-red-100 py-2 rounded-xl">{error}</p>}
                {!account ? (
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Connect wallet to authorize payment</p>
                    <button className="w-full py-5 bg-slate-200 text-slate-400 border-4 border-slate-300 rounded-3xl font-black uppercase cursor-not-allowed">
                      Wallet Disconnected
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handlePurchase}
                    disabled={minting || !selectedColor}
                    className="w-full py-5 bg-blue-500 text-white border-4 border-black rounded-3xl font-black uppercase italic tracking-widest text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {minting ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
                    {minting ? "Authorizing..." : "Mint & Secure Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success View */}
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="max-w-md w-full p-8 bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-black mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Check className="text-green-600 w-12 h-12" strokeWidth={4} />
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Order Secured!</h2>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed">Your digital collectible has been minted and your physical gear manifest has been logged for production.</p>
          <div className="flex flex-col gap-4">
            <Link href="/profile">
              <button className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                Manage My Assets
              </button>
            </Link>
            <button 
              onClick={() => setSuccess(false)} 
              className="w-full py-5 bg-slate-50 text-slate-400 border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
            >
              Back to Catalog
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
