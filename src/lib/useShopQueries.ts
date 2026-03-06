/**
 * useShopQueries.ts
 * React Query hooks for reading shop state from the Sui blockchain.
 *
 * Usage:
 *   const { data: items, isLoading } = useShopItems();
 *   const { data: receipt }          = useShopReceipt(receiptId);
 *   const { data: receipts }         = useAllShopReceipts(); // admin only
 */

import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  normaliseShopItem,
  normaliseShopReceipt,
  type ShopItem,
  type ShopReceipt,
  type RawShopItemFields,
  type RawShopReceiptFields,
  type RawShopRegistryFields,
  type RawShopReceiptRegistryFields,
} from "@/lib/shopTypes";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const shopQueryKeys = {
  registry:       ["shop", "registry"]          as const,
  items:          ["shop", "items"]             as const,
  item:    (id: string) => ["shop", "item", id] as const,
  receiptRegistry: ["shop", "receipt-registry"] as const,
  receipts:       ["shop", "receipts"]          as const,
  receipt: (id: string) => ["shop", "receipt", id] as const,
  myReceipts: (addr: string) => ["shop", "receipts", "my", addr] as const,
};

// ─── ShopRegistry ────────────────────────────────────────────────────────────

/** Fetch the ShopRegistry to get all item IDs. */
export function useShopRegistry() {
  const client = useSuiClient();

  return useQuery({
    queryKey: shopQueryKeys.registry,
    queryFn: async () => {
      const obj = await client.getObject({
        id: CONTRACT_ADDRESSES.SHOP_REGISTRY_ID,
        options: { showContent: true },
      });
      if (obj.data?.content?.dataType !== "moveObject") return null;
      const fields = obj.data.content.fields as unknown as RawShopRegistryFields;
      return {
        id:           CONTRACT_ADDRESSES.SHOP_REGISTRY_ID,
        itemIds:      fields.item_ids as string[],   // ← no .map(x => x.id)
        totalCreated: Number(fields.total_created),
      };
    },
    staleTime: 30_000,
  });
}

// ─── All Shop Items ───────────────────────────────────────────────────────────

/** Fetch all ShopItems from the registry. Filters out unavailable if filterAvailable=true. */
export function useShopItems(filterAvailable = false) {
  const client    = useSuiClient();
  const { data: registry } = useShopRegistry();

  return useQuery({
    queryKey: shopQueryKeys.items,
    queryFn: async (): Promise<ShopItem[]> => {
      if (!registry?.itemIds.length) return [];

      const objects = await client.multiGetObjects({
        ids:     registry.itemIds,
        options: { showContent: true },
      });

      const items: ShopItem[] = [];
      for (const obj of objects) {
        if (obj.data?.content?.dataType !== "moveObject") continue;
        const id     = obj.data.objectId;
        const fields = obj.data.content.fields as unknown as RawShopItemFields;
        items.push(normaliseShopItem(id, fields));
      }

      return filterAvailable ? items.filter((i) => i.available) : items;
    },
    enabled:   !!registry?.itemIds.length,
    staleTime: 15_000,
  });
}

// ─── Single Shop Item ────────────────────────────────────────────────────────

export function useShopItem(itemId: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: shopQueryKeys.item(itemId ?? ""),
    queryFn:  async (): Promise<ShopItem | null> => {
      if (!itemId) return null;
      const obj = await client.getObject({
        id:      itemId,
        options: { showContent: true },
      });
      if (obj.data?.content?.dataType !== "moveObject") return null;
      const fields = obj.data.content.fields as unknown as RawShopItemFields;
      return normaliseShopItem(obj.data.objectId, fields);
    },
    enabled:   !!itemId,
    staleTime: 15_000,
  });
}

// ─── ShopReceiptRegistry ─────────────────────────────────────────────────────

export function useShopReceiptRegistry() {
  const client = useSuiClient();

  return useQuery({
    queryKey: shopQueryKeys.receiptRegistry,
    queryFn:  async () => {
      const obj = await client.getObject({
        id:      CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID,
        options: { showContent: true },
      });
      if (obj.data?.content?.dataType !== "moveObject") return null;
      const fields = obj.data.content.fields as unknown as RawShopReceiptRegistryFields;
      return {
        id:            CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID,
        totalReceipts: Number(fields.total_receipts),
        receiptIds:    fields.receipt_ids as string[],
      };
    },
    staleTime: 30_000,
  });
}

// ─── All Shop Receipts (admin) ────────────────────────────────────────────────

/** Fetch all shop receipts. Intended for the admin panel only. */
export function useAllShopReceipts() {
  const client                    = useSuiClient();
  const { data: registry }        = useShopReceiptRegistry();

  return useQuery({
    queryKey: shopQueryKeys.receipts,
    queryFn:  async (): Promise<ShopReceipt[]> => {
      if (!registry?.receiptIds.length) return [];

      const objects = await client.multiGetObjects({
        ids:     registry.receiptIds,
        options: { showContent: true },
      });

      const receipts: ShopReceipt[] = [];
      for (const obj of objects) {
        if (obj.data?.content?.dataType !== "moveObject") continue;
        const id     = obj.data.objectId;
        const fields = obj.data.content.fields as unknown as RawShopReceiptFields;
        receipts.push(normaliseShopReceipt(id, fields));
      }

      return receipts.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled:   !!registry?.receiptIds.length,
    staleTime: 15_000,
  });
}

// ─── Single Shop Receipt ──────────────────────────────────────────────────────

export function useShopReceipt(receiptId: string | undefined) {
  const client = useSuiClient();

  return useQuery({
    queryKey: shopQueryKeys.receipt(receiptId ?? ""),
    queryFn:  async (): Promise<ShopReceipt | null> => {
      if (!receiptId) return null;
      const obj = await client.getObject({
        id:      receiptId,
        options: { showContent: true },
      });
      if (obj.data?.content?.dataType !== "moveObject") return null;
      const fields = obj.data.content.fields as unknown as RawShopReceiptFields;
      return normaliseShopReceipt(obj.data.objectId, fields);
    },
    enabled:   !!receiptId,
    staleTime: 15_000,
  });
}

// ─── My Shop Receipts (buyer) ────────────────────────────────────────────────

/**
 * Fetch all shop receipts belonging to a specific buyer address.
 * Loads all receipts from the registry then filters by buyer field.
 * Fine for testnet; on mainnet consider using event indexing instead.
 */
export function useMyShopReceipts(buyerAddress: string | undefined) {
  const { data: all, ...rest } = useAllShopReceipts();

  const data = buyerAddress && all
    ? all.filter((r) => r.buyer === buyerAddress)
    : [];

  return { data, ...rest };
}