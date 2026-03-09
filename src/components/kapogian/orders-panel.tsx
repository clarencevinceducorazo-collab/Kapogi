"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS, mistToSui } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { cn } from "@/lib/utils";

interface Order {
  objectId: string;
  type: "nft" | "shop";
  nftId?: string;
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

export function OrdersPanel({ account }: { account: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (account?.address) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [account?.address]);

  const loadOrders = async () => {
    if (!account?.address) return;
    setLoading(true);
    setError("");
    try {
      const nftEventType = `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`;
      const shopEventType = `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.SHOP_RECEIPT}::ReceiptCreated`;

      const fetchIds = async (type: string) => {
        let ids: string[] = [];
        let hasNext = true;
        let cursor: string | null = null;
        while (hasNext) {
          const page: any = await suiClient.queryEvents({
            query: { MoveEventType: type },
            cursor,
            order: "descending",
          });
          page.data.forEach((e: any) => { if (e.parsedJson?.buyer === account.address) ids.push(e.parsedJson?.receipt_id); });
          if (page.hasNextPage && page.nextCursor) cursor = page.nextCursor;
          else hasNext = false;
        }
        return ids;
      };

      const [nftIds, shopIds] = await Promise.all([fetchIds(nftEventType), fetchIds(shopEventType)]);
      const allIds = Array.from(new Set([...nftIds, ...shopIds])); // Deduplicate

      if (allIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const receiptObjects = [];
      for (let i = 0; i < allIds.length; i += 50) {
        const chunk = allIds.slice(i, i + 50);
        const res = await suiClient.multiGetObjects({ ids: chunk, options: { showContent: true } });
        receiptObjects.push(...res);
      }

      const parsed: Order[] = [];
      const nftRefs: string[] = [];
      const shopItemRefs: string[] = [];

      receiptObjects.forEach((res) => {
        if (!res.data?.content || res.data.content.dataType !== "moveObject") return;
        const f = res.data.content.fields as any;
        const isShop = !!f.item_id;

        const order: Order = {
          objectId: res.data.objectId,
          type: isShop ? "shop" : "nft",
          createdAt: Number(f.created_at),
          status: Number(f.status),
          paymentAmount: Number(f.payment_amount),
          trackingNumber: f.tracking_number || "",
          carrier: f.carrier || "",
          estimatedDelivery: Number(f.estimated_delivery || 0),
          itemName: isShop ? f.item_name : "Spirit Manifest",
          itemsSelected: isShop 
            ? [f.chosen_size, f.chosen_color].filter(v => v && v !== "N/A")
            : f.items_selected.split(",").map((s: string) => s.trim()),
        };

        if (isShop) {
          const itemId = f.item_id.id || f.item_id;
          if (itemId) shopItemRefs.push(itemId);
        } else {
          order.nftId = f.nft_id;
          if (f.nft_id) nftRefs.push(f.nft_id);
        }
        parsed.push(order);
      });

      const [nftData, shopItemData] = await Promise.all([
        nftRefs.length > 0 ? suiClient.multiGetObjects({ ids: nftRefs, options: { showDisplay: true } }) : Promise.resolve([]),
        shopItemRefs.length > 0 ? suiClient.multiGetObjects({ ids: shopItemRefs, options: { showContent: true } }) : Promise.resolve([]),
      ]);

      const nftMap = new Map(nftData.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.display?.data as any)]));
      const shopMap = new Map(shopItemData.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.content as any)?.fields]));

      const final = parsed.map(o => {
        if (o.type === "nft") {
          const d = nftMap.get(o.nftId!);
          if (d) { 
            o.itemName = d.name || o.itemName; 
            o.imageUrl = getIPFSGatewayUrl(d.image_url); 
          }
        } else {
          const r = receiptObjects.find(x => x.data?.objectId === o.objectId);
          const iid = r?.data?.content?.dataType === "moveObject" ? (r.data.content.fields as any).item_id.id || (r.data.content.fields as any).item_id : null;
          const f = shopMap.get(iid);
          if (f) { 
            o.imageUrl = f.image_animated || f.image_static; 
            o.isAnimated = !!f.image_animated; 
          } else {
            // Fallback for deleted shop items
            o.imageUrl = "/images/KapogianLogo.webp";
          }
        }
        return o;
      }).sort((a, b) => b.createdAt - a.createdAt);

      setOrders(final);
    } catch (err) {
      console.error(err);
      setError("Sync failed. Manifest data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return { text: "In Transit", icon: <Truck size={14} />, bg: "bg-blue-100", textColor: "text-blue-600" };
      case ORDER_STATUS.DELIVERED:
        return { text: "Delivered", icon: <CheckCircle size={14} />, bg: "bg-green-100", textColor: "text-green-600" };
      default:
        return { text: "Processing", icon: <Package size={14} />, bg: "bg-yellow-100", textColor: "text-yellow-600" };
    }
  };

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

  if (orders.length === 0) return (
    <div className="text-center py-20 opacity-50 flex flex-col items-center">
      <ShoppingBag className="mb-4 text-slate-300" size={64} strokeWidth={1.5} />
      <p className="font-bold uppercase tracking-widest text-sm text-slate-400">No gear found in inventory</p>
      <a href="/shop" className="mt-6 text-sky-500 font-bold hover:underline">Start Shopping →</a>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">
          <Package className="text-amber-500" /> My Orders
        </h3>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase">
          {orders.length} ITEMS
        </span>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => {
          const si = getStatusInfo(order.status);
          return (
            <div key={order.objectId} onClick={() => setSelectedOrder(order)}
              className="group bg-white border-4 border-slate-100 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:border-sky-200 transition-all hover:translate-x-1 shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden relative flex-shrink-0 shadow-inner">
                {order.imageUrl && <Image src={getIPFSGatewayUrl(order.imageUrl)} alt="o" fill className="object-contain p-1" unoptimized={order.isAnimated} />}
              </div>
              <div className="flex-grow text-center sm:text-left overflow-hidden w-full">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                  <p className="font-bold text-slate-800 truncate uppercase text-lg">{order.itemName}</p>
                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black/10 uppercase", order.type === 'shop' ? 'bg-cyan-100 text-cyan-600' : 'bg-pink-100 text-pink-600')}>
                    {order.type}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase mt-1">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Hash size={10} /> {mistToSui(order.paymentAmount).toFixed(3)} SUI</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black border-2 whitespace-nowrap flex items-center justify-center gap-1.5 uppercase ${si.bg} ${si.textColor} border-current/10`}>
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

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-headline mb-2 border-b-4 border-slate-50 pb-4 uppercase tracking-tight">Order Record</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pt-4">
              <div className="w-32 h-32 rounded-3xl border-4 border-black overflow-hidden relative shadow-lg bg-slate-50 transform -rotate-3">
                {selectedOrder.imageUrl && <Image src={getIPFSGatewayUrl(selectedOrder.imageUrl)} alt="o" fill className="object-contain p-2" unoptimized={selectedOrder.isAnimated} />}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <p className="text-2xl font-black uppercase italic tracking-tighter leading-tight truncate">{selectedOrder.itemName}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {selectedOrder.itemsSelected.map((it, i) => (
                    <span key={i} className="bg-yellow-100 border-2 border-black px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{it}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Clock size={10} /> Status</p><p className="font-bold text-slate-800 uppercase text-xs">{getStatusInfo(selectedOrder.status).text}</p></div>
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> Paid</p><p className="font-bold text-slate-800 text-xs">{mistToSui(selectedOrder.paymentAmount).toFixed(3)} SUI</p></div>
            </div>
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><MapPin size={10} /> Destination</p>
              <p className="font-bold text-slate-700 text-xs italic uppercase">Verified Vault Address</p>
            </div>
            {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
              <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl relative overflow-hidden">
                <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                <p className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Live Logistics</p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="text-center sm:text-left"><p className="text-lg font-black text-blue-800 uppercase">{selectedOrder.carrier}</p><p className="text-[10px] font-mono font-bold text-blue-600 mt-1 uppercase truncate">{selectedOrder.trackingNumber}</p></div>
                  <button onClick={() => { const u = `https://t.17track.net/en#nums=${selectedOrder.trackingNumber}`; window.open(u, "_blank"); }} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px]">Track <ExternalLink size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <LoaderCircle className="mx-auto mb-2 text-slate-300 animate-spin" size={24} />
                <p className="italic text-slate-400 font-bold text-xs uppercase tracking-tight">Summoning into physical form... 🧵</p>
              </div>
            )}
            <button onClick={() => setSelectedOrder(null)} className="w-full mt-8 bg-black hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Close Entry</button>
          </div>
        </div>
      )}
    </div>
  );
}
