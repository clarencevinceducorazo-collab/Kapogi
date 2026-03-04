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
  Wallet,
  ShoppingBag,
  ImageIcon as LucideImageIcon,
  Tag
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// --- Product Data ---
const PRODUCTS = [
  {
    id: "shirt",
    name: "Classic Kapogian Tee",
    type: "Shirt",
    pricePeso: 499,
    image: "/images/merch-selection/shirts/whiteNoBG.png",
    color: "White",
    hasSize: true,
    description: "Premium cotton tee featuring the signature Kapogian cut."
  },
  {
    id: "mug",
    name: "Spirit Vessel Mug",
    type: "Mug",
    pricePeso: 349,
    image: "/images/merch-selection/mug/staticBlackMUG.png",
    color: "Matte Black",
    hasSize: false,
    description: "High-durability ceramic mug for your daily spirit fuel."
  },
  {
    id: "hoodie",
    name: "Aura Guard Hoodie",
    type: "Hoodie",
    pricePeso: 999,
    image: "/images/merch-selection/hoodies/greyhoodiestatic.png",
    color: "Space Grey",
    hasSize: true,
    description: "Heavyweight fleece hoodie designed for comfort and presence."
  }
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function KapogianShopPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Selection State
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getTreasuryConfigInfo().then(setPricing);
    if (account?.address) {
      setLoading(true);
      getOwnedCharacters(account.address).then(chars => {
        const parsed = chars.map((obj: any) => ({
          id: obj.data.objectId,
          name: obj.data.display?.data?.name || "Unnamed NFT",
          imageUrl: obj.data.display?.data?.image_url || ""
        }));
        setOwnedNfts(parsed);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load NFTs", err);
        setLoading(false);
      });
    }
  }, [account?.address]);

  const handlePurchase = async () => {
    if (!account || !selectedProduct || !pricing) return;
    
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

      const itemsSelected = `${selectedProduct.type.toUpperCase()}${selectedSize ? `-${selectedSize}` : ""}${customPrintNft ? `+PRINT-${customPrintNft.id.slice(0,8)}` : ""}`;

      const attributes = JSON.stringify({
        item_type: selectedProduct.type,
        color: selectedProduct.color,
        size: selectedSize || "N/A",
        custom_print: customPrintNft ? customPrintNft.name : "None",
        mmr: 0,
        lineage: "Ancient",
        rank: "Spirit Seed"
      });

      const result = await mintCharacterNFT({
        name: `Kapogian ${selectedProduct.type}`,
        description: `Physical ${selectedProduct.name} ${customPrintNft ? `with custom print of ${customPrintNft.name}` : ""}`,
        imageUrl: selectedProduct.image,
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
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-black" style={{ textShadow: "6px 6px 0px #fff, 10px 10px 0px #000" }}>
              The Shop
            </h1>
            <p className="text-xl font-bold text-slate-600 mt-4 uppercase tracking-widest">
              Direct-to-Spirit Physical Gear
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div 
                key={product.id}
                className="bg-white border-4 border-black rounded-[2.5rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group flex flex-col"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square relative rounded-[2rem] bg-slate-50 border-4 border-black mb-6 overflow-hidden shadow-inner group-hover:bg-yellow-50 transition-colors">
                  <Image src={product.image} alt={product.name} fill className="object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black px-3 py-1 rounded-full font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ₱{product.pricePeso}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">{product.name}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{product.type} • {product.color}</p>
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

      {/* Purchase Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
          <div className="bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: Preview */}
            <div className="w-full md:w-1/2 bg-blue-500 border-b-4 md:border-b-0 md:border-r-4 border-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              <div className="relative w-64 h-64 md:w-80 md:h-80 z-10 group">
                {selectedProduct && (
                  <Image 
                    src={selectedProduct.image} 
                    alt="preview" 
                    fill 
                    className="object-contain drop-shadow-2xl" 
                  />
                )}
                {customPrintNft && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-black/20 bg-white/40 backdrop-blur-sm mt-4 shadow-xl">
                      <Image src={customPrintNft.imageUrl} alt="print" width={96} height={96} className="object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center z-10">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">
                  {selectedProduct?.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1 rounded-full text-white text-xs font-black uppercase">
                    ₱{selectedProduct?.pricePeso}
                  </div>
                  <div className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-full text-black text-xs font-black uppercase">
                    {pricing ? `${mistToSui(pricing.baseMintPrice)} SUI` : "..."}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Options */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Check className="text-green-500" /> Configure Item
                  </h3>
                  
                  {/* Size Selection */}
                  {selectedProduct?.hasSize && (
                    <div className="space-y-3 mb-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Size</label>
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "w-12 h-12 rounded-xl border-2 font-black transition-all flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none",
                              selectedSize === size 
                                ? "bg-yellow-400 border-black text-black scale-105" 
                                : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Image Print */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Image Print (Optional)</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setCustomPrintNft(null)}
                        className={cn(
                          "aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all",
                          !customPrintNft ? "bg-black border-black text-white" : "bg-slate-50 border-slate-200 text-slate-400"
                        )}
                      >
                        <X size={16} />
                        <span className="text-[8px] font-black mt-1 uppercase">None</span>
                      </button>
                      {ownedNfts.map(nft => (
                        <button
                          key={nft.id}
                          onClick={() => setCustomPrintNft(nft)}
                          className={cn(
                            "aspect-square rounded-xl border-2 overflow-hidden relative transition-all",
                            customPrintNft?.id === nft.id ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2" : "border-slate-200 opacity-60 hover:opacity-100"
                          )}
                        >
                          <Image src={nft.imageUrl} alt="nft" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                    {!loading && ownedNfts.length === 0 && (
                      <p className="text-[10px] font-bold text-slate-400 italic">No owned NFTs found for custom printing.</p>
                    )}
                    {loading && (
                      <LoaderCircle size={16} className="animate-spin text-slate-300 mx-auto" />
                    )}
                  </div>
                </div>

                {/* Shipping Form */}
                <div className="space-y-4 pt-4 border-t-2 border-slate-100 border-dashed">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                    <Tag className="text-blue-500" /> Delivery Data
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      placeholder="Full Name" 
                      className="h-12 border-2 border-black rounded-xl font-bold" 
                      value={shipping.name}
                      onChange={e => setShipping({...shipping, name: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Email" 
                        className="h-12 border-2 border-black rounded-xl font-bold" 
                        value={shipping.email}
                        onChange={e => setShipping({...shipping, email: e.target.value})}
                      />
                      <Input 
                        placeholder="Contact #" 
                        className="h-12 border-2 border-black rounded-xl font-bold" 
                        value={shipping.contact}
                        onChange={e => setShipping({...shipping, contact: e.target.value})}
                      />
                    </div>
                    <Input 
                      placeholder="Street, City, Province, ZIP" 
                      className="h-12 border-2 border-black rounded-xl font-bold" 
                      value={shipping.address}
                      onChange={e => setShipping({...shipping, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 border-t-4 border-black">
                {error && <p className="text-red-500 text-xs font-black uppercase mb-4 text-center">{error}</p>}
                {!account ? (
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase">Wallet connection required</p>
                    <button className="w-full py-4 bg-blue-500 text-white border-4 border-black rounded-2xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50 cursor-not-allowed">
                      Connect Wallet First
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handlePurchase}
                    disabled={minting}
                    className="w-full py-4 bg-blue-500 text-white border-4 border-black rounded-2xl font-black uppercase italic tracking-widest text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {minting ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
                    {minting ? "Authorizing..." : "Mint & Order Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="max-w-md w-full p-8 bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-black mx-auto mb-6">
            <Check className="text-green-600 w-10 h-10" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Order Secured!</h2>
          <p className="text-slate-500 font-bold mb-8">Your digital collectible is minted and your physical gear is now in production.</p>
          <div className="flex flex-col gap-3">
            <Link href="/profile" className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center">
              View My Assets
            </Link>
            <button onClick={() => setSuccess(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest text-sm">
              Keep Shopping
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
