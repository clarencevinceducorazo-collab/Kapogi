'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Box, LockKeyhole, Key, ShieldCheck, ShieldAlert, LockOpen, Truck,
  CheckCircle, FileText, Home, LoaderCircle, ClipboardList, Download,
  Package, Clock, Search, X, Mail, Phone, MapPin, User, Crown,
  UserPlus, UserMinus, PauseCircle, PlayCircle, Wallet, DollarSign,
  RefreshCw, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CustomConnectButton } from '@/components/kapogian/CustomConnectButton';
import Link from 'next/link';
import {
  suiClient,
  getAllReceipts, markAsShipped, addTrackingInfo, markAsDelivered,
  checkIsAdmin, checkIsSuperAdmin,
  getAdminRegistryInfo, getTreasuryConfigInfo,
  superAdminAddAdmin, superAdminRemoveAdmin,
  superAdminPauseMinting, superAdminUnpauseMinting,
  superAdminUpdateTreasury, superAdminUpdateMintPrice, superAdminUpdateBundlePrice,
} from '@/lib/sui';
import { decryptShippingInfo, type ShippingInfo } from '@/lib/encryption';
import { ORDER_STATUS, CONTRACT_ADDRESSES } from '@/lib/constants';
import { getIPFSGatewayUrl } from '@/lib/pinata';
import { mistToSui, suiToMist } from '@/lib/constants';

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
  character?: { name: string; imageUrl: string };
}

interface DecryptedCard extends ShippingInfo {
  id: string;
  itemsSelected: string;
  character?: { name: string; imageUrl: string };
}

interface RegistryInfo {
  admins: string[];
  mintPaused: boolean;
  pauseReason: string;
}

interface TreasuryInfo {
  treasuryAddress: string;
  baseMintPrice: number;
  bundleUpgradePrice: number;
}

// ─────────────────────────────────────────────
// Design System
// ─────────────────────────────────────────────

const BrutalCard = ({ children, className = '', noPadding = false }: {
  children: React.ReactNode; className?: string; noPadding?: boolean;
}) => (
  <div className={`bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${className}`}>
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);

const BrutalButton = ({ children, onClick, className = '', variant = 'default', disabled = false, title }: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'black' | 'purple' | 'teal' | 'orange' | 'yellow';
  disabled?: boolean; title?: string;
}) => {
  const variants: Record<string, string> = {
    default: 'bg-white text-black hover:bg-gray-50',
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    black: 'bg-black text-white hover:bg-gray-800',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
    teal: 'bg-teal-500 text-white hover:bg-teal-600',
    orange: 'bg-orange-500 text-white hover:bg-orange-600',
    yellow: 'bg-yellow-400 text-black hover:bg-yellow-500',
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`h-10 px-4 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 border-2 border-black rounded font-black text-[9px] uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

// ─────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) => (
  <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id}
        className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[340px] border-4 border-black rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-4 animate-in slide-in-from-left-4 fade-in duration-200 ${
          toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-yellow-300'
        }`}>
        <div className="flex-1">
          <p className="font-black text-black text-sm uppercase tracking-tight leading-snug">
            {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : '● '}{toast.message}
          </p>
        </div>
        <button onClick={() => onRemove(toast.id)} className="text-black/60 hover:text-black font-black text-lg leading-none mt-0.5 flex-shrink-0">×</button>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Super Admin Panel (drawer/modal)
// ─────────────────────────────────────────────

function SuperAdminPanel({
  onClose, signAndExecute, onToast,
}: {
  onClose: () => void;
  signAndExecute: any;
  onToast: (msg: string, type: Toast['type']) => void;
}) {
  const account = useCurrentAccount();
  const [registry, setRegistry] = useState<RegistryInfo | null>(null);
  const [treasury, setTreasury] = useState<TreasuryInfo | null>(null);
  const [superCapId, setSuperCapId] = useState<string>('');
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Add/Remove Admin
  const [newAdminAddr, setNewAdminAddr] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);

  // Pause
  const [pauseReason, setPauseReason] = useState('');
  const [togglingPause, setTogglingPause] = useState(false);

  // Treasury
  const [newTreasuryAddr, setNewTreasuryAddr] = useState('');
  const [updatingTreasury, setUpdatingTreasury] = useState(false);

  // Prices
  const [newMintPriceSui, setNewMintPriceSui] = useState('');
  const [newBundlePriceSui, setNewBundlePriceSui] = useState('');
  const [updatingMintPrice, setUpdatingMintPrice] = useState(false);
  const [updatingBundlePrice, setUpdatingBundlePrice] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    setLoadingInfo(true);
    try {
      const [reg, treas] = await Promise.all([getAdminRegistryInfo(), getTreasuryConfigInfo()]);
      setRegistry(reg);
      setTreasury(treas);

      // Find the SuperAdminCap object ID in the current wallet
      if (account?.address) {
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: { StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::admin::SuperAdminCap` },
        });
        if (ownedObjects.data[0]?.data?.objectId) {
          setSuperCapId(ownedObjects.data[0].data.objectId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminAddr.startsWith('0x')) { onToast('Invalid address format', 'error'); return; }
    setAddingAdmin(true);
    try {
      await superAdminAddAdmin({ superAdminCapId: superCapId, newAdminAddress: newAdminAddr, signAndExecute });
      onToast('Admin added!', 'success');
      setNewAdminAddr('');
      loadInfo();
    } catch (e: any) { onToast(e?.message?.includes('EAlreadyAdmin') ? 'Already an admin.' : 'Failed to add admin.', 'error'); }
    finally { setAddingAdmin(false); }
  };

  const handleRemoveAdmin = async (addr: string) => {
    setRemovingAdmin(addr);
    try {
      await superAdminRemoveAdmin({ superAdminCapId: superCapId, adminAddress: addr, signAndExecute });
      onToast('Admin removed.', 'success');
      loadInfo();
    } catch (e) { onToast('Failed to remove admin.', 'error'); }
    finally { setRemovingAdmin(null); }
  };

  const handleTogglePause = async () => {
    if (!registry) return;
    setTogglingPause(true);
    try {
      if (registry.mintPaused) {
        await superAdminUnpauseMinting({ superAdminCapId: superCapId, signAndExecute });
        onToast('Minting resumed!', 'success');
      } else {
        if (!pauseReason.trim()) { onToast('Enter a pause reason.', 'error'); setTogglingPause(false); return; }
        await superAdminPauseMinting({ superAdminCapId: superCapId, reason: pauseReason, signAndExecute });
        onToast('Minting paused.', 'info');
        setPauseReason('');
      }
      loadInfo();
    } catch (e) { onToast('Failed to toggle pause.', 'error'); }
    finally { setTogglingPause(false); }
  };

  const handleUpdateTreasury = async () => {
    if (!newTreasuryAddr.startsWith('0x')) { onToast('Invalid address format', 'error'); return; }
    setUpdatingTreasury(true);
    try {
      await superAdminUpdateTreasury({ superAdminCapId: superCapId, newTreasuryAddress: newTreasuryAddr, signAndExecute });
      onToast('Treasury address updated!', 'success');
      setNewTreasuryAddr('');
      loadInfo();
    } catch (e) { onToast('Failed to update treasury.', 'error'); }
    finally { setUpdatingTreasury(false); }
  };

  const handleUpdateMintPrice = async () => {
    const sui = parseFloat(newMintPriceSui);
    if (isNaN(sui) || sui <= 0) { onToast('Invalid price', 'error'); return; }
    setUpdatingMintPrice(true);
    try {
      await superAdminUpdateMintPrice({ superAdminCapId: superCapId, newPrice: suiToMist(sui), signAndExecute });
      onToast('Mint price updated!', 'success');
      setNewMintPriceSui('');
      loadInfo();
    } catch (e) { onToast('Failed to update mint price.', 'error'); }
    finally { setUpdatingMintPrice(false); }
  };

  const handleUpdateBundlePrice = async () => {
    const sui = parseFloat(newBundlePriceSui);
    if (isNaN(sui) || sui <= 0) { onToast('Invalid price', 'error'); return; }
    setUpdatingBundlePrice(true);
    try {
      await superAdminUpdateBundlePrice({ superAdminCapId: superCapId, newPrice: suiToMist(sui), signAndExecute });
      onToast('Bundle price updated!', 'success');
      setNewBundlePriceSui('');
      loadInfo();
    } catch (e) { onToast('Failed to update bundle price.', 'error'); }
    finally { setUpdatingBundlePrice(false); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer from right */}
      <div className="relative ml-auto h-full w-full max-w-lg bg-white border-l-4 border-black flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,1)] overflow-hidden">

        {/* Header */}
        <div className="bg-black text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Crown size={22} className="text-yellow-400" />
            <div>
              <h2 className="font-black text-lg uppercase tracking-tight leading-none">Super Admin</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">System Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border-2 border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors font-black text-lg">×</button>
        </div>

        {/* Cap ID badge */}
        {superCapId && (
          <div className="px-6 py-2 bg-yellow-50 border-b-2 border-yellow-200 flex items-center gap-2">
            <Crown size={12} className="text-yellow-600" />
            <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Cap:</span>
            <span className="text-[10px] font-mono text-yellow-600">{shortAddr(superCapId)}</span>
          </div>
        )}

        {loadingInfo ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-slate-400 font-black uppercase text-sm">
            <LoaderCircle className="animate-spin" size={20} /> Loading config...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ── Mint Pause ── */}
            <section className={`border-4 rounded-2xl p-5 ${registry?.mintPaused ? 'border-red-500 bg-red-50' : 'border-black bg-white'}`}>
              <div className="flex items-center gap-2 mb-4">
                {registry?.mintPaused ? <PauseCircle size={18} className="text-red-500" /> : <PlayCircle size={18} className="text-green-500" />}
                <h3 className="font-black uppercase tracking-tight text-sm">Minting Status</h3>
                <Badge className={registry?.mintPaused ? 'bg-red-500 text-white ml-auto' : 'bg-green-400 ml-auto'}>
                  {registry?.mintPaused ? 'PAUSED' : 'ACTIVE'}
                </Badge>
              </div>

              {registry?.mintPaused && (
                <div className="mb-4 p-3 bg-red-100 border-2 border-red-300 rounded-xl text-xs font-bold text-red-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  Reason: {registry.pauseReason || 'No reason provided'}
                </div>
              )}

              {!registry?.mintPaused && (
                <input
                  placeholder="Pause reason (required)..."
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded-xl px-3 font-bold text-sm bg-white outline-none mb-3"
                />
              )}

              <BrutalButton
                variant={registry?.mintPaused ? 'success' : 'danger'}
                className="w-full"
                onClick={handleTogglePause}
                disabled={togglingPause || (!registry?.mintPaused && !pauseReason.trim())}
              >
                {togglingPause ? <LoaderCircle size={15} className="animate-spin" /> : registry?.mintPaused ? <><PlayCircle size={15} /> Resume Minting</> : <><PauseCircle size={15} /> Pause Minting</>}
              </BrutalButton>
            </section>

            {/* ── Admin Whitelist ── */}
            <section className="border-4 border-black rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} />
                <h3 className="font-black uppercase tracking-tight text-sm">Admin Whitelist</h3>
                <Badge className="bg-slate-100 ml-auto">{registry?.admins.length ?? 0} admins</Badge>
              </div>

              {/* Current admins list */}
              <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto">
                {(registry?.admins ?? []).length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 text-center py-3">No admins whitelisted yet.</p>
                ) : (
                  registry?.admins.map((addr) => (
                    <div key={addr} className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2">
                      <User size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-600 flex-1 truncate" title={addr}>{addr}</span>
                      <button
                        onClick={() => handleRemoveAdmin(addr)}
                        disabled={removingAdmin === addr}
                        className="text-red-400 hover:text-red-600 disabled:opacity-40"
                        title="Remove admin"
                      >
                        {removingAdmin === addr ? <LoaderCircle size={14} className="animate-spin" /> : <UserMinus size={14} />}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add new admin */}
              <div className="flex gap-2">
                <input
                  placeholder="0x... wallet address"
                  value={newAdminAddr}
                  onChange={(e) => setNewAdminAddr(e.target.value)}
                  className="flex-1 h-10 border-2 border-black rounded-xl px-3 font-bold text-xs bg-white outline-none"
                />
                <BrutalButton variant="primary" onClick={handleAddAdmin} disabled={addingAdmin || !newAdminAddr}>
                  {addingAdmin ? <LoaderCircle size={14} className="animate-spin" /> : <UserPlus size={14} />}
                </BrutalButton>
              </div>
            </section>

            {/* ── Treasury Address ── */}
            <section className="border-4 border-black rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={18} />
                <h3 className="font-black uppercase tracking-tight text-sm">Treasury Wallet</h3>
              </div>
              <div className="p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                <p className="font-mono text-xs font-bold text-slate-700 truncate" title={treasury?.treasuryAddress}>
                  {treasury?.treasuryAddress ?? '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="New 0x... address"
                  value={newTreasuryAddr}
                  onChange={(e) => setNewTreasuryAddr(e.target.value)}
                  className="flex-1 h-10 border-2 border-black rounded-xl px-3 font-bold text-xs bg-white outline-none"
                />
                <BrutalButton variant="orange" onClick={handleUpdateTreasury} disabled={updatingTreasury || !newTreasuryAddr}>
                  {updatingTreasury ? <LoaderCircle size={14} className="animate-spin" /> : 'Update'}
                </BrutalButton>
              </div>
            </section>

            {/* ── Pricing ── */}
            <section className="border-4 border-black rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={18} />
                <h3 className="font-black uppercase tracking-tight text-sm">Pricing</h3>
              </div>
              <div className="space-y-4">
                {/* Mint price */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Mint Price</p>
                  <p className="font-black text-slate-600 text-sm mb-2">Current: {mistToSui(treasury?.baseMintPrice ?? 0)} SUI</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="New price in SUI"
                      type="number"
                      value={newMintPriceSui}
                      onChange={(e) => setNewMintPriceSui(e.target.value)}
                      className="flex-1 h-10 border-2 border-black rounded-xl px-3 font-bold text-xs bg-white outline-none"
                    />
                    <BrutalButton variant="black" onClick={handleUpdateMintPrice} disabled={updatingMintPrice || !newMintPriceSui}>
                      {updatingMintPrice ? <LoaderCircle size={14} className="animate-spin" /> : 'Set'}
                    </BrutalButton>
                  </div>
                </div>
                {/* Bundle price */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bundle Upgrade Price</p>
                  <p className="font-black text-slate-600 text-sm mb-2">Current: {mistToSui(treasury?.bundleUpgradePrice ?? 0)} SUI</p>
                  <div className="flex gap-2">
                    <input
                      placeholder="New price in SUI"
                      type="number"
                      value={newBundlePriceSui}
                      onChange={(e) => setNewBundlePriceSui(e.target.value)}
                      className="flex-1 h-10 border-2 border-black rounded-xl px-3 font-bold text-xs bg-white outline-none"
                    />
                    <BrutalButton variant="black" onClick={handleUpdateBundlePrice} disabled={updatingBundlePrice || !newBundlePriceSui}>
                      {updatingBundlePrice ? <LoaderCircle size={14} className="animate-spin" /> : 'Set'}
                    </BrutalButton>
                  </div>
                </div>
              </div>
            </section>

            {/* Refresh button */}
            <BrutalButton className="w-full" onClick={loadInfo}>
              <RefreshCw size={14} /> Refresh Data
            </BrutalButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function AdminPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Role state — both checked on-chain
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  const [adminPrivateKey, setAdminPrivateKey] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [decryptedCards, setDecryptedCards] = useState<DecryptedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterItem, setFilterItem] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ongoing' | 'shipped' | 'delivered'>('ongoing');
  const [superAdminPanelOpen, setSuperAdminPanelOpen] = useState(false);

  // Tracking modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estDeliveryDate, setEstDeliveryDate] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Role detection on wallet connect ──────────
  useEffect(() => {
    if (!account?.address) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    Promise.all([
      checkIsAdmin(account.address),
      checkIsSuperAdmin(account.address),
    ]).then(([admin, superAdmin]) => {
      setIsAdmin(admin || superAdmin); // super admin can also do admin things
      setIsSuperAdmin(superAdmin);
    }).catch(() => {
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }).finally(() => setRoleLoading(false));
  }, [account?.address]);

  useEffect(() => {
    if (isAdmin) loadReceipts();
    else setLoading(false);
  }, [isAdmin]);

  // Stats
  const stats = useMemo(() => ({
    pending: receipts.filter((r) => r.status === ORDER_STATUS.PENDING).length,
    shipped: receipts.filter((r) => r.status === ORDER_STATUS.SHIPPED).length,
    delivered: receipts.filter((r) => r.status === ORDER_STATUS.DELIVERED).length,
  }), [receipts]);

  const allItems = useMemo(() => {
    const items = new Set<string>();
    receipts.forEach((r) => r.itemsSelected.split(',').forEach((i) => items.add(i.trim())));
    return Array.from(items).sort();
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return receipts.filter((r) => {
      if (activeTab === 'ongoing' && r.status !== ORDER_STATUS.PENDING) return false;
      if (activeTab === 'shipped' && r.status !== ORDER_STATUS.SHIPPED) return false;
      if (activeTab === 'delivered' && r.status !== ORDER_STATUS.DELIVERED) return false;
      if (filterItem !== 'all' && !r.itemsSelected.split(',').map((i) => i.trim()).includes(filterItem)) return false;
      if (q) {
        const matchName = r.character?.name?.toLowerCase().includes(q);
        const matchId = r.objectId.toLowerCase().includes(q);
        const matchBuyer = r.buyer.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchBuyer) return false;
      }
      return true;
    });
  }, [receipts, searchQuery, filterItem, activeTab]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError('');
      const allReceiptObjects = await getAllReceipts();
      if (allReceiptObjects.length === 0) { setReceipts([]); setLoading(false); return; }

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

      const nftObjects = await suiClient.multiGetObjects({
        ids: parsedReceipts.map((r) => r.nftId),
        options: { showDisplay: true },
      });

      const nftsMap = new Map(
        nftObjects.filter((obj) => obj.data).map((obj) => [
          obj.data?.objectId,
          { imageUrl: getIPFSGatewayUrl((obj.data?.display?.data as any)?.image_url), name: (obj.data?.display?.data as any)?.name },
        ]),
      );

      setReceipts(parsedReceipts.map((r) => ({ ...r, character: nftsMap.get(r.nftId) })));
    } catch (err) {
      console.error(err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrackingModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setTrackingNumber(receipt.trackingNumber || '');
    setCarrier(receipt.carrier || '');
    setEstDeliveryDate(receipt.estimatedDelivery ? new Date(receipt.estimatedDelivery).toISOString().split('T')[0] : '');
    setTrackingModalOpen(true);
  };

  const handleSaveTracking = async () => {
    if (!selectedReceipt || !trackingNumber || !carrier || !estDeliveryDate) { showToast('All tracking fields are required.', 'error'); return; }
    setIsSavingTracking(true);
    try {
      await addTrackingInfo({ receiptObjectId: selectedReceipt.objectId, trackingNumber, carrier, estimatedDelivery: new Date(estDeliveryDate).getTime(), signAndExecute });
      showToast('Tracking information saved!', 'success');
      setTrackingModalOpen(false);
      loadReceipts();
    } catch (e) { showToast('Failed to save tracking info.', 'error'); }
    finally { setIsSavingTracking(false); }
  };

  const handleToggleDecrypt = async (receipt: Receipt) => {
    if (decryptedCards.some((c) => c.id === receipt.objectId)) { setDecryptedCards([]); return; }
    if (!adminPrivateKey) { showToast('Enter Admin Private Key first.', 'error'); return; }
    try {
      const decryptedInfo = await decryptShippingInfo(receipt.encryptedShippingInfo, adminPrivateKey);
      setDecryptedCards([{ id: receipt.objectId, ...decryptedInfo, itemsSelected: receipt.itemsSelected, character: receipt.character }]);
    } catch (e) { showToast('Decryption failed. Check your key.', 'error'); }
  };

  const handleMarkShipped = async (receiptId: string) => {
    try {
      await markAsShipped({ receiptObjectId: receiptId, signAndExecute });
      showToast('Order marked as Shipped!', 'success');
      loadReceipts();
    } catch (e) { showToast('Failed to mark as shipped.', 'error'); }
  };

  const handleMarkDelivered = async (receiptId: string) => {
    try {
      await markAsDelivered({ receiptObjectId: receiptId, signAndExecute });
      showToast('Order marked as Delivered!', 'success');
      loadReceipts();
    } catch (e) { showToast('Failed to mark as delivered.', 'error'); }
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
    } catch { window.open(imageUrl, '_blank'); }
  };

  // ── Guards ─────────────────────────────────

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <BrutalCard className="max-w-md w-full text-center">
          <LockKeyhole size={48} className="mx-auto mb-4 text-slate-400" />
          <h2 className="font-black text-2xl uppercase mb-3">Admin Access</h2>
          <p className="text-sm font-bold text-slate-500 mb-6">Connect your wallet to continue.</p>
          <CustomConnectButton className="!bg-blue-500 !border-4 !border-black !text-white !font-black !px-6 !py-2 !rounded-xl !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:!bg-blue-600" />
        </BrutalCard>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-3 font-black text-slate-400 uppercase">
          <LoaderCircle className="animate-spin" size={28} /> Verifying access...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <BrutalCard className="max-w-md w-full text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="font-black text-2xl uppercase mb-3">Access Denied</h2>
          <p className="mb-2 font-bold text-slate-600">This wallet is not in the admin whitelist.</p>
          <p className="text-xs font-mono text-slate-400">{account.address}</p>
        </BrutalCard>
      </div>
    );
  }

  // ── Main Render ────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900"
      style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundAttachment: 'fixed', zoom: 0.9 }}>

      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Box size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Management</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kapogian Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <BrutalButton className="!px-3"><Home size={20} /></BrutalButton>
            </Link>

            {/* ── Super Admin Button (only visible if super admin) ── */}
            {isSuperAdmin && (
              <BrutalButton
                variant="yellow"
                onClick={() => setSuperAdminPanelOpen(true)}
                className="gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Crown size={16} />
                <span>Super Admin</span>
              </BrutalButton>
            )}

            <div className="bg-white border-4 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-sm flex items-center gap-2">
              {isSuperAdmin && <Crown size={14} className="text-yellow-500" />}
              {shortAddr(account.address)}
            </div>
            <CustomConnectButton className="!bg-blue-500 !border-4 !border-black !text-white !font-black !px-5 !py-2 !rounded-xl !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:!bg-blue-600 !text-sm" />
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 p-3 rounded-xl border-2 border-black"><Clock size={28} /></div>
              <div><p className="text-xs font-black uppercase text-slate-400">Pending</p><p className="text-4xl font-black">{stats.pending}</p></div>
            </div>
          </BrutalCard>
          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-blue-400 p-3 rounded-xl border-2 border-black text-white"><Truck size={28} /></div>
              <div><p className="text-xs font-black uppercase text-slate-400">Shipped</p><p className="text-4xl font-black">{stats.shipped}</p></div>
            </div>
          </BrutalCard>
          <BrutalCard>
            <div className="flex items-center gap-4">
              <div className="bg-green-400 p-3 rounded-xl border-2 border-black text-white"><CheckCircle size={28} /></div>
              <div><p className="text-xs font-black uppercase text-slate-400">Delivered</p><p className="text-4xl font-black">{stats.delivered}</p></div>
            </div>
          </BrutalCard>
          <BrutalCard className="bg-blue-500">
            <div className="flex items-center gap-4">
              <div className="bg-black p-3 rounded-xl border-2 border-black text-white"><Package size={28} /></div>
              <div><p className="text-xs font-black uppercase text-blue-900/60">Total Orders</p><p className="text-4xl font-black text-black">{receipts.length}</p></div>
            </div>
          </BrutalCard>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* ── Left: Security & Decrypted ── */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <BrutalCard>
              <div className="flex items-center gap-3 mb-4">
                <LockKeyhole className="text-slate-400" size={20} />
                <h3 className="font-black uppercase tracking-tight text-base">Security Credentials</h3>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4 bg-slate-50 p-3 rounded-xl border-2 border-dashed border-slate-300 leading-tight">
                AES-256 decryption key. Only processed locally in memory.
              </p>
              <div className="relative">
                <input type="password" placeholder="Enter Private Key..." value={adminPrivateKey} onChange={(e) => setAdminPrivateKey(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-4 border-black rounded-2xl px-5 text-lg font-bold placeholder:text-slate-300 focus:bg-white focus:ring-0 outline-none transition-all" />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
              <div className="mt-4 flex items-start gap-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-3">
                <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-tight">Your private key is never sent to any server. Local decryption only.</p>
              </div>
            </BrutalCard>

            <BrutalCard noPadding className="flex-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
                      <p className="font-black text-slate-400 uppercase text-base tracking-tighter">Cipher Block Locked</p>
                      <p className="text-sm font-bold text-slate-300 mt-1">Select an order and click the Lock Icon</p>
                    </div>
                  </div>
                ) : (
                  decryptedCards.map((card) => (
                    <div key={card.id} className="space-y-6">
                      <div className="flex gap-4 p-4 bg-blue-50 border-4 border-blue-200 rounded-2xl relative">
                        <div className="absolute -top-2 -right-2 bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase rounded border border-white">Decrypted</div>
                        {card.character?.imageUrl && (
                          <Image src={card.character.imageUrl} alt={card.character.name || 'Character'} width={88} height={88}
                            className="w-22 h-22 rounded-xl border-2 border-black object-cover shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
                        )}
                        <div className="flex flex-col justify-center">
                          <p className="text-xs font-black text-blue-500 uppercase leading-none mb-1">Holder Identity</p>
                          <h4 className="font-black text-slate-900 text-xl leading-tight">{card.character?.name}</h4>
                          <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase truncate w-40" title={card.id}>{shortAddr(card.id)}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={11} /> Consignee</label>
                          <div className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-sm flex items-center justify-between">
                            {card.full_name}<ShieldCheck size={16} className="text-green-500" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={11} /> Shipping Destination</label>
                          <div className="p-3 bg-slate-50 border-2 border-black rounded-xl font-bold text-slate-700 text-sm leading-relaxed italic">{card.address}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone size={11} /> Contact</label>
                            <p className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-xs truncate">{card.contact_number}</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Mail size={11} /> Email</label>
                            <p className="p-3 bg-slate-50 border-2 border-black rounded-xl font-black text-slate-700 text-xs truncate">{(card as any).email}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Package size={11} /> Inventory</label>
                          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border-2 border-black rounded-xl">
                            {card.itemsSelected.split(',').map((item) => (
                              <Badge key={item} className="bg-white !text-[10px]">{item.trim()}</Badge>
                            ))}
                          </div>
                        </div>
                        {card.character?.imageUrl && (
                          <BrutalButton variant="black" className="w-full h-12 text-sm"
                            onClick={() => handleDownloadImage(card.character!.imageUrl, card.character!.name)}>
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

          {/* ── Right: Order Registry ── */}
          <section className="lg:col-span-8 flex flex-col">
            <BrutalCard noPadding className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col flex-1">
              <div className="p-5 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Order Registry</h3>
                  <Badge className="bg-yellow-400 border-2 border-black !text-xs !px-2.5 !py-0.5">{receipts.length}</Badge>
                </div>
                <div className="flex items-center border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {(['ongoing', 'shipped', 'delivered'] as const).map((tab, i) => {
                    const count = receipts.filter((r) =>
                      tab === 'ongoing' ? r.status === 0 : tab === 'shipped' ? r.status === 1 : r.status === 2
                    ).length;
                    const Icon = tab === 'ongoing' ? Clock : tab === 'shipped' ? Truck : CheckCircle;
                    const activeColor = tab === 'ongoing' ? 'bg-yellow-400 text-black' : tab === 'shipped' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white';
                    const badgeActive = tab === 'ongoing' ? 'bg-black text-white border-black' : 'bg-white border-white';
                    const badgeInactive = tab === 'ongoing' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : tab === 'shipped' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-green-100 border-green-400 text-green-700';
                    return (
                      <React.Fragment key={tab}>
                        {i > 0 && <div className="w-0.5 h-6 bg-black" />}
                        <button onClick={() => setActiveTab(tab)}
                          className={`h-10 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === tab ? activeColor : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                          <Icon size={12} /> {tab === 'ongoing' ? 'Pending' : tab}
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${activeTab === tab ? badgeActive : badgeInactive}`}>{count}</span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Search + Filters */}
              <div className="px-5 py-3 border-b-2 border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <input placeholder="Search name, object ID, or wallet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-xl pl-10 h-10 font-bold text-sm outline-none" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"><X size={13} /></button>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Item</span>
                  <select value={filterItem} onChange={(e) => setFilterItem(e.target.value)}
                    className="h-10 bg-white border-2 border-black rounded-xl px-3 font-black text-xs uppercase outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <option value="all">All Items</option>
                    {allItems.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                {(searchQuery || filterItem !== 'all') && (
                  <button onClick={() => { setSearchQuery(''); setFilterItem('all'); }}
                    className="h-10 px-3 border-2 border-red-400 rounded-xl font-black text-xs uppercase text-red-500 hover:bg-red-50 flex items-center gap-1.5">
                    <X size={12} /> Clear
                  </button>
                )}
                <span className="text-[10px] font-black text-slate-400 ml-auto">{filteredReceipts.length} result{filteredReceipts.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-16 flex justify-center items-center gap-3 text-slate-400 font-black text-sm uppercase">
                  <LoaderCircle className="animate-spin" size={24} /> Loading orders...
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="p-16 text-center font-black text-slate-400 uppercase text-sm">No orders to display.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b-4 border-black">
                      <tr>
                        <th className="p-4 text-left text-[11px] font-black uppercase text-slate-400 tracking-widest pl-6">Asset & ID</th>
                        <th className="p-4 text-left text-[11px] font-black uppercase text-slate-400 tracking-widest">Cart</th>
                        <th className="p-4 text-center text-[11px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                        <th className="p-4 text-right text-[11px] font-black uppercase text-slate-400 tracking-widest pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {filteredReceipts.map((receipt) => {
                        const isDecrypted = decryptedCards.some((c) => c.id === receipt.objectId);
                        return (
                          <tr key={receipt.objectId} className={`hover:bg-slate-50 transition-colors ${isDecrypted ? 'bg-blue-50/50' : ''}`}>
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                {receipt.character?.imageUrl ? (
                                  <Image src={receipt.character.imageUrl} alt={receipt.character.name || 'NFT'} width={64} height={64}
                                    className="w-16 h-16 rounded-xl border-2 border-black bg-white object-cover flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                ) : (
                                  <div className="w-16 h-16 rounded-xl border-2 border-black bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0"><Package size={24} /></div>
                                )}
                                <div>
                                  <p className="font-black text-slate-900 text-sm leading-none">{receipt.character?.name || shortAddr(receipt.nftId)}</p>
                                  <p className="text-xs font-mono font-bold text-slate-400 mt-1.5 uppercase tracking-tighter" title={receipt.objectId}>{shortAddr(receipt.objectId)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                                {receipt.itemsSelected.split(',').map((item) => (
                                  <Badge key={item} className={`!text-[10px] tracking-tighter ${item.trim() === 'ALL_BUNDLE' ? 'bg-blue-500 text-white' : 'bg-white'}`}>{item.trim()}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              {receipt.status === ORDER_STATUS.PENDING ? (
                                <Badge className="bg-yellow-300 border-yellow-500 !text-[11px] !px-2.5 !py-1">Pending</Badge>
                              ) : receipt.status === ORDER_STATUS.SHIPPED ? (
                                <Badge className="bg-blue-400 text-white !text-[11px] !px-2.5 !py-1">Shipped</Badge>
                              ) : (
                                <Badge className="bg-green-500 text-white !text-[11px] !px-2.5 !py-1">Delivered</Badge>
                              )}
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex justify-end gap-2 flex-wrap">
                                <BrutalButton onClick={() => handleToggleDecrypt(receipt)} title={isDecrypted ? 'Clear Data' : 'Decrypt PII'} variant={isDecrypted ? 'danger' : 'purple'}>
                                  {isDecrypted ? <LockKeyhole size={15} /> : <LockOpen size={15} />}
                                  {isDecrypted ? 'Hide' : 'Decrypt'}
                                </BrutalButton>
                                <BrutalButton variant="primary" disabled={receipt.status !== ORDER_STATUS.PENDING} onClick={() => handleMarkShipped(receipt.objectId)}>
                                  <Truck size={15} /> Ship
                                </BrutalButton>
                                <BrutalButton variant="success" disabled={receipt.status !== ORDER_STATUS.SHIPPED} onClick={() => handleMarkDelivered(receipt.objectId)}>
                                  <CheckCircle size={15} /> Done
                                </BrutalButton>
                                <BrutalButton variant="teal" className="!px-3"
                                  disabled={receipt.status === ORDER_STATUS.PENDING || receipt.status === ORDER_STATUS.DELIVERED}
                                  onClick={() => handleOpenTrackingModal(receipt)} title="Add/Edit Tracking">
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

      {/* ── Tracking Modal ── */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-4 border-black rounded-3xl w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase italic">Logistics Update</h2>
              <button onClick={() => setTrackingModalOpen(false)} className="bg-red-500 text-white w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carrier Service</label>
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-3 outline-none cursor-pointer">
                  <option value="">Select a carrier…</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="LBC">LBC</option>
                  <option value="DHL">DHL World</option>
                  <option value="SPX">Shoppe Express</option>
                  <option value="J&T">J&T (17Track)</option>
                  <option value="NINJA">NINJA Van Philippines</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking Number</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-4 outline-none focus:bg-white"
                  placeholder="e.g. 1Z999AA10123456784" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Delivery Date</label>
                <input type="date" value={estDeliveryDate} onChange={(e) => setEstDeliveryDate(e.target.value)}
                  className="w-full h-12 border-2 border-black rounded-xl font-bold bg-slate-50 px-4 outline-none focus:bg-white" />
              </div>
              <div className="pt-4 flex gap-3">
                <BrutalButton onClick={() => setTrackingModalOpen(false)} className="flex-1">Discard</BrutalButton>
                <BrutalButton variant="black" className="flex-1 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]" onClick={handleSaveTracking} disabled={isSavingTracking}>
                  {isSavingTracking ? <LoaderCircle size={16} className="animate-spin" /> : 'Inject Tracking'}
                </BrutalButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Super Admin Panel ── */}
      {superAdminPanelOpen && (
        <SuperAdminPanel
          onClose={() => setSuperAdminPanelOpen(false)}
          signAndExecute={signAndExecute}
          onToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}