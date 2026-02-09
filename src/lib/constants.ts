/**
 * Application Constants
 */

// Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  MINT_COUNTER_ID: process.env.NEXT_PUBLIC_MINT_COUNTER_ID!,
  RECEIPT_REGISTRY_ID: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ID!,
  ADMIN_CAP_ID: process.env.NEXT_PUBLIC_ADMIN_CAP_ID!,
  TREASURY_WALLET: process.env.NEXT_PUBLIC_TREASURY_WALLET!,
};
export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_WALLET!;

// Pricing (in MIST: 1 SUI = 1,000,000,000 MIST)
export const PRICING = {
  BASE_MINT: 20_000_000, // 20 SUI
  BUNDLE_UPGRADE: 10_000_000, // 10 SUI
  TOTAL_BUNDLE: 30_000_000, // 30 SUI
};

// Module names
export const MODULES = {
  CHARACTER_NFT: 'character_nft',
  ORDER_RECEIPT: 'order_receipt',
  ADMIN: 'admin',
  TREASURY: 'treasury',
};

// Merch Options
export const MERCH_OPTIONS = [
  { id: 'SHIRT', name: 'T-Shirt', icon: '👕' },
  { id: 'MUG', name: 'Mug', icon: '☕' },
  { id: 'MOUSEPAD', name: 'Mouse Pad', icon: '🖱️' },
  { id: 'HOODIE', name: 'Hoodie', icon: '🧥' },
] as const;

export const BUNDLE_OPTION = {
  id: 'ALL_BUNDLE',
  name: 'All Items Bundle',
  icon: '🎁',
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
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') ?? 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
};

// IPFS Configuration - UPDATED to use all Pinata environment variables
export const IPFS_CONFIG = {
  // API credentials (for uploading)
  apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
  apiSecret: process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  jwt: process.env.NEXT_PUBLIC_PINATA_JWT || '',
  
  // Gateway configuration (for accessing files)
  gateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://nft.kapogian.xyz/ipfs/',
  gatewayUrl: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://nft.kapogian.xyz',
  gatewayKey: process.env.NEXT_PUBLIC_PINATA_GATEWAY_KEY || '',
  
  // Group/folder organization
  groupId: process.env.PINATA_GROUP_KAPOGIAN || '',
};

// Encryption
export const ENCRYPTION_CONFIG = {
  adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
};

// Gemini AI
export const GEMINI_CONFIG = {
  imageApiUrl: process.env.NEXT_PUBLIC_GEMINI_IMAGE_API!,
  textApiUrl: process.env.NEXT_PUBLIC_GEMINI_TEXT_API!,
};

// Helper function to convert SUI to MIST
export function suiToMist(sui: number): number {
  return sui * 1_000_000_000;
}

// Helper function to convert MIST to SUI
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

// Helper to format SUI amount for display
export function formatSui(mist: number): string {
  return `${mistToSui(mist).toFixed(2)} SUI`;
}