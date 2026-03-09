"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { suiClient } from "@/lib/sui";
import { getIPFSGatewayUrl } from "@/lib/pinata";
import { CONTRACT_ADDRESSES, MODULES, ORDER_STATUS } from "@/lib/constants";
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
} from "lucide-react";
import { CustomConnectButton } from "@/components/kapogian/CustomConnectButton";
import { PageHeader } from "@/components/kapogian/page-header";
import { PageFooter } from "@/components/kapogian/page-footer";

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
  character?: {
    name: string;
    imageUrl: string;
  };
}

interface StatusInfo {
  text: string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}

/**
 * MyOrdersPage
 * - Shows a full-page view of the user's order receipts and logistics
 * - Loads on-chain `ReceiptCreated` events, resolves receipt objects,
 *   and fetches related NFT display data for each receipt
 * - Renders a list of `OrderCard` items and an `OrderModal` for details
 */
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
      // Fetch ALL ReceiptCreated events with pagination
      // We build two parallel arrays (ids and buyer addresses) to later
      // filter receipts that belong to the connected account.
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

      // Filter to current user's receipts only (by matching buyer address)
      const userReceiptIds = allReceiptIds.filter(
        (_, idx) => allBuyerAddresses[idx] === account.address,
      );

      if (userReceiptIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch receipt objects in chunks of 50 to avoid hitting API limits
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

      // Keep only valid objects returned by the node
      const validReceipts = receipts.filter((r) => r.data);

      // Map node objects into a normalized Order-like shape (without character)
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

      // Fetch NFT display data for the NFTs referenced by the receipts
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

      // Combine parsed receipt metadata with resolved NFT display info
      const combinedOrders = parsedReceipts.map((receipt) => ({
        ...receipt,
        character: nftsMap.get(receipt.nftId),
      }));

      setOrders(combinedOrders as Order[]);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Translate numeric ORDER_STATUS into UI-friendly badge info
  const getStatusInfo = (status: number): StatusInfo => {
    switch (status) {
      case ORDER_STATUS.SHIPPED:
        return {
          text: "In Transit",
          icon: <Truck className="w-4 h-4" />,
          bg: "bg-blue-400",
          textColor: "text-white",
        };
      case ORDER_STATUS.DELIVERED:
        return {
          text: "Delivered",
          icon: <CheckCircle className="w-4 h-4" />,
          bg: "bg-green-500",
          textColor: "text-white",
        };
      default:
        return {
          text: "Processing",
          icon: <Package className="w-4 h-4" />,
          bg: "bg-yellow-400",
          textColor: "text-black",
        };
    }
  };

  /**
   * getTrackingUrl
   * - Builds a carrier-specific tracking URL when possible
   * - Falls back to 17TRACK for a set of common carriers
   */
  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const c = carrier.toUpperCase();

    if (c.includes("UPS"))
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;

    if (c.includes("FEDEX"))
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;

    if (c.includes("LBC"))
      return `https://www.lbcexpress.com/track/?tracking_no=${trackingNumber}`;

    // Carriers that DON'T support URL autofill → use 17TRACK
    if (
      c.includes("J&T") ||
      c.includes("JNT") ||
      c.includes("SPX") ||
      c.includes("SHOPEE") ||
      c.includes("NINJA")
    ) {
      return `https://t.17track.net/en#nums=${trackingNumber}`;
    }

    return "";
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-black selection:text-white relative">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/kapogian_background.png"
          alt="bg"
          fill
          className="object-cover"
          priority
        />
      </div>
      <PageHeader />
      <main className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          {/* Page Header */}
          <header className="mb-12 text-center md:text-left">
            <div className="inline-block bg-black text-white px-4 py-1 mb-4 rounded-lg font-black text-xs uppercase tracking-widest">
              Inventory & Logistics
            </div>
            <h1
              className="text-6xl md:text-8xl font-black uppercase leading-[0.9] whitespace-nowrap"
              style={{ textShadow: "6px 6px 0px #000" }}
            >
              <span
                className="text-black"
                style={{ WebkitTextStroke: "2px black" }}
              >
                Order{" "}
              </span>
              <span
                className="text-white"
                style={{ WebkitTextStroke: "2px black" }}
              >
                History
              </span>
            </h1>
          </header>

          {/* States */}
          {!account ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Wallet size={48} />
              </div>
              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">
                Sync Required
              </h3>
              <p className="font-bold text-gray-500 uppercase max-w-xs mx-auto mb-10 leading-snug">
                Connect your wallet to track your physical gear.
              </p>
              <CustomConnectButton className="!bg-yellow-400 !hover:bg-yellow-300 !text-black !border-4 !border-black !font-black !px-12 !py-5 !rounded-2xl !text-xl !shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase italic" />
            </div>
          ) : loading ? (
            <div className="h-[40vh] flex flex-col items-center justify-center gap-6 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <LoaderCircle size={64} className="animate-spin text-black" />
              <p className="font-black uppercase tracking-widest text-xl">
                Scanning Blockchain...
              </p>
            </div>
          ) : error ? (
            <div className="bg-white border-4 border-black rounded-[2rem] p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-24 h-24 bg-red-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShieldAlert size={48} className="text-red-600" />
              </div>
              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">
                System Error
              </h3>
              <p className="font-bold text-gray-500 uppercase max-w-xs mx-auto">
                {error}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-16 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShoppingBag size={48} />
              </div>
              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter italic">
                No Gear Found
              </h3>
              <p className="font-bold text-gray-500 uppercase max-w-xs mx-auto mb-10 leading-snug">
                You haven't claimed any physical items yet.
              </p>
              <a href="/summoning">
                <button className="bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-black px-12 py-5 rounded-2xl text-xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-none uppercase italic">
                  Go to Summoning
                </button>
              </a>
            </div>
          ) : (
            /* ORDER LIST CONTAINER */
            <div className="bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {/* List header bar */}
              <div className="bg-black text-white px-8 py-4 flex justify-between items-center border-b-4 border-black">
                <span className="font-black uppercase italic tracking-widest text-sm">
                  Active Manifests ({orders.length})
                </span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white" />
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                </div>
              </div>

              {/* Scrollable list — shows 5 cards, scrolls if more */}
              <div
                className="p-6 md:p-8 space-y-6 bg-[#fafafa] overflow-y-auto"
                style={{ maxHeight: "calc(5 * 120px + 4 * 24px + 64px)" }}
              >
                {orders.map((order) => (
                  <OrderCard
                    key={order.objectId}
                    order={order}
                    statusInfo={getStatusInfo(order.status)}
                    onClick={() => setSelectedOrder(order)}
                  />
                ))}
              </div>

              <div className="bg-gray-100 p-4 text-center border-t-4 border-black">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                  End of encrypted log
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <PageFooter />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          statusInfo={getStatusInfo(selectedOrder.status)}
          trackingUrl={getTrackingUrl(
            selectedOrder.carrier,
            selectedOrder.trackingNumber,
          )}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────────────────────────── */
/**
 * OrderCard
 * - Compact row used in the order list. Shows NFT thumbnail, basic meta and status.
 * - Clicking the card opens the `OrderModal` with full details.
 */
function OrderCard({
  order,
  statusInfo,
  onClick,
}: {
  order: Order;
  statusInfo: StatusInfo;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-6"
    >
      {/* Avatar + status badge */}
      <div className="relative flex-shrink-0">
        <div className="w-24 h-24 bg-gray-100 rounded-2xl border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-3 transition-transform relative">
          {order.character?.imageUrl && (
            <Image
              src={order.character.imageUrl}
              alt="NFT"
              fill
              className="object-cover"
            />
          )}
        </div>
        <div
          className={`absolute -bottom-2 -right-2 p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusInfo.bg}`}
        >
          {statusInfo.icon}
        </div>
      </div>

      {/* Info */}
      <div className="flex-grow text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
          <h3 className="text-3xl font-black uppercase tracking-tight leading-none">
            {order.character?.name || "Unknown Kapogian"}
          </h3>
          <span className="font-mono text-[10px] bg-black text-white px-3 py-1 rounded-full uppercase self-center md:self-auto">
            ID: {order.objectId.slice(0, 8)}
          </span>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold uppercase text-gray-500">
          <div className="flex items-center gap-2 border-2 border-transparent group-hover:border-black group-hover:bg-white group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-xl cursor-default transition-all">
            <Calendar size={12} className="text-black" />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 border-2 border-transparent group-hover:border-black group-hover:bg-white group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded-xl cursor-default transition-all">
            <Hash size={12} className="text-black" />
            {(order.paymentAmount / 1_000_000_000).toFixed(3)} SUI
          </div>
        </div>
      </div>

      {/* Status button */}
      <div className="w-full md:w-auto flex-shrink-0">
        <button
          className={`w-full flex items-center justify-between gap-4 px-6 py-4 border-4 border-black rounded-xl font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 ${statusInfo.bg} ${statusInfo.textColor}`}
        >
          <span className="text-xs">{statusInfo.text}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── Order Modal ────────────────────────────────────────────────────────── */
/**
 * OrderModal
 * - Shows detailed receipt information including items, payment, dates and tracking
 * - Provides a button to copy the tracking number and open the carrier URL
 */
function OrderModal({
  order,
  statusInfo,
  trackingUrl,
  onClose,
}: {
  order: Order;
  statusInfo: StatusInfo;
  trackingUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white border-4 border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white p-8 flex justify-between items-start border-b-4 border-black">
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
              Order Receipt
            </h2>
            <p className="font-mono text-xs opacity-60 mt-2 uppercase break-all">
              TX: {order.objectId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white text-black p-2 rounded-xl border-2 border-white hover:bg-red-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* NFT + items */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-40 h-40 bg-gray-100 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0 overflow-hidden transform -rotate-2 relative">
              {order.character?.imageUrl && (
                <Image
                  src={order.character.imageUrl}
                  alt="NFT"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black mb-2 text-xs font-black uppercase ${statusInfo.bg} ${statusInfo.textColor}`}
                >
                  {statusInfo.icon}
                  {statusInfo.text}
                </div>
                <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                  {order.character?.name}
                </h3>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {order.itemsSelected.split(",").map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-yellow-100 border-2 border-black rounded-lg text-[10px] font-black uppercase tracking-tight"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Payment / Date */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="bg-gray-100 border-2 border-black p-4 rounded-xl transition-all hover:-translate-y-1 cursor-default"
              style={{ boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "6px 6px 0px 0px rgba(0,0,0,1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "3px 3px 0px 0px rgba(0,0,0,1)";
              }}
            >
              <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                Payment
              </p>
              <p className="font-bold text-lg">
                {(order.paymentAmount / 1_000_000_000).toFixed(3)} SUI
              </p>
            </div>
            <div
              className="bg-gray-100 border-2 border-black p-4 rounded-xl transition-all hover:-translate-y-1 cursor-default"
              style={{ boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "6px 6px 0px 0px rgba(0,0,0,1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "3px 3px 0px 0px rgba(0,0,0,1)";
              }}
            >
              <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                Mint Date
              </p>
              <p className="font-bold text-lg">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Logistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LogisticsCard
              icon={<MapPin size={20} />}
              label="Shipping To"
              value="Verified Vault Address"
            />
            <LogisticsCard
              icon={<Clock size={20} />}
              label="Est. Arrival"
              value={
                order.estimatedDelivery
                  ? new Date(order.estimatedDelivery).toLocaleDateString()
                  : "TBD"
              }
            />
          </div>

          {/* Tracking */}
          <div className="bg-gray-50 border-4 border-black border-dashed rounded-3xl p-6">
            <h4 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
              <Truck size={20} /> Live Tracking
            </h4>

            {order.status >= ORDER_STATUS.SHIPPED ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">
                      Carrier
                    </p>
                    <p className="font-bold">{order.carrier}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">
                      Number
                    </p>
                    <p className="font-mono text-sm font-bold break-all">
                      {order.trackingNumber}
                    </p>
                  </div>
                </div>

                {trackingUrl && (
                  <button
                    onClick={async () => {
                      try {
                        // Copy tracking number
                        await navigator.clipboard.writeText(
                          order.trackingNumber,
                        );

                        // Open tracking page in new tab
                        window.open(
                          trackingUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      } catch (err) {
                        console.error("Clipboard copy failed:", err);
                        // Still open link even if clipboard fails
                        window.open(
                          trackingUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    }}
                    className="w-full py-4 bg-blue-500 text-white border-4 border-black rounded-2xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    External Tracking <ExternalLink size={18} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 italic text-gray-500 font-bold uppercase text-[10px]">
                Crafting your gear... Tracking ID will appear once shipped. 🧵
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-100 border-t-4 border-black">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase hover:bg-gray-800 transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Logistics Card ─────────────────────────────────────────────────────── */
/**
 * LogisticsCard
 * - Small reusable display used inside the modal to show shipping related values
 */
function LogisticsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="bg-white border-2 border-black p-4 rounded-2xl flex items-center gap-4 transition-all hover:-translate-y-1 cursor-default"
      style={{ boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "6px 6px 0px 0px rgba(0,0,0,1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "3px 3px 0px 0px rgba(0,0,0,1)";
      }}
    >
      <div className="p-2 bg-gray-100 rounded-lg border-2 border-black">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400">
          {label}
        </p>
        <p className="font-bold uppercase tracking-tight text-xs">{value}</p>
      </div>
    </div>
  );
}
