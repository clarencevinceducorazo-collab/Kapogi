'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Box,
  LockKeyhole,
  Key,
  ShieldCheck,
  ShieldAlert,
  LockOpen,
  Truck,
  CheckCircle,
  FileText,
  Home,
  LoaderCircle,
  ClipboardList,
  Download,
  Package,
  Clock,
  Search,
  X,
  Mail,
  Phone,
  MapPin,
  User,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { suiClient, getAllReceipts, markAsShipped, addTrackingInfo, markAsDelivered } from '@/lib/sui';
import { decryptShippingInfo, type ShippingInfo } from '@/lib/encryption';
import { ADMIN_ADDRESS, ORDER_STATUS } from '@/lib/constants';
import { getIPFSGatewayUrl } from '@/lib/pinata';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Receipt {
  objectId: string;
  nftId: string;
  buyer: string;
  itemsSelected: string;
  encryptedShippingInfo: string;
  status: number;
  paymentAmount: number;
  createdAt: number;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: number;
  character?: {
    name: string;
    imageUrl: string;
  };
}

interface DecryptedCard extends ShippingInfo {
  id: string;
  itemsSelected: string;
  character?: {
    name: string;
    imageUrl: string;
  };
}

// ─────────────────────────────────────────────
// Design-System Components (File 1 style)
// ─────────────────────────────────────────────

const BrutalCard = ({
  children,
  className = '',
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) => (
  <div
    className={`bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${className}`}
  >
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);

const BrutalButton = ({
  children,
  onClick,
  className = '',
  variant = 'default',
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'black' | 'purple' | 'teal';
  disabled?: boolean;
  title?: string;
}) => {
  const variants: Record<string, string> = {
    default: 'bg-white text-black hover:bg-gray-50',
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    black: 'bg-black text-white hover:bg-gray-800',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
    teal: 'bg-teal-500 text-white hover:bg-teal-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-10 px-4 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Helper to shorten an address like 0xABCD...1234
const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={`px-2 py-0.5 border-2 border-black rounded font-black text-[9px] uppercase tracking-wider ${className}`}
  >
    {children}
  </span>
);

// ─────────────────────────────────────────────
// Toast Notification System
// ─────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) => (
  <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[340px] border-4 border-black rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-4 animate-in slide-in-from-left-4 fade-in duration-200 ${
          toast.type === 'success' ? 'bg-green-400' :
          toast.type === 'error' ? 'bg-red-400' :
          'bg-yellow-300'
        }`}
      >
        <div className="flex-1">
          <p className="font-black text-black text-sm uppercase tracking-tight leading-snug">
            {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : '● '}
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-black/60 hover:text-black font-black text-lg leading-none mt-0.5 flex-shrink-0"
        >
          ×
        </button>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function AdminPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const isAdmin = account?.address === ADMIN_ADDRESS;

  const [adminPrivateKey, setAdminPrivateKey] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [decryptedCards, setDecryptedCards] = useState<DecryptedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterItem, setFilterItem] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ongoing' | 'shipped' | 'delivered'>('ongoing');

  // Tracking modal state
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estDeliveryDate, setEstDeliveryDate] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // ── Toast notifications ────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Stats ──────────────────────────────────
  const stats = useMemo(
    () => ({
      pending: receipts.filter((r) => r.status === ORDER_STATUS.PENDING).length,
      shipped: receipts.filter((r) => r.status === ORDER_STATUS.SHIPPED).length,
      delivered: receipts.filter((r) => r.status === ORDER_STATUS.DELIVERED).length,
    }),
    [receipts],
  );

  // All unique items across receipts for filter dropdown
  const allItems = useMemo(() => {
    const items = new Set<string>();
    receipts.forEach(r => r.itemsSelected.split(',').forEach(i => items.add(i.trim())));
    return Array.from(items).sort();
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return receipts.filter((r) => {
      // Tab filter
      if (activeTab === 'ongoing' && r.status !== ORDER_STATUS.PENDING) return false;
      if (activeTab === 'shipped' && r.status !== ORDER_STATUS.SHIPPED) return false;
      if (activeTab === 'delivered' && r.status !== ORDER_STATUS.DELIVERED) return false;

      // Item filter
      if (filterItem !== 'all') {
        if (!r.itemsSelected.split(',').map(i => i.trim()).includes(filterItem)) return false;
      }

      // Search: name, objectId, or buyer wallet address
      if (q) {
        const matchName = r.character?.name?.toLowerCase().includes(q);
        const matchId = r.objectId.toLowerCase().includes(q);
        const matchBuyer = r.buyer.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchBuyer) return false;
      }

      return true;
    });
  }, [receipts, searchQuery, filterItem, activeTab]);

  useEffect(() => {
    if (isAdmin) {
      loadReceipts();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // ── Data Loading ───────────────────────────

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError('');
      const allReceiptObjects = await getAllReceipts();

      if (allReceiptObjects.length === 0) {
        setReceipts([]);
        setLoading(false);
        return;
      }

      const parsedReceipts: Omit<Receipt, 'character'>[] = allReceiptObjects
        .map((obj: any) => ({
          objectId: obj.data.objectId,
          nftId: obj.data.content.fields.nft_id,
          buyer: obj.data.content.fields.buyer,
          itemsSelected: obj.data.content.fields.items_selected,
          encryptedShippingInfo: obj.data.content.fields.encrypted_shipping_info,
          status: Number(obj.data.content.fields.status),
          paymentAmount: Number(obj.data.content.fields.payment_amount),
          createdAt: Number(obj.data.content.fields.created_at),
          trackingNumber: obj.data.content.fields.tracking_number || '',
          carrier: obj.data.content.fields.carrier || '',
          estimatedDelivery: Number(obj.data.content.fields.estimated_delivery || 0),
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
              imageUrl: getIPFSGatewayUrl((obj.data?.display?.data as any)?.image_url),
              name: (obj.data?.display?.data as any)?.name,
            },
          ]),
      );

      setReceipts(
        parsedReceipts.map((receipt) => ({
          ...receipt,
          character: nftsMap.get(receipt.nftId),
        })),
      );
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ───────────────────────────────

  const handleOpenTrackingModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setTrackingNumber(receipt.trackingNumber || '');
    setCarrier(receipt.carrier || '');
    setEstDeliveryDate(
      receipt.estimatedDelivery
        ? new Date(receipt.estimatedDelivery).toISOString().split('T')[0]
        : '',
    );
    setTrackingModalOpen(true);
  };

  const handleSaveTracking = async () => {
    if (!selectedReceipt || !trackingNumber || !carrier || !estDeliveryDate) {
      showToast('All tracking fields are required.', 'error');
      return;
    }
    setIsSavingTracking(true);
    try {
      await addTrackingInfo({
        receiptObjectId: selectedReceipt.objectId,
        trackingNumber,
        carrier,
        estimatedDelivery: new Date(estDeliveryDate).getTime(),
        signAndExecute,
      });
      showToast('Tracking information saved!', 'success');
      setTrackingModalOpen(false);
      loadReceipts();
    } catch (e) {
      console.error(e);
      showToast('Failed to save tracking info.', 'error');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleToggleDecrypt = async (receipt: Receipt) => {
    const isDecrypted = decryptedCards.some((card) => card.id === receipt.objectId);
    if (isDecrypted) {
      setDecryptedCards([]);
    } else {
      if (!adminPrivateKey) {
        showToast('Enter Admin Private Key first.', 'error');
        return;
      }
      try {
        const decryptedInfo = await decryptShippingInfo(
          receipt.encryptedShippingInfo,
          adminPrivateKey,
        );
        setDecryptedCards([
          {
            id: receipt.objectId,
            ...decryptedInfo,
            itemsSelected: receipt.itemsSelected,
            character: receipt.character,
          },
        ]);
        setError('');
      } catch (e) {
        console.error(e);
        showToast('Decryption failed. Check your key.', 'error');
      }
    }
  };

  const handleMarkShipped = async (receiptId: string) => {
    try {
      await markAsShipped({ receiptObjectId: receiptId, signAndExecute });
      showToast('Order marked as Shipped!', 'success');
      loadReceipts();
    } catch (e) {
      console.error(e);
      showToast('Failed to mark as shipped.', 'error');
    }
  };

  const handleMarkDelivered = async (receiptId: string) => {
    // proceed without confirm - handled by button state
    try {
      await markAsDelivered({ receiptObjectId: receiptId, signAndExecute });
      showToast('Order marked as Delivered!', 'success');
      loadReceipts();
    } catch (e) {
      console.error(e);
      showToast('Failed to mark as delivered.', 'error');
    }
  };

  const handleDownloadImage = async (imageUrl: string, characterName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `kapogian_${characterName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Could not download image.', 'error');
      window.open(imageUrl, '_blank');
    }
  };

  // ── Guard: not connected ───────────────────
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <BrutalCard className="max-w-md w-full text-center">
          <LockKeyhole size={48} className="mx-auto mb-4 text-slate-400" />
          <h2 className="font-black text-2xl uppercase mb-3">Admin Access</h2>
          <p className="text-sm font-bold text-slate-500 mb-6">Please connect your wallet to continue.</p>
          <CustomConnectButton className="!bg-blue-500 !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-xl !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:!bg-blue-600" />
        </BrutalCard>
      </div>
    );
  }

  // ── Guard: not admin ───────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <BrutalCard className="max-w-md w-full text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="font-black text-2xl uppercase mb-3">Access Denied</h2>
          <p className="mb-2 font-bold text-slate-600">This page is for administrators only.</p>
          <p className="text-xs font-mono text-slate-400">{account.address}</p>
        </BrutalCard>
      </div>
    );
  }

  // ── Main Render ────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200"
      style={{
        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundAttachment: 'fixed',
      }}
    >

            {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Box size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Management</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Kapogian Admin Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <BrutalButton className="!px-3">
                <Home size={20} />
              </BrutalButton>
            </Link>
            <div
              className="bg-white border-4 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-sm"
              title={ADMIN_ADDRESS}
            >
              {shortAddr(ADMIN_ADDRESS)}
            </div>
            <CustomConnectButton className="!bg-blue-500 !border-4 !border-black !text-white !font-black !px-5 !py-2 !rounded-xl !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:!bg-blue-600 !text-sm" />
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 space-y-8">

        {/* ── Statistics Bar ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 p-3 rounded-xl border-2 border-black">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Pending</p>
                <p className="text-4xl font-black">{stats.pending}</p>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-blue-400 p-3 rounded-xl border-2 border-black text-white">
                <Truck size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Shipped</p>
                <p className="text-4xl font-black">{stats.shipped}</p>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-green-400 p-3 rounded-xl border-2 border-black text-white">
                <CheckCircle size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Delivered</p>
                <p className="text-4xl font-black">{stats.delivered}</p>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard className="bg-blue-500">
            <div className="flex items-center gap-4">
              <div className="bg-black p-3 rounded-xl border-2 border-black text-white">
                <Package size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-blue-900/60">Total Orders</p>
                <p className="text-4xl font-black text-black">{receipts.length}</p>
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* ── Left Column: Security & Decrypted Payload ── */}
          <aside className="lg:col-span-4 flex flex-col gap-6">

            {/* Private Key Input */}
            <BrutalCard>
              <div className="flex items-center gap-3 mb-4">
                <LockKeyhole className="text-slate-400" size={20} />
                <h3 className="font-black uppercase tracking-tight text-base">Security Credentials</h3>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4 bg-slate-50 p-3 rounded-xl border-2 border-dashed border-slate-300 leading-tight">
                AES-256 decryption key. Only processed locally in memory.
              </p>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter Private Key..."
                  value={adminPrivateKey}
                  onChange={(e) => setAdminPrivateKey(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-4 border-black rounded-2xl px-5 text-lg font-bold placeholder:text-slate-300 focus:bg-white focus:ring-0 outline-none transition-all"
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
              <div className="mt-4 flex items-start gap-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-3">
                <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-tight">
                  Your private key is never sent to any server. Local decryption only.
                </p>
              </div>
            </BrutalCard>

            {/* Decrypted Shipping Payload Panel */}
            <BrutalCard
              noPadding
              className="flex-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-black uppercase text-base tracking-widest flex items-center gap-2">
                  <FileText size={18} /> Shipping Payload
                </h3>
              </div>

              <div className="p-6">
                {decryptedCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                      <LockOpen className="text-slate-300" size={36} />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 uppercase text-base tracking-tighter">
                        Cipher Block Locked
                      </p>
                      <p className="text-sm font-bold text-slate-300 mt-1">
                        Select an order and click the Lock Icon
                      </p>
                    </div>
                  </div>
                ) : (
                  decryptedCards.map((card) => (
                    <div key={card.id} className="space-y-6">
                      {/* Character header */}
                      <div className="flex gap-4 p-4 bg-blue-50 border-4 border-blue-200 rounded-2xl relative">
                        <div className="absolute -top-2 -right-2 bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase rounded border border-white">
                          Decrypted
                        </div>
                        {card.character?.imageUrl && (
                          <Image
                            src={card.character.imageUrl}
                            alt={card.character.name || 'Character'}
                            width={88}
                            height={88}
                            className="w-22 h-22 rounded-xl border-2 border-black object-cover shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                          />
                        )}
                        <div className="flex flex-col justify-center">
                          <p className="text-xs font-black text-blue-500 uppercase leading-none mb-1">
                            Holder Identity
                          </p>
                          <h4 className="font-black text-slate-900 text-xl leading-tight">
                            {card.character?.name}
                          </h4>
                          <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase truncate w-40" title={card.id}>
                            {shortAddr(card.id)}
                          </p>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <User size={11} /> Consignee
                          </label>
                          <div className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-sm flex items-center justify-between">
                            {card.full_name}
                            <ShieldCheck size={16} className="text-green-500" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={11} /> Shipping Destination
                          </label>
                          <div className="p-3 bg-slate-50 border-2 border-black rounded-xl font-bold text-slate-700 text-sm leading-relaxed italic">
                            {card.address}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Phone size={11} /> Contact
                            </label>
                            <p className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-xs truncate">
                              {card.contact_number}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Mail size={11} /> Email
                            </label>
                            <p className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-xs truncate">
                              {(card as any).email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Package size={11} /> Inventory Breakdown
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border-2 border-black rounded-xl">
                            {card.itemsSelected.split(',').map((item) => (
                              <Badge key={item} className="bg-white !text-[10px]">
                                {item.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {card.character?.imageUrl && (
                          <BrutalButton
                            variant="black"
                            className="w-full h-12 text-sm"
                            onClick={() =>
                              handleDownloadImage(card.character!.imageUrl, card.character!.name)
                            }
                          >
                            <Download size={16} /> Download NFT Image
                          </BrutalButton>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BrutalCard>
          </aside>

          {/* ── Right Column: Order Registry ── */}
          <section className="lg:col-span-8 flex flex-col">
            <BrutalCard noPadding className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col flex-1">
              {/* Header: Title + Tabs */}
              <div className="p-5 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Order Registry</h3>
                  <Badge className="bg-yellow-400 border-2 border-black !text-xs !px-2.5 !py-0.5">{receipts.length}</Badge>
                </div>
                {/* Tabs */}
                <div className="flex items-center border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <button
                    onClick={() => setActiveTab('ongoing')}
                    className={`h-10 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === 'ongoing' ? 'bg-yellow-400 text-black' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Clock size={12} /> Pending
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${activeTab === 'ongoing' ? 'bg-black text-white border-black' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>
                      {receipts.filter(r => r.status === ORDER_STATUS.PENDING).length}
                    </span>
                  </button>
                  <div className="w-0.5 h-6 bg-black" />
                  <button
                    onClick={() => setActiveTab('shipped')}
                    className={`h-10 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === 'shipped' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Truck size={12} /> Shipped
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${activeTab === 'shipped' ? 'bg-white text-blue-600 border-white' : 'bg-blue-100 border-blue-400 text-blue-700'}`}>
                      {receipts.filter(r => r.status === ORDER_STATUS.SHIPPED).length}
                    </span>
                  </button>
                  <div className="w-0.5 h-6 bg-black" />
                  <button
                    onClick={() => setActiveTab('delivered')}
                    className={`h-10 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeTab === 'delivered' ? 'bg-green-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle size={12} /> Delivered
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${activeTab === 'delivered' ? 'bg-white text-green-600 border-white' : 'bg-green-100 border-green-400 text-green-700'}`}>
                      {receipts.filter(r => r.status === ORDER_STATUS.DELIVERED).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Search + Filters Bar */}
              <div className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    placeholder="Search name, object ID, or wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-xl pl-10 h-10 font-bold text-sm outline-none focus:bg-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Item Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Item</span>
                  <select
                    value={filterItem}
                    onChange={(e) => setFilterItem(e.target.value)}
                    className="h-10 bg-white border-2 border-black rounded-xl px-3 font-black text-xs uppercase outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="all">All Items</option>
                    {allItems.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                {/* Active filter count */}
                {(searchQuery || filterItem !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterItem('all'); }}
                    className="h-10 px-3 border-2 border-red-400 rounded-xl font-black text-xs uppercase text-red-500 hover:bg-red-50 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.4)]"
                  >
                    <X size={12} /> Clear
                  </button>
                )}

                <span className="text-[10px] font-black text-slate-400 ml-auto">
                  {filteredReceipts.length} result{filteredReceipts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-16 flex justify-center items-center gap-3 text-slate-400 font-black text-sm uppercase">
                  <LoaderCircle className="animate-spin" size={24} /> Loading orders...
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="p-16 text-center font-black text-slate-400 uppercase text-sm">
                  No orders to display.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b-4 border-black">
                      <tr>
                        <th className="p-4 text-left text-[11px] font-black uppercase text-slate-400 tracking-widest pl-6">
                          Asset & ID
                        </th>
                        <th className="p-4 text-left text-[11px] font-black uppercase text-slate-400 tracking-widest">
                          Cart
                        </th>
                        <th className="p-4 text-center text-[11px] font-black uppercase text-slate-400 tracking-widest">
                          Status
                        </th>
                        <th className="p-4 text-right text-[11px] font-black uppercase text-slate-400 tracking-widest pr-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {filteredReceipts.map((receipt) => {
                        const isDecrypted = decryptedCards.some(
                          (card) => card.id === receipt.objectId,
                        );
                        return (
                          <tr
                            key={receipt.objectId}
                            className={`hover:bg-slate-50 transition-colors ${isDecrypted ? 'bg-blue-50/50' : ''}`}
                          >
                            {/* Asset */}
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                {receipt.character?.imageUrl ? (
                                  <Image
                                    src={receipt.character.imageUrl}
                                    alt={receipt.character.name || 'NFT'}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-xl border-2 border-black bg-white object-cover flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl border-2 border-black bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0">
                                    <Package size={24} />
                                  </div>
                                )}
                                <div>
                                  <p className="font-black text-slate-900 text-sm leading-none">
                                    {receipt.character?.name ||
                                      shortAddr(receipt.nftId)}
                                  </p>
                                  <p
                                    className="text-xs font-mono font-bold text-slate-400 mt-1.5 uppercase tracking-tighter"
                                    title={receipt.objectId}
                                  >
                                    {shortAddr(receipt.objectId)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Cart */}
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                {receipt.itemsSelected.split(',').map((item) => (
                                  <Badge
                                    key={item}
                                    className={`!text-[10px] tracking-tighter ${item.trim() === 'ALL_BUNDLE' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                                  >
                                    {item.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-4 text-center">
                              {receipt.status === ORDER_STATUS.PENDING ? (
                                <Badge className="bg-yellow-300 border-yellow-500 !text-[11px] !px-2.5 !py-1">Pending</Badge>
                              ) : receipt.status === ORDER_STATUS.SHIPPED ? (
                                <Badge className="bg-blue-400 text-white !text-[11px] !px-2.5 !py-1">Shipped</Badge>
                              ) : (
                                <Badge className="bg-green-500 text-white !text-[11px] !px-2.5 !py-1">Delivered</Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 pr-6">
                              <div className="flex justify-end gap-2 flex-wrap">
                                {/* Decrypt */}
                                <BrutalButton
                                  onClick={() => handleToggleDecrypt(receipt)}
                                  title={isDecrypted ? 'Clear Data' : 'Decrypt PII'}
                                  variant={isDecrypted ? 'danger' : 'purple'}
                                >
                                  {isDecrypted ? (
                                    <LockKeyhole size={15} />
                                  ) : (
                                    <LockOpen size={15} />
                                  )}
                                  {isDecrypted ? 'Hide' : 'Decrypt'}
                                </BrutalButton>

                                {/* Ship */}
                                <BrutalButton
                                  variant="primary"
                                  disabled={receipt.status !== ORDER_STATUS.PENDING}
                                  onClick={() => handleMarkShipped(receipt.objectId)}
                                >
                                  <Truck size={15} /> Ship
                                </BrutalButton>

                                {/* Delivered */}
                                <BrutalButton
                                  variant="success"
                                  disabled={receipt.status !== ORDER_STATUS.SHIPPED}
                                  onClick={() => handleMarkDelivered(receipt.objectId)}
                                >
                                  <CheckCircle size={15} /> Done
                                </BrutalButton>

                                {/* Tracking */}
                                <BrutalButton
                                  variant="teal"
                                  className="!px-3"
                                  disabled={receipt.status === ORDER_STATUS.PENDING || receipt.status === ORDER_STATUS.DELIVERED}
                                  onClick={() => handleOpenTrackingModal(receipt)}
                                  title={receipt.status === ORDER_STATUS.DELIVERED ? 'Order complete' : 'Add/Edit Tracking'}
                                >
                                  <ClipboardList size={15} />
                                </BrutalButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </BrutalCard>
          </section>
        </div>
      </main>

      {/* ── Tracking Modal (File 1 brutalist style) ── */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase italic">Logistics Update</h2>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="bg-red-500 text-white w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Carrier Service
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-3 outline-none cursor-pointer"
                >
                  <option value="">Select a carrier…</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="J&T Express">J&amp;T Express</option>
                  <option value="LBC">LBC</option>
                  <option value="DHL">DHL World</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tracking Number
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-4 outline-none focus:bg-white"
                  placeholder="e.g. 1Z999AA10123456784"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  value={estDeliveryDate}
                  onChange={(e) => setEstDeliveryDate(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-4 outline-none focus:bg-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <BrutalButton
                  onClick={() => setTrackingModalOpen(false)}
                  className="flex-1"
                >
                  Discard
                </BrutalButton>
                <BrutalButton
                  variant="black"
                  className="flex-1 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
                  onClick={handleSaveTracking}
                  disabled={isSavingTracking}
                >
                  {isSavingTracking ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    'Inject Tracking'
                  )}
                </BrutalButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}