"use client";

/**
 * ShopItemSection.tsx
 * Fixed: colorBg is now stored as a CSS hex/linear-gradient string
 * so it works correctly in both the admin preview AND the shop page's
 * style={{ backgroundColor: item.colorBg }} prop.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingBag, Plus, RefreshCw, LoaderCircle, Pencil, X,
  Package, DollarSign, Layers, Eye, EyeOff,
  Image as ImageIcon, Tag, Palette, CheckCircle,
  ChevronDown, List, Trash2, AlertTriangle, AlertCircle
} from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import {
  CONTRACT_ADDRESSES, MODULES,
  SHOP_ITEM_TYPES, SHOP_ITEM_TYPE_LABELS, SHOP_ITEM_TYPE_ICONS,
  mistToSui, suiToMist,
} from "@/lib/constants";
import { useShopItems, useAllShopReceipts } from "@/lib/useShopQueries";
import { useQueryClient } from "@tanstack/react-query";
import { shopQueryKeys } from "@/lib/useShopQueries";
import type { ShopItem, ShopReceipt } from "@/lib/shopTypes";
import { cn, formatAddress } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STANDARD_SIZES  = ["XS", "S", "M", "L", "XL", "XXL"];
const STANDARD_COLORS = ["White", "Black", "Blue", "Red", "Grey", "Beige", "Cyan", "Pink", "Green", "Yellow", "Purple"];
const MAX_UPLOAD_SIZE = 200 * 1024 * 1024; // 200MB

// Each preset has:
//   value  — what gets stored on-chain in colorBg (valid CSS, works in style={{ backgroundColor }})
//   label  — human name
//   preview — inline style for the swatch in the admin picker
export const COLOR_BG_PRESETS = [
  { value: "#e0f2fe",  label: "Sky Blue",    preview: "#e0f2fe" },
  { value: "#fce7f3",  label: "Pink",        preview: "#fce7f3" },
  { value: "#d1fae5",  label: "Emerald",     preview: "#d1fae5" },
  { value: "#ede9fe",  label: "Violet",      preview: "#ede9fe" },
  { value: "#fef9c3",  label: "Yellow",      preview: "#fef9c3" },
  { value: "#ffedd5",  label: "Orange",      preview: "#ffedd5" },
  { value: "#f1f5f9",  label: "Slate",       preview: "#f1f5f9" },
  { value: "#e0e7ff",  label: "Indigo",      preview: "#e0e7ff" },
  { value: "#fef3c7",  label: "Amber",       preview: "#fef3c7" },
  { value: "#f0fdf4",  label: "Mint",        preview: "#f0fdf4" },
  { value: "#fff1f2",  label: "Rose",        preview: "#fff1f2" },
  { value: "#f0f9ff",  label: "Light Sky",   preview: "#f0f9ff" },
];

const DEFAULT_COLOR_BG = COLOR_BG_PRESETS[0].value;

const STATUS_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: "Pending",   cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  1: { label: "Shipped",   cls: "bg-blue-100 text-blue-700 border-blue-300" },
  2: { label: "Delivered", cls: "bg-green-100 text-green-700 border-green-300" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast { message: string; type: "success" | "error" | "info" }

interface Props {
  superCapId: string;
  signAndExecute: any;
  onToast: (msg: string, type: Toast["type"]) => void;
  adminRegistryId?: string;
}

const BLANK_FORM = {
  name: "",
  itemType: SHOP_ITEM_TYPES.SHIRT as number,
  priceSui: "",
  initialStock: "",
  sizes: [] as string[],
  colors: [] as string[],
  imageStatic: "",
  imageAnimated: "",
  imageBack: "",
  colorBg: DEFAULT_COLOR_BG,
};

interface PinataFile {
  ipfsHash: string;
  name: string;
  url: string;
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children, required }: { icon: any; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
      <Icon size={12} className="opacity-70" />
      {children} {required && <span className="text-rose-500">*</span>}
    </div>
  );
}

function DropdownMultiSelect({ label, options, selected, onToggle }: {
  label: string; options: string[]; selected: string[]; onToggle: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}
        className={cn("flex gap-2 items-center flex-wrap bg-sky-50 border-2 border-sky-100 rounded-2xl px-3 py-2 min-h-[46px] cursor-pointer hover:border-cyan-200 transition-all", open && "border-cyan-300 bg-white")}>
        {selected.length === 0
          ? <span className="text-slate-300 font-bold text-sm">Select {label}...</span>
          : selected.map((val) => (
            <span key={val} className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-sky-200">
              {val}
              <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(val); }} className="hover:text-rose-500">
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
        <ChevronDown size={14} className={cn("ml-auto text-slate-300 transition-transform", open && "rotate-180")} />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-50 p-2 grid grid-cols-2 gap-1 animate-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => onToggle(opt)}
              className={cn("flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase transition-all",
                selected.includes(opt) ? "bg-cyan-400 text-white shadow-sm" : "hover:bg-slate-50 text-slate-500")}>
              {opt}
              {selected.includes(opt) && <CheckCircle size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownAssetSelect({ label, value, onChange, onToast, required, files, loadingFiles }: {
  label: string; value: string; onChange: (url: string) => void; onToast: any;
  required?: boolean; files: PinataFile[]; loadingFiles: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadErrorMsg("File is too heavy (Max 200MB).");
      setUploadStatus('error');
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadStatus('loading');
    setUploadErrorMsg("");
    try {
      const presignRes = await fetch("/api/pinata/upload");
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url } = await presignRes.json();
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(url, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
      const data = await uploadRes.json();
      const cid = data?.data?.cid;
      if (!cid) throw new Error("No CID from Pinata");
      const gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz";
      const gatewayKey = process.env.NEXT_PUBLIC_PINATA_GATEWAY_KEY || "";
      const imageUrl = gatewayKey
        ? `${gatewayUrl}/ipfs/${cid}?pinataGatewayToken=${gatewayKey}`
        : `${gatewayUrl}/ipfs/${cid}`;
      onChange(imageUrl);
      setUploadStatus('success');
      setTimeout(() => { setUploadStatus('idle'); setOpen(false); }, 1500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadErrorMsg(err.message || "Upload failed.");
      setUploadStatus('error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <SectionLabel icon={ImageIcon} required={required}>{label}</SectionLabel>
      <div className="relative">
        <div onClick={() => setOpen(!open)}
          className={cn("h-12 border-2 rounded-2xl flex items-center px-4 cursor-pointer transition-all",
            value ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
            open && "border-cyan-300 bg-white")}>
          {value ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-md bg-white border border-slate-100 overflow-hidden flex-shrink-0">
                <img src={value} className="w-full h-full object-contain" alt="p" />
              </div>
              <span className="text-xs font-black text-emerald-600 truncate uppercase tracking-tighter">Asset Selected</span>
            </div>
          ) : (
            <span className="text-slate-300 font-bold text-xs">Pick or Upload {label}...</span>
          )}
          <ChevronDown size={14} className={cn("ml-auto text-slate-300 transition-transform", open && "rotate-180")} />
        </div>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-[60] overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadStatus === 'loading'}
              className="p-4 border-b-2 border-slate-50 hover:bg-sky-50 flex items-center gap-3 transition-colors text-sky-600">
              <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                {uploadStatus === 'loading' ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-tight">
                  {uploadStatus === 'loading' ? "Uploading to IPFS..." :
                   uploadStatus === 'success' ? "Asset Pinned!" :
                   uploadStatus === 'error' ? "Upload Failed" : "Upload New File"}
                </p>
                <p className="text-[10px] font-bold opacity-60">
                  {uploadStatus === 'loading' ? "Please wait a moment..." : "Add fresh asset up to 200MB"}
                </p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*" />
            </button>
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <p className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <List size={10} /> Pinata Library
              </p>
              {loadingFiles ? (
                <div className="p-4 flex items-center justify-center gap-2 text-slate-300 font-bold text-[10px]">
                  <LoaderCircle className="animate-spin" size={12} /> Syncing Library...
                </div>
              ) : files.length === 0 ? (
                <p className="p-4 text-center text-slate-300 font-bold text-[10px]">Library is empty.</p>
              ) : (
                files.map((file) => (
                  <button key={file.ipfsHash} type="button" onClick={() => { onChange(file.url); setOpen(false); }}
                    className={cn("w-full flex items-center gap-3 p-2 rounded-xl transition-all border-2",
                      value === file.url ? "bg-emerald-50 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50")}>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      <img src={file.url} className="w-full h-full object-cover" alt="prev" />
                    </div>
                    <div className="text-left overflow-hidden flex-1">
                      <p className="text-[10px] font-black text-slate-700 truncate">{file.name}</p>
                      <p className="text-[8px] font-mono text-slate-400 truncate opacity-60">{file.ipfsHash}</p>
                    </div>
                    {value === file.url && <CheckCircle size={14} className="text-emerald-500" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={uploadStatus !== 'idle'} onOpenChange={() => { if (uploadStatus !== 'loading') setUploadStatus('idle'); }}>
        <DialogContent className="max-w-sm w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="sr-only">Asset Upload Status</DialogTitle>
            <DialogDescription className="sr-only">Feedback on the IPFS upload progress.</DialogDescription>
          </DialogHeader>
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center">
            {uploadStatus === 'loading' && (
              <div className="animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-sky-50 rounded-[2rem] border-4 border-sky-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <LoaderCircle className="animate-spin text-sky-500" size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 mb-2 italic">Summoning Asset...</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Uploading "{label}"<br/>to the IPFS decentralized network.</p>
              </div>
            )}
            {uploadStatus === 'success' && (
              <div className="animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] border-4 border-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="text-emerald-500" size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-emerald-600 mb-2 italic">Ritual Complete!</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Your image has been permanently pinned.<br/>Manifesting preview...</p>
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] border-4 border-rose-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <AlertCircle className="text-rose-500" size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-rose-600 mb-2 italic">Upload Severed</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{uploadErrorMsg || "The file might be too large."}</p>
                <button onClick={() => setUploadStatus('idle')} className="mt-6 w-full py-3 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#9f1239]">Try Again</button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ title, subtitle, warning, onConfirm, onCancel, loading, variant = "danger" }: {
  title: string; subtitle: string; warning: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
  variant?: "danger" | "warning";
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center">
        <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-lg",
          variant === "danger" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500")}>
          {variant === "danger" ? <Trash2 size={40} /> : <AlertTriangle size={40} />}
        </div>
        <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-800 mb-1">{title}</h3>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">{subtitle}</p>
        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 mb-8">
          <p className="text-xs font-bold text-slate-500 leading-relaxed italic">{warning}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} disabled={loading}
            className={cn("w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs border-4 border-black transition-all active:translate-y-1 active:shadow-none disabled:opacity-50",
              variant === "danger" ? "bg-rose-500 shadow-[6px_6px_0_0_#9f1239]" : "bg-amber-500 shadow-[6px_6px_0_0_#b45309]")}>
            {loading ? <LoaderCircle className="animate-spin mx-auto" size={18} /> : "Permanent Burn"}
          </button>
          <button onClick={onCancel} disabled={loading} className="font-black text-[10px] uppercase text-slate-400 hover:text-black tracking-widest transition-colors">Abort Procedure</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopItemSection({ superCapId, signAndExecute, onToast, adminRegistryId }: Props) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, refetch } = useShopItems(false);
  const { data: allReceipts = [], isLoading: receiptsLoading } = useAllShopReceipts();

  const [activeTab, setActiveTab]     = useState<"items" | "receipts">("items");
  const [isOpen, setIsOpen]           = useState(false);
  const [form, setForm]               = useState(BLANK_FORM);
  const [isEditing, setIsEditing]     = useState(false);
  const [targetId, setTargetId]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [pinataFiles, setPinataFiles] = useState<PinataFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [deleteItemConfirm, setDeleteItemConfirm]       = useState<ShopItem | null>(null);
  const [deletingItemId, setDeletingItemId]             = useState<string | null>(null);
  const [deleteReceiptConfirm, setDeleteReceiptConfirm] = useState<ShopReceipt | null>(null);
  const [deletingReceiptId, setDeletingReceiptId]       = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingFiles(true);
      fetch("/api/pinata/list")
        .then((r) => r.json())
        .then((d) => { if (d.files) setPinataFiles(d.files); })
        .finally(() => setLoadingFiles(false));
    }
  }, [isOpen]);

  const invalidate = async () => {
    await new Promise((res) => setTimeout(res, 1500));
    await queryClient.invalidateQueries({ queryKey: shopQueryKeys.items });
    await queryClient.invalidateQueries({ queryKey: shopQueryKeys.receipts });
    await queryClient.invalidateQueries({ queryKey: shopQueryKeys.registry });
    await queryClient.invalidateQueries({ queryKey: shopQueryKeys.receiptRegistry });
    await refetch();
  };

  const openCreate = () => { setForm(BLANK_FORM); setIsEditing(false); setIsOpen(true); };
  const openEdit = (item: ShopItem) => {
    setForm({
      name: item.name, itemType: item.itemType,
      priceSui: item.priceSui.toString(), initialStock: item.stock.toString(),
      sizes: item.sizes, colors: item.colors,
      imageStatic: item.imageStatic, imageAnimated: item.imageAnimated,
      imageBack: item.imageBack,
      // Normalise: if it's an old Tailwind gradient string, fall back to default
      colorBg: item.colorBg?.startsWith("#") ? item.colorBg : DEFAULT_COLOR_BG,
    });
    setTargetId(item.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return onToast("Name is required.", "error");
    setSubmitting(true);
    try {
      const tx = new Transaction();
      if (isEditing) {
        tx.moveCall({
          target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_shop_item_display`,
          arguments: [
            tx.object(superCapId), tx.object(targetId),
            tx.pure.string(form.name.trim()),
            tx.pure.string(form.sizes.join(",")),
            tx.pure.string(form.colors.join(",")),
            tx.pure.string(form.imageStatic.trim()),
            tx.pure.string(form.imageAnimated.trim()),
            tx.pure.string(form.imageBack.trim()),
            tx.pure.string(form.colorBg.trim()), // now a valid CSS color
            tx.object("0x6"),
          ],
        });
        if (form.priceSui && parseFloat(form.priceSui) > 0) {
          tx.moveCall({
            target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_shop_item_price`,
            arguments: [
              tx.object(superCapId), tx.object(targetId),
              tx.pure.u64(suiToMist(parseFloat(form.priceSui))),
              tx.object("0x6"),
            ],
          });
        }
      } else {
        tx.moveCall({
          target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::create_shop_item`,
          arguments: [
            tx.object(superCapId),
            tx.object(CONTRACT_ADDRESSES.SHOP_REGISTRY_ID),
            tx.pure.string(form.name.trim()),
            tx.pure.u8(form.itemType),
            tx.pure.u64(suiToMist(parseFloat(form.priceSui))),
            tx.pure.u64(parseInt(form.initialStock)),
            tx.pure.string(form.sizes.join(",")),
            tx.pure.string(form.colors.join(",")),
            tx.pure.string(form.imageStatic.trim()),
            tx.pure.string(form.imageAnimated.trim()),
            tx.pure.string(form.imageBack.trim()),
            tx.pure.string(form.colorBg.trim()), // now a valid CSS color
            tx.object("0x6"),
          ],
        });
      }
      await signAndExecute({ transaction: tx });
      onToast(isEditing ? "Item updated!" : "Item created!", "success");
      setIsOpen(false);
      await invalidate();
    } catch (e: any) {
      onToast(e.message || "Action failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ShopItem) => {
    const registryId = adminRegistryId || CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID;
    setTogglingId(item.id);
    try {
      const tx = new Transaction();
      const func = item.available ? "pause_shop_item" : "unpause_shop_item";
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::${func}`,
        arguments: [tx.object(registryId), tx.object(item.id), tx.object("0x6")],
      });
      await signAndExecute({ transaction: tx });
      onToast(item.available ? "Item hidden." : "Item visible!", "success");
      await invalidate();
    } catch {
      onToast("Toggle failed.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemConfirm) return;
    setDeletingItemId(deleteItemConfirm.id);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::burn_shop_item`,
        arguments: [
          tx.object(superCapId),
          tx.object(CONTRACT_ADDRESSES.SHOP_REGISTRY_ID),
          tx.object(deleteItemConfirm.id),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx });
      onToast(`"${deleteItemConfirm.name}" permanently deleted.`, "success");
      setDeleteItemConfirm(null);
      await invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Deletion failed.", "error");
    } finally {
      setDeletingItemId(null);
    }
  };

  const confirmDeleteReceipt = async () => {
    if (!deleteReceiptConfirm) return;
    setDeletingReceiptId(deleteReceiptConfirm.id);
    const registryId = adminRegistryId ?? CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID;
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::burn_shop_receipt`,
        arguments: [
          tx.object(registryId),
          tx.object(CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID),
          tx.object(deleteReceiptConfirm.id),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx });
      onToast(`Receipt ${formatAddress(deleteReceiptConfirm.id)} deleted.`, "success");
      setDeleteReceiptConfirm(null);
      await invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Deletion failed.", "error");
    } finally {
      setDeletingReceiptId(null);
    }
  };

  return (
    <>
      {deleteItemConfirm && (
        <ConfirmModal
          title="Burn Shop Item." subtitle="Atomic Object Erasure"
          warning="Permanently deletes this item from the blockchain. This action is irreversible. Item must be hidden (paused) first."
          onConfirm={confirmDeleteItem} onCancel={() => setDeleteItemConfirm(null)}
          loading={!!deletingItemId} />
      )}
      {deleteReceiptConfirm && (
        <ConfirmModal
          title="Burn Receipt" subtitle="Proof-of-Purchase Deletion"
          warning="Deletes the on-chain receipt. Only do this for delivered orders that have been archived off-chain."
          onConfirm={confirmDeleteReceipt} onCancel={() => setDeleteReceiptConfirm(null)}
          loading={!!deletingReceiptId} />
      )}

      <section className="border-4 border-black rounded-3xl overflow-hidden bg-white">
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-cyan-400" />
            <h3 className="font-black uppercase text-base tracking-tight">Shop Inventory</h3>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 h-10 px-4 bg-cyan-400 text-black rounded-xl border-2 border-black font-black text-xs uppercase hover:bg-cyan-300 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 transition-all">
            <Plus size={16} /> Deploy Merch
          </button>
        </div>

        <div className="flex border-b-2 border-black bg-slate-50">
          {(["items", "receipts"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors",
                activeTab === tab ? "bg-white border-b-2 border-black text-black" : "text-slate-400 hover:text-black")}>
              {tab === "items" ? `Objects (${items.length})` : `Receipts (${allReceipts.length})`}
            </button>
          ))}
        </div>

        {activeTab === "items" && (
          <div className="divide-y-2 divide-slate-100 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center gap-3 text-slate-400 font-black text-xs uppercase">
                <LoaderCircle className="animate-spin" size={24} /> Loading...
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Thumbnail — use backgroundColor directly, it's now a valid CSS color */}
                  <div
                    className="w-14 h-14 rounded-2xl border-2 border-black overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: item.colorBg || "#e0f2fe" }}
                  >
                    <img src={item.imageStatic} className="w-full h-full object-contain p-1" alt="p" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate uppercase">{item.name}</p>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      <span className={item.available ? "text-emerald-500" : "text-rose-500"}>{item.available ? "Visible" : "Hidden"}</span>
                      <span>•</span>
                      <span>{Number(item.priceSui).toFixed(3)} SUI</span>
                      <span>•</span>
                      <span>{item.stock} Stock</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleStatus(item)} title={item.available ? "Hide" : "Show"}
                      className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center bg-white hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      {item.available ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center bg-white hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteItemConfirm(item)} disabled={item.available}
                      className={cn("w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]",
                        item.available ? "bg-slate-100 text-slate-300 opacity-50" : "bg-rose-500 text-white hover:bg-rose-600 shadow-[2px_2px_0_0_#9f1239]")}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="divide-y-2 divide-slate-100 max-h-[600px] overflow-y-auto">
            {allReceipts.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-black text-xs text-slate-800">{r.itemName}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{formatAddress(r.buyer)} • {Number(r.paymentSui).toFixed(3)} SUI</p>
                </div>
                {r.status === 2 && (
                  <button onClick={() => setDeleteReceiptConfirm(r)}
                    className="w-8 h-8 rounded-lg border-2 border-black bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-[2px_2px_0_0_#9f1239]">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Deploy / Modify Modal ───────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex overflow-hidden animate-in zoom-in-95 duration-300" style={{ maxHeight: "92vh" }}>

            {/* Left — live preview */}
            <div
              className="w-72 flex-shrink-0 p-8 border-r-4 border-slate-50 relative overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: form.colorBg || DEFAULT_COLOR_BG }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              <div className="relative z-10 flex flex-col h-full items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Manifest Preview</span>
                <div className="w-full bg-white rounded-[2.5rem] border-4 border-black p-4 shadow-xl mb-6 flex flex-col items-center">
                  <div
                    className="w-full aspect-square rounded-[1.8rem] border-2 border-slate-50 flex items-center justify-center relative mb-4"
                    style={{ backgroundColor: form.colorBg || DEFAULT_COLOR_BG }}
                  >
                    {form.imageStatic
                      ? <img src={form.imageStatic} className="w-full h-full object-contain p-2" alt="p" />
                      : <Plus size={40} className="text-slate-300" />}
                  </div>
                  <div className="text-center w-full px-2">
                    <span className="text-[8px] font-black uppercase text-slate-400">{SHOP_ITEM_TYPE_LABELS[form.itemType as keyof typeof SHOP_ITEM_TYPE_LABELS]}</span>
                    <h4 className="font-black text-lg text-slate-800 leading-tight uppercase truncate">{form.name || "UNNAMED OBJECT"}</h4>
                    <div className="bg-sky-50 rounded-xl py-1.5 border border-slate-100 mt-2 font-black text-sm text-blue-500">
                      SUI {Number(form.priceSui || 0).toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="px-10 pt-8 pb-6 border-b-4 border-slate-50 flex items-start justify-between">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white"><Package size={24} /></div>
                  {isEditing ? "Modify Object" : "Deploy Asset"}
                </h2>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
                {/* Identity */}
                <div className="space-y-6">
                  <SectionLabel icon={Tag} required>Identity</SectionLabel>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 text-lg outline-none focus:border-cyan-300"
                    placeholder="Product Name..." />
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(SHOP_ITEM_TYPE_LABELS).map(([val, label]) => (
                      <button key={val} onClick={() => setForm({ ...form, itemType: Number(val) })}
                        className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all",
                          form.itemType === Number(val) ? "bg-cyan-400 border-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]" : "bg-slate-50 border-slate-100 text-slate-400")}>
                        <span className="text-2xl">{SHOP_ITEM_TYPE_ICONS[Number(val) as keyof typeof SHOP_ITEM_TYPE_ICONS]}</span>
                        <span className="text-[10px] font-black uppercase">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price / Stock */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <SectionLabel icon={DollarSign} required>Price (SUI)</SectionLabel>
                    <input type="number" value={form.priceSui} onChange={(e) => setForm({ ...form, priceSui: e.target.value })}
                      className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black outline-none" placeholder="0.000" />
                  </div>
                  <div>
                    <SectionLabel icon={Package} required>Initial Supply</SectionLabel>
                    <input type="number" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                      className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black outline-none" placeholder="Units..." />
                  </div>
                </div>

                {/* Sizes / Colors / Background */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <SectionLabel icon={Palette}>Sizes</SectionLabel>
                    <DropdownMultiSelect label="Sizes" options={STANDARD_SIZES} selected={form.sizes}
                      onToggle={(s) => setForm(f => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s] }))} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <SectionLabel icon={Palette}>Colors</SectionLabel>
                      <DropdownMultiSelect label="Colors" options={STANDARD_COLORS} selected={form.colors}
                        onToggle={(c) => setForm(f => ({ ...f, colors: f.colors.includes(c) ? f.colors.filter(x => x !== c) : [...f.colors, c] }))} />
                    </div>
                    {/* ── Background color picker ── */}
                    <div>
                      <SectionLabel icon={Palette}>Card Background</SectionLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {COLOR_BG_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            title={preset.label}
                            onClick={() => setForm({ ...form, colorBg: preset.value })}
                            className={cn(
                              "w-9 h-9 rounded-xl border-2 transition-all",
                              form.colorBg === preset.value
                                ? "border-black scale-110 shadow-[0_0_0_3px_rgba(0,0,0,0.15)]"
                                : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                            )}
                            style={{ backgroundColor: preset.preview }}
                          />
                        ))}
                      </div>
                      {/* Selected color feedback */}
                      <p className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Selected: <span className="text-slate-600">{COLOR_BG_PRESETS.find(p => p.value === form.colorBg)?.label ?? form.colorBg}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assets */}
                <div className="grid grid-cols-3 gap-6">
                  <DropdownAssetSelect label="Static" value={form.imageStatic} onChange={(url) => setForm({ ...form, imageStatic: url })} onToast={onToast} required files={pinataFiles} loadingFiles={loadingFiles} />
                  <DropdownAssetSelect label="Animated" value={form.imageAnimated} onChange={(url) => setForm({ ...form, imageAnimated: url })} onToast={onToast} files={pinataFiles} loadingFiles={loadingFiles} />
                  <DropdownAssetSelect label="Back" value={form.imageBack} onChange={(url) => setForm({ ...form, imageBack: url })} onToast={onToast} files={pinataFiles} loadingFiles={loadingFiles} />
                </div>
              </div>

              <div className="px-10 py-6 border-t-4 border-slate-50 bg-slate-50/50 flex gap-4">
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-black text-white font-black py-5 rounded-[2rem] border-4 border-black hover:bg-slate-800 transition-all uppercase tracking-widest text-sm shadow-[6px_6px_0_0_rgba(59,130,246,0.5)] active:translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50">
                  {submitting ? <LoaderCircle className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  {submitting ? "Processing..." : isEditing ? "Update Object" : "Deploy to Chain"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}