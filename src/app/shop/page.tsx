"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
import { cn } from "@/lib/utils";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getOwnedCharacters } from "@/lib/sui";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { LoaderCircle, Wallet, Sparkles, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { useShopItems } from "@/lib/useShopQueries";
import { useShopPurchase } from "@/lib/useShopTransactions";
import type { ShopItem } from "@/lib/shopTypes";
import type { ShippingInfo } from "@/lib/shopTypes";
import { mistToSui } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OwnedNft {
  id: string;
  name: string;
  imageUrl: string;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black text-sm uppercase tracking-tight animate-in slide-in-from-bottom-4 fade-in",
        type === "success" ? "bg-green-400 text-black" : "bg-red-400 text-white",
      )}
    >
      {type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 font-black text-lg">×</button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function KapogianShop() {
  const account = useCurrentAccount();
  const { purchase } = useShopPurchase();

  // ── Realtime: poll every 12 s, re-fetch instantly on tab focus ─────────────
  // Pass polling options as the second arg to useShopItems.
  // If your hook doesn't accept a second arg yet, see the note below.
  const {
    data: shopItems = [],
    isLoading: loadingItems,
    isFetching,
  } = useShopItems(true, {
    refetchInterval: 4_000,             // background poll every 12 s
    refetchIntervalInBackground: false,  // pause when tab is hidden
    refetchOnWindowFocus: true,          // instant sync when user switches back
  });

  // Notify when new items appear after the initial load
  const prevCountRef = useRef<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (loadingItems) return;
    if (prevCountRef.current !== null && shopItems.length > prevCountRef.current) {
      const diff = shopItems.length - prevCountRef.current;
      setToast({ message: `${diff} new item${diff > 1 ? "s" : ""} just dropped! 🔥`, type: "success" });
    }
    prevCountRef.current = shopItems.length;
  }, [shopItems.length, loadingItems]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQty, setCurrentQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedPrintId, setSelectedPrintId] = useState("none");
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Philippines",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  }>({});
  const [formTouched, setFormTouched] = useState(false);

  // Email validation: must be a valid email format
  function validateEmail(email: string) {
    // Only allow valid TLDs: .com, .net, .org, .ph, .io, .co, .gov, .edu, .info, .biz, .dev, .app, .xyz, .me, .tv, .us, .uk, .ca, .au, .sg, .id, .my, .jp, .kr, .cn, .in, .eu, .fr, .de, .es, .it, .nl, .ru, .br, .za, .tr, .ir, .ua, .pl, .se, .no, .fi, .dk, .ch, .at, .be, .cz, .gr, .hu, .pt, .ro, .sk, .si, .bg, .lt, .lv, .ee, .hr, .rs, .ba, .mk, .al, .by, .ge, .md, .am, .az, .kg, .kz, .tj, .tm, .uz, .mn, .vn, .th, .la, .kh, .mm, .lk, .np, .pk, .bd, .af, .sa, .ae, .qa, .kw, .om, .bh, .ye, .jo, .lb, .sy, .iq, .eg, .ma, .dz, .tn, .ly, .sd, .ss, .et, .so, .ke, .ug, .tz, .rw, .bi, .mw, .zm, .zm, .zw, .mz, .ao, .cm, .gh, .ng, .sn, .ci, .ml, .bf, .ne, .tg, .bj, .gm, .gw, .cv, .st, .sc, .mu, .mg, .re, .yt, .pm, .wf, .tf, .pf, .nc, .vu, .sb, .fm, .mh, .pw, .ki, .nr, .tv, .tk, .to, .ws, .as, .ck, .nu, .tk, .fj, .pg, .sb, .vu, .wf, .ws, .ph
    // You can add/remove TLDs as needed
    const tldPattern = /\.(com|net|org|ph|io|co|gov|edu|info|biz|dev|app|xyz|me|tv|us|uk|ca|au|sg|id|my|jp|kr|cn|in|eu|fr|de|es|it|nl|ru|br|za|tr|ir|ua|pl|se|no|fi|dk|ch|at|be|cz|gr|hu|pt|ro|sk|si|bg|lt|lv|ee|hr|rs|ba|mk|al|by|ge|md|am|az|kg|kz|tj|tm|uz|mn|vn|th|la|kh|mm|lk|np|pk|bd|af|sa|ae|qa|kw|om|bh|ye|jo|lb|sy|iq|eg|ma|dz|tn|ly|sd|ss|et|so|ke|ug|tz|rw|bi|mw|zm|zw|mz|ao|cm|gh|ng|sn|ci|ml|bf|ne|tg|bj|gm|gw|cv|st|sc|mu|mg|re|yt|pm|wf|tf|pf|nc|vu|sb|fm|mh|pw|ki|nr|tk|to|ws|as|ck|nu|fj|pg|sb|vu|wf|ws)\b$/i;
    // Standard email regex
    const emailPattern = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
    return emailPattern.test(email) && tldPattern.test(email);
  }

  // Philippine phone validation: only 11 digits, starts with 09
  function validatePHPhone(phone: string) {
    return /^09\d{9}$/.test(phone);
  }

  function validateFormFields(form: typeof shippingForm) {
    const errors: typeof formErrors = {};
    if (!form.fullName.trim()) errors.fullName = "Receiver name is required.";
    if (form.email && !validateEmail(form.email)) errors.email = "Enter a valid email address.";
    if (!form.phone.trim()) errors.phone = "Mobile number is required.";
    else if (!validatePHPhone(form.phone)) errors.phone = "Enter a valid PH mobile (11 digits, starts with 09).";
    if (!form.address.trim()) errors.address = "Address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.province.trim()) errors.province = "Province is required.";
    // postalCode and country are optional
    return errors;
  }

  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (account?.address) {
      setLoadingNfts(true);
      getOwnedCharacters(account.address)
        .then((chars) => {
          const parsed = chars.map((obj: any) => {
            const display = obj.data?.display?.data || {};
            return {
              id: obj.data?.objectId,
              name: display.name || "Unnamed Spirit",
              imageUrl: getIPFSGatewayUrl(display.image_url || ""),
            };
          });
          setOwnedNfts(parsed);
        })
        .catch((err) => console.error("Failed to load NFTs", err))
        .finally(() => setLoadingNfts(false));
    } else {
      setOwnedNfts([]);
    }
  }, [account?.address]);

  const ITEM_TYPE_LABELS: Record<number, string> = {
    0: "shirt", 1: "hoodie", 2: "mug", 3: "mousepad", 4: "other",
  };

  const filteredItems = shopItems.filter((item) => {
    if (activeFilter === "all") return true;
    return ITEM_TYPE_LABELS[item.itemType] === activeFilter;
  });

  const openModal = (item: ShopItem) => {
    setSelectedItem(item);
    setCurrentStep(1);
    setCurrentQty(1);
    const noSize = item.itemType === 2 || item.itemType === 3;
    setSelectedSize(noSize ? "N/A" : "");
    setSelectedColor(item.colors[0] ?? "");
    setSelectedPrintId("none");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = "";
  };

  const nextStep = () => {
    if (currentStep === 2) {
      const errors = validateFormFields(shippingForm);
      setFormErrors(errors);
      setFormTouched(true);
      if (Object.keys(errors).length > 0) {
        setToast({ message: "Fill in all required and valid shipping fields.", type: "error" });
        return;
      }
    }
    setCurrentStep((p) => Math.min(p + 1, 3));
  };
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const canProceedStep1 =
    selectedItem &&
    (selectedItem.itemType === 2 || selectedItem.itemType === 3 ? true : selectedSize !== "");

  const canProceedStep2 =
    Object.keys(validateFormFields(shippingForm)).length === 0;

  const handlePurchase = async () => {
    if (!selectedItem || !account) return;
    const errors = validateFormFields(shippingForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ message: "Fill in all required and valid shipping fields.", type: "error" });
      return;
    }
    setPurchasing(true);
    try {
      const shippingInfo: ShippingInfo = {
        fullName: shippingForm.fullName,
        email: shippingForm.email,
        phone: shippingForm.phone,
        address: shippingForm.address,
        city: shippingForm.city,
        province: shippingForm.province,
        postalCode: shippingForm.postalCode,
        country: shippingForm.country,
        notes: shippingForm.notes,
      };
      await purchase(
        { id: selectedItem.id, priceMist: selectedItem.priceMist },
        {
          itemId: selectedItem.id,
          quantity: currentQty,
          chosenSize: selectedSize,
          chosenColor: selectedColor,
          customPrintNftId: selectedPrintId !== "none" ? selectedPrintId : null,
          shippingInfo,
        },
      );
      setToast({ message: "Order placed on-chain! 🎉", type: "success" });
      closeModal();
    } catch (err: any) {
      console.error(err);
      setToast({
        message: err?.message?.includes("Insufficient") ? "Insufficient SUI balance." : "Transaction failed.",
        type: "error",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const selectedNft = ownedNfts.find((n) => n.id === selectedPrintId);
  const totalSui = selectedItem ? mistToSui(Number(selectedItem.priceMist) * currentQty) : 0;

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

        .poster-card {
          background: #ffffff;
          border: 4px solid #000000;
          box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .poster-card:hover {
          transform: translate(-4px,-4px);
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
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
          color:white; border-color:#3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.3),0 4px 12px rgba(59,130,246,0.3);
          animation: glow-pulse 2s infinite;
        }

        .step-indicator.active {
          background: linear-gradient(135deg,#67e8f9,#3b82f6);
          color: white;
        }
      `}</style>

      <div style={{ fontFamily: "Fredoka, sans-serif" }}>
        <PageHeader />
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: "4s" }} />
       
      </div>

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-8 px-4 text-center">
        <div className="flex justify-center gap-3 mb-5 animate-float">
          <div className="bg-pink-300 text-pink-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide transform -rotate-2 border-2 border-white shadow-md">🛍️ MERCH DROP</div>
          <div className="bg-cyan-300 text-cyan-900 px-4 py-1.5 rounded-full font-extrabold text-xs tracking-wide border-2 border-white shadow-md">💫 LIMITED STOCK</div>
        </div>
        <h1
          className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none drop-shadow-xl"
          style={{ textShadow: "2px 2px 0px #3b82f6,-1px -1px 0 #fff" }}
        >
          KAPO SHOP
        </h1>
        <p className="text-lg font-bold text-slate-500 max-w-xl mx-auto mb-3">
          Official phygital merch for true Kapogian collectors. Pay with{" "}
          <span className="text-cyan-500">SUI</span> only.
        </p>

        {/* ── Live indicator pill ── */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border-2 border-white rounded-full px-4 py-1.5 shadow-sm">
            {isFetching && !loadingItems
              ? <RefreshCw size={10} className="text-sky-400 animate-spin" />
              : <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            }
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isFetching && !loadingItems ? "Syncing chain..." : "Live inventory"}
            </span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="relative z-10 px-4 mb-10">
        <div className="max-w-6xl mx-auto flex gap-3 flex-wrap justify-center">
          {[
            { id: "all",       label: "All Items",   icon: "" },
            { id: "shirt",     label: "Shirts",      icon: "👕" },
            { id: "hoodie",    label: "Hoodies",     icon: "🧥" },
            { id: "mug",       label: "Mugs",        icon: "☕" },
            { id: "mousepad",  label: "Mouse Pads",  icon: "🖱️" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold text-sm squishy-btn border-2 transition-all flex items-center gap-1.5 md:gap-2",
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

      {/* Product Grid */}
      <section className="relative z-10 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {loadingItems ? (
            <div className="flex items-center justify-center py-24 gap-3 text-slate-400 font-black uppercase text-sm">
              <LoaderCircle className="animate-spin" size={28} /> Loading inventory from chain...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-24 font-black text-slate-300 uppercase text-lg">
              No items available in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="poster-card rounded-[2.5rem] overflow-hidden flex flex-col h-full group"
                >
                  <div
                    className="relative h-48 md:h-64 flex items-center justify-center overflow-hidden m-2 rounded-[2rem] border-2 border-black cursor-pointer group/img"
                    style={{ backgroundColor: item.colorBg || "#f8fafc" }}
                    onClick={() => setPreviewItem(item)}
                  >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                      <Image
                        src={item.imageStatic}
                        alt={item.name}
                        fill
                        className="object-contain drop-shadow-2xl transition-opacity duration-300 group-hover:opacity-0"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={item.imageAnimated}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-contain drop-shadow-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:group-hover:-translate-y-2"
                        />
                      </div>
                    </div>
                    {item.stock <= 5 && item.stock > 0 && (
                      <div className="absolute top-4 right-4 bg-red-400 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        ⚠️ LOW STOCK
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-white flex-grow flex flex-col items-center text-center">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-widest border border-slate-200">
                      {ITEM_TYPE_LABELS[item.itemType]}
                    </span>
                    <h3 className="font-headline text-2xl text-black mt-3 mb-2 tracking-tight uppercase leading-none">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mb-3">
                      {item.stock} in stock
                    </p>
                    <div className="flex items-center gap-2 mt-auto w-full">
                      <div className="bg-sky-50 border-2 border-black rounded-xl p-1 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] min-w-[70px]">
                        <iconify-icon icon="token-branded:sui" class="text-blue-500 text-xl" />
                        <span className="font-black text-black text-sm pt-1 pb-1 pr-1">
                          {mistToSui(Number(item.priceMist)).toFixed(3)}
                        </span>
                      </div>
                      <button
                        className="bg-black text-white font-black px-4 py-2 rounded-[1rem] hover:bg-slate-900 transition-all squishy-btn flex items-center justify-center gap-2 text-lg shine-effect shadow-[3px_3px_0px_0px_rgba(59,130,246,0.6)] border-2 border-black w-full text-center"
                        onClick={() => openModal(item)}
                      >
                        Purchase
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Item Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewItem(null)}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          
          <div 
            className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-6 tracking-tight uppercase leading-none drop-shadow-xl" style={{ textShadow: "0px 4px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}>
              {previewItem.name}
            </h2>

            {/* Image */}
            <div className="relative w-full aspect-square mb-8 pointer-events-none">
              <Image src={previewItem.imageAnimated} alt={previewItem.name} fill unoptimized className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-float" />
            </div>

            {/* Price & Purchase Button */}
            <div className="flex flex-col items-center gap-4 w-full px-4 md:px-8">
              <div className="bg-sky-50 border-[3px] border-black rounded-2xl px-6 py-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full justify-center">
                <iconify-icon icon="token-branded:sui" class="text-blue-500 text-3xl" />
                <span className="font-black text-black text-2xl pt-1">
                  {mistToSui(Number(previewItem.priceMist)).toFixed(3)} SUI
                </span>
              </div>
              
              <button
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black py-4 rounded-[1.5rem] hover:opacity-90 transition-all squishy-btn flex items-center justify-center gap-3 text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black uppercase tracking-widest mt-2"
                onClick={() => {
                  const item = previewItem;
                  setPreviewItem(null);
                  openModal(item);
                }}
              >
                Purchase Now
              </button>
            </div>
            
            <button 
              className="absolute -top-4 -right-2 sm:-right-8 z-20 w-12 h-12 bg-white text-black border-4 border-black font-black rounded-full flex items-center justify-center hover:bg-slate-200 transition-all squishy-btn shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-2xl leading-none"
              onClick={() => setPreviewItem(null)}
            >
              <span className="-mb-1">✕</span>
            </button>
          </div>
        </div>
      )}

      {/* Purchase Modal — identical to original */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="relative z-10 w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border-4 border-black flex flex-col md:flex-row overflow-hidden animate-pop-in"
            style={{ maxHeight: "90vh" }}
          >
            {/* Left panel — compact on mobile, sidebar on md+ */}
            <div
              className="w-full h-32 md:h-auto md:w-56 flex-shrink-0 flex flex-row md:flex-col items-center justify-center gap-4 md:gap-0 px-4 py-2 md:p-6 relative overflow-hidden"
              style={{ backgroundColor: selectedItem.colorBg || "#f8fafc" }}
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10 w-20 h-20 md:w-44 md:h-44 bg-white rounded-[1.25rem] md:rounded-3xl flex items-center justify-center shadow-md md:shadow-xl border-[3px] md:border-4 border-black md:mb-4 animate-float overflow-hidden flex-shrink-0">
                <Image src={selectedItem.imageAnimated} alt="preview" fill unoptimized className="object-contain p-2 md:p-0" />
              </div>
              <div className="relative z-10 flex flex-col items-start md:items-center gap-1.5 md:gap-2 min-w-0 flex-1 md:flex-none">
                <div className="bg-black text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest shadow-md md:shadow-lg">
                  {ITEM_TYPE_LABELS[selectedItem.itemType]}
                </div>
                <h2 className="text-xs md:text-base font-headline text-white tracking-tight leading-tight uppercase truncate w-full md:text-center md:w-auto">
                  <span style={{ textShadow: "-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000" }}>
                    {selectedItem.name}
                  </span>
                </h2>
                <div className="bg-sky-50 border-2 border-black rounded-lg md:rounded-xl px-2 py-1 md:px-3 md:py-1.5 flex items-center gap-1.5 md:gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <iconify-icon icon="token-branded:sui" class="text-blue-500 text-sm md:text-lg" />
                  <span className="font-black text-black text-sm md:text-base leading-none">{mistToSui(Number(selectedItem.priceMist)).toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col overflow-hidden border-t-4 md:border-t-0 md:border-l-4 border-black bg-slate-50 relative">
              <div className="px-4 md:px-7 pt-4 pb-3 md:pt-6 md:pb-4 border-b-4 border-black bg-white flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex gap-1.5 md:gap-2 items-center">
                  {[1, 2, 3].map((step, i) => (
                    <React.Fragment key={step}>
                      {i > 0 && (
                        <div className="h-1 md:h-1.5 w-3 md:w-10 bg-slate-200 rounded-full border border-black/10 overflow-hidden">
                          <div className={cn("h-full bg-sky-400 transition-all duration-500", currentStep > i ? "w-full" : "w-0")} />
                        </div>
                      )}
                      <div className={cn("step-indicator w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-xs md:text-sm transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] md:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", currentStep >= step ? "active" : "text-slate-400 bg-slate-100")}>
                        {step}
                      </div>
                    </React.Fragment>
                  ))}
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 ml-1.5 md:ml-2 uppercase tracking-wide md:tracking-[0.2em] truncate hidden sm:inline-block">
                    {currentStep === 1 ? "Configuration" : currentStep === 2 ? "Logistics" : "Authorize Pay"}
                  </span>
                </div>
                <button onClick={closeModal} className="w-9 h-9 bg-red-500 text-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-600 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="px-4 py-5 md:px-7 md:py-6 space-y-6 md:space-y-8">
                    {selectedItem.sizes.length > 0 && (
                      <div>
                        <p className="font-black text-black mb-2 text-xs tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> Select Fit
                        </p>
                        <div className="flex gap-2.5 flex-wrap">
                          {selectedItem.sizes.map((size) => (
                            <button key={size} onClick={() => setSelectedSize(size)}
                              className={cn("size-btn h-9 min-w-9 px-2 rounded-[0.75rem] font-black text-xs border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                                selectedSize === size ? "bg-sky-400 border-black text-white" : "bg-white border-slate-200 text-slate-600 hover:border-black")}>
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedItem.colors.length > 0 && (
                      <div>
                        <p className="font-black text-black mb-2 text-xs tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" /> Select Color
                        </p>
                        <div className="flex gap-2.5 flex-wrap">
                          {selectedItem.colors.map((color) => (
                            <button key={color} onClick={() => setSelectedColor(color)}
                              className={cn("h-9 px-3 rounded-[0.75rem] font-black text-xs border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                                selectedColor === color ? "bg-sky-400 border-black text-white" : "bg-white border-slate-200 text-slate-600 hover:border-black")}>
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <p className="font-black text-black text-xs tracking-widest uppercase flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-pink-400 rounded-full" /> Custom Print
                        </p>
                        <span className="bg-pink-100 text-pink-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-pink-200">EXCLUSIVE</span>
                      </div>
                      <div className="bg-white border-4 border-black rounded-[2rem] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                        {!account ? (
                          <div className="text-center py-8">
                            <Wallet className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-5 tracking-widest">Connect wallet to view your spirits</p>
                            <CustomConnectButton className="!text-xs !px-6 !py-3" />
                          </div>
                        ) : loadingNfts ? (
                          <div className="text-center py-10">
                            <LoaderCircle className="w-10 h-10 animate-spin mx-auto text-sky-400" />
                            <p className="text-[10px] font-black uppercase text-slate-400 mt-3 tracking-[0.2em]">Loading your spirits...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            <button onClick={() => setSelectedPrintId("none")}
                              className={cn("aspect-square rounded-2xl border-4 flex flex-col items-center justify-center transition-all",
                                selectedPrintId === "none" ? "bg-black border-black text-white shadow-lg scale-105 z-10" : "bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-300")}>
                              <iconify-icon icon="solar:forbidden-circle-bold-duotone" class="text-2xl" />
                              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">NONE</span>
                            </button>
                            {ownedNfts.map((nft) => (
                              <button key={nft.id} onClick={() => setSelectedPrintId(nft.id)}
                                className={cn("aspect-square rounded-2xl border-4 overflow-hidden relative transition-all bg-white",
                                  selectedPrintId === nft.id ? "border-sky-400 shadow-lg scale-105 z-10" : "border-slate-100 opacity-70 hover:opacity-100 hover:border-slate-300")}>
                                <Image src={nft.imageUrl} alt={nft.name} fill className="object-cover" />
                                {selectedPrintId === nft.id && (
                                  <div className="absolute inset-0 bg-sky-400/20 flex items-center justify-center">
                                    <div className="bg-white rounded-full p-1 border-2 border-black">
                                      <iconify-icon icon="solar:check-circle-bold" class="text-xs text-sky-500" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                            {ownedNfts.length === 0 && (
                              <div className="col-span-full py-10 text-center">
                                <Sparkles className="w-10 h-10 mx-auto text-amber-200 mb-3" />
                                <p className="text-[10px] font-black uppercase text-slate-400 leading-relaxed tracking-widest">
                                  No spirits detected.<br />Summon one to unlock custom gear.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-3xl">
                      <p className="font-black text-black text-xs tracking-widest uppercase ml-4">Copies</p>
                      <div className="flex items-center gap-4 mr-2">
                        <button onClick={() => setCurrentQty(Math.max(1, currentQty - 1))}
                          className="w-7 h-7 bg-slate-100 border-2 border-black rounded-[0.75rem] font-black text-base text-black hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">−</button>
                        <span className="text-2xl font-black text-black w-7 text-center">{currentQty}</span>
                        <button onClick={() => setCurrentQty(Math.min(selectedItem.stock, currentQty + 1))}
                          className="w-7 h-7 bg-slate-100 border-2 border-black rounded-[0.75rem] font-black text-base text-black hover:bg-slate-200 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">+</button>
                      </div>
                    </div>
                    <button onClick={nextStep} disabled={!canProceedStep1}
                      className="w-full bg-black text-white font-black py-5 rounded-3xl hover:bg-slate-800 transition-all squishy-btn flex items-center justify-center gap-3 shine-effect text-sm uppercase tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
                      <iconify-icon icon="solar:rocket-2-bold" width="22" />
                      Initialize Manifest
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="px-4 py-5 md:px-7 md:py-6 space-y-4">
                    <div className="bg-white border-4 border-black rounded-2xl md:rounded-[2rem] p-4 md:p-6 mb-2 md:mb-4">
                      <h3 className="text-xl md:text-2xl font-headline text-black mb-1 uppercase tracking-tight leading-none md:leading-normal">Logistics Form</h3>
                      <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1 md:mt-0">Encrypted end-to-end on-chain</p>
                    </div>
                    {[
                      { key: "fullName", label: "Receiver Name *",        placeholder: "e.g. Satoshi Pogi",     type: "text"  },
                      { key: "email",    label: "Email",                   placeholder: "your@email.com",        type: "email" },
                      { key: "phone",    label: "Mobile Number *",         placeholder: "09XXXXXXXXX",           type: "tel"   },
                      { key: "address",  label: "Street & Unit Address *", placeholder: "Lot, Block, Street...", type: "text"  },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
                        <input
                          type={type}
                          value={(shippingForm as any)[key]}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (key === "phone") {
                              // Only allow numbers, max 11 digits
                              value = value.replace(/[^0-9]/g, "").slice(0, 11);
                            }
                            setShippingForm((f) => ({ ...f, [key]: value }));
                            // Only clear error for this field if user corrects it after submit attempt
                            if (formTouched) {
                              setFormErrors((err) => {
                                const newErr = { ...err };
                                delete newErr[key as keyof typeof formErrors];
                                return newErr;
                              });
                            }
                          }}
                          placeholder={placeholder}
                          className={
                            "w-full bg-white border-4 border-black rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-black font-bold placeholder-gray-400 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-sky-300" +
                            (formTouched && formErrors[key as keyof typeof formErrors] ? " border-red-500" : "")
                          }
                          maxLength={key === "phone" ? 11 : undefined}
                        />
                        {formTouched && formErrors[key as keyof typeof formErrors] && (
                          <div className="text-red-500 text-xs font-bold mt-1 ml-2">{formErrors[key as keyof typeof formErrors]}</div>
                        )}
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { key: "province",   label: "Province *",  placeholder: "Metro Manila" },
                        { key: "city",       label: "City *",      placeholder: "Quezon City"  },
                        { key: "postalCode", label: "Postal Code", placeholder: "1100"         },
                        { key: "country",    label: "Country",     placeholder: "Philippines"  },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-black uppercase tracking-widest ml-2">{label}</label>
                          <input
                            type="text"
                            value={(shippingForm as any)[key]}
                            onChange={(e) => {
                              setShippingForm((f) => ({ ...f, [key]: e.target.value }));
                              if (formTouched) {
                                setFormErrors((err) => {
                                  const newErr = { ...err };
                                  delete newErr[key as keyof typeof formErrors];
                                  return newErr;
                                });
                              }
                            }}
                            placeholder={placeholder}
                            className={
                              "w-full bg-white border-4 border-black rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-black font-bold placeholder-gray-400 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-sky-300" +
                                (formTouched && formErrors[key as keyof typeof formErrors] ? " border-red-500" : "")
                            }
                          />
                          {formTouched && formErrors[key as keyof typeof formErrors] && (
                            <div className="text-red-500 text-xs font-bold mt-1 ml-2">{formErrors[key as keyof typeof formErrors]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Order Notes (optional)</label>
                      <input type="text" value={shippingForm.notes}
                        onChange={(e) => setShippingForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Any special instructions..."
                        className="w-full bg-white border-4 border-black rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 font-black text-slate-700 placeholder-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                    </div>
                    <div className="flex gap-2.5 md:gap-4 mt-6 md:mt-8">
                      <button onClick={prevStep} className="w-12 h-12 md:w-14 md:h-14 bg-white border-4 border-black rounded-xl md:rounded-2xl font-black text-slate-800 hover:bg-slate-50 squishy-btn flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <iconify-icon icon="solar:arrow-left-bold" width="20" className="md:w-6" />
                      </button>
                      <button onClick={nextStep}
                        className={
                          "flex-1 bg-sky-400 text-white border-4 border-black font-black py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-sky-500 squishy-btn flex items-center justify-center gap-2 md:gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-[0.1em] md:tracking-widest text-xs md:text-sm" +
                          (!canProceedStep2 ? " opacity-60" : "")
                        }
                        type="button"
                      >
                        Confirm Logistics <iconify-icon icon="solar:check-circle-bold" width="20" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="px-4 py-5 md:px-7 md:py-6 space-y-5 md:space-y-6">
                    <div className="bg-white border-4 border-black rounded-2xl md:rounded-[2rem] p-4 md:p-6">
                      <h3 className="text-xl md:text-2xl font-headline text-black mb-1 uppercase tracking-tight leading-none md:leading-normal">Checkout Manifest</h3>
                      <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1 md:mt-0">Network: SUI Mainnet</p>
                    </div>
                    <div className="bg-white border-4 border-black rounded-2xl md:rounded-[2rem] p-4 md:p-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 md:mb-4">Final Receipt</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 border-2 border-black rounded-2xl flex items-center justify-center overflow-hidden relative flex-shrink-0">
                          {selectedPrintId !== "none" && selectedNft
                            ? <Image src={selectedNft.imageUrl} alt="print" fill className="object-cover" />
                            : <Image src={selectedItem.imageAnimated} alt="item" width={50} height={50} unoptimized className="object-contain" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black text-base md:text-lg truncate uppercase italic tracking-tighter leading-tight">{selectedItem.name}</p>
                          <p className="text-slate-400 font-black text-[9px] md:text-[10px] uppercase tracking-wide md:tracking-widest flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-0">
                            Qty: {currentQty}
                            {selectedSize && selectedSize !== "N/A" && (<><span className="w-1 h-1 bg-slate-200 rounded-full" /> Size: {selectedSize}</>)}
                            {selectedColor && (<><span className="w-1 h-1 bg-slate-200 rounded-full" /> {selectedColor}</>)}
                          </p>
                          {selectedPrintId !== "none" && (
                            <p className="text-sky-500 font-black text-[9px] mt-1 uppercase tracking-tighter border-t border-sky-100 pt-1">🎨 Print: {selectedNft?.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 space-y-1">
                        <p>📦 {shippingForm.fullName} — {shippingForm.phone}</p>
                        <p>📍 {shippingForm.address}, {shippingForm.city}, {shippingForm.province}</p>
                      </div>
                      <div className="mt-5 md:mt-6 pt-4 md:pt-5 border-t-4 border-black flex justify-between items-center">
                        <span className="font-black text-slate-400 text-[10px] md:text-xs uppercase tracking-widest">Total SUI</span>
                        <div className="flex-1 bg-sky-50 border-2 border-black rounded-xl p-2 md:p-3 flex items-center justify-center gap-1.5 md:gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ml-3 md:ml-4">
                          <iconify-icon icon="token-branded:sui" class="text-blue-500 text-xl md:text-2xl" />
                          <span className="font-black text-black text-lg md:text-xl">{totalSui.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                    {!account ? (
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-400 uppercase mb-4">Connect wallet to purchase</p>
                        <CustomConnectButton className="!text-sm !px-8 !py-4 !mx-auto" />
                      </div>
                    ) : (
                      <button onClick={handlePurchase} disabled={purchasing}
                        className="w-full bg-black text-white font-black py-4 md:py-6 rounded-2xl md:rounded-[2rem] hover:bg-slate-900 transition-all squishy-btn flex items-center justify-center gap-3 md:gap-4 text-lg md:text-xl shine-effect shadow-[4px_4px_0px_0px_rgba(59,130,246,0.6)] md:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.6)] border-[3px] md:border-4 border-black disabled:opacity-50 disabled:cursor-not-allowed leading-none">
                        {purchasing
                          ? <><LoaderCircle className="animate-spin w-5 h-5 md:w-7 md:h-7" /> Signing...</>
                          : <><iconify-icon icon="token-branded:sui" class="text-2xl md:text-[32px]" /> Authorize & Pay</>
                        }
                      </button>
                    )}
                    <div className="text-center pt-2">
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black mb-6 uppercase tracking-[0.2em]">
                        <iconify-icon icon="solar:shield-check-bold-duotone" class="text-green-500 text-sm" />
                        Secured on SUI Network · Shipping info encrypted on-chain
                      </div>
                      <button onClick={prevStep} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-black transition-colors underline decoration-2 underline-offset-4">
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ fontFamily: "Fredoka, sans-serif" }}>
        <PageFooter />
      </div>
    </div>
  );
}