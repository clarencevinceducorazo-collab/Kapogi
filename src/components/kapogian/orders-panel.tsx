
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
  ExternalLink
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
    if (account?.address) loadOrders();
    else setLoading(false);
  }, [account?.address]);

  const loadOrders = async () => {
    if (!account?.address) return;
    setLoading(true);
    setError("");
    try {
      let allReceiptIds: string[] = [];
      let allBuyerAddresses: string[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      while (hasNextPage) {
        const page: any = await suiClient.queryEvents({
          query: {
            MoveEventType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ORDER_RECEIPT}::ReceiptCreated`,
          },
          cursor,
          order: "ascending",
        });
        page.data.forEach((event: any) => {
          allReceiptIds.push(event.parsedJson?.receipt_id);
          allBuyerAddresses.push(event.parsedJson?.buyer);
        });
        if (page.hasNextPage && page.nextCursor) cursor = page.nextCursor;
        else hasNextPage = false;
      }
      const userReceiptIds = allReceiptIds.filter(
        (_, idx) => allBuyerAddresses[idx] === account.address,
      );
      if (userReceiptIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const receipts: any[] = [];
      for (let i = 0; i < userReceiptIds.length; i += 50) {
        const chunk = userReceiptIds.slice(i, i + chunkSize);
        const chunkReceipts = await suiClient.multiGetObjects({
          ids: chunk,
          options: { showContent: true },
        });
        receipts.push(...chunkReceipts);
      }
      const chunkSize = 50;
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

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <LoaderCircle className="animate-spin text-slate-400" size={40} />
    </div>
  );

  if (error) return (
    <div className="text-center py-10 bg-red-50 rounded-3xl border-4 border-red-100">
      <ShieldAlert className="mx-auto mb-2 text-red-500" size={32} />
      <p className="font-bold text-red-600">{error}</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-20 opacity-50">
      <ShoppingBag className="mx-auto mb-4" size={48} />
      <p className="font-bold uppercase tracking-widest text-sm">No orders found</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-2xl tracking-tight font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Package className="text-amber-500" /> My Orders ({orders.length})
      </h3>
      {orders.map((order) => {
        const si = getStatusInfo(order.status);
        return (
          <div 
            key={order.objectId}
            onClick={() => setSelectedOrder(order)}
            className="group bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-4 flex items-center gap-4 cursor-pointer hover:border-slate-200 transition-all hover:translate-x-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 overflow-hidden relative flex-shrink-0">
              {order.character?.imageUrl && <Image src={order.character.imageUrl} alt="nft" fill className="object-cover" />}
            </div>
            <div className="flex-grow">
              <p className="font-bold text-slate-800 truncate uppercase">{order.character?.name || 'Unknown'}</p>
              <div className="flex gap-3 text-[10px] font-black text-slate-400 uppercase mt-1">
                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Hash size={10} /> {(order.paymentAmount / 1e9).toFixed(2)} SUI</span>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap flex items-center gap-1.5 ${si.bg} ${si.textColor} border-current/20`}>
              {si.icon} {si.text}
            </span>
          </div>
        );
      })}

      {/* Detail Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-colors"><X size={24} /></button>
            <h2 className="text-3xl font-headline mb-6 border-b-4 border-slate-100 pb-4">Order Detail</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-3xl border-4 border-black overflow-hidden relative shadow-lg">
                {selectedOrder.character?.imageUrl && <Image src={selectedOrder.character.imageUrl} alt="nft" fill className="object-cover" />}
              </div>
              <div>
                <p className="text-2xl font-black uppercase italic tracking-tighter">{selectedOrder.character?.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedOrder.itemsSelected.split(',').map((it, i) => (
                    <span key={i} className="bg-yellow-100 border-2 border-black px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">{it.trim()}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                <p className="font-bold text-slate-800">{getStatusInfo(selectedOrder.status).text}</p>
              </div>
              <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment</p>
                <p className="font-bold text-slate-800">{(selectedOrder.paymentAmount / 1e9).toFixed(2)} SUI</p>
              </div>
            </div>

            {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
              <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl">
                <p className="text-xs font-black text-blue-400 uppercase mb-2">Live Tracking</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-blue-800">{selectedOrder.carrier}</p>
                    <p className="text-xs font-mono text-blue-600">{selectedOrder.trackingNumber}</p>
                  </div>
                  <button className="bg-blue-500 text-white p-3 rounded-2xl shadow-lg border-2 border-blue-600 hover:scale-105 transition-transform">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center py-6 italic text-slate-400 font-bold text-sm">Character is being summoned into physical form... 🧵</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
