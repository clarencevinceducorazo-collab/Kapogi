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
      return { text: "In Transit",  icon: <Truck size={14} />,       bg: "bg-blue-100",   textColor: "text-blue-600"  };
    case ORDER_STATUS.DELIVERED:
      return { text: "Delivered",   icon: <CheckCircle size={14} />, bg: "bg-green-100",  textColor: "text-green-600" };
    default:
      return { text: "Processing",  icon: <Package size={14} />,     bg: "bg-yellow-100", textColor: "text-yellow-600"};
  }
}

function getTrackingUrl(carrier: string, trackingNumber: string) {
  const c = carrier.toUpperCase();
  if (c.includes("UPS"))    return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c.includes("FEDEX"))  return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  if (c.includes("LBC"))    return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;
  return `https://t.17track.net/en#nums=${trackingNumber}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPanel({ account }: { account: any }) {
  const [nftOrders,  setNftOrders]  = useState<NftOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loadingNft,  setLoadingNft]  = useState(true);
  const [loadingShop, setLoadingShop] = useState(true);
  const [errorNft,  setErrorNft]  = useState("");
  const [errorShop, setErrorShop] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (account?.address) {
      loadNftOrders();
      loadShopOrders();
    } else {
      setLoadingNft(false);
      setLoadingShop(false);
    }
  }, [account?.address]);

  // ── NFT Ritual Orders ──────────────────────────────────────────────────────
  const loadNftOrders = async () => {
    if (!account?.address) return;
    setLoadingNft(true);
    setErrorNft("");
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
        hasNextPage = page.hasNextPage && !!page.nextCursor;
        cursor = page.nextCursor ?? null;
      }

      const userReceiptIds = allReceiptIds.filter(
        (_, idx) => allBuyerAddresses[idx] === account.address,
      );
      if (userReceiptIds.length === 0) { setNftOrders([]); return; }

      const receipts = [];
      for (let i = 0; i < userReceiptIds.length; i += 50) {
        const chunk = userReceiptIds.slice(i, i + 50);
        const res = await suiClient.multiGetObjects({ ids: chunk, options: { showContent: true } });
        receipts.push(...res);
      }

      const parsed = receipts
        .filter((r) => r.data)
        .map((obj: any): Omit<NftOrder, "character"> => ({
          kind: "nft",
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          itemsSelected: obj.data.content.fields.items_selected,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || "",
          carrier: obj.data.content.fields.carrier || "",
          estimatedDelivery: Number(obj.data.content.fields.estimated_delivery || 0),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      const nftIds = parsed.map((r) => r.nftId);
      const nftObjects = await suiClient.multiGetObjects({ ids: nftIds, options: { showDisplay: true } });
      const nftsMap = new Map(
        nftObjects
          .filter((obj) => obj.data)
          .map((obj) => [
            obj.data?.objectId,
            {
              imageUrl: getIPFSGatewayUrl((obj.data?.display?.data as any)?.image_url),
              name: (obj.data?.display?.data as any)?.name,
            },
          ]),
      );

      setNftOrders(parsed.map((r) => ({ ...r, character: nftsMap.get(r.nftId) })) as NftOrder[]);
    } catch (err) {
      console.error("Failed to load NFT orders:", err);
      setErrorNft("Failed to load ritual orders. Please try again.");
    } finally {
      setLoadingNft(false);
    }
  };

  // ── Shop Orders ────────────────────────────────────────────────────────────
  const loadShopOrders = async () => {
    if (!account?.address) return;
    setLoadingShop(true);
    setErrorShop("");
    try {
      const userAddr = account.address.toLowerCase();

      const registryObj = await suiClient.getObject({
        id: CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID,
        options: { showContent: true },
      });
      if (registryObj.data?.content?.dataType !== "moveObject") throw new Error("Registry not found");

      const registryFields = registryObj.data.content.fields as any;
      const receiptIds: string[] = registryFields.receipt_ids || [];
      if (receiptIds.length === 0) { setShopOrders([]); return; }

      const receiptObjects = [];
      for (let i = 0; i < receiptIds.length; i += 50) {
        const chunk = receiptIds.slice(i, i + 50);
        const res = await suiClient.multiGetObjects({ ids: chunk, options: { showContent: true } });
        receiptObjects.push(...res);
      }

      const parsed: ShopOrder[] = [];
      const shopItemRefs: string[] = [];

      receiptObjects.forEach((res) => {
        if (!res.data?.content || res.data.content.dataType !== "moveObject") return;
        const f = res.data.content.fields as any;
        if (f.buyer?.toLowerCase() !== userAddr) return;

        const order: ShopOrder = {
          kind: "shop",
          objectId: res.data.objectId,
          createdAt: Number(f.created_at),
          status: Number(f.status),
          paymentAmount: Number(f.payment_amount),
          trackingNumber: f.tracking_number || "",
          carrier: f.carrier || "",
          estimatedDelivery: Number(f.estimated_delivery || 0),
          itemName: f.item_name || "Kapogian Gear",
          itemsSelected: [f.chosen_size, f.chosen_color].filter((v) => v && v !== "N/A"),
        };
        const itemId = typeof f.item_id === "string" ? f.item_id : f.item_id?.id;
        if (itemId) shopItemRefs.push(itemId);
        parsed.push(order);
      });

      if (shopItemRefs.length > 0) {
        const itemData = await suiClient.multiGetObjects({
          ids: Array.from(new Set(shopItemRefs)),
          options: { showContent: true },
        });
        const itemMap = new Map(
          itemData.filter((o) => o.data).map((o) => [o.data?.objectId, (o.data?.content as any)?.fields]),
        );
        parsed.forEach((o) => {
          const receiptObj = receiptObjects.find((r) => r.data?.objectId === o.objectId);
          const rf = (receiptObj?.data?.content as any)?.fields;
          const iid = typeof rf?.item_id === "string" ? rf.item_id : rf?.item_id?.id;
          const ifields = itemMap.get(iid);
          o.imageUrl  = ifields ? (ifields.image_animated || ifields.image_static) : "/images/KapogianLogo.webp";
          o.isAnimated = !!ifields?.image_animated;
        });
      }

      setShopOrders(parsed.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Failed to load shop orders:", err);
      setErrorShop("Sync failed. Gear manifests unavailable.");
    } finally {
      setLoadingShop(false);
    }
  };

  // ── Derived list based on active tab ──────────────────────────────────────
  const visibleOrders: Order[] =
    activeTab === "nft"  ? nftOrders :
    activeTab === "shop" ? shopOrders :
    [...nftOrders, ...shopOrders].sort((a, b) => b.createdAt - a.createdAt);

  const loading = loadingNft || loadingShop;
  const hasError = errorNft || errorShop;

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderOrderCard = (order: Order) => {
    const si = getStatusInfo(order.status);
    const isNft = order.kind === "nft";
    const thumb  = isNft ? order.character?.imageUrl : getIPFSGatewayUrl(order.imageUrl ?? "");
    const title  = isNft ? (order.character?.name ?? "Unknown") : order.itemName;
    const amount = isNft ? (order.paymentAmount / 1e9).toFixed(3) : mistToSui(order.paymentAmount).toFixed(3);

    return (
      <div
        key={order.objectId}
        onClick={() => setSelectedOrder(order)}
        className="group bg-white border-4 border-slate-100 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center gap-4 cursor-pointer hover:border-sky-200 transition-all hover:translate-x-1 shadow-sm"
      >
        {/* Kind badge */}
        <div className="absolute hidden sm:flex">
          {isNft
            ? <span className="sr-only">NFT Ritual</span>
            : <span className="sr-only">Shop Order</span>
          }
        </div>

        <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden relative flex-shrink-0 shadow-inner">
          {thumb && (
            <Image
              src={thumb}
              alt={title}
              fill
              className="object-contain p-1"
              unoptimized={!isNft && (order as ShopOrder).isAnimated}
            />
          )}
        </div>

        <div className="flex-grow text-center sm:text-left overflow-hidden w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
            {isNft
              ? <span className="bg-violet-100 text-violet-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={8} /> Ritual</span>
              : <span className="bg-cyan-100   text-cyan-600   text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><ShoppingBag size={8} /> Shop</span>
            }
          </div>
          <p className="font-bold text-slate-800 truncate uppercase text-lg">{title}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-[10px] font-black text-slate-400 uppercase mt-1">
            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Hash size={10} /> {amount} SUI</span>
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
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!selectedOrder) return null;
    const isNft   = selectedOrder.kind === "nft";
    const si      = getStatusInfo(selectedOrder.status);
    const thumb   = isNft ? selectedOrder.character?.imageUrl : getIPFSGatewayUrl(selectedOrder.imageUrl ?? "");
    const title   = isNft ? (selectedOrder.character?.name ?? "Unknown") : selectedOrder.itemName;
    const amount  = isNft ? (selectedOrder.paymentAmount / 1e9).toFixed(3) : mistToSui(selectedOrder.paymentAmount).toFixed(3);
    const tags    = isNft
      ? (selectedOrder.itemsSelected?.split(",").map((s) => s.trim()) ?? [])
      : selectedOrder.itemsSelected;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
        <div
          className="relative bg-white border-4 border-black rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-y-auto"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-headline uppercase tracking-tight">
                {isNft ? "Manifest Detail" : "Order Record"}
              </h2>
              {isNft
                ? <span className="bg-violet-100 text-violet-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"><Sparkles size={8} /> NFT Ritual</span>
                : <span className="bg-cyan-100   text-cyan-600   text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"><ShoppingBag size={8} /> Shop Order</span>
              }
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
            >✕</button>
          </div>

          {/* NFT image + name */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="w-32 h-32 rounded-3xl border-4 border-black overflow-hidden relative shadow-lg bg-slate-50 transform -rotate-3 flex-shrink-0">
              {thumb && (
                <Image
                  src={thumb}
                  alt={title}
                  fill
                  className="object-contain p-2"
                  unoptimized={!isNft && (selectedOrder as ShopOrder).isAnimated}
                />
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <p className="text-2xl font-black uppercase italic tracking-tighter leading-tight truncate">{title}</p>
              <div className={`flex flex-wrap justify-center sm:justify-start gap-2 mt-3 ${tags.length > 5 ? "max-h-40 overflow-y-auto pr-2" : ""}`}>
                {tags.map((it, i) => (
                  <span key={i} className={`border-2 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${isNft ? "bg-yellow-100 border-black text-slate-700" : "bg-sky-100 border-sky-200 text-sky-700"}`}>
                    {it}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Clock size={10} /> Status</p>
              <p className="font-bold text-slate-800 uppercase text-xs">{si.text}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> Paid</p>
              <p className="font-bold text-slate-800 text-xs">{amount} SUI</p>
            </div>
          </div>

          {isNft && (
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><MapPin size={10} /> Shipping To</p>
              <p className="font-bold text-slate-700 text-sm italic">Verified Vault Address</p>
            </div>
          )}

          {/* Tracking */}
          {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
            <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl relative overflow-hidden">
              <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
              <p className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Live Logistics</p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="text-center sm:text-left">
                  <p className="text-lg font-black text-blue-800 uppercase leading-none">{selectedOrder.carrier}</p>
                  <p className="text-[10px] font-mono font-bold text-blue-600 mt-2 uppercase truncate">{selectedOrder.trackingNumber}</p>
                </div>
                <button
                  onClick={() => {
                    const url = isNft
                      ? getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber)
                      : `https://t.17track.net/en#nums=${selectedOrder.trackingNumber}`;
                    if (url) window.open(url, "_blank");
                  }}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px]"
                >
                  Track <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <LoaderCircle className="mx-auto mb-2 text-slate-300 animate-spin" size={24} />
              <p className="italic text-slate-400 font-bold text-xs uppercase tracking-tight">
                {isNft ? "Character is being summoned into physical form... 🧵" : "Summoning into physical form... 🧵"}
              </p>
            </div>
          )}

          <button
            onClick={() => setSelectedOrder(null)}
            className="w-full mt-8 bg-black hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0_0_#000]"
          >
            Close Entry
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {(
          [
            { id: "all",  label: "All",           icon: <LayoutGrid  size={13} />, count: nftOrders.length + shopOrders.length },
            { id: "nft",  label: "NFT Rituals",   icon: <Sparkles    size={13} />, count: nftOrders.length                     },
            { id: "shop", label: "Shop Orders",   icon: <ShoppingBag size={13} />, count: shopOrders.length                    },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-slate-800 border-2 border-slate-200"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
              activeTab === tab.id ? "bg-slate-100 text-slate-500" : "bg-slate-200 text-slate-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <LoaderCircle className="animate-spin text-sky-400" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Manifests...</p>
        </div>
      ) : hasError ? (
        <div className="text-center py-10 bg-red-50 rounded-3xl border-4 border-red-100">
          <ShieldAlert className="mx-auto mb-2 text-red-500" size={32} />
          <p className="font-bold text-red-600">{errorNft || errorShop}</p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="text-center py-20 opacity-50 flex flex-col items-center">
          <ShoppingBag className="mb-4 text-slate-300" size={64} strokeWidth={1.5} />
          <p className="font-bold uppercase tracking-widest text-sm text-slate-400">
            {activeTab === "nft"  ? "No ritual orders found" :
             activeTab === "shop" ? "No gear manifests found in your locker" :
             "No orders found"}
          </p>
          <a
            href={activeTab === "nft" ? "/summoning" : "/shop"}
            className="mt-6 text-sky-500 font-bold hover:underline"
          >
            {activeTab === "nft" ? "Start Summoning →" : "Visit the Kapo Shop →"}
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleOrders.map(renderOrderCard)}
        </div>
      )}

      {renderModal()}
    </div>
  );
}