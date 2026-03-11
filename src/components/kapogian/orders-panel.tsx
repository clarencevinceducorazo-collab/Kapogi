"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  LoaderCircle,
  ShieldAlert,
  Package,
  Truck,
  CheckCircle,
  ShoppingBag,
  Calendar,
  Hash,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS, mistToSui } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NftOrder {
  kind: "nft";
  objectId: string;
  nftId: string;
  itemsSelected: string;
  paymentAmount: number;
  status: number;
  createdAt: number;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  character?: { name: string; imageUrl: string };
}

interface ShopOrder {
  kind: "shop";
  objectId: string;
  itemName: string;
  itemsSelected: string[];
  paymentAmount: number;
  status: number;
  createdAt: number;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  imageUrl?: string;
  isAnimated?: boolean;
}

type Order = NftOrder | ShopOrder;
type Tab = "all" | "nft" | "shop";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusInfo(status: number) {
  switch (status) {
    case ORDER_STATUS.SHIPPED:
      return { text: "In Transit", icon: <Truck size={14} />, bg: "bg-blue-100", textColor: "text-blue-600" };
    case ORDER_STATUS.DELIVERED:
      return { text: "Delivered", icon: <CheckCircle size={14} />, bg: "bg-green-100", textColor: "text-green-600" };
    default:
      return { text: "Processing", icon: <Package size={14} />, bg: "bg-yellow-100", textColor: "text-yellow-600" };
  }
}

function getTrackingUrl(carrier: string, num: string) {
  const c = carrier.toUpperCase();
  if (c.includes("UPS")) return `https://www.ups.com/track?tracknum=${num}`;
  if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  if (c.includes("LBC")) return `https://www.lbcexpress.com/track/?tracking_no=${num}`;
  if (c.includes("J&T") || c.includes("SPX") || c.includes("NINJA")) return `https://t.17track.net/en#nums=${num}`;
  return "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPanel({ account }: { account: any }) {
  const [nftOrders, setNftOrders] = useState<NftOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selectedOrder]);

  const loadOrders = useCallback(async () => {
    if (!account?.address) return;
    setLoading(true);
    setError("");
    try {
      const userAddr = account.address.toLowerCase();

      // 1. Discovery via Registries
      const fetchIds = async (id: string) => {
        try {
          const obj = await suiClient.getObject({ id, options: { showContent: true } });
          if (obj.data?.content?.dataType === "moveObject") {
            const f = obj.data.content.fields as any;
            return (f.receipt_ids || []).map((rid: any) => typeof rid === "string" ? rid : rid.id || rid);
          }
        } catch {}
        return [];
      };

      const [nftIds, shopIds] = await Promise.all([
        fetchIds(CONTRACT_ADDRESSES.RECEIPT_REGISTRY_ID),
        fetchIds(CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID)
      ]);

      const allIds = Array.from(new Set([...nftIds, ...shopIds]));
      if (allIds.length === 0) {
        setNftOrders([]);
        setShopOrders([]);
        setLoading(false);
        return;
      }

      const receiptObjs = [];
      for (let i = 0; i < allIds.length; i += 50) {
        const chunk = allIds.slice(i, i + 50);
        const res = await suiClient.multiGetObjects({ ids: chunk, options: { showContent: true } });
        receiptObjs.push(...res);
      }

      const userNfts: NftOrder[] = [];
      const userShop: ShopOrder[] = [];
      const nftRefs: string[] = [];
      const shopItemRefs: string[] = [];

      receiptObjs.forEach((res) => {
        if (!res.data?.content || res.data.content.dataType !== "moveObject") return;
        const f = res.data.content.fields as any;
        if (f.buyer?.toLowerCase() !== userAddr) return;

        const isShop = !!f.item_id;
        const common = {
          objectId: res.data.objectId,
          status: Number(f.status || 0),
          paymentAmount: Number(f.payment_amount || 0),
          createdAt: Number(f.created_at || 0),
          trackingNumber: f.tracking_number || "",
          carrier: f.carrier || "",
          estimatedDelivery: Number(f.estimated_delivery || 0),
        };

        if (isShop) {
          const o: ShopOrder = {
            ...common,
            kind: "shop",
            itemName: f.item_name || "Kapogian Gear",
            itemsSelected: [f.chosen_size, f.chosen_color].filter(v => v && v !== "N/A"),
          };
          const itemId = typeof f.item_id === "string" ? f.item_id : f.item_id?.id;
          if (itemId) shopItemRefs.push(itemId);
          userShop.push(o);
        } else {
          const o: NftOrder = {
            ...common,
            kind: "nft",
            nftId: typeof f.nft_id === "string" ? f.nft_id : f.nft_id?.id,
            itemsSelected: f.items_selected || "",
          };
          if (o.nftId) nftRefs.push(o.nftId);
          userNfts.push(o);
        }
      });

      // 2. Resolve Metadata
      const [nftMeta, shopMeta] = await Promise.all([
        nftRefs.length > 0 ? suiClient.multiGetObjects({ ids: nftRefs, options: { showDisplay: true } }) : Promise.resolve([]),
        shopItemRefs.length > 0 ? suiClient.multiGetObjects({ ids: shopItemRefs, options: { showContent: true } }) : Promise.resolve([]),
      ]);

      const nMap = new Map(nftMeta.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.display?.data as any)]));
      const sMap = new Map(shopMeta.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.content as any)?.fields]));

      userNfts.forEach(o => {
        const d = nMap.get(o.nftId);
        if (d) o.character = { name: d.name, imageUrl: getIPFSGatewayUrl(d.image_url) };
      });

      userShop.forEach(o => {
        const ridObj = receiptObjs.find(r => r.data?.objectId === o.objectId);
        const iidRaw = (ridObj?.data?.content as any)?.fields?.item_id;
        const iid = typeof iidRaw === "string" ? iidRaw : iidRaw?.id;
        const f = sMap.get(iid);
        if (f) {
          o.imageUrl = f.image_animated || f.image_static;
          o.isAnimated = !!f.image_animated;
        }
      });

      setNftOrders(userNfts.sort((a, b) => b.createdAt - a.createdAt));
      setShopOrders(userShop.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error(err);
      setError("Sync failed. Check connection.");
    } finally {
      setLoading(false);
    }
  }, [account?.address]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    if (activeTab === "nft") return nftOrders;
    if (activeTab === "shop") return shopOrders;
    return [...nftOrders, ...shopOrders].sort((a, b) => b.createdAt - a.createdAt);
  }, [nftOrders, shopOrders, activeTab]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <LoaderCircle className="animate-spin text-sky-400" size={40} />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Manifests...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-10 bg-red-50 rounded-3xl border-4 border-red-100">
      <ShieldAlert className="mx-auto mb-2 text-red-500" size={32} />
      <p className="font-bold text-red-600">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit border-2 border-slate-200">
          {[
            { id: "all",  label: "All", icon: LayoutGrid,  count: nftOrders.length + shopOrders.length },
            { id: "nft",  label: "Rituals", icon: Sparkles, count: nftOrders.length },
            { id: "shop", label: "Shop Gear", icon: ShoppingBag, count: shopOrders.length },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-black hover:bg-white")}>
              <tab.icon size={14} /> {tab.label}
              <span className={cn("ml-1 px-1.5 py-0.5 rounded text-[9px] font-black", activeTab === tab.id ? "bg-white/20" : "bg-slate-200")}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="text-center py-20 opacity-50 flex flex-col items-center">
          <ShoppingBag className="mb-4 text-slate-300" size={64} strokeWidth={1.5} />
          <p className="font-black uppercase tracking-widest text-sm text-slate-400">No manifests found in sector</p>
          <a href="/shop" className="mt-6 text-sky-500 font-black hover:underline uppercase text-xs tracking-widest">Visit the Kapo Shop →</a>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleOrders.map((order) => {
            const si = getStatusInfo(order.status);
            const isNft = order.kind === "nft";
            const thumb = isNft ? order.character?.imageUrl : getIPFSGatewayUrl(order.imageUrl || "");
            const title = isNft ? (order.character?.name || "Spirit") : order.itemName;
            const amount = isNft ? (order.paymentAmount / 1e9).toFixed(3) : mistToSui(order.paymentAmount).toFixed(3);

            return (
              <div key={order.objectId} onClick={() => setSelectedOrder(order)}
                className="group bg-white border-4 border-slate-100 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:border-sky-200 transition-all hover:translate-x-1 shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden relative flex-shrink-0 shadow-inner">
                  {thumb && <Image src={thumb} alt="p" fill className="object-contain p-1" unoptimized={!isNft && (order as ShopOrder).isAnimated} />}
                </div>
                <div className="flex-grow text-center sm:text-left overflow-hidden w-full">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    {isNft ? <span className="bg-violet-100 text-violet-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Ritual</span> : <span className="bg-cyan-100 text-cyan-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Gear</span>}
                  </div>
                  <p className="font-bold text-slate-800 truncate uppercase text-lg italic">{title}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase mt-1">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-blue-500"><Hash size={10} /> {amount} SUI</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black border-2 flex items-center justify-center gap-1.5 uppercase ${si.bg} ${si.textColor} border-current/10`}>
                    {si.icon} {si.text}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white border-4 border-black rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-headline uppercase tracking-tight">Manifest Detail</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="w-32 h-32 rounded-3xl border-4 border-black overflow-hidden relative shadow-lg bg-slate-50 transform -rotate-3 flex-shrink-0">
                {selectedOrder.kind === "nft" ? (
                  selectedOrder.character?.imageUrl && <Image src={selectedOrder.character.imageUrl} alt="p" fill className="object-contain p-2" />
                ) : (
                  selectedOrder.imageUrl && <Image src={getIPFSGatewayUrl(selectedOrder.imageUrl)} alt="p" fill className="object-contain p-2" unoptimized={selectedOrder.isAnimated} />
                )}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <p className="text-2xl font-black uppercase italic tracking-tighter leading-tight truncate">
                  {selectedOrder.kind === "nft" ? (selectedOrder.character?.name || "Spirit") : selectedOrder.itemName}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {(selectedOrder.kind === "nft" ? selectedOrder.itemsSelected.split(",") : selectedOrder.itemsSelected).map((it, i) => (
                    <span key={i} className="bg-sky-50 border-2 border-black px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase">{it.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                <p className={cn("font-black text-xs uppercase flex items-center gap-1", getStatusInfo(selectedOrder.status).textColor)}>{getStatusInfo(selectedOrder.status).icon} {getStatusInfo(selectedOrder.status).text}</p>
              </div>
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Authorization</p>
                <p className="font-black text-slate-800 text-xs">{selectedOrder.kind === "nft" ? (selectedOrder.paymentAmount / 1e9).toFixed(3) : mistToSui(selectedOrder.paymentAmount).toFixed(3)} SUI</p>
              </div>
            </div>
            {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
              <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl relative overflow-hidden">
                <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                <p className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Logistics Hub</p>
                {selectedOrder.trackingNumber ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="text-center sm:text-left">
                      <p className="text-lg font-black text-blue-800 uppercase">{selectedOrder.carrier}</p>
                      <p className="text-[10px] font-mono font-bold text-blue-600 truncate">{selectedOrder.trackingNumber}</p>
                    </div>
                    <button onClick={() => { const url = getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber); if (url) window.open(url, "_blank"); }}
                      className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 transition-all font-black uppercase text-[10px]">
                      Track <ExternalLink size={14} />
                    </button>
                  </div>
                ) : <p className="italic text-blue-400 font-bold text-xs uppercase">Awaiting tracking feed...</p>}
              </div>
            ) : <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"><LoaderCircle className="mx-auto mb-2 text-slate-300 animate-spin" size={24} /><p className="italic text-slate-400 font-bold text-xs uppercase">Manifesting into physical form... 🧵</p></div>}
            <button onClick={() => setSelectedOrder(null)} className="w-full mt-8 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0_0_#000]">Close Log</button>
          </div>
        </div>
      )}
    </div>
  );
}
