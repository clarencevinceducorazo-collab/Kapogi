"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { suiClient } from "@/lib/sui";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS, SHOP_ITEM_TYPE_LABELS, mistToSui } from "@/lib/constants";
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
  MapPin,
  Clock,
  X,
  Sparkles,
} from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";

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

interface StatusInfo {
  text: string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}

export default function MyOrdersPage() {
  const account = useCurrentAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      // Discovery: Fetch events for both NFT Receipts and Shop Receipts
      const nftEventType = `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`;
      const shopEventType = `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.SHOP_RECEIPT}::ReceiptCreated`;

      const fetchUserReceiptIds = async (eventType: string) => {
        let ids: string[] = [];
        let hasNextPage = true;
        let cursor: string | null = null;

        while (hasNextPage) {
          const page: any = await suiClient.queryEvents({
            query: { MoveEventType: eventType },
            cursor: cursor,
            order: "descending",
          });

          page.data.forEach((event: any) => {
            if (event.parsedJson?.buyer === account.address) {
              ids.push(event.parsedJson?.receipt_id);
            }
          });

          if (page.hasNextPage && page.nextCursor) {
            cursor = page.nextCursor;
          } else {
            hasNextPage = false;
          }
        }
        return ids;
      };

      const [nftReceiptIds, shopReceiptIds] = await Promise.all([
        fetchUserReceiptIds(nftEventType),
        fetchUserReceiptIds(shopEventType),
      ]);

      const allIds = [...nftReceiptIds, ...shopReceiptIds];
      if (allIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch all receipt objects
      const receiptObjects = [];
      const chunkSize = 50;
      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize);
        const chunkRes = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true },
        });
        receiptObjects.push(...chunkRes);
      }

      // Filter and parse
      const parsed: Order[] = [];
      const nftReferenceIds: string[] = [];
      const shopItemReferenceIds: string[] = [];

      receiptObjects.forEach((res) => {
        if (!res.data?.content || res.data.content.dataType !== "moveObject") return;
        const fields = res.data.content.fields as any;
        const isShop = !!fields.item_id;

        const order: Order = {
          objectId: res.data.objectId,
          type: isShop ? "shop" : "nft",
          createdAt: Number(fields.created_at),
          status: Number(fields.status),
          paymentAmount: Number(fields.payment_amount),
          trackingNumber: fields.tracking_number || "",
          carrier: fields.carrier || "",
          estimatedDelivery: Number(fields.estimated_delivery || 0),
          itemName: isShop ? fields.item_name : "Unnamed Kapogian",
          itemsSelected: isShop 
            ? [fields.chosen_size, fields.chosen_color].filter(v => v && v !== "N/A")
            : fields.items_selected.split(",").map((s: string) => s.trim()),
        };

        if (isShop) {
          shopItemReferenceIds.push(fields.item_id.id || fields.item_id);
        } else {
          order.nftId = fields.nft_id;
          if (fields.nft_id) nftReferenceIds.push(fields.nft_id);
        }

        parsed.push(order);
      });

      // Fetch images for NFTs and ShopItems
      const [nftDataRes, shopItemDataRes] = await Promise.all([
        nftReferenceIds.length > 0 
          ? suiClient.multiGetObjects({ ids: nftReferenceIds, options: { showDisplay: true } })
          : Promise.resolve([]),
        shopItemReferenceIds.length > 0
          ? suiClient.multiGetObjects({ ids: shopItemReferenceIds, options: { showContent: true } })
          : Promise.resolve([]),
      ]);

      const nftMap = new Map(nftDataRes.map(o => [o.data?.objectId, (o.data?.display?.data as any)]));
      const shopMap = new Map(shopItemDataRes.map(o => [o.data?.objectId, (o.data?.content as any)?.fields]));

      // Final Assembly
      const finalOrders = parsed.map(order => {
        if (order.type === "nft") {
          const display = nftMap.get(order.nftId!);
          if (display) {
            order.itemName = display.name || order.itemName;
            order.imageUrl = getIPFSGatewayUrl(display.image_url);
          }
        } else {
          // Find the shop item ID from the object again (since we didn't store it in the array mapping yet)
          // We'll re-extract from the original objects if needed, but let's assume the order preserved relative to fetch.
          // Actually let's just find the shop item ID in the receipt fields.
          const receiptObj = receiptObjects.find(r => r.data?.objectId === order.objectId);
          const itemId = receiptObj?.data?.content?.dataType === "moveObject" 
            ? (receiptObj.data.content.fields as any).item_id.id || (receiptObj.data.content.fields as any).item_id
            : null;
          
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
      setError("Sync failed. The library is temporarily unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number): StatusInfo => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return { text: "In Transit", icon: <Truck size={14} />, bg: "bg-blue-400", textColor: "text-white" };
      case ORDER_STATUS.DELIVERED:
        return { text: "Delivered", icon: <CheckCircle size={14} />, bg: "bg-green-500", textColor: "text-white" };
      default:
        return { text: "Processing", icon: <Package size={14} />, bg: "bg-yellow-400", textColor: "text-black" };
    }
  };

  const getTrackingUrl = (carrier: string, num: string) => {
    const c = carrier.toUpperCase();
    if (c.includes("UPS")) return `https://www.ups.com/track?tracknum=${num}`;
    if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    if (c.includes("LBC")) return `https://www.lbcexpress.com/track/?tracking_no=${num}`;
    if (c.includes("J&T") || c.includes("SPX") || c.includes("NINJA")) return `https://t.17track.net/en#nums=${num}`;
    return "";
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-black selection:text-white relative">
      <div className="fixed inset-0 -z-10">
        <Image src="/images/kapogian_background.png" alt="bg" fill className="object-cover" priority />
      </div>
      <PageHeader />
      <main className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <header className="mb-12 text-center md:text-left">
            <div className="inline-block bg-black text-white px-4 py-1 mb-4 rounded-lg font-black text-xs uppercase tracking-widest">
              Fulfillment Log
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9]" style={{ textShadow: "6px 6px 0px #000" }}>
              <span className="text-black" style={{ WebkitTextStroke: "2px black" }}>Order </span>
              <span className="text-white" style={{ WebkitTextStroke: "2px black" }}>History</span>
            </h1>
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
              <p className="font-bold text-gray-50">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <ShoppingBag size={48} className="mx-auto mb-8" />
              <h3 className="text-4xl font-black uppercase mb-4 italic">No Orders</h3>
              <p className="font-bold text-gray-500 uppercase mb-10">You haven't purchased anything yet.</p>
              <a href="/shop"><button className="bg-yellow-400 border-4 border-black font-black px-12 py-5 rounded-2xl text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase italic">Visit Shop</button></a>
            </div>
          ) : (
            <div className="bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-black text-white px-8 py-4 flex justify-between items-center border-b-4 border-black">
                <span className="font-black uppercase italic tracking-widest text-sm">Active Manifests ({orders.length})</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white" />
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-6 bg-[#fafafa] overflow-y-auto max-h-[70vh]">
                {orders.map((order) => (
                  <OrderCard key={order.objectId} order={order} statusInfo={getStatusInfo(order.status)} onClick={() => setSelectedOrder(order)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <PageFooter />

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          statusInfo={getStatusInfo(selectedOrder.status)}
          trackingUrl={getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber)}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function OrderCard({ order, statusInfo, onClick }: { order: Order; statusInfo: StatusInfo; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <div className="w-24 h-24 bg-gray-100 rounded-2xl border-4 border-black overflow-hidden relative group-hover:rotate-3 transition-transform">
          {order.imageUrl && <Image src={order.imageUrl} alt="img" fill className="object-contain p-1" unoptimized={order.isAnimated} />}
        </div>
        <div className={cn("absolute -bottom-2 -right-2 p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", statusInfo.bg)}>
          {statusInfo.icon}
        </div>
      </div>
      <div className="flex-grow text-center md:text-left min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
          <h3 className="text-2xl font-black uppercase tracking-tight truncate">{order.itemName}</h3>
          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase self-center md:self-auto border-2 border-black", order.type === 'shop' ? 'bg-cyan-400' : 'bg-pink-400')}>
            {order.type}
          </span>
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase">
          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Hash size={12} /> {mistToSui(order.paymentAmount).toFixed(3)} SUI</span>
        </div>
      </div>
      <div className="w-full md:w-auto">
        <button className={cn("w-full flex items-center justify-between gap-4 px-6 py-3 border-4 border-black rounded-xl font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", statusInfo.bg, statusInfo.textColor)}>
          {statusInfo.text} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function OrderModal({ order, statusInfo, trackingUrl, onClose }: { order: Order; statusInfo: StatusInfo; trackingUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-black text-white p-8 flex justify-between items-start border-b-4 border-black shrink-0">
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Manifest</h2>
            <p className="font-mono text-[10px] opacity-60 mt-2 uppercase truncate max-w-md">ID: {order.objectId}</p>
          </div>
          <button onClick={onClose} className="bg-white text-black p-2 rounded-xl border-2 border-white hover:bg-red-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-40 h-40 bg-slate-50 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0 overflow-hidden relative transform -rotate-2">
              {order.imageUrl && <Image src={order.imageUrl} alt="img" fill className="object-contain p-2" unoptimized={order.isAnimated} />}
            </div>
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black mb-2 text-xs font-black uppercase", statusInfo.bg, statusInfo.textColor)}>
                  {statusInfo.icon} {statusInfo.text}
                </div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{order.itemName}</h3>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {order.itemsSelected.map((it, i) => (
                  <span key={i} className="px-3 py-1 bg-sky-50 border-2 border-black rounded-lg text-[10px] font-black uppercase">{it}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Authorization</p>
              <p className="font-black text-lg">{mistToSui(order.paymentAmount).toFixed(3)} SUI</p>
            </div>
            <div className="bg-slate-50 border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Time Stamp</p>
              <p className="font-black text-lg">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white border-4 border-black rounded-3xl p-6 relative overflow-hidden">
            <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            <h4 className="text-xl font-black uppercase mb-4 flex items-center gap-2 italic"><Sparkles size={20} className="text-yellow-400" /> Logistics Status</h4>
            {order.status >= ORDER_STATUS.SHIPPED ? (
              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] font-black uppercase text-white/40">Carrier</p><p className="font-bold text-sm">{order.carrier}</p></div>
                  <div><p className="text-[9px] font-black uppercase text-white/40">Tracking</p><p className="font-mono text-xs font-bold truncate">{order.trackingNumber}</p></div>
                </div>
                {trackingUrl && (
                  <button onClick={() => window.open(trackingUrl, "_blank")} className="w-full py-3 bg-blue-500 text-white border-2 border-white/20 rounded-xl font-black uppercase shadow-lg hover:bg-blue-400 transition-all flex items-center justify-center gap-2 text-xs mt-2">
                    External Tracking <ExternalLink size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 italic text-white/40 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-white/10 rounded-2xl">
                Asset is being manifested into physical form... 🧵
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t-4 border-black shrink-0">
          <button onClick={onClose} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase hover:bg-slate-800 transition-all">Close Log</button>
        </div>
      </div>
    </div>
  );
}
