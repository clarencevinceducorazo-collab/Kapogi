"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { suiClient } from "@/lib/sui";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { CONTRACT_ADDRESSES, ORDER_STATUS, mistToSui } from "@/lib/constants";
import {
  LoaderCircle,
  ShieldAlert,
  Package,
  Truck,
  CheckCircle,
  Wallet,
  ExternalLink,
  Calendar,
  Hash,
  ShoppingBag,
  ChevronRight,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";
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

export default function MyOrdersPage() {
  const account = useCurrentAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<"all" | "nft" | "shop">("all");

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
      const fetchRegistryIds = async (registryId: string) => {
        try {
          const obj = await suiClient.getObject({
            id: registryId,
            options: { showContent: true }
          });
          if (obj.data?.content?.dataType === "moveObject") {
            const fields = obj.data.content.fields as any;
            return (fields.receipt_ids || []).map((id: any) => typeof id === 'string' ? id : id.id || id);
          }
        } catch (e) {
          console.warn(`Registry ${registryId} not found.`);
        }
        return [];
      };

      const [nftIds, shopIds] = await Promise.all([
        fetchRegistryIds(CONTRACT_ADDRESSES.RECEIPT_REGISTRY_ID),
        fetchRegistryIds(CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID)
      ]);

      const allIds = Array.from(new Set([...nftIds, ...shopIds]));
      if (allIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const receiptObjects = [];
      for (let i = 0; i < allIds.length; i += 50) {
        const chunk = allIds.slice(i, i + chunkSize);
        const res = await suiClient.multiGetObjects({ ids: chunk, options: { showContent: true } });
        receiptObjects.push(...res);
      }

      const parsed: Order[] = [];
      const nftReferenceIds: string[] = [];
      const shopItemReferenceIds: string[] = [];

      receiptObjects.forEach((res) => {
        if (!res.data?.content || res.data.content.dataType !== "moveObject") return;
        const fields = res.data.content.fields as any;
        if (fields.buyer?.toLowerCase() !== account.address.toLowerCase()) return;

        const isShop = !!fields.item_id;

        const order: Order = {
          objectId: res.data.objectId,
          type: isShop ? "shop" : "nft",
          createdAt: Number(fields.created_at || 0),
          status: Number(fields.status || 0),
          paymentAmount: Number(fields.payment_amount || 0),
          trackingNumber: fields.tracking_number || "",
          carrier: fields.carrier || "",
          estimatedDelivery: Number(fields.estimated_delivery || 0),
          itemName: isShop ? fields.item_name : "Spirit Manifest",
          itemsSelected: isShop 
            ? [fields.chosen_size, fields.chosen_color].filter(v => v && v !== "N/A")
            : (fields.items_selected || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        };

        if (isShop) {
          const itemId = typeof fields.item_id === 'string' ? fields.item_id : fields.item_id?.id || fields.item_id;
          if (itemId) shopItemReferenceIds.push(itemId);
        } else {
          const nftId = typeof fields.nft_id === 'string' ? fields.nft_id : fields.nft_id?.id || fields.nft_id;
          order.nftId = nftId;
          if (nftId) nftReferenceIds.push(nftId);
        }

        parsed.push(order);
      });

      const [nftDataRes, shopItemDataRes] = await Promise.all([
        nftReferenceIds.length > 0 
          ? suiClient.multiGetObjects({ ids: nftReferenceIds, options: { showDisplay: true } })
          : Promise.resolve([]),
        shopItemReferenceIds.length > 0
          ? suiClient.multiGetObjects({ ids: shopItemReferenceIds, options: { showContent: true } })
          : Promise.resolve([]),
      ]);

      const nftMap = new Map(nftDataRes.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.display?.data as any)]));
      const shopMap = new Map(shopItemDataRes.filter(o => o.data).map(o => [o.data?.objectId, (o.data?.content as any)?.fields]));

      const finalOrders = parsed.map(order => {
        if (order.type === "nft") {
          const display = nftMap.get(order.nftId!);
          if (display) {
            order.itemName = display.name || order.itemName;
            order.imageUrl = getIPFSGatewayUrl(display.image_url);
          }
        } else {
          const receiptObj = receiptObjects.find(r => r.data?.objectId === order.objectId);
          const iidRaw = (receiptObj?.data?.content as any)?.fields?.item_id;
          const itemId = typeof iidRaw === 'string' ? iidRaw : iidRaw?.id || iidRaw;
          
          const fields = shopMap.get(itemId);
          if (fields) {
            order.imageUrl = fields.image_animated || fields.image_static;
            order.isAnimated = !!fields.image_animated;
          }
        }
        return order;
      }).sort((a, b) => b.createdAt - a.createdAt);

      setOrders(finalOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Sync failed. Manifest data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter(o => o.type === filter);
  }, [orders, filter]);

  const getStatusInfo = (status: number) => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return { text: "In Transit", icon: <Truck size={14} />, bg: "bg-blue-400", textColor: "text-white" };
      case ORDER_STATUS.DELIVERED:
        return { text: "Delivered", icon: <CheckCircle size={14} />, bg: "bg-green-500", textColor: "text-white" };
      default:
        return { text: "Processing", icon: <Package size={14} />, bg: "bg-yellow-400", textColor: "text-black" };
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-black selection:text-white relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/images/kapogian_background.png" alt="bg" fill className="object-cover" priority />
      </div>
      <PageHeader />
      <main className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-block bg-black text-white px-4 py-1 mb-4 rounded-lg font-black text-xs uppercase tracking-widest">
                Fulfillment Log
              </div>
              <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9]" style={{ textShadow: "6px 6px 0px #000" }}>
                <span className="text-black" style={{ WebkitTextStroke: "2px black" }}>Order </span>
                <span className="text-white" style={{ WebkitTextStroke: "2px black" }}>History</span>
              </h1>
            </div>

            <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-[1.5rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              {[
                { id: "all",  label: "All",    icon: Layers },
                { id: "nft",  label: "Rituals", icon: Sparkles },
                { id: "shop", label: "Shop",    icon: ShoppingBag },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    filter === btn.id 
                      ? "bg-black text-white" 
                      : "text-slate-400 hover:text-black hover:bg-slate-50"
                  )}
                >
                  <btn.icon size={14} />
                  {btn.label}
                </button>
              ))}
            </div>
          </header>

          {!account ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Wallet size={48} className="mx-auto mb-8" />
              <h3 className="text-4xl font-black uppercase mb-4 italic">Sync Required</h3>
              <p className="font-bold text-gray-500 uppercase mb-10">Connect your wallet to view your manifests.</p>
              <CustomConnectButton className="!px-12 !py-5 !text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
            </div>
          ) : loading ? (
            <div className="h-[40vh] flex flex-col items-center justify-center gap-6 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LoaderCircle size={64} className="animate-spin text-black" />
              <p className="font-black uppercase tracking-widest text-xl">Scanning Blockchain...</p>
            </div>
          ) : error ? (
            <div className="bg-white border-4 border-black rounded-[2rem] p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <ShieldAlert size={48} className="text-red-600 mx-auto mb-8" />
              <h3 className="text-4xl font-black uppercase mb-4 italic">System Error</h3>
              <p className="font-bold text-gray-500 uppercase">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <ShoppingBag size={48} className="mx-auto mb-8" />
              <h3 className="text-4xl font-black uppercase mb-4 italic">No Orders</h3>
              <p className="font-bold text-gray-500 uppercase mb-10">You haven't made a purchase in this sector yet.</p>
              <a href="/shop"><button className="bg-yellow-400 border-4 border-black font-black px-12 py-5 rounded-2xl text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase italic active:translate-y-1 transition-all">Visit Shop</button></a>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.objectId} order={order} statusInfo={getStatusInfo(order.status)} onClick={() => setSelectedOrder(order)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <PageFooter />

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          statusInfo={getStatusInfo(selectedOrder.status)}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function OrderCard({ order, statusInfo, onClick }: { order: Order; statusInfo: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-8">
      <div className="relative shrink-0">
        <div className="w-28 h-28 bg-slate-50 rounded-3xl border-4 border-black overflow-hidden relative group-hover:rotate-3 transition-transform">
          {order.imageUrl ? <Image src={getIPFSGatewayUrl(order.imageUrl)} alt="img" fill className="object-contain p-2" unoptimized={order.isAnimated} /> : <div className="flex items-center justify-center h-full text-slate-200"><Package size={40} /></div>}
        </div>
        <div className={cn("absolute -bottom-2 -right-2 p-2 rounded-xl border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", statusInfo.bg)}>
          {statusInfo.icon}
        </div>
      </div>
      <div className="flex-grow text-center md:text-left min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
          <h3 className="text-3xl font-black uppercase tracking-tight truncate italic">{order.itemName}</h3>
          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-black uppercase self-center md:self-auto", order.type === 'shop' ? 'bg-cyan-400' : 'bg-pink-400')}>
            {order.type}
          </span>
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1.5 text-blue-500"><Hash size={14} /> {mistToSui(order.paymentAmount).toFixed(3)} SUI</span>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <button className={cn("w-full flex items-center justify-between gap-6 px-8 py-4 border-4 border-black rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-y-1", statusInfo.bg, statusInfo.textColor)}>
          {statusInfo.text} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function OrderModal({ order, statusInfo, onClose }: { order: Order; statusInfo: any; onClose: () => void }) {
  const getTrackingUrl = (carrier: string, num: string) => {
    const c = carrier.toUpperCase();
    if (c.includes("UPS")) return `https://www.ups.com/track?tracknum=${num}`;
    if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    if (c.includes("LBC")) return `https://www.lbcexpress.com/track/?tracking_no=${num}`;
    if (c.includes("J&T") || c.includes("SPX") || c.includes("NINJA")) return `https://t.17track.net/en#nums=${num}`;
    return "";
  };

  const trackingUrl = order.trackingNumber ? getTrackingUrl(order.carrier, order.trackingNumber) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-black text-white p-10 flex justify-between items-start border-b-4 border-black shrink-0">
          <div>
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">Manifest</h2>
            <p className="font-mono text-[10px] opacity-40 mt-3 uppercase truncate max-w-md">ID: {order.objectId}</p>
          </div>
          <button onClick={onClose} className="bg-white text-black p-3 rounded-2xl border-4 border-white hover:bg-red-500 hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"><X size={28} /></button>
        </div>
        <div className="p-10 space-y-10 overflow-y-auto fancy-scrollbar">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0 overflow-hidden relative transform -rotate-2">
              {order.imageUrl ? <Image src={getIPFSGatewayUrl(order.imageUrl)} alt="img" fill className="object-contain p-2" unoptimized={order.isAnimated} /> : <div className="flex items-center justify-center h-full text-slate-200"><Package size={64} /></div>}
            </div>
            <div className="flex-grow space-y-6 text-center md:text-left pt-2">
              <div>
                <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-black mb-3 text-xs font-black uppercase shadow-sm", statusInfo.bg, statusInfo.textColor)}>
                  {statusInfo.icon} {statusInfo.text}
                </div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85]">{order.itemName}</h3>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                {order.itemsSelected.map((it, i) => (
                  <span key={i} className="px-4 py-1.5 bg-sky-50 border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest">{it}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 border-4 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5"><Clock size={12} /> Authorization</p>
              <p className="font-black text-xl text-blue-600">{mistToSui(order.paymentAmount).toFixed(3)} SUI</p>
            </div>
            <div className="bg-slate-50 border-4 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5"><Calendar size={12} /> Time Stamp</p>
              <p className="font-black text-xl text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-slate-950 text-white border-4 border-black rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl">
            <Truck className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10 rotate-12" />
            <h4 className="text-2xl font-black uppercase mb-6 flex items-center gap-3 italic text-yellow-400"><Sparkles size={24} /> Logistics Status</h4>
            {order.status >= ORDER_STATUS.SHIPPED ? (
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-6 border-b border-white/10 pb-6">
                  <div><p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Carrier Service</p><p className="font-black text-lg text-white uppercase">{order.carrier}</p></div>
                  <div><p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Tracking ID</p><p className="font-mono text-sm font-bold truncate text-sky-400">{order.trackingNumber}</p></div>
                </div>
                {trackingUrl && (
                  <button onClick={() => window.open(trackingUrl, "_blank")} className="w-full py-4 bg-blue-500 text-white border-4 border-black rounded-2xl font-black uppercase tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(59,130,246,0.4)] hover:bg-blue-400 transition-all flex items-center justify-center gap-3 text-xs active:translate-y-1 active:shadow-none">
                    External Manifest Tracking <ExternalLink size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-10 italic text-white/30 font-black uppercase text-[11px] tracking-[0.3em] border-4 border-dashed border-white/5 rounded-3xl">
                Asset is being manifested into physical form... 🧵
              </div>
            )}
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t-4 border-black shrink-0">
          <button onClick={onClose} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-800 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none">Close Log Entry</button>
        </div>
      </div>
    </div>
  );
}
