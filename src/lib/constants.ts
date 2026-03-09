/**
 * Application Constants
 */

// Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  MINT_COUNTER_ID: process.env.NEXT_PUBLIC_MINT_COUNTER_ID!,
  RECEIPT_REGISTRY_ID: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ID!,
  TRANSFER_POLICY_ID: process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID!,
  COLLECTION_METADATA_ID: process.env.NEXT_PUBLIC_COLLECTION_METADATA_ID!,
  ADMIN_REGISTRY_ID: process.env.NEXT_PUBLIC_ADMIN_REGISTRY_ID!,
  TREASURY_CONFIG_ID: process.env.NEXT_PUBLIC_TREASURY_CONFIG_ID!,
  // Shop — set these after deploying the new package
  SHOP_REGISTRY_ID: process.env.NEXT_PUBLIC_SHOP_REGISTRY_ID!,
  SHOP_RECEIPT_REGISTRY_ID: process.env.NEXT_PUBLIC_SHOP_RECEIPT_REGISTRY_ID!,
};

// Pricing (in MIST: 1 SUI = 1,000,000,000 MIST)
export const PRICING = {
  BASE_MINT: 20_000_000_000,      // 20 SUI
  BUNDLE_UPGRADE: 10_000_000_000, // 10 SUI
  TOTAL_BUNDLE: 30_000_000_000,   // 30 SUI
};

// Module names
export const MODULES = {
  CHARACTER_NFT: "character_nft",
  ORDER_RECEIPT: "order_receipt",
  ADMIN: "admin",
  TREASURY: "treasury",
  // Shop modules (new)
  SHOP_ITEM: "shop_item",
  SHOP_RECEIPT: "shop_receipt",
};

// Merch Options (used by the NFT mint flow)
export const MERCH_OPTIONS = [
  { id: "SHIRT",     name: "T-Shirt",    icon: "👕" },
  { id: "MUG",       name: "Mug",        icon: "☕" },
  { id: "MOUSEPAD",  name: "Mouse Pad",  icon: "🖱️" },
  { id: "HOODIE",    name: "Hoodie",     icon: "🧥" },
] as const;

export const BUNDLE_OPTION = {
  id: "ALL_BUNDLE",
  name: "All Items Bundle",
  icon: "🎁",
  price: PRICING.BUNDLE_UPGRADE,
} as const;

// ─── Shop Item Types (mirrors shop_item.move TYPE_* constants) ─────────────
export const SHOP_ITEM_TYPES = {
  SHIRT:    0,
  HOODIE:   1,
  MUG:      2,
  MOUSEPAD: 3,
  OTHER:    4,
} as const;

export type ShopItemTypeValue = typeof SHOP_ITEM_TYPES[keyof typeof SHOP_ITEM_TYPES];

export const SHOP_ITEM_TYPE_LABELS: Record<ShopItemTypeValue, string> = {
  [SHOP_ITEM_TYPES.SHIRT]:    "T-Shirt",
  [SHOP_ITEM_TYPES.HOODIE]:   "Hoodie",
  [SHOP_ITEM_TYPES.MUG]:      "Mug",
  [SHOP_ITEM_TYPES.MOUSEPAD]: "Mouse Pad",
  [SHOP_ITEM_TYPES.OTHER]:    "Other",
};

export const SHOP_ITEM_TYPE_ICONS: Record<ShopItemTypeValue, string> = {
  [SHOP_ITEM_TYPES.SHIRT]:    "👕",
  [SHOP_ITEM_TYPES.HOODIE]:   "🧥",
  [SHOP_ITEM_TYPES.MUG]:      "☕",
  [SHOP_ITEM_TYPES.MOUSEPAD]: "🖱️",
  [SHOP_ITEM_TYPES.OTHER]:    "📦",
};

// ─── Shop / Order Status (shared between NFT receipts and shop receipts) ────
export const ORDER_STATUS = {
  PENDING:   0,
  SHIPPED:   1,
  DELIVERED: 2,
} as const;

export type OrderStatusValue = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  [ORDER_STATUS.PENDING]:   "Pending",
  [ORDER_STATUS.SHIPPED]:   "Shipped",
  [ORDER_STATUS.DELIVERED]: "Delivered",
};

export const ORDER_STATUS_COLORS: Record<OrderStatusValue, string> = {
  [ORDER_STATUS.PENDING]:   "text-yellow-500",
  [ORDER_STATUS.SHIPPED]:   "text-blue-500",
  [ORDER_STATUS.DELIVERED]: "text-green-500",
};

// Network Configuration
export const NETWORK_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "mainnet") ?? "testnet",
  rpcUrl:  process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
};

// IPFS Configuration
export const IPFS_CONFIG = {
  gateway:    process.env.NEXT_PUBLIC_IPFS_GATEWAY    || "https://nft.kapogian.xyz/ipfs/",
  gatewayUrl: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz",
};

// Encryption
export const ENCRYPTION_CONFIG = {
  adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function suiToMist(sui: number): number {
  return sui * 1_000_000_000;
}

export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

export function formatSui(mist: number): string {
  return `${mistToSui(mist).toFixed(3)} SUI`;
}

/** Parse a comma-separated on-chain string into a trimmed string array. */
export function parseOnChainList(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
