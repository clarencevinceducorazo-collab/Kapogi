/**
 * Application Constants
 * 
 * SECURITY NOTE: This file has both build-time and runtime configurations.
 * Build-time values are used as fallbacks. Runtime values are fetched from /api/config.
 */

// Runtime configuration cache
let runtimeConfigCache: any = null;
let configLoadAttempted = false;

/**
 * Fetch configuration from API at runtime
 * This allows environment variables to be updated without rebuilding the image
 */
export async function getRuntimeConfig() {
  // Return cached config if already loaded
  if (runtimeConfigCache || configLoadAttempted) {
    return runtimeConfigCache;
  }

  try {
    // Only fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/config', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        runtimeConfigCache = await response.json();
        configLoadAttempted = true;
        console.log('✅ Runtime config loaded successfully');
        return runtimeConfigCache;
      } else {
        console.warn('⚠️  Failed to load runtime config, using build-time values');
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not fetch runtime config:', error);
  }

  configLoadAttempted = true;
  return null;
}

// Build-time fallback: Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
  MINT_COUNTER_ID: process.env.NEXT_PUBLIC_MINT_COUNTER_ID || '',
  RECEIPT_REGISTRY_ID: process.env.NEXT_PUBLIC_RECEIPT_REGISTRY_ID || '',
  ADMIN_CAP_ID: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '',
  TREASURY_WALLET: process.env.NEXT_PUBLIC_TREASURY_WALLET || '',
  TRANSFER_POLICY_ID: process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID || '',
  COLLECTION_METADATA_ID: process.env.NEXT_PUBLIC_COLLECTION_METADATA_ID || '',
};
export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

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

// Network Configuration - Build-time fallback
export const NETWORK_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') ?? 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
};

/**
 * Get network config with runtime values if available
 */
export async function getNetworkConfig() {
  const runtimeConfig = await getRuntimeConfig();
  
  if (runtimeConfig?.suiNetwork || runtimeConfig?.suiRpcUrl) {
    return {
      network: (runtimeConfig.suiNetwork as 'testnet' | 'mainnet') ?? 'testnet',
      rpcUrl: runtimeConfig.suiRpcUrl || 'https://fullnode.testnet.sui.io:443',
    };
  }
  
  return NETWORK_CONFIG;
}

// IPFS Configuration - Build-time fallback
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
  groupId: process.env.NEXT_PUBLIC_PINATA_GROUP_KAPOGIAN || '',
};

/**
 * Get IPFS config with runtime values if available
 */
export async function getIpfsConfig() {
  const runtimeConfig = await getRuntimeConfig();
  
  if (runtimeConfig) {
    return {
      apiKey: runtimeConfig.pinataApiKey || IPFS_CONFIG.apiKey,
      apiSecret: runtimeConfig.pinataApiSecret || IPFS_CONFIG.apiSecret,
      jwt: runtimeConfig.pinataJwt || IPFS_CONFIG.jwt,
      gateway: runtimeConfig.ipfsGateway || IPFS_CONFIG.gateway,
      gatewayUrl: runtimeConfig.pinataGatewayUrl || IPFS_CONFIG.gatewayUrl,
      gatewayKey: runtimeConfig.pinataGatewayKey || IPFS_CONFIG.gatewayKey,
      groupId: runtimeConfig.pinataGroupKapogian || IPFS_CONFIG.groupId,
    };
  }
  
  return IPFS_CONFIG;
}

// Encryption - Build-time fallback
export const ENCRYPTION_CONFIG = {
  adminPublicKey: process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY || '',
};

/**
 * Get encryption config with runtime values if available
 * Falls back to build-time values if runtime config is not available
 */
export async function getEncryptionConfig() {
  const runtimeConfig = await getRuntimeConfig();
  
  if (runtimeConfig?.adminPublicKey) {
    return {
      adminPublicKey: runtimeConfig.adminPublicKey,
    };
  }
  
  return ENCRYPTION_CONFIG;
}

// Gemini AI - Build-time fallback
export const GEMINI_CONFIG = {
  imageApiUrl: process.env.NEXT_PUBLIC_GEMINI_IMAGE_API || '',
  textApiUrl: process.env.NEXT_PUBLIC_GEMINI_TEXT_API || '',
};

/**
 * Get Gemini config with runtime values if available
 */
export async function getGeminiConfig() {
  const runtimeConfig = await getRuntimeConfig();
  
  if (runtimeConfig?.geminiImageApi || runtimeConfig?.geminiTextApi) {
    return {
      imageApiUrl: runtimeConfig.geminiImageApi || GEMINI_CONFIG.imageApiUrl,
      textApiUrl: runtimeConfig.geminiTextApi || GEMINI_CONFIG.textApiUrl,
    };
  }
  
  return GEMINI_CONFIG;
}

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
