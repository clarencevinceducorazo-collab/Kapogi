'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  MapPin
} from 'lucide-react';
import { suiClient } from '@/lib/sui';
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS } from '@/lib/constants';
import { getIPFSGatewayUrl } from '@/lib/pinata';

interface Order {
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

export function OrdersPanel({ account }: { account: any }) {
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
      // 1. Fetch ALL ReceiptCreated events
      let allReceiptIds: string[] = [];
      let allBuyerAddresses: string[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;

      while (hasNextPage) {
        const page: any = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`,
          },
          cursor: cursor,
          order: "ascending",
        });

        page.data.forEach((event: any) => {
          allReceiptIds.push(event.parsedJson?.receipt_id);
          allBuyerAddresses.push(event.parsedJson?.buyer);
        });

        if (page.hasNextPage && page.nextCursor) {
          cursor = page.nextCursor;
        } else {
          hasNextPage = false;
        }
      }

      // 2. Filter to current user's receipts
      const userReceiptIds = allReceiptIds.filter(
        (_, idx) => allBuyerAddresses[idx] === account.address,
      );

      if (userReceiptIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // 3. Fetch receipt objects
      const receipts = [];
      const chunkSize = 50;
      for (let i = 0; i < userReceiptIds.length; i += chunkSize) {
        const chunk = userReceiptIds.slice(i, i + chunkSize);
        const chunkReceipts = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true },
        });
        receipts.push(...chunkReceipts);
      }

      const validReceipts = receipts.filter((r) => r.data);

      const parsedReceipts: Omit<Order, "character">[] = validReceipts
        .map((obj: any) => ({
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          itemsSelected: obj.data.content.fields.items_selected,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || "",
          carrier: obj.data.content.fields.carrier || "",
          estimatedDelivery: Number(
            obj.data.content.fields.estimated_delivery || 0,
          ),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      // 4. Fetch NFT display data
      const nftIds = parsedReceipts.map((r) => r.nftId);
      const nftObjects = await suiClient.multiGetObjects({
        ids: nftIds,
        options: { showDisplay: true },
      });

      const nftsMap = new Map(
        nftObjects
          .filter((obj) => obj.data)
          .map((obj) => [
            obj.data?.objectId,
            {
              imageUrl: getIPFSGatewayUrl(
                (obj.data?.display?.data as any)?.image_url,
              ),
              name: (obj.data?.display?.data as any)?.name,
            },
          ]),
      );

      setOrders(
        parsedReceipts.map((receipt) => ({
          ...receipt,
          character: nftsMap.get(receipt.nftId),
        })) as Order[],
      );
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders. Please try again later.");
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

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const c = carrier.toUpperCase();
    if (c.includes("UPS")) return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    if (c.includes("FEDEX")) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    if (c.includes("LBC")) return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;
    if (c.includes("J&T") || c.includes("SPX") || c.includes("NINJA")) return `https://t.17track.net/en#nums=${trackingNumber}`;
    return "";
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
      <a href="/summoning" className="mt-6 text-sky-500 font-bold hover:underline">Start Summoning →</a>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-2xl tracking-tight font-semibold text-slate-800 flex items-center gap-2">
          <Package className="text-amber-500" /> My Orders
        </h3>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase">{orders.length} ITEMS</span>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => {
          const si = getStatusInfo(order.status);
          return (
            <div 
              key={order.objectId}
              onClick={() => setSelectedOrder(order)}
              className="group bg-white border-4 border-slate-100 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:border-sky-200 transition-all hover:translate-x-1 shadow-sm"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden relative flex-shrink-0 shadow-inner">
                {order.character?.imageUrl && (
                  <Image src={order.character.imageUrl} alt="nft" fill className="object-contain p-1" />
                )}
              </div>
              <div className="flex-grow text-center sm:text-left overflow-hidden w-full">
                <p className="font-bold text-slate-800 truncate uppercase text-lg">{order.character?.name || 'Unknown'}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase mt-1">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Hash size={10} /> {(order.paymentAmount / 1e9).toFixed(2)} SUI</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border-2 whitespace-nowrap flex items-center justify-center gap-1.5 ${si.bg} ${si.textColor} border-current/10`}>
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

      {/* Detail Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-headline mb-6 border-b-4 border-slate-50 pb-4">Manifest Detail</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="w-32 h-32 rounded-3xl border-4 border-black overflow-hidden relative shadow-lg bg-slate-50">
                {selectedOrder.character?.imageUrl && <Image src={selectedOrder.character.imageUrl} alt="nft" fill className="object-contain p-2" />}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">{selectedOrder.character?.name}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {selectedOrder.itemsSelected.split(',').map((it, i) => (
                    <span key={i} className="bg-yellow-100 border-2 border-black px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{it.trim()}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl flex flex-col items-center sm:items-start">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Clock size={10} /> Status</p>
                <p className="font-bold text-slate-800">{getStatusInfo(selectedOrder.status).text}</p>
              </div>
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl flex flex-col items-center sm:items-start">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> Payment</p>
                <p className="font-bold text-slate-800">{(selectedOrder.paymentAmount / 1e9).toFixed(2)} SUI</p>
              </div>
            </div>

            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><MapPin size={10} /> Shipping To</p>
              <p className="font-bold text-slate-700 text-sm italic">Verified Vault Address</p>
            </div>

            {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
              <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={64} /></div>
                <p className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Live Logistics</p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="text-center sm:text-left">
                    <p className="text-xl font-black text-blue-800">{selectedOrder.carrier}</p>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-1">{selectedOrder.trackingNumber}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const url = getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber);
                      if (url) window.open(url, '_blank');
                    }}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    Track <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <LoaderCircle className="mx-auto mb-2 text-slate-300 animate-spin" size={24} />
                <p className="italic text-slate-400 font-bold text-sm">Character is being summoned into physical form... 🧵</p>
              </div>
            )}
            
            <button 
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-8 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
