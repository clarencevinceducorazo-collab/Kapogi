
"use client";

/**
 * ShopItemSection.tsx
 * Overhauled Admin UI for managing Shop items on-chain.
 * Features a high-fidelity landscape modal with live preview, dropdown multi-selects, 
 * Pinata asset library integration, and specialized upload status modals.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingBag, Plus, RefreshCw, LoaderCircle, Pencil, X,
  Package, DollarSign, Layers, ToggleLeft, ToggleRight,
  Upload, Image as ImageIcon, Tag, Palette, CheckCircle,
  AlertCircle, ChevronDown, List, Trash2, Eye, EyeOff
} from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_ADDRESSES, MODULES, SHOP_ITEM_TYPES, SHOP_ITEM_TYPE_LABELS, SHOP_ITEM_TYPE_ICONS, mistToSui, suiToMist } from "@/lib/constants";
import { useShopItems } from "@/lib/useShopQueries";
import { useQueryClient } from "@tanstack/react-query";
import { shopQueryKeys } from "@/lib/useShopQueries";
import type { ShopItem } from "@/lib/shopTypes";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const STANDARD_COLORS = ["White", "Black", "Blue", "Red", "Grey", "Beige", "Cyan", "Pink", "Green", "Yellow", "Purple"];

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
  colorBg: "from-cyan-100 to-blue-100",
};

interface PinataFile {
  ipfsHash: string;
  name: string;
  url: string;
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children, required }: { icon: any, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
      <Icon size={12} className="opacity-70" />
      {children} {required && <span className="text-rose-500">*</span>}
    </div>
  );
}

/**
 * DropdownMultiSelect
 */
function DropdownMultiSelect({
  label,
  options,
  selected,
  onToggle
}: {
  label: string,
  options: string[],
  selected: string[],
  onToggle: (val: string) => void
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        className={cn(
          "flex gap-2 items-center flex-wrap bg-sky-50 border-2 border-sky-100 rounded-2xl px-3 py-2 min-h-[46px] cursor-pointer hover:border-cyan-200 transition-all",
          open && "border-cyan-300 bg-white"
        )}
      >
        {selected.length === 0 ? (
          <span className="text-slate-300 font-bold text-sm">Select {label}...</span>
        ) : (
          selected.map((val) => (
            <span key={val} className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-sky-200">
              {val}
              <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(val); }} className="hover:text-rose-500"><X size={10} strokeWidth={3} /></button>
            </span>
          ))
        )}
        <ChevronDown size={14} className={cn("ml-auto text-slate-300 transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-50 p-2 grid grid-cols-2 gap-1 animate-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black uppercase transition-all",
                selected.includes(opt) ? "bg-cyan-400 text-white shadow-sm" : "hover:bg-slate-50 text-slate-500"
              )}
            >
              {opt}
              {selected.includes(opt) && <CheckCircle size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownAssetSelect
 */
function DropdownAssetSelect({
  label,
  value,
  onChange,
  onToast,
  required,
  files,
  loadingFiles
}: {
  label: string,
  value: string,
  onChange: (url: string) => void,
  onToast: any,
  required?: boolean,
  files: PinataFile[],
  loadingFiles: boolean
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local status state for upload feedback
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('loading');
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `shop-asset-${Date.now()}`);
      const res = await fetch("/api/pinata/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { imageUrl } = await res.json();
      onChange(imageUrl);
      setUploadStatus('success');
      setTimeout(() => {
        setUploadStatus('idle');
        setOpen(false);
      }, 1500);
    } catch {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <SectionLabel icon={ImageIcon} required={required}>{label}</SectionLabel>
      
      <div className="relative">
        <div 
          onClick={() => setOpen(!open)}
          className={cn(
            "h-12 border-2 rounded-2xl flex items-center px-4 cursor-pointer transition-all",
            value ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
            open && "border-cyan-300 bg-white"
          )}
        >
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl z-[60] overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
            {/* Upload Zone inside dropdown */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus === 'loading'}
              className={cn(
                "p-4 border-b-2 border-slate-50 flex items-center gap-3 transition-colors",
                uploadStatus === 'loading' ? "bg-slate-50 text-slate-400" : "hover:bg-sky-50 text-sky-600"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center border-2",
                uploadStatus === 'loading' ? "bg-white border-slate-200" : 
                uploadStatus === 'success' ? "bg-emerald-100 border-emerald-300 text-emerald-600" :
                uploadStatus === 'error' ? "bg-red-100 border-red-300 text-red-600" :
                "bg-sky-100 border-sky-200 text-sky-600"
              )}>
                {uploadStatus === 'loading' ? <LoaderCircle className="animate-spin" size={16} /> : 
                 uploadStatus === 'success' ? <CheckCircle size={16} /> :
                 uploadStatus === 'error' ? <AlertCircle size={16} /> :
                 <Plus size={16} />}
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-tight">
                  {uploadStatus === 'loading' ? "Uploading to IPFS..." : 
                   uploadStatus === 'success' ? "Asset Pinned!" :
                   uploadStatus === 'error' ? "Upload Failed" :
                   "Upload New File"}
                </p>
                <p className="text-[10px] font-bold opacity-60">
                  {uploadStatus === 'loading' ? "Please wait a moment..." : "Add fresh asset to Pinata"}
                </p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept="image/*" />
            </button>

            {/* Status Feedback Overlays */}
            {uploadStatus === 'loading' && (
              <div className="p-12 flex flex-col items-center gap-3 bg-white/95">
                <LoaderCircle className="animate-spin text-sky-400" size={32} />
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Pinning to IPFS Network...</p>
              </div>
            )}

            {/* List from Pinata */}
            {uploadStatus === 'idle' && (
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
                    <button
                      key={file.ipfsHash}
                      type="button"
                      onClick={() => { onChange(file.url); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-xl transition-all border-2",
                        value === file.url ? "bg-emerald-50 border-emerald-200" : "bg-white border-transparent hover:bg-slate-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
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
            )}
          </div>
        )}
      </div>

      {/* Global Status Modals for Upload */}
      <Dialog open={uploadStatus !== 'idle'} onOpenChange={() => { if(uploadStatus !== 'loading') setUploadStatus('idle') }}>
        <DialogContent className="max-w-sm w-full p-0 bg-transparent border-none shadow-none !rounded-[2.5rem]">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] text-center relative overflow-hidden">
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
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">We couldn't reach Pinata.<br/>Please check your connection.</p>
                <button onClick={() => setUploadStatus('idle')} className="mt-6 w-full py-3 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#9f1239]">Try Again</button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopItemSection({ superCapId, signAndExecute, onToast, adminRegistryId }: Props) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, refetch } = useShopItems(false);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Library State
  const [pinataFiles, setPinataFiles] = useState<PinataFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingFiles(true);
      fetch("/api/pinata/list")
        .then(res => res.json())
        .then(data => {
          if (data.files) setPinataFiles(data.files);
        })
        .finally(() => setLoadingFiles(false));
    }
  }, [isOpen]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.items });
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.registry });
    refetch();
  };

  const openCreate = () => {
    setForm(BLANK_FORM);
    setIsEditing(false);
    setIsOpen(true);
  };

  const openEdit = (item: ShopItem) => {
    setForm({
      name: item.name,
      itemType: item.itemType,
      priceSui: item.priceSui.toString(),
      initialStock: item.stock.toString(),
      sizes: item.sizes,
      colors: item.colors,
      imageStatic: item.imageStatic,
      imageAnimated: item.imageAnimated,
      imageBack: item.imageBack,
      colorBg: item.colorBg || "from-cyan-100 to-blue-100",
    });
    setTargetId(item.id);
    setIsEditing(true);
    setIsOpen(true);
  };

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size]
    }));
  };

  const toggleColor = (color: string) => {
    setForm(f => ({
      ...f,
      colors: f.colors.includes(color) ? f.colors.filter(c => c !== color) : [...f.colors, color]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return onToast("Name is required.", "error");
    if (!form.priceSui || parseFloat(form.priceSui) <= 0) return onToast("Valid price required.", "error");
    if (!form.initialStock || parseInt(form.initialStock) <= 0) return onToast("Initial stock required.", "error");
    if (!form.imageStatic) return onToast("Static image is required.", "error");

    setSubmitting(true);
    try {
      const tx = new Transaction();
      if (isEditing) {
        tx.moveCall({
          target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_shop_item_display`,
          arguments: [
            tx.object(superCapId),
            tx.object(targetId),
            tx.pure.string(form.name.trim()),
            tx.pure.string(form.sizes.join(",")),
            tx.pure.string(form.colors.join(",")),
            tx.pure.string(form.imageStatic.trim()),
            tx.pure.string(form.imageAnimated.trim()),
            tx.pure.string(form.imageBack.trim()),
            tx.pure.string(form.colorBg.trim()),
            tx.object("0x6"),
          ],
        });
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
            tx.pure.string(form.colorBg.trim()),
            tx.object("0x6"),
          ],
        });
      }
      await signAndExecute({ transaction: tx });
      onToast(isEditing ? "Item updated!" : "Item created!", "success");
      setIsOpen(false);
      invalidate();
    } catch (e: any) {
      onToast(e.message || "Action failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ShopItem) => {
    const registryId = adminRegistryId || CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID;
    try {
      const tx = new Transaction();
      const func = item.available ? "pause_shop_item" : "unpause_shop_item";
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::${func}`,
        arguments: [tx.object(registryId), tx.object(item.id), tx.object("0x6")],
      });
      await signAndExecute({ transaction: tx });
      onToast(item.available ? "Item hidden from shop." : "Item now visible!", item.available ? "info" : "success");
      invalidate();
    } catch (e: any) {
      onToast("Toggle failed.", "error");
    }
  };

  const handleDeleteItem = async (item: ShopItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action is irreversible on-chain.`)) return;
    
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::delete_shop_item`,
        arguments: [
          tx.object(superCapId),
          tx.object(CONTRACT_ADDRESSES.SHOP_REGISTRY_ID),
          tx.object(item.id),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx });
      onToast("Item deleted from registry.", "success");
      invalidate();
    } catch (e: any) {
      onToast("Deletion failed.", "error");
    }
  };

  const PRESET_BGS = [
    "from-cyan-100 to-blue-100",
    "from-pink-100 to-rose-100",
    "from-emerald-100 to-teal-100",
    "from-violet-100 to-fuchsia-100",
    "from-yellow-100 to-amber-100",
    "from-orange-100 to-red-100",
    "from-slate-100 to-zinc-100",
    "from-indigo-100 to-purple-100"
  ];

  return (
    <section className="border-4 border-black rounded-3xl overflow-hidden">
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} className="text-cyan-400" />
          <h3 className="font-black uppercase text-base tracking-tight">Shop Inventory</h3>
          <span className="ml-1 px-2 py-0.5 bg-white/10 rounded text-[10px] font-black">{items.length}</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-10 px-4 bg-cyan-400 text-black rounded-xl border-2 border-cyan-200 font-black text-xs uppercase hover:bg-cyan-300 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Plus size={16} /> New Item
        </button>
      </div>

      <div className="divide-y-2 divide-slate-100 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400 font-black text-xs uppercase">
            <LoaderCircle className="animate-spin" size={24} />
            Loading Shop Objects...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center font-black text-slate-300 text-xs uppercase italic">
            No items on-chain. Deploy your first merch.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={cn("w-16 h-16 rounded-2xl border-4 border-black flex-shrink-0 overflow-hidden bg-gradient-to-br", item.colorBg || "from-slate-50 to-slate-100")}>
                  {item.imageStatic ? (
                    <img src={item.imageStatic} className="w-full h-full object-contain p-1" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{SHOP_ITEM_TYPE_ICONS[item.itemType]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-black text-slate-800 text-sm">{item.name}</p>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      {SHOP_ITEM_TYPE_LABELS[item.itemType]}
                    </span>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", 
                      item.available ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200")}>
                      {item.available ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><DollarSign size={10} />{item.priceSui.toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Layers size={10} />{item.stock} Units</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(item)} 
                    title={item.available ? "Hide from shop" : "Show in shop"}
                    className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center bg-white hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                  >
                    {item.available ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-rose-400" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center bg-white hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item)} 
                    className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center bg-white hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-white rounded-[3rem] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex overflow-hidden animate-in zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>
            
            {/* LEFT: Live Preview */}
            <div className={cn("w-72 flex-shrink-0 p-8 border-r-4 border-slate-50 relative overflow-hidden transition-all bg-gradient-to-br", form.colorBg)}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 flex flex-col h-full items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <iconify-icon icon="solar:star-circle-bold" /> Live Preview
                </span>

                <div className="w-full bg-white rounded-[2.5rem] border-4 border-black p-4 shadow-xl mb-6 flex flex-col items-center">
                  <div className={cn("w-full aspect-square rounded-[1.8rem] border-2 border-slate-50 flex items-center justify-center relative mb-4 transition-all bg-gradient-to-br", form.colorBg)}>
                    {form.imageStatic ? (
                      <img src={form.imageStatic} className="w-full h-full object-contain p-2" alt="p" />
                    ) : (
                      <div className="text-6xl opacity-20">{SHOP_ITEM_TYPE_ICONS[form.itemType as keyof typeof SHOP_ITEM_TYPE_ICONS]}</div>
                    )}
                    <span className="absolute top-2 right-2 bg-yellow-300 text-black text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-black">NEW</span>
                  </div>
                  <div className="text-center w-full px-2">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{SHOP_ITEM_TYPE_LABELS[form.itemType as keyof typeof SHOP_ITEM_TYPE_LABELS]}</span>
                    <h4 className="font-headline text-lg text-slate-800 leading-tight uppercase truncate">{form.name || "Product Name"}</h4>
                    <div className="flex items-center justify-center gap-1.5 mt-2 bg-slate-50 rounded-xl py-1.5 border border-slate-100">
                      <iconify-icon icon="token-branded:sui" class="text-blue-500 text-sm" />
                      <span className="font-black text-sm">{form.priceSui || "0.00"}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white/80 border-2 border-white rounded-2xl p-4 shadow-sm backdrop-blur-sm mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Inventory</span>
                    <span className="text-xs font-black text-slate-700">{form.initialStock || 0} PCS</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (parseInt(form.initialStock) || 0))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="px-10 pt-8 pb-6 border-b-4 border-slate-50 flex items-start justify-between shrink-0">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white">
                      <Plus size={24} />
                    </div>
                    {isEditing ? "Modify Shop Item" : "Deploy New Merch"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Metadata Configuration & Asset Deployment</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all font-bold">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
                
                {/* Section: Identity */}
                <div className="space-y-6">
                  <SectionLabel icon={Tag} required>Item Identity</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <input 
                        type="text" 
                        value={form.name} 
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 placeholder-slate-200 outline-none focus:border-cyan-300 focus:bg-white transition-all text-lg"
                        placeholder="Product Name..."
                      />
                    </div>
                    
                    <div className="col-span-full grid grid-cols-5 gap-3">
                      {Object.entries(SHOP_ITEM_TYPE_LABELS).map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setForm({...form, itemType: Number(val)})}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all hover:scale-105",
                            form.itemType === Number(val) 
                              ? "bg-cyan-400 border-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]" 
                              : "bg-slate-50 border-slate-100 text-slate-400"
                          )}
                        >
                          <span className="text-2xl">{SHOP_ITEM_TYPE_ICONS[Number(val) as keyof typeof SHOP_ITEM_TYPE_ICONS]}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Pricing & Stock */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <SectionLabel icon={DollarSign} required>Unit Price (SUI)</SectionLabel>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={form.priceSui}
                        onChange={(e) => setForm({...form, priceSui: e.target.value})}
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 outline-none focus:border-blue-300 focus:bg-white transition-all"
                        placeholder="0.00"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-blue-400 transition-colors uppercase">SUI</span>
                    </div>
                  </div>
                  <div>
                    <SectionLabel icon={Package} required>Initial Supply</SectionLabel>
                    <input 
                      type="number" 
                      value={form.initialStock}
                      onChange={(e) => setForm({...form, initialStock: e.target.value})}
                      className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 outline-none focus:border-amber-300 focus:bg-white transition-all"
                      placeholder="Units to mint..."
                    />
                  </div>
                </div>

                {/* Section: Variations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <SectionLabel icon={Palette}>Size Variations</SectionLabel>
                    <DropdownMultiSelect 
                      label="Sizes" 
                      options={STANDARD_SIZES} 
                      selected={form.sizes} 
                      onToggle={toggleSize} 
                    />
                  </div>
                  <div>
                    <SectionLabel icon={Palette}>Color Variations</SectionLabel>
                    <DropdownMultiSelect 
                      label="Colors" 
                      options={STANDARD_COLORS} 
                      selected={form.colors} 
                      onToggle={toggleColor} 
                    />
                  </div>
                </div>

                {/* Section: Media Assets */}
                <div className="grid grid-cols-3 gap-6">
                  <DropdownAssetSelect 
                    label="Static View" 
                    value={form.imageStatic} 
                    onChange={(url) => setForm({...form, imageStatic: url})} 
                    onToast={onToast} 
                    required 
                    files={pinataFiles}
                    loadingFiles={loadingFiles}
                  />
                  <DropdownAssetSelect 
                    label="Animated GIF" 
                    value={form.imageAnimated} 
                    onChange={(url) => setForm({...form, imageAnimated: url})} 
                    onToast={onToast} 
                    files={pinataFiles}
                    loadingFiles={loadingFiles}
                  />
                  <DropdownAssetSelect 
                    label="Back View" 
                    value={form.imageBack} 
                    onChange={(url) => setForm({...form, imageBack: url})} 
                    onToast={onToast} 
                    files={pinataFiles}
                    loadingFiles={loadingFiles}
                  />
                </div>

                {/* Section: Theming */}
                <div>
                  <SectionLabel icon={Palette}>Card Background Theme</SectionLabel>
                  <div className="bg-slate-50 border-4 border-slate-100 rounded-3xl p-6 flex flex-wrap gap-4 items-center">
                    {PRESET_BGS.map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setForm({...form, colorBg: bg})}
                        className={cn(
                          "w-10 h-10 rounded-full border-4 transition-all hover:scale-110 bg-gradient-to-br",
                          bg,
                          form.colorBg === bg ? "border-black scale-110 shadow-lg" : "border-white shadow-sm"
                        )}
                      />
                    ))}
                    <div className="h-8 w-[2px] bg-slate-200 mx-2" />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-slate-400">Hex Code:</span>
                      <input 
                        type="text" 
                        value={form.colorBg} 
                        onChange={(e) => setForm({...form, colorBg: e.target.value})}
                        className="w-32 bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-10 py-6 border-t-4 border-slate-50 bg-slate-50/50 flex gap-4 shrink-0">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-40 bg-white border-4 border-slate-100 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-black text-white font-black py-4 rounded-2xl border-4 border-black hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0_0_rgba(59,130,246,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? <LoaderCircle className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  {submitting ? "Deploying Item..." : isEditing ? "Update Shop Object" : "Mint Shop Item"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t-2 border-slate-100 bg-slate-50">
        <button onClick={() => refetch()} className="w-full h-8 flex items-center justify-center gap-2 text-slate-500 font-bold text-xs uppercase hover:text-black">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </section>
  );
}
