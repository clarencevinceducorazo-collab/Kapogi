"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  RefreshCw,
  PartyPopper,
  PackageCheck,
  MapPinned,
} from "lucide-react";
import { suiClient } from "@/lib/sui";
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS, mistToSui } from "@/lib/constants";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { UserMessageDrawer } from "@/components/kapogian/UserMessageDrawer";

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

// ─── Success Modal Types ──────────────────────────────────────────────────────

type SuccessModalType = "shipped" | "tracking" | "delivered" | null;

interface SuccessModalData {
  type: SuccessModalType;
  order: Order | null;
}

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

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({
  data,
  onClose,
}: {
  data: SuccessModalData;
  onClose: () => void;
}) {
  if (!data.type || !data.order) return null;

  const order = data.order;
  const title  = order.kind === "nft"
    ? ((order as NftOrder).character?.name ?? "Your Order")
    : (order as ShopOrder).itemName;

  const configs = {
    shipped: {
      icon: <Truck size={40} className="text-blue-500" />,
      bg: "from-blue-50 to-cyan-50",
      accent: "bg-blue-500",
      ring: "ring-blue-200",
      badge: "bg-blue-100 text-blue-700",
      headline: "Order Shipped! 🚚",
      body: "Your order is now in transit. You'll receive tracking updates as it makes its way to you.",
      cta: null,
    },
    tracking: {
      icon: <MapPinned size={40} className="text-teal-500" />,
      bg: "from-teal-50 to-emerald-50",
      accent: "bg-teal-500",
      ring: "ring-teal-200",
      badge: "bg-teal-100 text-teal-700",
      headline: "Tracking Updated! 📦",
      body: "Logistics information has been updated. You can now track your package in real time.",
      cta:
        order.trackingNumber && order.carrier
          ? {
              label: "Track Package",
              url: getTrackingUrl(order.carrier, order.trackingNumber),
            }
          : null,
    },
    delivered: {
      icon: <PartyPopper size={40} className="text-green-500" />,
      bg: "from-green-50 to-lime-50",
      accent: "bg-green-500",
      ring: "ring-green-200",
      badge: "bg-green-100 text-green-700",
      headline: "Delivered! 🎉",
      body: "Your order has been marked as delivered. We hope you enjoy your Kapogian gear!",
      cta: null,
    },
  };

  const cfg = configs[data.type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative bg-gradient-to-br ${cfg.bg} border-4 border-black rounded-[2.5rem] p-8 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ring-4 ${cfg.ring} animate-in zoom-in-95 duration-300`}
      >
        {/* Decorative top bar */}
        <div className={`absolute top-0 left-8 right-8 h-1.5 ${cfg.accent} rounded-b-full`} />

        {/* Icon */}
        <div className="flex justify-center mb-5 mt-2">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            {cfg.icon}
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{cfg.headline}</h2>
          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${cfg.badge}`}>
            {title}
          </div>
          <p className="text-sm font-semibold text-slate-600 leading-relaxed">{cfg.body}</p>
        </div>

        {/* Tracking info if available */}
        {data.type === "tracking" && order.trackingNumber && (
          <div className="bg-white border-2 border-black rounded-2xl p-4 mb-4 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Number</p>
            <p className="font-mono font-black text-slate-800 text-sm">{order.trackingNumber}</p>
            {order.carrier && (
              <p className="text-xs font-bold text-slate-500 mt-1">via {order.carrier}</p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          {cfg.cta && (
            <a
              href={cfg.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 ${cfg.accent} text-white rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
            >
              {cfg.cta.label} <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live pulse indicator ─────────────────────────────────────────────────────

function LiveBadge({ lastUpdated }: { lastUpdated: Date }) {
  return (
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      Live · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // 15 seconds

export function OrdersPanel({ account }: { account: any }) {
  const [nftOrders,  setNftOrders]  = useState<NftOrder[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loadingNft,  setLoadingNft]  = useState(true);
  const [loadingShop, setLoadingShop] = useState(true);
  const [errorNft,  setErrorNft]  = useState("");
  const [errorShop, setErrorShop] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [successModal, setSuccessModal] = useState<SuccessModalData>({ type: null, order: null });

  // ── Change-detection refs ─────────────────────────────────────────────────
  const prevStatusMap  = useRef<Map<string, number>>(new Map());
  const prevTrackingMap = useRef<Map<string, string>>(new Map());
  const shownModalKeys = useRef<Set<string>>(new Set());

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedOrder || successModal.type) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [selectedOrder, successModal.type]);

  useEffect(() => {
    if (account?.address) {
      loadNftOrders(true);
      loadShopOrders(true);
    } else {
      setLoadingNft(false);
      setLoadingShop(false);
    }
  }, [account?.address]);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!account?.address) return;
    const interval = setInterval(() => {
      loadNftOrders(false);
      loadShopOrders(false);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [account?.address]);

  // ── Unified change detector ────────────────────────────────────────────────
  const detectChanges = useCallback((orders: Order[]) => {
    for (const order of orders) {
      const prevStatus   = prevStatusMap.current.get(order.objectId);
      const currStatus   = order.status;
      const prevTracking = prevTrackingMap.current.get(order.objectId) ?? "";
      const currTracking = order.trackingNumber ?? "";

      if (prevStatus !== undefined && prevStatus !== currStatus) {
        const key = `${order.objectId}:status:${currStatus}`;
        if (!shownModalKeys.current.has(key)) {
          shownModalKeys.current.add(key);
          if (currStatus === ORDER_STATUS.SHIPPED) {
            setSuccessModal({ type: "shipped", order });
          } else if (currStatus === ORDER_STATUS.DELIVERED) {
            setSuccessModal({ type: "delivered", order });
          }
        }
      }

      if (
        currStatus === ORDER_STATUS.SHIPPED &&
        currTracking !== "" &&
        prevTracking !== currTracking
      ) {
        const key = `${order.objectId}:tracking:${currTracking}`;
        if (!shownModalKeys.current.has(key)) {
          shownModalKeys.current.add(key);
          setSuccessModal({ type: "tracking", order });
        }
      }

      prevStatusMap.current.set(order.objectId, currStatus);
      prevTrackingMap.current.set(order.objectId, currTracking);
    }
  }, []);

  // ── NFT Ritual Orders ──────────────────────────────────────────────────────
  const loadNftOrders = async (isInitial = false) => {
    if (!account?.address) return;
    if (isInitial) setLoadingNft(true);
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
      if (userReceiptIds.length === 0) {
        setNftOrders([]);
        return;
      }

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

      const final = parsed.map((r) => ({ ...r, character: nftsMap.get(r.nftId) })) as NftOrder[];

      if (isInitial) {
        final.forEach((o) => {
          prevStatusMap.current.set(o.objectId, o.status);
          prevTrackingMap.current.set(o.objectId, o.trackingNumber ?? "");
        });
      } else {
        detectChanges(final);
      }

      setNftOrders(final);
      setLastUpdated(new Date());

      setSelectedOrder((prev) => {
        if (!prev || prev.kind !== "nft") return prev;
        const updated = final.find((o) => o.objectId === prev.objectId);
        return updated ?? prev;
      });
    } catch (err) {
      console.error("Failed to load NFT orders:", err);
      if (isInitial) setErrorNft("Failed to load ritual orders. Please try again.");
    } finally {
      if (isInitial) setLoadingNft(false);
    }
  };

  // ── Shop Orders ────────────────────────────────────────────────────────────
  const loadShopOrders = async (isInitial = false) => {
    if (!account?.address) return;
    if (isInitial) setLoadingShop(true);
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
      if (receiptIds.length === 0) {
        setShopOrders([]);
        return;
      }

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

      const final = parsed.sort((a, b) => b.createdAt - a.createdAt);

      if (isInitial) {
        final.forEach((o) => {
          prevStatusMap.current.set(o.objectId, o.status);
          prevTrackingMap.current.set(o.objectId, o.trackingNumber ?? "");
        });
      } else {
        detectChanges(final);
      }

      setShopOrders(final);
      setLastUpdated(new Date());

      setSelectedOrder((prev) => {
        if (!prev || prev.kind !== "shop") return prev;
        const updated = final.find((o) => o.objectId === prev.objectId);
        return updated ?? prev;
      });
    } catch (err) {
      console.error("Failed to load shop orders:", err);
      if (isInitial) setErrorShop("Sync failed. Gear manifests unavailable.");
    } finally {
      if (isInitial) setLoadingShop(false);
    }
  };

  const handleManualRefresh = () => {
    shownModalKeys.current.clear();
    loadNftOrders(false);
    loadShopOrders(false);
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

  // ── Detail Modal ──────────────────────────────────────────────────────────
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

    const steps = [
      { label: "Processing", icon: <Package size={14} />, status: ORDER_STATUS.PENDING },
      { label: "In Transit", icon: <Truck size={14} />,   status: ORDER_STATUS.SHIPPED },
      { label: "Delivered",  icon: <CheckCircle size={14} />, status: ORDER_STATUS.DELIVERED },
    ];

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

          {/* ── Status Stepper ── */}
          <div className="mb-6 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Clock size={10} /> Order Progress
            </p>
            <div className="flex items-center gap-0">
              {steps.map((step, i) => {
                const isComplete = selectedOrder.status >= step.status;
                const isActive   = selectedOrder.status === step.status;
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                          isComplete
                            ? isActive
                              ? "bg-black text-white border-black scale-110"
                              : "bg-green-500 text-white border-green-600"
                            : "bg-white text-slate-300 border-slate-200"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <span className={`text-[8px] font-black uppercase mt-1 text-center leading-tight ${isComplete ? "text-slate-700" : "text-slate-300"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-3 transition-all ${selectedOrder.status > step.status ? "bg-green-500" : "bg-slate-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Clock size={10} /> Status</p>
              <p className={`font-bold uppercase text-xs flex items-center gap-1.5 ${si.textColor}`}>{si.icon} {si.text}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> Paid</p>
              <p className="font-bold text-slate-800 text-xs">{amount} SUI</p>
            </div>
          </div>

          {/* Estimated delivery */}
          {selectedOrder.estimatedDelivery > 0 && selectedOrder.status === ORDER_STATUS.SHIPPED && (
            <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl mb-4 flex items-center gap-3">
              <Calendar size={16} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Est. Delivery</p>
                <p className="font-bold text-blue-800 text-sm">
                  {new Date(selectedOrder.estimatedDelivery).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Tracking */}
          {selectedOrder.status >= ORDER_STATUS.SHIPPED ? (
            <div className="bg-blue-50 border-4 border-blue-100 p-6 rounded-3xl relative overflow-hidden">
              <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
              <p className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Live Logistics</p>

              {selectedOrder.trackingNumber ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-black text-blue-800 uppercase leading-none">{selectedOrder.carrier}</p>
                    <p className="text-[10px] font-mono font-bold text-blue-600 mt-2 uppercase truncate">{selectedOrder.trackingNumber}</p>
                    {selectedOrder.estimatedDelivery > 0 && (
                      <p className="text-[9px] text-blue-400 font-bold mt-1">
                        Est. {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const url = getTrackingUrl(selectedOrder.carrier, selectedOrder.trackingNumber);
                      if (url) window.open(url, "_blank");
                    }}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg border-2 border-blue-400 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px]"
                  >
                    Track <ExternalLink size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative z-10 flex items-center gap-3">
                  <LoaderCircle className="animate-spin text-blue-300 flex-shrink-0" size={18} />
                  <p className="italic text-blue-500 font-bold text-xs uppercase tracking-tight">
                    Tracking info being prepared...
                  </p>
                </div>
              )}
            </div>
          ) : selectedOrder.status === ORDER_STATUS.DELIVERED ? (
            <div className="text-center py-8 bg-green-50 rounded-3xl border-2 border-green-200">
              <PackageCheck className="mx-auto mb-2 text-green-500" size={32} />
              <p className="font-black text-green-700 text-sm uppercase tracking-tight">Package Delivered!</p>
              <p className="text-xs text-green-500 font-bold mt-1">Thank you for your order 🎉</p>
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
      {/* Support Chat Drawer at the very top */}
      <UserMessageDrawer walletAddress={account?.address ?? ""} />
      {/* ── Tab bar + live indicator ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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

        {/* Live badge + manual refresh */}
        <div className="flex items-center gap-3">
          <LiveBadge lastUpdated={lastUpdated} />
          <button
            onClick={handleManualRefresh}
            className="w-8 h-8 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-200 transition-all"
            title="Refresh now"
          >
            <RefreshCw size={13} />
          </button>
        </div>
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

      {/* Detail modal */}
      {renderModal()}

      {/* Success modal */}
      <SuccessModal
        data={successModal}
        onClose={() => setSuccessModal({ type: null, order: null })}
      />

      {/* ...existing code... */}
    </div>
  );
}