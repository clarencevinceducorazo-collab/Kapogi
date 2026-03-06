/**
 * shopTypes.ts
 * TypeScript types that mirror the on-chain Move structs.
 * All field names match the Move field names exactly for easy mapping.
 */

import type { ShopItemTypeValue, OrderStatusValue } from "@/lib/constants";

// ─── ShopItem (mirrors shop_item::ShopItem) ──────────────────────────────────

/** Raw on-chain ShopItem object as returned by suiClient.getObject() */
export interface RawShopItemFields {
  name:             string;
  item_type:        number;    // u8 — use SHOP_ITEM_TYPES for mapping
  price_mist:       string;    // u64 comes back as string from RPC
  stock:            string;    // u64
  available:        boolean;
  available_sizes:  string;    // comma-separated, e.g. "S,M,L,XL"
  available_colors: string;    // comma-separated, e.g. "White,Black"
  image_static:     string;    // IPFS/Arweave URL
  image_animated:   string;
  image_back:       string;
  color_bg:         string;
  created_at:       string;    // u64 ms timestamp
  updated_at:       string;
  created_by:       string;    // address
}

/** Parsed, frontend-friendly ShopItem */
export interface ShopItem {
  id:              string;
  name:            string;
  itemType:        ShopItemTypeValue;
  priceMist:       bigint;
  priceSui:        number;
  stock:           number;
  available:       boolean;
  sizes:           string[];   // parsed from available_sizes
  colors:          string[];   // parsed from available_colors
  imageStatic:     string;
  imageAnimated:   string;
  imageBack:       string;
  colorBg:         string;
  createdAt:       number;
  updatedAt:       number;
  createdBy:       string;
}

// ─── ShopRegistry (mirrors shop_item::ShopRegistry) ─────────────────────────

export interface RawShopRegistryFields {
  item_ids:      string[];
  total_created: string;
}

export interface ShopRegistry {
  id:           string;
  itemIds:      string[];
  totalCreated: number;
}

// ─── ShopReceipt (mirrors shop_receipt::ShopReceipt) ────────────────────────

/** Raw on-chain ShopReceipt */
export interface RawShopReceiptFields {
  item_id:                 { id: string };
  item_name:               string;
  item_type:               number;
  buyer:                   string;
  chosen_size:             string;
  chosen_color:            string;
  custom_print_nft_id:     { type: string; fields?: { id: { id: string } } } | null;
  quantity:                string;
  payment_amount:          string;
  encrypted_shipping_info: string;
  encryption_pubkey:       string;
  status:                  number;
  tracking_number:         string;
  carrier:                 string;
  estimated_delivery:      string;
  created_at:              string;
  updated_at:              string;
}

/** Parsed, frontend-friendly ShopReceipt */
export interface ShopReceipt {
  id:                    string;
  itemId:                string;
  itemName:              string;
  itemType:              ShopItemTypeValue;
  buyer:                 string;
  chosenSize:            string;
  chosenColor:           string;
  customPrintNftId:      string | null;   // null = no custom print
  quantity:              number;
  paymentAmount:         bigint;
  paymentSui:            number;
  encryptedShippingInfo: string;
  encryptionPubkey:      string;
  status:                OrderStatusValue;
  trackingNumber:        string;
  carrier:               string;
  estimatedDelivery:     number;          // ms timestamp, 0 if not set
  createdAt:             number;
  updatedAt:             number;
  // Decrypted at runtime — never stored on-chain
  shippingInfo?:         ShippingInfo;
}

// ─── ShopReceiptRegistry ────────────────────────────────────────────────────

export interface RawShopReceiptRegistryFields {
  total_receipts: string;
  receipt_ids:    string[];
}

export interface ShopReceiptRegistry {
  id:            string;
  totalReceipts: number;
  receiptIds:    string[];
}

// ─── Shipping Info (encrypted on-chain, decrypted client-side) ──────────────

export interface ShippingInfo {
  fullName:    string;
  email:       string;
  phone:       string;
  address:     string;
  city:        string;
  province:    string;
  postalCode:  string;
  country:     string;
  notes?:      string;
}

// ─── Purchase flow input ────────────────────────────────────────────────────

export interface ShopPurchaseInput {
  itemId:              string;
  quantity:            number;
  chosenSize:          string;
  chosenColor:         string;
  customPrintNftId:    string | null;    // NFT object ID or null
  shippingInfo:        ShippingInfo;
}

// ─── Normalisation helpers ──────────────────────────────────────────────────

import { parseOnChainList, mistToSui, SHOP_ITEM_TYPES } from "@/lib/constants";

export function normaliseShopItem(id: string, fields: RawShopItemFields): ShopItem {
  return {
    id,
    name:          fields.name,
    itemType:      fields.item_type as ShopItemTypeValue,
    priceMist:     BigInt(fields.price_mist),
    priceSui:      mistToSui(Number(fields.price_mist)),
    stock:         Number(fields.stock),
    available:     fields.available,
    sizes:         parseOnChainList(fields.available_sizes),
    colors:        parseOnChainList(fields.available_colors),
    imageStatic:   fields.image_static,
    imageAnimated: fields.image_animated,
    imageBack:     fields.image_back,
    colorBg:       fields.color_bg,
    createdAt:     Number(fields.created_at),
    updatedAt:     Number(fields.updated_at),
    createdBy:     fields.created_by,
  };
}

export function normaliseShopReceipt(
  id: string,
  fields: RawShopReceiptFields
): ShopReceipt {
  // custom_print_nft_id is Option<ID> — Some wraps an inner { id: { id } }
  let customPrintNftId: string | null = null;
  if (
    fields.custom_print_nft_id &&
    fields.custom_print_nft_id.fields?.id?.id
  ) {
    customPrintNftId = fields.custom_print_nft_id.fields.id.id;
  }

  return {
    id,
    itemId:                fields.item_id.id,
    itemName:              fields.item_name,
    itemType:              fields.item_type as ShopItemTypeValue,
    buyer:                 fields.buyer,
    chosenSize:            fields.chosen_size,
    chosenColor:           fields.chosen_color,
    customPrintNftId,
    quantity:              Number(fields.quantity),
    paymentAmount:         BigInt(fields.payment_amount),
    paymentSui:            mistToSui(Number(fields.payment_amount)),
    encryptedShippingInfo: fields.encrypted_shipping_info,
    encryptionPubkey:      fields.encryption_pubkey,
    status:                fields.status as OrderStatusValue,
    trackingNumber:        fields.tracking_number,
    carrier:               fields.carrier,
    estimatedDelivery:     Number(fields.estimated_delivery),
    createdAt:             Number(fields.created_at),
    updatedAt:             Number(fields.updated_at),
  };
}