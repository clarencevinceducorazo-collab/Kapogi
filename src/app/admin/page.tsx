
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
    Box, LockKeyhole, Key, ShieldCheck, ShieldAlert, LockOpen, Truck,
    CheckCircle, FileText, Home, LoaderCircle, ClipboardList, Download,
    Package, Clock, Search, X, Mail, Phone, MapPin, User, Crown,
    UserPlus, UserMinus, PauseCircle, PlayCircle, Wallet, DollarSign,
    RefreshCw, ChevronDown, AlertTriangle, Trash2
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

const shortAddr = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// ─────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) => (
    <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
            <div key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-[340px] border-4 border-black rounded-2xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] p-4 animate-in slide-in-from-left-4 fade-in duration-200 ${toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-yellow-300'
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
                            <h2 className="font-bold text-lg uppercase tracking-tight leading-none">Super Admin</h2>
                            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">System Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl border-2 border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-colors font-bold text-lg">×</button>
                </div>

                {/* Cap ID badge */}
                {superCapId && (
                    <div className="px-6 py-2 bg-yellow-50 border-b-2 border-yellow-200 flex items-center gap-2">
                        <Crown size={12} className="text-yellow-600" />
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Cap:</span>
                        <span className="text-[10px] font-mono text-yellow-600">{shortAddr(superCapId)}</span>
                    </div>
                )}

                {loadingInfo ? (
                    <div className="flex-1 flex items-center justify-center gap-3 text-slate-400 font-bold uppercase text-sm">
                        <LoaderCircle className="animate-spin" size={20} /> Loading config...
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* ── Mint Pause ── */}
                        <div className={`border-4 rounded-2xl p-5 ${registry?.mintPaused ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                {registry?.mintPaused ? <PauseCircle size={18} className="text-red-500" /> : <PlayCircle size={18} className="text-green-500" />}
                                <h3 className="font-bold uppercase tracking-tight text-sm">Minting Status</h3>
                                <span className={`ml-auto px-2 py-0.5 rounded text-white font-bold text-[9px] ${registry?.mintPaused ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {registry?.mintPaused ? 'PAUSED' : 'ACTIVE'}
                                </span>
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
                                    className="w-full h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-sm bg-white outline-none mb-3 focus:border-blue-400"
                                />
                            )}

                            <button
                                className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white ${registry?.mintPaused ? 'bg-green-500' : 'bg-red-500'} disabled:opacity-50`}
                                onClick={handleTogglePause}
                                disabled={togglingPause || (!registry?.mintPaused && !pauseReason.trim())}
                            >
                                {togglingPause ? <LoaderCircle size={15} className="animate-spin" /> : registry?.mintPaused ? <><PlayCircle size={15} /> Resume Minting</> : <><PauseCircle size={15} /> Pause Minting</>}
                            </button>
                        </div>

                        {/* ── Admin Whitelist ── */}
                        <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm">Admin Whitelist</h3>
                                <span className="ml-auto px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[9px]">{registry?.admins.length ?? 0} admins</span>
                            </div>

                            <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto">
                                {(registry?.admins ?? []).length === 0 ? (
                                    <p className="text-xs font-bold text-slate-400 text-center py-3">No admins whitelisted yet.</p>
                                ) : (
                                    registry?.admins.map((addr) => (
                                        <div key={addr} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
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

                            <div className="flex gap-2">
                                <input
                                    placeholder="0x... wallet address"
                                    value={newAdminAddr}
                                    onChange={(e) => setNewAdminAddr(e.target.value)}
                                    className="flex-1 h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-xs bg-white outline-none focus:border-blue-400"
                                />
                                <button className="h-10 px-3 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50" onClick={handleAddAdmin} disabled={addingAdmin || !newAdminAddr}>
                                    {addingAdmin ? <LoaderCircle size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* ── Treasury Address ── */}
                        <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm">Treasury Wallet</h3>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Current</p>
                                <p className="font-mono text-xs font-bold text-slate-700 truncate" title={treasury?.treasuryAddress}>
                                    {treasury?.treasuryAddress ?? '—'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    placeholder="New 0x... address"
                                    value={newTreasuryAddr}
                                    onChange={(e) => setNewTreasuryAddr(e.target.value)}
                                    className="flex-1 h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-xs bg-white outline-none focus:border-blue-400"
                                />
                                <button className="h-10 px-4 bg-orange-500 text-white rounded-xl font-bold text-xs disabled:opacity-50" onClick={handleUpdateTreasury} disabled={updatingTreasury || !newTreasuryAddr}>
                                    {updatingTreasury ? <LoaderCircle size={14} className="animate-spin" /> : 'Update'}
                                </button>
                            </div>
                        </div>

                        {/* ── Pricing ── */}
                        <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm">Pricing</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Base Mint Price</p>
                                    <p className="font-bold text-slate-600 text-sm mb-2">Current: {mistToSui(treasury?.baseMintPrice ?? 0)} SUI</p>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="New price in SUI"
                                            type="number"
                                            value={newMintPriceSui}
                                            onChange={(e) => setNewMintPriceSui(e.target.value)}
                                            className="flex-1 h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-xs bg-white outline-none focus:border-blue-400"
                                        />
                                        <button className="h-10 px-4 bg-slate-800 text-white rounded-xl font-bold text-xs disabled:opacity-50" onClick={handleUpdateMintPrice} disabled={updatingMintPrice || !newMintPriceSui}>
                                            {updatingMintPrice ? <LoaderCircle size={14} className="animate-spin" /> : 'Set'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Bundle Upgrade Price</p>
                                    <p className="font-bold text-slate-600 text-sm mb-2">Current: {mistToSui(treasury?.bundleUpgradePrice ?? 0)} SUI</p>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="New price in SUI"
                                            type="number"
                                            value={newBundlePriceSui}
                                            onChange={(e) => setNewBundlePriceSui(e.target.value)}
                                            className="flex-1 h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-xs bg-white outline-none focus:border-blue-400"
                                        />
                                        <button className="h-10 px-4 bg-slate-800 text-white rounded-xl font-bold text-xs disabled:opacity-50" onClick={handleUpdateBundlePrice} disabled={updatingBundlePrice || !newBundlePriceSui}>
                                            {updatingBundlePrice ? <LoaderCircle size={14} className="animate-spin" /> : 'Set'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full h-10 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50" onClick={loadInfo}>
                            <RefreshCw size={14} /> Refresh Data
                        </button>
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
    const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'delivered'>('pending');
    const [superAdminPanelOpen, setSuperAdminPanelOpen] = useState(false);

    const [trackingModalOpen, setTrackingModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [carrier, setCarrier] = useState('');
    const [estDeliveryDate, setEstDeliveryDate] = useState('');
    const [isSavingTracking, setIsSavingTracking] = useState(false);

    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastCounter = useRef(0);
    const showToast = (message: string, type: Toast['type'] = 'info') => {
        const id = ++toastCounter.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };
    const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

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
            setIsAdmin(admin || superAdmin);
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
            if (activeTab === 'pending' && r.status !== ORDER_STATUS.PENDING) return false;
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

    if (!account) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="toy-card rounded-[2rem] max-w-md w-full text-center p-8">
                    <LockKeyhole size={48} className="mx-auto mb-4 text-slate-400" />
                    <h2 className="font-bold text-2xl uppercase mb-3 text-slate-700">Admin Access</h2>
                    <p className="text-sm font-semibold text-slate-500 mb-6">Connect your wallet to continue.</p>
                    <CustomConnectButton className="!bg-blue-500 !border-2 !border-white/50 !text-white !font-bold !px-6 !py-3 !rounded-2xl shadow-[0_4px_0_0_#1d4ed8,0_8px_16px_-4px_rgba(59,130,246,0.4)]" />
                </div>
            </div>
        );
    }

    if (roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="flex items-center gap-3 font-bold text-slate-400 uppercase">
                    <LoaderCircle className="animate-spin" size={28} /> Verifying access...
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="toy-card rounded-[2rem] max-w-md w-full text-center p-8">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="font-bold text-2xl uppercase mb-3 text-slate-700">Access Denied</h2>
                    <p className="mb-2 font-semibold text-slate-600">This wallet is not in the admin whitelist.</p>
                    <p className="text-xs font-mono text-slate-400">{account.address}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-slate-700 min-h-screen flex flex-col overflow-x-hidden relative bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] aspect-square rounded-full bg-sky-200/40 blur-[120px] mix-blend-multiply"></div>
                <div className="absolute bottom-[20%] right-[-10%] w-[40%] aspect-square rounded-full bg-violet-200/40 blur-[120px] mix-blend-multiply"></div>
                <div className="absolute top-[40%] left-[20%] w-[30%] aspect-square rounded-full bg-amber-100/40 blur-[100px] mix-blend-multiply"></div>
            </div>

            <nav className="bg-white/70 backdrop-blur-xl border-b-4 border-white sticky top-0 z-50 shadow-[0_10px_40px_-15px_rgba(14,165,233,0.1)]">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(56,189,248,0.5)] border-2 border-white/50 bouncy-hover group-hover:rotate-6">
                          <Image
                                           src="/images/KapogianLogo.webp"
                                           alt="logo"
                                           width={64}
                                           height={64}
                                           className="rounded-full border-2 border-primary-foreground/50"
                                         />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold tracking-tight leading-none text-slate-800">Management</h1>
                            <span className="text-xs font-semibold text-sky-500 tracking-widest uppercase mt-1">Kapogian Admin Console</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="w-12 h-12 bg-white/90 border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(14,165,233,0.15)] text-slate-500 bouncy-hover hover:text-sky-500 hover:border-sky-100">
                                <Home className="text-2xl" />
                            </button>
                        </Link>
                        {isSuperAdmin && (
                            <button onClick={() => setSuperAdminPanelOpen(true)} className="w-12 h-12 bg-white/90 border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(14,165,233,0.15)] text-yellow-500 bouncy-hover hover:text-yellow-600 hover:border-yellow-100">
                                <Crown className="text-2xl" />
                            </button>
                        )}
                        <div className="bg-white/90 border-2 border-white rounded-2xl px-4 h-12 flex items-center shadow-[0_8px_20px_-8px_rgba(14,165,233,0.15)] font-semibold text-sm text-slate-600">
                            {shortAddr(account.address)}
                        </div>
                        <CustomConnectButton />
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 flex flex-col gap-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="toy-card rounded-[2rem] p-5 flex items-center gap-5 bouncy-hover cursor-pointer">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-400 text-white border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(251,191,36,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-y-[-50%] translate-x-[-50%]"></div>
                            <Clock className="text-3xl relative z-10" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase block mb-1">Pending</span>
                            <span className="text-4xl font-bold tracking-tight leading-none text-slate-800">{stats.pending}</span>
                        </div>
                    </div>
                    <div className="toy-card rounded-[2rem] p-5 flex items-center gap-5 bouncy-hover cursor-pointer">
                        <div className="w-14 h-14 bg-gradient-to-br from-sky-300 to-blue-400 text-white border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(56,189,248,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-y-[-50%] translate-x-[-50%]"></div>
                            <Truck className="text-3xl relative z-10" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-sky-500 tracking-widest uppercase block mb-1">Shipped</span>
                            <span className="text-4xl font-bold tracking-tight leading-none text-slate-800">{stats.shipped}</span>
                        </div>
                    </div>
                    <div className="toy-card rounded-[2rem] p-5 flex items-center gap-5 bouncy-hover cursor-pointer">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-300 to-emerald-500 text-white border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-y-[-50%] translate-x-[-50%]"></div>
                            <CheckCircle className="text-3xl relative z-10" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-emerald-500 tracking-widest uppercase block mb-1">Delivered</span>
                            <span className="text-4xl font-bold tracking-tight leading-none text-slate-800">{stats.delivered}</span>
                        </div>
                    </div>
                    <div className="toy-card rounded-[2rem] p-5 flex items-center gap-5 bouncy-hover cursor-pointer">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-300 to-purple-500 text-white border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_8px_16px_-6px_rgba(168,85,247,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 blur-md rounded-full translate-y-[-50%] translate-x-[-50%]"></div>
                            <Package className="text-3xl relative z-10" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase block mb-1">Total Orders</span>
                            <span className="text-4xl font-bold tracking-tight leading-none text-slate-800">{receipts.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_2.5fr] gap-8">
                    <div className="flex flex-col gap-8">
                        <div className="toy-card rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-sky-100 text-sky-500 rounded-xl flex items-center justify-center">
                                    <LockKeyhole className="text-2xl" />
                                </div>
                                <h2 className="text-lg font-bold tracking-tight text-slate-800">Security Credentials</h2>
                            </div>
                            <p className="text-sm font-medium text-slate-500 mb-6 pb-6 border-b-2 border-dashed border-sky-100/60">
                                AES-256 decryption key. Only processed locally in memory.
                            </p>
                            <div className="relative mb-6 group">
                                <input type="password" placeholder="Enter Private Key..." value={adminPrivateKey} onChange={(e) => setAdminPrivateKey(e.target.value)} className="w-full bg-white/60 border-[3px] border-white rounded-2xl pl-5 pr-12 py-4 text-base font-medium focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100/50 transition-all placeholder:text-slate-400 shadow-inner" />
                                <Key className="text-2xl text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 group-focus-within:text-sky-500 transition-colors" />
                            </div>
                            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-100 rounded-2xl p-4 flex gap-3 text-sky-600 shadow-sm">
                                <ShieldCheck className="text-2xl shrink-0 mt-0.5" />
                                <p className="text-sm font-semibold leading-relaxed">Your private key is never sent to any server. Local decryption only.</p>
                            </div>
                        </div>

                        <div className="toy-card rounded-[2rem] overflow-hidden flex flex-col h-[400px] !p-0">
                            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white p-5 flex items-center gap-3 border-b-4 border-white/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full translate-y-[-50%] translate-x-[50%]"></div>
                                <FileText className="text-2xl relative z-10" />
                                <h2 className="text-lg font-bold tracking-tight relative z-10">Shipping Payload</h2>
                            </div>
                            <div className="bg-white/40 flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                                {decryptedCards.length === 0 ? (
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-violet-100 shadow-[0_15px_35px_-10px_rgba(168,85,247,0.3)] mb-6 float-slow">
                                            <LockKeyhole className="text-5xl text-violet-300" />
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight text-slate-600 mb-2">Cipher Block Locked</h3>
                                        <p className="text-base font-medium text-slate-400 max-w-[200px]">Select an order and click the Lock icon</p>
                                    </div>
                                ) : (
                                    decryptedCards.map((card) => (
                                        <div key={card.id} className="text-left w-full space-y-3">
                                            {card.character?.imageUrl && (
                                                <div className="flex gap-3 items-center">
                                                    <Image src={card.character.imageUrl} alt={card.character.name || 'Character'} width={64} height={64} className="w-16 h-16 rounded-xl border-2 border-black object-cover" />
                                                    <div>
                                                        <h4 className="font-bold text-lg leading-tight">{card.character?.name}</h4>
                                                        <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase truncate w-40" title={card.id}>{shortAddr(card.id)}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><User size={11} /> Consignee</label>
                                                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-sm flex items-center justify-between">
                                                    {card.full_name}<ShieldCheck size={14} className="text-green-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><MapPin size={11} /> Destination</label>
                                                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-xs leading-snug">{card.address}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><Phone size={11} /> Contact</label>
                                                    <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-xs truncate">{card.contact_number}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="toy-card rounded-[2rem] flex flex-col overflow-hidden h-fit !p-0">
                        <div className="p-6 border-b-[3px] border-white flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Order Registry</h2>
                                <div className="bg-gradient-to-br from-amber-200 to-amber-400 border-2 border-white text-white px-3 py-1 rounded-xl text-sm font-bold shadow-[0_4px_10px_-2px_rgba(251,191,36,0.4)]">
                                    {receipts.length}
                                </div>
                            </div>
                            <div className="flex items-center bg-white/50 border-2 border-white rounded-2xl p-1.5 shadow-sm backdrop-blur-md">
                                <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 flex items-center gap-2 text-sm font-bold shadow-[0_4px_12px_-4px_rgba(14,165,233,0.2)] bouncy-hover rounded-xl ${activeTab === 'pending' ? 'bg-white text-sky-600 border-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                    <Clock className="text-lg" /> Pending
                                </button>
                                <button onClick={() => setActiveTab('shipped')} className={`px-4 py-2 flex items-center gap-2 text-sm font-semibold bouncy-hover rounded-xl ${activeTab === 'shipped' ? 'bg-white text-sky-600 border-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                    <Truck className="text-lg" /> Shipped
                                    <span className="bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-lg text-xs ml-1 font-bold">{stats.shipped}</span>
                                </button>
                                <button onClick={() => setActiveTab('delivered')} className={`px-4 py-2 flex items-center gap-2 text-sm font-semibold bouncy-hover rounded-xl ${activeTab === 'delivered' ? 'bg-white text-sky-600 border-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                    <CheckCircle className="text-lg" /> Delivered
                                    <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-lg text-xs ml-1 font-bold">{stats.delivered}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center border-b-[3px] border-white bg-white/20">
                            <div className="flex-1 w-full flex items-center px-6 py-4 md:border-r-[3px] border-white group">
                                <Search className="text-2xl text-slate-400 mr-4 shrink-0 group-focus-within:text-sky-500 transition-colors" />
                                <input type="text" placeholder="Search name, object ID, or wallet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent text-base font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none" />
                            </div>
                            <div className="px-6 py-4 w-full md:w-auto flex items-center gap-4 bg-sky-50/30 min-w-[300px]">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest shrink-0">Item</span>
                                <div className="relative w-full group">
                                    <select value={filterItem} onChange={(e) => setFilterItem(e.target.value)} className="w-full bg-white/80 border-2 border-white rounded-xl text-sm font-bold text-slate-700 pl-4 pr-10 py-2.5 shadow-sm focus:outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100/50 cursor-pointer transition-all appearance-none bouncy-hover">
                                        <option value="all">All Items</option>
                                        {allItems.map(item => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                    <ChevronDown className="text-lg absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-sky-500 transition-colors" />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 shrink-0">{filteredReceipts.length} results</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[1000px]">
                                <div className="grid grid-cols-[3fr_2.5fr_1.5fr_4fr] gap-6 px-8 py-5 bg-sky-50/40 border-b-[3px] border-white text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <div>Asset &amp; ID</div>
                                    <div>Cart</div>
                                    <div>Status</div>
                                    <div className="text-right pr-4">Actions</div>
                                </div>
                                <div className="flex flex-col">
                                    {loading ? (
                                        <div className="p-16 flex justify-center items-center gap-3 text-slate-400 font-bold text-sm uppercase">
                                            <LoaderCircle className="animate-spin" size={24} /> Loading orders...
                                        </div>
                                    ) : filteredReceipts.length === 0 ? (
                                        <div className="p-16 text-center font-bold text-slate-400 uppercase text-sm">No orders to display.</div>
                                    ) : (
                                        filteredReceipts.map((receipt) => (
                                            <div key={receipt.objectId} className="grid grid-cols-[3fr_2.5fr_1.5fr_4fr] gap-6 px-8 py-5 items-center border-b-[3px] border-white/60 hover:bg-white/60 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <Image src={receipt.character?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${receipt.nftId}`} alt="Avatar" width={56} height={56} className="w-14 h-14 rounded-2xl border-4 border-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.08)] bg-sky-100 bouncy-hover" />
                                                    <div>
                                                        <div className="text-base font-bold text-slate-800 mb-0.5">{receipt.character?.name || shortAddr(receipt.nftId)}</div>
                                                        <div className="text-xs font-semibold text-slate-400 tracking-wide">@{shortAddr(receipt.objectId)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {receipt.itemsSelected.split(',').map(item => (
                                                        <span key={item} className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm ${item.trim() === 'ALL_BUNDLE' ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white border-sky-300' : 'bg-white border-2 border-sky-50 text-sky-600'}`}>{item.trim()}</span>
                                                    ))}
                                                </div>
                                                <div>
                                                    {receipt.status === ORDER_STATUS.PENDING ? (
                                                        <span className="bg-amber-100 text-amber-600 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl inline-block shadow-sm">Pending</span>
                                                    ) : receipt.status === ORDER_STATUS.SHIPPED ? (
                                                        <span className="bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl inline-block shadow-sm">Shipped</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-600 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-xl inline-block shadow-sm">Delivered</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => handleToggleDecrypt(receipt)} className="bg-gradient-to-b from-violet-400 to-purple-500 text-white border-2 border-violet-200/50 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_0_0_#9333ea,0_8px_16px_-6px_rgba(168,85,247,0.4)] squishy-btn squishy-btn-purple">
                                                        <LockOpen className="text-lg" /> {decryptedCards.some(c => c.id === receipt.objectId) ? 'Hide' : 'Decrypt'}
                                                    </button>
                                                    <button onClick={() => handleMarkShipped(receipt.objectId)} disabled={receipt.status !== ORDER_STATUS.PENDING} className="bg-gradient-to-b from-sky-400 to-blue-500 text-white border-2 border-sky-200/50 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_0_0_#2563eb,0_8px_16px_-6px_rgba(59,130,246,0.4)] squishy-btn squishy-btn-blue disabled:opacity-50 disabled:shadow-none disabled:active:transform-none">
                                                        <Truck className="text-lg" /> Ship
                                                    </button>
                                                    <button onClick={() => handleMarkDelivered(receipt.objectId)} disabled={receipt.status !== ORDER_STATUS.SHIPPED} className="bg-emerald-50 text-emerald-500 border-2 border-emerald-100 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        <CheckCircle className="text-lg" /> Done
                                                    </button>
                                                    <button onClick={() => handleOpenTrackingModal(receipt)} className="bg-white/80 text-teal-500 border-2 border-white w-9 h-9 rounded-xl flex items-center justify-center shadow-sm hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition-colors bouncy-hover">
                                                        <ClipboardList className="text-lg" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <button className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-amber-300 to-orange-400 text-white rounded-full flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(245,158,11,0.6)] border-4 border-white bouncy-hover font-bold text-xl z-50 float-slow">
                N
            </button>

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
                                <button onClick={() => setTrackingModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 border-2 border-slate-200">Discard</button>
                                <button className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold border-2 border-black" onClick={handleSaveTracking} disabled={isSavingTracking}>
                                    {isSavingTracking ? <LoaderCircle size={16} className="animate-spin" /> : 'Inject Tracking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
