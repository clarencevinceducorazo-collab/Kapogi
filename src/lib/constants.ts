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
  // NEW: replaces ADMIN_CAP_ID
  ADMIN_REGISTRY_ID: process.env.NEXT_PUBLIC_ADMIN_REGISTRY_ID!,
  TREASURY_CONFIG_ID: process.env.NEXT_PUBLIC_TREASURY_CONFIG_ID!,
};

// Pricing (in MIST: 1 SUI = 1,000,000,000 MIST)
export const PRICING = {
  BASE_MINT: 20_000_000_000, // 20 SUI
  BUNDLE_UPGRADE: 10_000_000_000, // 10 SUI
  TOTAL_BUNDLE: 30_000_000_000, // 30 SUI
};

// Module names
export const MODULES = {
  CHARACTER_NFT: "character_nft",
  ORDER_RECEIPT: "order_receipt",
  ADMIN: "admin",
  TREASURY: "treasury",
};

// Merch Options
export const MERCH_OPTIONS = [
  { id: "SHIRT", name: "T-Shirt", icon: "👕" },
  { id: "MUG", name: "Mug", icon: "☕" },
  { id: "MOUSEPAD", name: "Mouse Pad", icon: "🖱️" },
  { id: "HOODIE", name: "Hoodie", icon: "🧥" },
] as const;

export const BUNDLE_OPTION = {
  id: "ALL_BUNDLE",
  name: "All Items Bundle",
  icon: "🎁",
  price: PRICING.BUNDLE_UPGRADE,
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 0,
  SHIPPED: 1,
  DELIVERED: 2,
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  network:
    (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "mainnet") ?? "testnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_SUI_RPC_URL ||
    "https://fullnode.testnet.sui.io:443",
};

// IPFS Configuration — public / display-only values.
// ⚠️  Upload credentials (PINATA_JWT, PINATA_API_KEY, PINATA_API_SECRET) live
//     server-side in src/lib/server/pinata.ts (no NEXT_PUBLIC_ prefix).
export const IPFS_CONFIG = {
  /** Base public IPFS gateway URL (no auth token). */
  gateway:
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://nft.kapogian.xyz/ipfs/",
  /** Custom Pinata gateway hostname — used to build /ipfs/<cid> URLs. */
  gatewayUrl:
    process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || "https://nft.kapogian.xyz",
  /**
   * Pinata Gateway token — READ-ONLY access token for displaying pinned files.
   * This is safe as NEXT_PUBLIC_ because it cannot upload or delete content.
   * Set NEXT_PUBLIC_PINATA_GATEWAY_KEY in your .env file.
   */
  gatewayKey: process.env.NEXT_PUBLIC_PINATA_GATEWAY_KEY || "",
  /** Pinata group/folder ID for organising uploaded files. */
  groupId: process.env.NEXT_PUBLIC_PINATA_GROUP_KAPOGIAN || "",
};

// Encryption
export const ENCRYPTION_CONFIG = {
  adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
};

// Gemini AI — API keys and endpoints are handled exclusively in
// src/app/api/generate-image/route.ts and src/app/api/generate-text/route.ts
// via the server-side GEMINI_API_KEY env var.  Nothing to export here.

export function suiToMist(sui: number): number {
  return sui * 1_000_000_000;
}

export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

export function formatSui(mist: number): string {
  return `${mistToSui(mist).toFixed(2)} SUI`;
}
