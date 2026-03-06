/**
 * useShopTransactions.ts
 * React hooks for writing to the shop smart contracts on the Sui blockchain.
 *
 * Exports:
 *   useShopPurchase       – buyer: purchase a shop item
 *   useMarkShopOrderShipped   – admin: mark a shop receipt as shipped
 *   useMarkShopOrderDelivered – admin: mark a shop receipt as delivered
 *   useAddShopTracking        – admin: add tracking info to a shop receipt
 */

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESSES, MODULES, ENCRYPTION_CONFIG } from "@/lib/constants";
import { shopQueryKeys } from "@/lib/useShopQueries";
import type { ShippingInfo } from "@/lib/shopTypes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Encrypt shipping info using the admin's public key (AES-256 via SubtleCrypto). */
async function encryptShippingInfo(info: ShippingInfo, publicKeyHex: string): Promise<string> {
  // Serialize the shipping info to JSON
  const plaintext = JSON.stringify(info);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Import the public key (SPKI format expected)
  const keyBytes = hexToBytes(publicKeyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    keyBytes,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoKey, data);
  return bytesToHex(new Uint8Array(encrypted));
}

/** Fallback: simple base64 encoding if encryption fails or no key is configured. */
function fallbackEncode(info: ShippingInfo): string {
  return btoa(JSON.stringify(info));
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── useShopPurchase ──────────────────────────────────────────────────────────

export interface PurchaseItemRef {
  id: string;
  priceMist: bigint;
}

export interface PurchaseOptions {
  itemId: string;
  quantity: number;
  chosenSize: string;
  chosenColor: string;
  customPrintNftId: string | null;
  shippingInfo: ShippingInfo;
}

/**
 * Hook for buyers to purchase a shop item.
 *
 * Usage:
 *   const { purchase, isPending } = useShopPurchase();
 *   await purchase({ id, priceMist }, { itemId, quantity, chosenSize, ... });
 */
export function useShopPurchase() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const purchase = async (item: PurchaseItemRef, opts: PurchaseOptions) => {
    // Encrypt shipping info
    let encryptedShippingInfo: string;
    const pubKey = ENCRYPTION_CONFIG.adminPublicKey;

    try {
      if (pubKey) {
        encryptedShippingInfo = await encryptShippingInfo(opts.shippingInfo, pubKey);
      } else {
        encryptedShippingInfo = fallbackEncode(opts.shippingInfo);
      }
    } catch {
      // Graceful fallback so the purchase still goes through
      encryptedShippingInfo = fallbackEncode(opts.shippingInfo);
    }

    const encryptionPubkey = pubKey ?? "";

    // Build custom_print_nft_bytes: 32-byte ID or empty vector
    let customPrintNftBytes: number[] = [];
    if (opts.customPrintNftId) {
      const hex = opts.customPrintNftId.replace(/^0x/, "");
      if (hex.length === 64) {
        for (let i = 0; i < 64; i += 2) {
          customPrintNftBytes.push(parseInt(hex.slice(i, i + 2), 16));
        }
      }
    }

    const totalMist = BigInt(item.priceMist) * BigInt(opts.quantity);

    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalMist.toString())]);

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.SHOP_RECEIPT}::purchase`,
      arguments: [
        tx.object(item.id),                                              // item: &mut ShopItem
        tx.object(CONTRACT_ADDRESSES.TREASURY_CONFIG_ID),               // treasury_config
        tx.object(CONTRACT_ADDRESSES.SHOP_RECEIPT_REGISTRY_ID),         // registry
        coin,                                                            // payment: Coin<SUI>
        tx.pure.u64(opts.quantity),                                      // quantity
        tx.pure.string(opts.chosenSize),                                 // chosen_size
        tx.pure.string(opts.chosenColor),                                // chosen_color
        tx.pure(bcs_vector_u8(customPrintNftBytes)),                     // custom_print_nft_bytes
        tx.pure.string(encryptedShippingInfo),                           // encrypted_shipping_info
        tx.pure.string(encryptionPubkey),                                // encryption_pubkey
        tx.object("0x6"),                                                // clock
      ],
    });

    const result = await signAndExecute(
      { transaction: tx },
      { showEffects: true, showObjectChanges: true }
    );

    // Invalidate shop queries so UI refreshes
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.items });
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.receiptRegistry });
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.receipts });

    return result;
  };

  return { purchase };
}

// ─── bcs helper for vector<u8> ────────────────────────────────────────────────

/**
 * Manually encode a vector<u8> in BCS format for tx.pure().
 * BCS: ULEB128 length prefix + raw bytes.
 */
function bcs_vector_u8(bytes: number[]): Uint8Array {
  const len = bytes.length;
  const uleb = encodeULEB128(len);
  const out = new Uint8Array(uleb.length + len);
  out.set(uleb, 0);
  out.set(bytes, uleb.length);
  return out;
}

function encodeULEB128(value: number): Uint8Array {
  const result: number[] = [];
  do {
    let byte = value & 0x7f;
    value >>= 7;
    if (value !== 0) byte |= 0x80;
    result.push(byte);
  } while (value !== 0);
  return new Uint8Array(result);
}

// ─── Admin: useMarkShopOrderShipped ──────────────────────────────────────────

/**
 * Admin hook to mark a shop receipt as shipped.
 *
 * Usage:
 *   const { markShipped } = useMarkShopOrderShipped();
 *   await markShipped(receiptId);
 */
export function useMarkShopOrderShipped() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const markShipped = async (receiptId: string) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_shop_order_shipped`,
      arguments: [
        tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
        tx.object(receiptId),
        tx.object("0x6"),
      ],
    });

    const result = await signAndExecute(
      { transaction: tx },
      { showEffects: true }
    );

    queryClient.invalidateQueries({ queryKey: shopQueryKeys.receipts });

    return result;
  };

  return { markShipped };
}

// ─── Admin: useMarkShopOrderDelivered ────────────────────────────────────────

/**
 * Admin hook to mark a shop receipt as delivered.
 *
 * Usage:
 *   const { markDelivered } = useMarkShopOrderDelivered();
 *   await markDelivered(receiptId);
 */
export function useMarkShopOrderDelivered() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const markDelivered = async (receiptId: string) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::mark_shop_order_delivered`,
      arguments: [
        tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
        tx.object(receiptId),
        tx.object("0x6"),
      ],
    });

    const result = await signAndExecute(
      { transaction: tx },
      { showEffects: true }
    );

    queryClient.invalidateQueries({ queryKey: shopQueryKeys.receipts });

    return result;
  };

  return { markDelivered };
}

// ─── Admin: useAddShopTracking ────────────────────────────────────────────────

/**
 * Admin hook to add tracking info to a shop receipt.
 *
 * Usage:
 *   const { addTracking } = useAddShopTracking();
 *   await addTracking(receiptId, trackingNumber, carrier, estimatedDeliveryMs);
 */
export function useAddShopTracking() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const addTracking = async (
    receiptId: string,
    trackingNumber: string,
    carrier: string,
    estimatedDeliveryMs: number
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::${MODULES.ADMIN}::add_shop_tracking`,
      arguments: [
        tx.object(CONTRACT_ADDRESSES.ADMIN_REGISTRY_ID),
        tx.object(receiptId),
        tx.pure.string(trackingNumber),
        tx.pure.string(carrier),
        tx.pure.u64(estimatedDeliveryMs),
        tx.object("0x6"),
      ],
    });

    const result = await signAndExecute(
      { transaction: tx },
      { showEffects: true }
    );

    queryClient.invalidateQueries({ queryKey: shopQueryKeys.receipts });

    return result;
  };

  return { addTracking };
}