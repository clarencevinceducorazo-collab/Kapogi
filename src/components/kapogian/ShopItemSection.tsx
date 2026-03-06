"use client";

/**
 * ShopItemSection.tsx
 * Drop this component into SuperAdminPanel.
 *
 * Usage inside SuperAdminPanel (after the AchievementSection):
 *
 *   {superCapId && (
 *     <ShopItemSection superCapId={superCapId} signAndExecute={signAndExecute} onToast={onToast} />
 *   )}
 *
 * Also add to the admin/page.tsx imports:
 *   import { ShopItemSection } from "@/components/kapogian/ShopItemSection";
 *   (or wherever you place this file)
 *
 * Requires in constants.ts → MODULES:
 *   SHOP_ITEM: "shop_item",   ← already present
 *
 * Move calls used:
 *   admin::create_shop_item        (SuperAdminCap)
 *   admin::update_shop_item_display (SuperAdminCap)
 *   admin::update_shop_item_price   (SuperAdminCap)
 *   admin::replenish_shop_stock     (AdminRegistry — pass via prop or fetch)
 *   admin::pause_shop_item          (AdminRegistry)
 *   admin::unpause_shop_item        (AdminRegistry)
 */

import React, { useState, useEffect } from "react";
import {
  ShoppingBag, Plus, RefreshCw, LoaderCircle, Pencil, X,
  PauseCircle, PlayCircle, Package, DollarSign, Layers,
  ToggleLeft, ToggleRight, Image as ImageIcon,
} from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_ADDRESSES, MODULES, SHOP_ITEM_TYPES, SHOP_ITEM_TYPE_LABELS, mistToSui, suiToMist } from "@/lib/constants";
import { useShopItems } from "@/lib/useShopQueries";
import { useQueryClient } from "@tanstack/react-query";
import { shopQueryKeys } from "@/lib/useShopQueries";
import type { ShopItem } from "@/lib/shopTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast { message: string; type: "success" | "error" | "info" }

interface Props {
  superCapId: string;
  signAndExecute: any;
  onToast: (msg: string, type: Toast["type"]) => void;
  /** Pass the AdminRegistry ID when calling replenish/pause (whitelisted admin fns) */
  adminRegistryId?: string;
}

// ─── Form defaults ────────────────────────────────────────────────────────────

const BLANK_FORM = {
  name: "",
  itemType: SHOP_ITEM_TYPES.SHIRT as number,
  priceSui: "",
  initialStock: "",
  availableSizes: "",
  availableColors: "",
  imageStatic: "",
  imageAnimated: "",
  imageBack: "",
  colorBg: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ITEM_TYPE_ICONS: Record<number, string> = {
  [SHOP_ITEM_TYPES.SHIRT]:    "👕",
  [SHOP_ITEM_TYPES.HOODIE]:   "🧥",
  [SHOP_ITEM_TYPES.MUG]:      "☕",
  [SHOP_ITEM_TYPES.MOUSEPAD]: "🖱️",
  [SHOP_ITEM_TYPES.OTHER]:    "📦",
};

const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type = "text", disabled = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-10 border-2 border-slate-200 rounded-xl px-3 font-semibold text-sm bg-white outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopItemSection({ superCapId, signAndExecute, onToast, adminRegistryId }: Props) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, refetch } = useShopItems(false); // show all, including unavailable

  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(BLANK_FORM);
  const [creating, setCreating]       = useState(false);

  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editForm, setEditForm]       = useState(BLANK_FORM);
  const [savingEdit, setSavingEdit]   = useState(false);

  const [pricingId, setPricingId]     = useState<string | null>(null);
  const [newPriceSui, setNewPriceSui] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const [stockId, setStockId]         = useState<string | null>(null);
  const [addStock, setAddStock]       = useState("");
  const [savingStock, setSavingStock] = useState(false);

  const [togglingId, setTogglingId]   = useState<string | null>(null);

  // ── field helpers ──────────────────────────────────────────────────────────

  const setField = (key: keyof typeof BLANK_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const setEditField = (key: keyof typeof BLANK_FORM) => (v: string) =>
    setEditForm((f) => ({ ...f, [key]: v }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.items });
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.registry });
    refetch();
  };

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim()) { onToast("Name is required.", "error"); return; }
    const price = parseFloat(form.priceSui);
    const stock = parseInt(form.initialStock, 10);
    if (isNaN(price) || price <= 0) { onToast("Enter a valid price.", "error"); return; }
    if (isNaN(stock) || stock <= 0) { onToast("Enter a valid stock amount.", "error"); return; }

    setCreating(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::create_shop_item`,
        arguments: [
          tx.object(superCapId),
          tx.object(CONTRACT_ADDRESSES.SHOP_REGISTRY_ID),
          tx.pure.string(form.name.trim()),
          tx.pure.u8(form.itemType),
          tx.pure.u64(suiToMist(price)),
          tx.pure.u64(stock),
          tx.pure.string(form.availableSizes.trim()),
          tx.pure.string(form.availableColors.trim()),
          tx.pure.string(form.imageStatic.trim()),
          tx.pure.string(form.imageAnimated.trim()),
          tx.pure.string(form.imageBack.trim()),
          tx.pure.string(form.colorBg.trim()),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx }, { showEffects: true, showObjectChanges: true });
      onToast(`"${form.name}" created!`, "success");
      setForm(BLANK_FORM);
      setShowCreate(false);
      invalidate();
    } catch (err: any) {
      console.error(err);
      onToast(err?.message?.slice(0, 80) ?? "Failed to create item.", "error");
    } finally {
      setCreating(false);
    }
  };

  // ── Edit display ───────────────────────────────────────────────────────────

  const openEdit = (item: ShopItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      itemType: item.itemType,
      priceSui: item.priceSui.toString(),
      initialStock: item.stock.toString(),
      availableSizes: item.sizes.join(","),
      availableColors: item.colors.join(","),
      imageStatic: item.imageStatic,
      imageAnimated: item.imageAnimated,
      imageBack: item.imageBack,
      colorBg: item.colorBg,
    });
    setPricingId(null);
    setStockId(null);
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editForm.name.trim()) { onToast("Name is required.", "error"); return; }
    setSavingEdit(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_shop_item_display`,
        arguments: [
          tx.object(superCapId),
          tx.object(itemId),
          tx.pure.string(editForm.name.trim()),
          tx.pure.string(editForm.availableSizes.trim()),
          tx.pure.string(editForm.availableColors.trim()),
          tx.pure.string(editForm.imageStatic.trim()),
          tx.pure.string(editForm.imageAnimated.trim()),
          tx.pure.string(editForm.imageBack.trim()),
          tx.pure.string(editForm.colorBg.trim()),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx }, { showEffects: true });
      onToast("Item updated!", "success");
      setEditingId(null);
      invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Update failed.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Price ──────────────────────────────────────────────────────────────────

  const handleSavePrice = async (itemId: string) => {
    const sui = parseFloat(newPriceSui);
    if (isNaN(sui) || sui <= 0) { onToast("Enter a valid price.", "error"); return; }
    setSavingPrice(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::update_shop_item_price`,
        arguments: [
          tx.object(superCapId),
          tx.object(itemId),
          tx.pure.u64(suiToMist(sui)),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx }, { showEffects: true });
      onToast("Price updated!", "success");
      setPricingId(null);
      setNewPriceSui("");
      invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Price update failed.", "error");
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Replenish stock ────────────────────────────────────────────────────────

  const handleReplenish = async (itemId: string) => {
    const amount = parseInt(addStock, 10);
    if (isNaN(amount) || amount <= 0) { onToast("Enter a valid stock amount.", "error"); return; }
    const registryId = adminRegistryId ?? CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID;
    setSavingStock(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::replenish_shop_stock`,
        arguments: [
          tx.object(registryId),
          tx.object(itemId),
          tx.pure.u64(amount),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx }, { showEffects: true });
      onToast(`+${amount} stock added!`, "success");
      setStockId(null);
      setAddStock("");
      invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Replenish failed.", "error");
    } finally {
      setSavingStock(false);
    }
  };

  // ── Pause / Unpause ────────────────────────────────────────────────────────

  const handleToggleAvailability = async (item: ShopItem) => {
    const registryId = adminRegistryId ?? CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID;
    setTogglingId(item.id);
    try {
      const tx = new Transaction();
      const fn = item.available ? "pause_shop_item" : "unpause_shop_item";
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::${fn}`,
        arguments: [
          tx.object(registryId),
          tx.object(item.id),
          tx.object("0x6"),
        ],
      });
      await signAndExecute({ transaction: tx }, { showEffects: true });
      onToast(item.available ? `"${item.name}" paused.` : `"${item.name}" live!`, item.available ? "info" : "success");
      invalidate();
    } catch (err: any) {
      onToast(err?.message?.slice(0, 80) ?? "Toggle failed.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="border-4 border-black rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-cyan-400" />
          <h3 className="font-black uppercase text-sm tracking-tight">Shop Items</h3>
          <span className="ml-1 px-2 py-0.5 bg-white/10 rounded text-[10px] font-black">{items.length}</span>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setEditingId(null); setPricingId(null); setStockId(null); }}
          className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400 text-black rounded-lg border-2 border-cyan-200 font-black text-xs uppercase hover:bg-cyan-300"
        >
          <Plus size={13} /> New Item
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-5 border-b-2 border-black bg-cyan-50 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-700 mb-1">
            Create New Shop Item
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div className="col-span-2">
              <FieldLabel>Item Name *</FieldLabel>
              <Input value={form.name} onChange={setField("name")} placeholder="e.g. Kapogian Classic Tee" />
            </div>

            {/* Type */}
            <div>
              <FieldLabel>Item Type *</FieldLabel>
              <select
                value={form.itemType}
                onChange={(e) => setForm((f) => ({ ...f, itemType: Number(e.target.value) }))}
                className="w-full h-10 border-2 border-slate-200 rounded-xl px-3 font-bold text-sm bg-white outline-none cursor-pointer"
              >
                {Object.entries(SHOP_ITEM_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {ITEM_TYPE_ICONS[Number(val)]} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <FieldLabel>Price (SUI) *</FieldLabel>
              <Input value={form.priceSui} onChange={setField("priceSui")} placeholder="e.g. 15" type="number" />
            </div>

            {/* Stock */}
            <div>
              <FieldLabel>Initial Stock *</FieldLabel>
              <Input value={form.initialStock} onChange={setField("initialStock")} placeholder="e.g. 100" type="number" />
            </div>

            {/* Sizes */}
            <div>
              <FieldLabel>Sizes (comma-separated)</FieldLabel>
              <Input value={form.availableSizes} onChange={setField("availableSizes")} placeholder="XS,S,M,L,XL,XXL" />
            </div>

            {/* Colors */}
            <div className="col-span-2">
              <FieldLabel>Colors (comma-separated)</FieldLabel>
              <Input value={form.availableColors} onChange={setField("availableColors")} placeholder="White,Black,Blue" />
            </div>

            {/* Images */}
            <div className="col-span-2">
              <FieldLabel>Static Image URL</FieldLabel>
              <Input value={form.imageStatic} onChange={setField("imageStatic")} placeholder="ipfs://... or https://..." />
            </div>
            <div className="col-span-2">
              <FieldLabel>Animated Image URL (GIF/WEBP)</FieldLabel>
              <Input value={form.imageAnimated} onChange={setField("imageAnimated")} placeholder="ipfs://... or https://..." />
            </div>
            <div>
              <FieldLabel>Back Image URL (optional)</FieldLabel>
              <Input value={form.imageBack} onChange={setField("imageBack")} placeholder="ipfs://..." />
            </div>
            <div>
              <FieldLabel>Card BG Color (optional)</FieldLabel>
              <Input value={form.colorBg} onChange={setField("colorBg")} placeholder="#f8fafc or bg-sky-100" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 h-10 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 h-10 bg-black text-white rounded-xl font-black text-sm border-2 border-black disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <LoaderCircle size={14} className="animate-spin" /> : <><Plus size={14} /> Create Item</>}
            </button>
          </div>
        </div>
      )}

      {/* Item List */}
      <div className="divide-y-2 divide-slate-100 max-h-[520px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-slate-400 font-black text-xs uppercase">
            <LoaderCircle size={16} className="animate-spin" /> Loading items...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center font-black text-slate-300 text-xs uppercase">
            No shop items yet. Create one above.
          </div>
        ) : (
          items.map((item) => {
            const isEditing  = editingId === item.id;
            const isPricing  = pricingId === item.id;
            const isStocking = stockId === item.id;
            const isToggling = togglingId === item.id;

            return (
              <div key={item.id} className="p-4 bg-white">
                {/* Item Row */}
                <div className="flex items-start gap-3">
                  {/* Image preview */}
                  <div className="w-12 h-12 rounded-xl border-2 border-black bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                    {item.imageStatic ? (
                      <img src={item.imageStatic} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <span>{ITEM_TYPE_ICONS[item.itemType]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-slate-800 truncate">{item.name}</p>
                      <span className="px-1.5 py-0.5 border rounded text-[9px] font-black uppercase bg-slate-100 text-slate-500 border-slate-200">
                        {ITEM_TYPE_ICONS[item.itemType]} {SHOP_ITEM_TYPE_LABELS[item.itemType]}
                      </span>
                      <span className={`px-1.5 py-0.5 border rounded text-[9px] font-black uppercase ${item.available ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-600 border-red-300"}`}>
                        {item.available ? "Live" : "Paused"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><DollarSign size={9} />{item.priceSui.toFixed(2)} SUI</span>
                      <span className="flex items-center gap-1"><Layers size={9} />{item.stock} in stock</span>
                      {item.sizes.length > 0 && <span>{item.sizes.join(", ")}</span>}
                    </div>
                    <p className="text-[9px] font-mono text-slate-300 mt-0.5">{shortAddr(item.id)}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {/* Pause / Unpause */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      disabled={isToggling}
                      title={item.available ? "Pause" : "Unpause"}
                      className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-colors disabled:opacity-40 ${item.available ? "bg-green-400 hover:bg-green-500" : "bg-slate-200 hover:bg-slate-300"}`}
                    >
                      {isToggling ? <LoaderCircle size={13} className="animate-spin" /> : item.available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>

                    {/* Edit display */}
                    <button
                      onClick={() => isEditing ? setEditingId(null) : openEdit(item)}
                      title="Edit display"
                      className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-colors ${isEditing ? "bg-blue-400 text-white" : "bg-white hover:bg-blue-50"}`}
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Edit price */}
                    <button
                      onClick={() => { setPricingId(isPricing ? null : item.id); setNewPriceSui(""); setEditingId(null); setStockId(null); }}
                      title="Update price"
                      className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-colors ${isPricing ? "bg-orange-400 text-white" : "bg-white hover:bg-orange-50"}`}
                    >
                      <DollarSign size={13} />
                    </button>

                    {/* Replenish stock */}
                    <button
                      onClick={() => { setStockId(isStocking ? null : item.id); setAddStock(""); setEditingId(null); setPricingId(null); }}
                      title="Replenish stock"
                      className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-colors ${isStocking ? "bg-teal-400 text-white" : "bg-white hover:bg-teal-50"}`}
                    >
                      <Package size={13} />
                    </button>
                  </div>
                </div>

                {/* Edit Display Form */}
                {isEditing && (
                  <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Edit Display Fields</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <FieldLabel>Name</FieldLabel>
                        <Input value={editForm.name} onChange={setEditField("name")} placeholder="Item name" />
                      </div>
                      <div>
                        <FieldLabel>Sizes (comma-separated)</FieldLabel>
                        <Input value={editForm.availableSizes} onChange={setEditField("availableSizes")} placeholder="XS,S,M,L,XL" />
                      </div>
                      <div>
                        <FieldLabel>Colors (comma-separated)</FieldLabel>
                        <Input value={editForm.availableColors} onChange={setEditField("availableColors")} placeholder="White,Black" />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel>Static Image URL</FieldLabel>
                        <Input value={editForm.imageStatic} onChange={setEditField("imageStatic")} placeholder="ipfs://..." />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel>Animated Image URL</FieldLabel>
                        <Input value={editForm.imageAnimated} onChange={setEditField("imageAnimated")} placeholder="ipfs://..." />
                      </div>
                      <div>
                        <FieldLabel>Back Image URL</FieldLabel>
                        <Input value={editForm.imageBack} onChange={setEditField("imageBack")} placeholder="ipfs://..." />
                      </div>
                      <div>
                        <FieldLabel>Card BG Color</FieldLabel>
                        <Input value={editForm.colorBg} onChange={setEditField("colorBg")} placeholder="#f8fafc" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingId(null)} className="flex-1 h-8 border-2 border-slate-200 rounded-lg font-bold text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                      <button onClick={() => handleSaveEdit(item.id)} disabled={savingEdit} className="flex-1 h-8 bg-blue-500 text-white rounded-lg font-black text-xs border-2 border-blue-300 disabled:opacity-50 flex items-center justify-center gap-1">
                        {savingEdit ? <LoaderCircle size={12} className="animate-spin" /> : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Form */}
                {isPricing && (
                  <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl space-y-2">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Update Price</p>
                    <p className="text-xs font-bold text-slate-500">Current: {item.priceSui.toFixed(2)} SUI</p>
                    <Input value={newPriceSui} onChange={setNewPriceSui} placeholder="New price in SUI" type="number" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setPricingId(null)} className="flex-1 h-8 border-2 border-slate-200 rounded-lg font-bold text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                      <button onClick={() => handleSavePrice(item.id)} disabled={savingPrice || !newPriceSui} className="flex-1 h-8 bg-orange-500 text-white rounded-lg font-black text-xs border-2 border-orange-300 disabled:opacity-50 flex items-center justify-center gap-1">
                        {savingPrice ? <LoaderCircle size={12} className="animate-spin" /> : "Set Price"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Stock Form */}
                {isStocking && (
                  <div className="mt-3 p-3 bg-teal-50 border-2 border-teal-200 rounded-xl space-y-2">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Replenish Stock</p>
                    <p className="text-xs font-bold text-slate-500">Current stock: {item.stock}</p>
                    <Input value={addStock} onChange={setAddStock} placeholder="Units to add" type="number" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setStockId(null)} className="flex-1 h-8 border-2 border-slate-200 rounded-lg font-bold text-xs text-slate-500 hover:bg-slate-50">Cancel</button>
                      <button onClick={() => handleReplenish(item.id)} disabled={savingStock || !addStock} className="flex-1 h-8 bg-teal-500 text-white rounded-lg font-black text-xs border-2 border-teal-300 disabled:opacity-50 flex items-center justify-center gap-1">
                        {savingStock ? <LoaderCircle size={12} className="animate-spin" /> : "+ Add Stock"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-slate-100 bg-slate-50">
        <button onClick={() => refetch()} className="w-full h-8 flex items-center justify-center gap-2 text-slate-500 font-bold text-xs uppercase hover:text-black">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </section>
  );
}